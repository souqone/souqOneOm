import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import type { JwtPayload } from './auth.types';
import { MailService } from '../mail/mail.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redis: RedisService,
  ) {
    this.googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }

  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private sanitizeUser(user: User) {
    const { passwordHash, emailVerificationCode, emailVerificationExpiry, passwordResetCode, passwordResetExpiry, ...safeUser } = user;
    return safeUser;
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  private buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { token: hashedToken, userId, expiresAt },
    });

    return token;
  }

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const code = this.generateVerificationCode();
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

      const accessToken = await this.jwtService.signAsync(this.buildPayload(user));
      const refreshToken = await this.generateRefreshToken(user.id);

      return { accessToken, refreshToken, user: this.sanitizeUser(user), requiresVerification: true };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.includes('email') ? 'البريد الإلكتروني' : 'اسم المستخدم';
        throw new BadRequestException(`${field} مستخدم بالفعل`);
      }
      throw err;
    }
  }

  private async logAudit(data: {
    email: string; userId?: string; success: boolean;
    method?: string; reason?: string; ip?: string; userAgent?: string;
  }) {
    try {
      await this.prisma.loginAudit.create({
        data: {
          email: data.email,
          userId: data.userId,
          success: data.success,
          method: data.method || 'EMAIL',
          ipAddress: data.ip,
          userAgent: data.userAgent,
          reason: data.reason,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write login audit', err);
    }
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();

    // Brute-force lockout check
    const lockoutKey = `auth:fail:${email}`;
    const attempts = await this.redis.get<number>(lockoutKey);
    if (attempts !== null && attempts >= MAX_LOGIN_ATTEMPTS) {
      const ttl = await this.redis.getTTL(lockoutKey);
      await this.logAudit({ email, success: false, reason: 'ACCOUNT_LOCKED', ip, userAgent });
      throw new UnauthorizedException(
        `تم قفل الحساب مؤقتاً بسبب محاولات فاشلة متعددة. حاول مرة أخرى بعد ${Math.ceil(ttl / 60)} دقيقة.`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.redis.incr(lockoutKey, LOCKOUT_DURATION_SECONDS);
      await this.logAudit({ email, success: false, reason: 'USER_NOT_FOUND', ip, userAgent });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (!user.passwordHash) {
      await this.logAudit({ email, userId: user.id, success: false, reason: 'GOOGLE_ONLY', ip, userAgent });
      throw new UnauthorizedException('هذا الحساب مسجل بواسطة Google. استخدم تسجيل الدخول بـ Google.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.redis.incr(lockoutKey, LOCKOUT_DURATION_SECONDS);
      await this.logAudit({ email, userId: user.id, success: false, reason: 'WRONG_PASSWORD', ip, userAgent });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    // Reset lockout on success
    await this.redis.del(lockoutKey);
    await this.logAudit({ email, userId: user.id, success: true, ip, userAgent });

    const accessToken = await this.jwtService.signAsync(this.buildPayload(user));
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async refresh(token: string) {
    const hashedToken = this.hashToken(token);
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashedToken } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('رمز التجديد غير صالح أو منتهي');
    }

    // إلغاء الرمز القديم
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    const accessToken = await this.jwtService.signAsync(this.buildPayload(user));
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
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

    await this.logAudit({ email, userId: user.id, success: true, method: 'GOOGLE', ip, userAgent });

    const accessToken = await this.jwtService.signAsync(this.buildPayload(user));
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
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

    if (!this.safeCompare(user.emailVerificationCode, code)) {
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

    const code = this.generateVerificationCode();
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

    const code = this.generateVerificationCode();
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
    if (!this.safeCompare(user.passwordResetCode, code)) {
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
    const hashedToken = this.hashToken(token);
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: hashedToken } });
    if (stored && !stored.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
