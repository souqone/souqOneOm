import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { AccessTokenGate } from '../auth/access-token-gate.service';
import { AuthService } from '../auth/auth.service';
import { OwnerContentVisibilityService } from '../common/services/owner-content-visibility.service';
import { MailService } from '../mail/mail.service';
import { USER_SELECT_PROFILE_PRIVATE } from '../common/constants/user-select.constant';
import * as bcrypt from 'bcryptjs';

describe('UsersService — Profile Update (PATCH /users/me)', () => {
  let service: UsersService;
  const originalEnv = process.env;

  const mockUser = {
    id: 'user-uuid-1',
    username: 'ahmed99',
    displayName: 'أحمد العماني',
    avatarUrl: 'https://lh3.googleusercontent.com/a/google-avatar-hash',
    bio: 'نبذة قديمة',
    country: 'OM',
    governorateId: 1,
    wilayaId: 101,
    governorateRef: { id: 1, nameAr: 'مسقط' },
    wilayaRef: { id: 101, nameAr: 'السيب' },
    isVerified: true,
    role: 'USER',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    email: 'ahmed@example.com',
    phone: '91234567',
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGeoService = {
    validateLocationPair: jest.fn().mockResolvedValue(true),
    syncLocation: jest.fn().mockResolvedValue(undefined),
    clearLocation: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuthTokenService = {
    revokeAllRefreshTokens: jest.fn(),
    signAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  };

  const mockAccessTokenGate = {
    invalidate: jest.fn(),
  };

  const mockAuthService = {
    verifyGoogleIdToken: jest.fn(),
  };

  const mockVisibilityService = {
    hideAllForUser: jest.fn().mockResolvedValue({ userId: 'u1', affectedCounts: {}, totalAffected: 0 }),
    restoreAllForUser: jest.fn().mockResolvedValue({ userId: 'u1', affectedCounts: {}, totalAffected: 0 }),
  };

  const mockMailService = {
    sendDeletionRequestEmail: jest.fn().mockResolvedValue(true),
    sendDeletionCancelledEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test', CLOUDINARY_CLOUD_NAME: 'souqone' };

    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser });
    mockPrisma.user.update.mockImplementation(({ data, select }) => {
      return Promise.resolve({
        ...mockUser,
        ...data,
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeoService },
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        { provide: AccessTokenGate, useValue: mockAccessTokenGate },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OwnerContentVisibilityService, useValue: mockVisibilityService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1. Bio Clearing & Updating', () => {
    it('should set bio to null when bio is null', async () => {
      await service.updateProfile('user-uuid-1', { bio: null });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({ bio: null }),
          select: expect.objectContaining(USER_SELECT_PROFILE_PRIVATE),
        }),
      );
    });

    it('should set bio to null when bio is an empty string', async () => {
      await service.updateProfile('user-uuid-1', { bio: '' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({ bio: null }),
        }),
      );
    });

    it('should set bio to null when bio is whitespace only', async () => {
      await service.updateProfile('user-uuid-1', { bio: '    ' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({ bio: null }),
        }),
      );
    });

    it('should update bio when a valid trimmed string is provided', async () => {
      await service.updateProfile('user-uuid-1', { bio: '  مهندس برمجيات مهتم بالسيارات  ' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bio: 'مهندس برمجيات مهتم بالسيارات' }),
        }),
      );
    });
  });

  describe('2. Phone Clearing Prevention, Step-Up Auth & Verification Reset', () => {
    it('should throw BadRequestException (400) when phone is null', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { phone: null as any }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف مطلوب ولا يمكن حذفه'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (400) when phone is empty string', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { phone: '' }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف مطلوب ولا يمكن حذفه'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException (400) when phone is whitespace only', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { phone: '   ' }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف مطلوب ولا يمكن حذفه'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should normalize valid new phone to E.164 and clear verification', async () => {
      await service.updateProfile('user-uuid-1', { phone: '99887766' });

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('phone', '+96899887766');
      expect(updateCall.data).toHaveProperty('phoneVerifiedAt', null);
      expect(updateCall.data).toHaveProperty('phoneE164', null);
    });

    it('requires currentPassword (403 STEP_UP_REQUIRED) when verified user with password changes phone without password', async () => {
      const hashed = await bcrypt.hash('Secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        passwordHash: hashed,
        phoneVerifiedAt: new Date(),
        phoneE164: '+96891234567',
      });

      await expect(
        service.updateProfile('user-uuid-1', { phone: '99887766' }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 403,
            code: 'STEP_UP_REQUIRED',
            message: 'لتغيير رقم الهاتف الموثق، يرجى إدخال كلمة المرور الحالية',
          }),
        }),
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws 403 STEP_UP_REQUIRED when verified user submits incorrect currentPassword', async () => {
      const hashed = await bcrypt.hash('Secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        passwordHash: hashed,
        phoneVerifiedAt: new Date(),
        phoneE164: '+96891234567',
      });

      await expect(
        service.updateProfile('user-uuid-1', {
          phone: '99887766',
          currentPassword: 'WrongPassword',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 403,
            code: 'STEP_UP_REQUIRED',
            message: 'كلمة المرور الحالية غير صحيحة لتأكيد تغيير رقم الهاتف',
          }),
        }),
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('succeeds with step-up when verified user submits correct currentPassword and clears verification', async () => {
      const hashed = await bcrypt.hash('Secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        passwordHash: hashed,
        phoneVerifiedAt: new Date(),
        phoneE164: '+96891234567',
      });

      const res = await service.updateProfile('user-uuid-1', {
        phone: '99887766',
        currentPassword: 'Secret123',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+96899887766',
            phoneVerifiedAt: null,
            phoneE164: null,
          }),
        }),
      );
      expect(res.phoneVerified).toBe(false);
    });

    it('allows Google-only verified user (no passwordHash) to change phone without step-up and clears verification', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        googleId: 'google-sub-123',
        passwordHash: null,
        phoneVerifiedAt: new Date(),
        phoneE164: '+96891234567',
      });

      const res = await service.updateProfile('user-uuid-1', {
        phone: '99887766',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+96899887766',
            phoneVerifiedAt: null,
            phoneE164: null,
          }),
        }),
      );
      expect(res.phoneVerified).toBe(false);
    });

    it('should keep stored phone untouched when user submits their existing unchanged raw 8-digit phone', async () => {
      // mockUser.phone is '91234567'
      await service.updateProfile('user-uuid-1', { phone: '91234567' });

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.phone).toBeUndefined();
    });

    it('should keep stored phone untouched when user submits their existing phone in lenient format', async () => {
      // mockUser.phone is '91234567' -> lenient is +96891234567
      await service.updateProfile('user-uuid-1', { phone: '+96891234567' });

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.phone).toBeUndefined();
    });

    it('should preserve legacy foreign phone without failure if sent unchanged', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: '+971501234567',
      });

      await service.updateProfile('user-uuid-1', { phone: '+971501234567' });

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.phone).toBeUndefined();
    });

    it('should reject with 400 when changing phone to a disallowed country', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { phone: '+971509999999' }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject with 400 when user with null phone adds +20 in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevCodes = process.env.PHONE_ALLOWED_COUNTRY_CODES;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.PHONE_ALLOWED_COUNTRY_CODES;

        mockPrisma.user.findUnique.mockResolvedValueOnce({
          ...mockUser,
          phone: null,
        });

        await expect(
          service.updateProfile('user-uuid-1', { phone: '+201012345678' }),
        ).rejects.toThrow(new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك'));

        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevCodes !== undefined) {
          process.env.PHONE_ALLOWED_COUNTRY_CODES = prevCodes;
        } else {
          delete process.env.PHONE_ALLOWED_COUNTRY_CODES;
        }
      }
    });

    it('should reject with 400 when user has invalid stored phone and sends another invalid phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: 'corrupt-old-phone',
      });

      await expect(
        service.updateProfile('user-uuid-1', { phone: 'invalid_phone' }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should reject with 400 when user with null phone sends an invalid phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: null,
      });

      await expect(
        service.updateProfile('user-uuid-1', { phone: 'invalid_phone' }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('3. Location & DisplayName Null Checks', () => {
    it('should throw BadRequestException when governorateId is null', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { governorateId: null as any }),
      ).rejects.toThrow(new BadRequestException('المحافظة والولاية لا يمكن حذفهما'));
    });

    it('should throw BadRequestException when wilayaId is null', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { wilayaId: null as any }),
      ).rejects.toThrow(new BadRequestException('المحافظة والولاية لا يمكن حذفهما'));
    });

    it('should throw BadRequestException when displayName is null', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { displayName: null as any }),
      ).rejects.toThrow(new BadRequestException('الاسم المعروض مطلوب ولا يمكن حذفه'));
    });

    it('should preserve validateLocationPair check for new governorateId/wilayaId', async () => {
      await service.updateProfile('user-uuid-1', { governorateId: 2, wilayaId: 201 });
      expect(mockGeoService.validateLocationPair).toHaveBeenCalledWith(2, 201);
    });
  });

  describe('4. Avatar URL Validation & Stored Avatar Compatibility', () => {
    it('should clear avatar in DB when avatarUrl is null', async () => {
      await service.updateProfile('user-uuid-1', { avatarUrl: null });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatarUrl: null }),
        }),
      );
    });

    it('should clear avatar in DB when avatarUrl is empty string', async () => {
      await service.updateProfile('user-uuid-1', { avatarUrl: '' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatarUrl: null }),
        }),
      );
    });

    it('should reject untrusted external URL with 400', async () => {
      await expect(
        service.updateProfile('user-uuid-1', { avatarUrl: 'https://evil.com/attacker.png' }),
      ).rejects.toThrow(new BadRequestException('الرابط غير مدعوم أو غير موثوق'));

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should accept local /uploads/ avatar path', async () => {
      const localAvatar = '/uploads/1729000000-user-avatar.jpg';
      await service.updateProfile('user-uuid-1', { avatarUrl: localAvatar });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatarUrl: localAvatar }),
        }),
      );
    });

    it('should accept valid Cloudinary URL matching cloud name', async () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/avatar.png';
      await service.updateProfile('user-uuid-1', { avatarUrl: cloudinaryUrl });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatarUrl: cloudinaryUrl }),
        }),
      );
    });

    it('should accept stored Google avatar when sent unchanged without domain check', async () => {
      const googleAvatar = mockUser.avatarUrl; // 'https://lh3.googleusercontent.com/a/google-avatar-hash'
      await service.updateProfile('user-uuid-1', {
        displayName: 'اسم جديد',
        avatarUrl: googleAvatar,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayName: 'اسم جديد',
            avatarUrl: googleAvatar,
          }),
        }),
      );
    });
  });

  describe('5. Coordinates (Latitude & Longitude)', () => {
    it('should clear location when latitude and longitude are null', async () => {
      await service.updateProfile('user-uuid-1', { latitude: null, longitude: null });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ latitude: null, longitude: null }),
        }),
      );
      expect(mockGeoService.clearLocation).toHaveBeenCalledWith('users', 'user-uuid-1');
    });

    it('should sync location when valid latitude and longitude are provided', async () => {
      await service.updateProfile('user-uuid-1', { latitude: 23.588, longitude: 58.3829 });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ latitude: 23.588, longitude: 58.3829 }),
        }),
      );
      expect(mockGeoService.syncLocation).toHaveBeenCalledWith('users', 'user-uuid-1', 23.588, 58.3829);
    });
  });

  describe('6. Legacy Client Backward Compatibility', () => {
    it('should keep untouched fields unchanged when client sends undefined for optional fields', async () => {
      await service.updateProfile('user-uuid-1', {
        displayName: 'تعديل فقط',
        phone: undefined,
        bio: undefined,
        avatarUrl: undefined,
      });

      const updateData = mockPrisma.user.update.mock.calls[0][0].data;
      expect(updateData.displayName).toBe('تعديل فقط');
      expect(updateData.phone).toBeUndefined();
      expect(updateData.bio).toBeUndefined();
      expect(updateData.avatarUrl).toBeUndefined();
    });
  });

  describe('7. DTO ValidationPipe Behavior', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    });

    it('should reject non-whitelisted sensitive field (e.g. role) with 400', async () => {
      await expect(
        pipe.transform({ role: 'ADMIN' }, { type: 'body', metatype: UpdateProfileDto }),
      ).rejects.toThrow();
    });

    it('should reject latitude out of bounds (> 90 or < -90)', async () => {
      const dtoAbove = plainToInstance(UpdateProfileDto, { latitude: 95.5 });
      const errorsAbove = await validate(dtoAbove);
      expect(errorsAbove.length).toBeGreaterThan(0);
      expect(errorsAbove[0].property).toBe('latitude');

      const dtoBelow = plainToInstance(UpdateProfileDto, { latitude: -95.5 });
      const errorsBelow = await validate(dtoBelow);
      expect(errorsBelow.length).toBeGreaterThan(0);
      expect(errorsBelow[0].property).toBe('latitude');
    });

    it('should reject longitude out of bounds (> 180 or < -180)', async () => {
      const dtoAbove = plainToInstance(UpdateProfileDto, { longitude: 185.0 });
      const errorsAbove = await validate(dtoAbove);
      expect(errorsAbove.length).toBeGreaterThan(0);
      expect(errorsAbove[0].property).toBe('longitude');

      const dtoBelow = plainToInstance(UpdateProfileDto, { longitude: -185.0 });
      const errorsBelow = await validate(dtoBelow);
      expect(errorsBelow.length).toBeGreaterThan(0);
      expect(errorsBelow[0].property).toBe('longitude');
    });

    it('should reject string latitude that cannot be a number', async () => {
      const dto = plainToInstance(UpdateProfileDto, { latitude: 'not-a-number' as any });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('latitude');
    });

    it('should reject bio exceeding 500 characters', async () => {
      const longBio = 'أ'.repeat(501);
      const dto = plainToInstance(UpdateProfileDto, { bio: longBio });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('bio');
    });

    it('should accept bio up to 500 characters', async () => {
      const validBio = 'أ'.repeat(500);
      const dto = plainToInstance(UpdateProfileDto, { bio: validBio });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject null phone in DTO validation', async () => {
      const dto = plainToInstance(UpdateProfileDto, { phone: null as any });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('phone');
      expect(errors[0].constraints?.isNotEmpty).toBe('رقم الهاتف مطلوب ولا يمكن حذفه');
    });

    it('should reject empty phone string in DTO validation', async () => {
      const dto = plainToInstance(UpdateProfileDto, { phone: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('phone');
      expect(errors[0].constraints?.isNotEmpty).toBe('رقم الهاتف مطلوب ولا يمكن حذفه');
    });

    it('should reject null governorateId in DTO validation', async () => {
      const dto = plainToInstance(UpdateProfileDto, { governorateId: null as any });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('governorateId');
    });

    it('should reject null wilayaId in DTO validation', async () => {
      const dto = plainToInstance(UpdateProfileDto, { wilayaId: null as any });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('wilayaId');
    });

    it('should reject null displayName in DTO validation', async () => {
      const dto = plainToInstance(UpdateProfileDto, { displayName: null as any });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('displayName');
    });
  });

  describe('Profile Role Privacy (GET /users/:id vs GET /users/me)', () => {
    it('getPublicProfile (GET /users/:id) MUST NOT select or return role', async () => {
      mockPrisma.user.findUnique.mockImplementation(async ({ select }) => {
        const result: Record<string, any> = {
          id: 'user-uuid-1',
          username: 'ahmed99',
          displayName: 'أحمد العماني',
          avatarUrl: null,
          bio: 'نبذة',
          country: 'OM',
          governorateId: 1,
          wilayaId: 101,
          governorateRef: { id: 1, nameAr: 'مسقط' },
          wilayaRef: { id: 101, nameAr: 'السيب' },
          isVerified: true,
          createdAt: new Date('2026-01-01'),
          _count: {
            listings: 0,
            busListings: 0,
            equipmentListings: 0,
            operatorListings: 0,
            spareParts: 0,
            carServices: 0,
            driverJobs: 0,
          },
        };
        if (select?.role) {
          result.role = 'USER';
        }
        return result;
      });

      const profile = await service.getPublicProfile('user-uuid-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          select: expect.not.objectContaining({ role: true }),
        }),
      );
      expect((profile as any).role).toBeUndefined();
      expect('role' in profile).toBe(false);
    });

    it('getProfile (GET /users/me) MUST select and return role for current user', async () => {
      mockPrisma.user.findUnique.mockImplementation(async ({ select }) => {
        const result: Record<string, any> = {
          id: 'user-uuid-1',
          username: 'ahmed99',
          email: 'ahmed@example.com',
          phone: '91234567',
          updatedAt: new Date(),
        };
        if (select?.role) {
          result.role = 'USER';
        }
        return result;
      });

      const profile = await service.getProfile('user-uuid-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          select: expect.objectContaining({ role: true }),
        }),
      );
      expect((profile as any).role).toBe('USER');
    });
  });

  describe('Last login method protection', () => {
    it('throws 400 LAST_LOGIN_METHOD when phone-verified account without other login method tries to change phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-phone-only',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
        passwordHash: null,
        googleId: null,
      });

      await expect(
        service.updateProfile('user-phone-only', { phone: '97654321' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          response: expect.objectContaining({
            code: 'LAST_LOGIN_METHOD',
            message:
              'لا يمكن إزالة وسيلة الدخول الأخيرة لحسابك. يرجى إضافة وسيلة دخول أخرى أولا.',
          }),
        }),
      );
    });

    it('throws 400 LAST_LOGIN_METHOD when user has password but UNVERIFIED email and no googleId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-unverified-email',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
        passwordHash: '$2b$10$somehashedpassword',
        email: 'unverified@example.com',
        emailVerifiedAt: null,
        isVerified: false,
        googleId: null,
      });

      await expect(
        service.updateProfile('user-unverified-email', { phone: '97654321' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
          response: expect.objectContaining({
            code: 'LAST_LOGIN_METHOD',
            message:
              'لا يمكن إزالة وسيلة الدخول الأخيرة لحسابك. يرجى إضافة وسيلة دخول أخرى أولا.',
          }),
        }),
      );
    });

    it('throws 400 "رقم الهاتف مطلوب ولا يمكن حذفه" when attempting to clear phone (phone: null)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-phone-only',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
        passwordHash: null,
        googleId: null,
      });

      await expect(
        service.updateProfile('user-phone-only', { phone: null as any }),
      ).rejects.toThrow('رقم الهاتف مطلوب ولا يمكن حذفه');
    });

    it('allows changing phone when user has linked googleId as alternative login method', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-google-and-phone',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
        passwordHash: null,
        googleId: 'google-sub-id',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-google-and-phone',
        displayName: 'Google User',
        phone: '+96897654321',
        phoneVerifiedAt: null,
        phoneE164: null,
      });

      const result = await service.updateProfile('user-google-and-phone', { phone: '97654321' });
      expect(result.phoneVerified).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+96897654321',
            phoneVerifiedAt: null,
            phoneE164: null,
          }),
        }),
      );
    });

    it('changePassword throws Arabic message distinguishing phone-only from Google accounts', async () => {
      // Phone only account
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-phone-only',
        passwordHash: null,
        googleId: null,
      });

      await expect(
        service.changePassword('user-phone-only', {
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow('هذا الحساب مسجل بواسطة رقم الهاتف ولا يحتوي على كلمة مرور.');

      // Google only account
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-google-only',
        passwordHash: null,
        googleId: 'google-sub-123',
      });

      await expect(
        service.changePassword('user-google-only', {
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow('هذا الحساب مسجل بواسطة Google ولا يحتوي على كلمة مرور.');
    });
  });
});


