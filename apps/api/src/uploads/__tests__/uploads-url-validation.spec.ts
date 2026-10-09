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

  it('should allow valid HTTPS Cloudinary URLs', async () => {
    process.env.NODE_ENV = 'production';
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
});
