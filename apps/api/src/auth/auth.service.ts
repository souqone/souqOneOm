import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { MailService } from '../mail/mail.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly tokens: AuthTokenService,
    private readonly audit: AuthAuditService,
  ) {
    this.googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const code = this.tokens.generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const user = await this.prisma.user.create({
        data: {
          email, username, displayName: dto.displayName, passwordHash, phone: dto.phone,
          country: dto.country,
          governorate: dto.governorate,
          city: dto.city,
          emailVerificationCode: code,
          emailVerificationExpiry: expiry,
        },
      });

      await this.mailService.sendVerificationEmail(email, code);

      const accessToken = await this.tokens.signAccessToken(user);
      const refreshToken = await this.tokens.generateRefreshToken(user.id);

      return { accessToken, refreshToken, user: this.tokens.sanitizeUser(user), requiresVerification: true };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.includes('email') ? 'البريد الإلكتروني' : 'اسم المستخدم';
        throw new BadRequestException(`${field} مستخدم بالفعل`);
      }
      throw err;
    }
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();

    // Brute-force lockout check
    const lockout = await this.audit.checkLockout(email);
    if (lockout.locked) {
      await this.audit.logAudit({ email, success: false, reason: 'ACCOUNT_LOCKED', ip, userAgent });
      throw new UnauthorizedException(
        `تم قفل الحساب مؤقتاً بسبب محاولات فاشلة متعددة. حاول مرة أخرى بعد ${lockout.ttlMinutes} دقيقة.`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.audit.recordFailedAttempt(email);
      await this.audit.logAudit({ email, success: false, reason: 'USER_NOT_FOUND', ip, userAgent });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (!user.passwordHash) {
      await this.audit.logAudit({ email, userId: user.id, success: false, reason: 'GOOGLE_ONLY', ip, userAgent });
      throw new UnauthorizedException('هذا الحساب مسجل بواسطة Google. استخدم تسجيل الدخول بـ Google.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.audit.recordFailedAttempt(email);
      await this.audit.logAudit({ email, userId: user.id, success: false, reason: 'WRONG_PASSWORD', ip, userAgent });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    // Reset lockout on success
    await this.audit.resetLockout(email);
    await this.audit.logAudit({ email, userId: user.id, success: true, ip, userAgent });

    const accessToken = await this.tokens.signAccessToken(user);
    const refreshToken = await this.tokens.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.tokens.sanitizeUser(user) };
  }

  async refresh(token: string) {
    const result = await this.tokens.rotateRefreshToken(token);
    if (!result) {
      throw new UnauthorizedException('رمز التجديد غير صالح أو منتهي');
    }
    return result;
  }

  async googleAuth(dto: GoogleAuthDto, ip?: string, userAgent?: string) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('رمز Google غير صالح');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('لم يتم العثور على بريد إلكتروني في حساب Google');
    }

    // Nonce validation for CSRF protection
    if (dto.nonce && payload.nonce !== dto.nonce) {
      throw new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة');
    }

    const { email, sub: googleId, name, picture } = payload;

    // Check if user exists by googleId
    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Check if user exists by email (link accounts)
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link existing email account with Google
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: user.avatarUrl || picture },
        });
      } else {
        // Create new user from Google
        const username = email.split('@')[0] + '_' + crypto.randomBytes(3).toString('hex');
        user = await this.prisma.user.create({
          data: {
            email,
            username,
            displayName: name || username,
            googleId,
            avatarUrl: picture,
            isVerified: true,
          },
        });
      }
    }

    await this.audit.logAudit({ email, userId: user.id, success: true, method: 'GOOGLE', ip, userAgent });

    const accessToken = await this.tokens.signAccessToken(user);
    const refreshToken = await this.tokens.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.tokens.sanitizeUser(user) };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    if (user.isVerified) return { message: 'البريد موثق بالفعل' };

    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      throw new BadRequestException('لا يوجد رمز تحقق مرسل. اطلب رمز جديد.');
    }

    if (new Date() > user.emailVerificationExpiry) {
      throw new BadRequestException('رمز التحقق منتهي. اطلب رمز جديد.');
    }

    if (!this.tokens.safeCompare(user.emailVerificationCode, code)) {
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, emailVerificationCode: null, emailVerificationExpiry: null },
    });

    return { message: 'تم توثيق البريد بنجاح' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    if (user.isVerified) return { message: 'البريد موثق بالفعل' };

    const code = this.tokens.generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationCode: code, emailVerificationExpiry: expiry },
    });

    await this.mailService.sendVerificationEmail(user.email, code);

    return { message: 'تم إرسال رمز تحقق جديد' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return { message: 'إذا كان البريد مسجلاً ستصلك رسالة' };

    const code = this.tokens.generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetCode: code, passwordResetExpiry: expiry },
    });

    await this.mailService.sendPasswordResetEmail(user.email, code);
    return { message: 'إذا كان البريد مسجلاً ستصلك رسالة' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.passwordResetCode || !user.passwordResetExpiry) {
      throw new BadRequestException('رمز إعادة التعيين غير صالح');
    }
    if (new Date() > user.passwordResetExpiry) {
      throw new BadRequestException('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
    }
    if (!this.tokens.safeCompare(user.passwordResetCode, code)) {
      throw new BadRequestException('رمز إعادة التعيين غير صحيح');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetCode: null, passwordResetExpiry: null },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async logout(token: string) {
    await this.tokens.revokeRefreshToken(token);
    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
