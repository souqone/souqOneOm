import { BadRequestException } from '@nestjs/common';
import { UploadsController } from '../uploads.controller';
import { UploadsService } from '../uploads.service';

describe('UploadsController — addImageByUrl SSRF Protection', () => {
  let controller: UploadsController;
  let mockUploadsService: Partial<UploadsService>;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockUploadsService = {
      addImageToListing: jest.fn().mockResolvedValue({ id: 'img-1', url: 'https://res.cloudinary.com/sample.jpg' } as any),
      addImageToService: jest.fn().mockResolvedValue({ id: 'simg-1', url: 'https://res.cloudinary.com/sample.jpg' } as any),
    };
    controller = new UploadsController(mockUploadsService as UploadsService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockUser = { sub: 'user-1', email: 'test@example.com', username: 'test', role: 'USER' };

  it('should reject invalid or non-string URLs with 400', async () => {
    await expect(controller.addImageByUrl('listing-1', { url: '' }, mockUser as any))
      .rejects.toThrow(BadRequestException);

    await expect(controller.addImageByUrl('listing-1', { url: 'not-a-valid-url' }, mockUser as any))
      .rejects.toThrow(BadRequestException);
  });

  it('should reject SSRF attack: https://evil.com/?cloudinary.com with 400', async () => {
    await expect(controller.addImageByUrl('listing-1', { url: 'https://evil.com/?cloudinary.com' }, mockUser as any))
      .rejects.toThrow(BadRequestException);
  });

  it('should reject subdomain takeover/spoof: https://res.cloudinary.com.evil.com/x with 400', async () => {
    await expect(controller.addImageByUrl('listing-1', { url: 'https://res.cloudinary.com.evil.com/x' }, mockUser as any))
      .rejects.toThrow(BadRequestException);
  });

  it('should reject non-https cloudinary URLs: http://res.cloudinary.com/image.jpg with 400', async () => {
    await expect(controller.addImageByUrl('listing-1', { url: 'http://res.cloudinary.com/image.jpg' }, mockUser as any))
      .rejects.toThrow(BadRequestException);
  });

  it('should reject localhost in production environment with 400', async () => {
    process.env.NODE_ENV = 'production';
    await expect(controller.addImageByUrl('listing-1', { url: 'http://localhost:3000/image.jpg' }, mockUser as any))
      .rejects.toThrow(BadRequestException);
  });

  it('should allow localhost in non-production environment', async () => {
    process.env.NODE_ENV = 'development';
    const result = await controller.addImageByUrl('listing-1', { url: 'http://localhost:3000/image.jpg' }, mockUser as any);
    expect(result).toBeDefined();
    expect(mockUploadsService.addImageToListing).toHaveBeenCalledWith(
      'listing-1',
      'user-1',
      'http://localhost:3000/image.jpg',
      false,
    );
  });

  it('should reject in production when CLOUDINARY_CLOUD_NAME is unset with 400', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CLOUDINARY_CLOUD_NAME;
    await expect(
      controller.addImageByUrl('listing-1', { url: 'https://res.cloudinary.com/souqone/image/upload/v12345/car.jpg' }, mockUser as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject attacker-cloud URL https://res.cloudinary.com/attacker-cloud/image/upload/x.jpg with 400', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
    await expect(
      controller.addImageByUrl('listing-1', { url: 'https://res.cloudinary.com/attacker-cloud/image/upload/x.jpg' }, mockUser as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject mismatched prefix https://res.cloudinary.com/souqone-fake/image/upload/x.jpg with 400', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
    await expect(
      controller.addImageByUrl('listing-1', { url: 'https://res.cloudinary.com/souqone-fake/image/upload/x.jpg' }, mockUser as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow valid HTTPS Cloudinary URLs matching own cloud name', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
    const validUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/car.jpg';
    const result = await controller.addImageByUrl('listing-1', { url: validUrl, isPrimary: true }, mockUser as any);
    expect(result).toBeDefined();
    expect(mockUploadsService.addImageToListing).toHaveBeenCalledWith(
      'listing-1',
      'user-1',
      validUrl,
      true,
    );
  });

  describe('addServiceImageByUrl parity with listings (D-221)', () => {
    it('should reject invalid or non-string URLs with 400', async () => {
      await expect(controller.addServiceImageByUrl('service-1', { url: '' }, mockUser as any))
        .rejects.toThrow(BadRequestException);

      await expect(controller.addServiceImageByUrl('service-1', { url: 'not-a-valid-url' }, mockUser as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject SSRF attacks on service image URL with 400', async () => {
      await expect(controller.addServiceImageByUrl('service-1', { url: 'https://evil.com/?cloudinary.com' }, mockUser as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject non-https cloudinary URLs on service image with 400', async () => {
      await expect(controller.addServiceImageByUrl('service-1', { url: 'http://res.cloudinary.com/image.jpg' }, mockUser as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should allow valid Cloudinary URL and delegate to addImageToService', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
      const validUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/service.jpg';
      const result = await controller.addServiceImageByUrl('service-1', { url: validUrl, isPrimary: true }, mockUser as any);
      expect(result).toBeDefined();
      expect(mockUploadsService.addImageToService).toHaveBeenCalledWith(
        'service-1',
        'user-1',
        validUrl,
        true,
      );
    });

    it('should default isPrimary to false when omitted', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
      const validUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/service.jpg';
      await controller.addServiceImageByUrl('service-1', { url: validUrl }, mockUser as any);
      expect(mockUploadsService.addImageToService).toHaveBeenCalledWith(
        'service-1',
        'user-1',
        validUrl,
        false,
      );
    });
  });

  describe('addPartImageByUrl (D-224)', () => {
    beforeEach(() => {
      mockUploadsService.addImageToPart = jest.fn().mockResolvedValue({
        id: 'part-img-1',
        url: 'https://res.cloudinary.com/souqone/image/upload/v12345/part.jpg',
        isPrimary: true,
      } as any);
    });

    it('should reject invalid or non-string URLs for part images with 400', async () => {
      await expect(
        controller.addPartImageByUrl('part-1', { url: '' }, mockUser as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.addPartImageByUrl('part-1', { url: 'ftp://bad-url' }, mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject SSRF attack for part images with 400', async () => {
      await expect(
        controller.addPartImageByUrl(
          'part-1',
          { url: 'https://evil.com/?cloudinary.com' },
          mockUser as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid HTTPS Cloudinary URLs and pass isPrimary correctly to addImageToPart', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
      const validUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/part.jpg';

      const result = await controller.addPartImageByUrl(
        'part-1',
        { url: validUrl, isPrimary: true },
        mockUser as any,
      );

      expect(result).toBeDefined();
      expect(mockUploadsService.addImageToPart).toHaveBeenCalledWith(
        'part-1',
        'user-1',
        validUrl,
        true,
      );
    });

    it('should default isPrimary to false when omitted in body', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone';
      const validUrl = 'https://res.cloudinary.com/souqone/image/upload/v12345/part.jpg';

      await controller.addPartImageByUrl(
        'part-1',
        { url: validUrl },
        mockUser as any,
      );

      expect(mockUploadsService.addImageToPart).toHaveBeenCalledWith(
        'part-1',
        'user-1',
        validUrl,
        false,
      );
    });
  });
});
