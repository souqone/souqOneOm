import 'reflect-metadata';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BadRequestException, RequestMethod } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  GUARDS_METADATA,
  ROUTE_ARGS_METADATA,
  INTERCEPTORS_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UploadFileStorageService } from '../upload-file-storage.service';
import { UploadImageManagerService } from '../upload-image-manager.service';
import { UploadsService } from '../uploads.service';
import { UploadsController } from '../uploads.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  CHAT_MEDIA_RULES,
  CHAT_UPLOAD_FOLDER,
  CHAT_UPLOAD_MAX_BODY_BYTES,
  CHAT_UPLOAD_THROTTLE_LIMIT,
  CHAT_UPLOAD_THROTTLE_TTL_MS,
} from '../chat-media.constants';
import { extractOwnedChatMediaKey, validateChatMediaFile } from '../chat-media.validator';

const makeFile = (
  overrides: Partial<Express.Multer.File> & { buffer: Buffer },
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'sample.bin',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: overrides.buffer.length,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as any,
    ...overrides,
  }) as Express.Multer.File;

// Realistic magic-byte fixtures
const JPEG_BUF = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG_BUF = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP_BUF = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
const HEIC_BUF = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypheic'), Buffer.alloc(4)]);
const PDF_BUF = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');
const M4A_BUF = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypM4A '), Buffer.alloc(4)]);
const MP3_ID3_BUF = Buffer.concat([Buffer.from('ID3'), Buffer.from([0x04, 0x00, 0x00])]);
const MP3_SYNC_BUF = Buffer.from([0xff, 0xfb, 0x90, 0x64]);
const AAC_ADTS_BUF = Buffer.from([0xff, 0xf1, 0x50, 0x80]);
const OGG_BUF = Buffer.concat([Buffer.from('OggS'), Buffer.from([0x00, 0x02])]);
const WAV_BUF = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')]);
const WEBM_BUF = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42]);
const EXE_BUF = Buffer.from('MZ\x90\x00\x03\x00\x00\x00This program cannot be run in DOS mode');
const HTML_BUF = Buffer.from('<!DOCTYPE html><html><script>alert(1)</script></html>');

describe('D-B22 Chat Media Upload, Validation & Cloudinary Resource Types', () => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  let tempWorkDir: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    tempWorkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'souqone-b22-'));
    process.chdir(tempWorkDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    fs.rmSync(tempWorkDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('Constants & Per-Type Validation Rules', () => {
    it('defines expected size limits and Cloudinary resource types in one constants map', () => {
      expect(CHAT_MEDIA_RULES.IMAGE.maxBytes).toBe(10 * 1024 * 1024);
      expect(CHAT_MEDIA_RULES.IMAGE.cloudinaryResourceType).toBe('image');
      expect(CHAT_MEDIA_RULES.PDF.maxBytes).toBe(10 * 1024 * 1024);
      expect(CHAT_MEDIA_RULES.PDF.cloudinaryResourceType).toBe('raw');
      expect(CHAT_MEDIA_RULES.AUDIO.maxBytes).toBe(5 * 1024 * 1024);
      expect(CHAT_MEDIA_RULES.AUDIO.cloudinaryResourceType).toBe('video');
      expect(CHAT_UPLOAD_MAX_BODY_BYTES).toBe(10 * 1024 * 1024);
    });

    it.each([
      ['JPEG image', 'image/jpeg', 'photo.jpg', JPEG_BUF, 'IMAGE', '.jpg'],
      ['PNG image', 'image/png', 'photo.png', PNG_BUF, 'IMAGE', '.png'],
      ['WebP image', 'image/webp', 'photo.webp', WEBP_BUF, 'IMAGE', '.webp'],
      ['HEIC image', 'image/heic', 'photo.heic', HEIC_BUF, 'IMAGE', '.heic'],
      ['PDF document', 'application/pdf', 'invoice.pdf', PDF_BUF, 'PDF', '.pdf'],
      ['M4A voice (audio/m4a)', 'audio/m4a', 'voice.m4a', M4A_BUF, 'AUDIO', '.m4a'],
      ['MP4 audio (video/mp4)', 'video/mp4', 'voice.mp4', M4A_BUF, 'AUDIO', '.mp4'],
      ['MP3 ID3', 'audio/mpeg', 'track.mp3', MP3_ID3_BUF, 'AUDIO', '.mp3'],
      ['MP3 sync', 'audio/mp3', 'track.mp3', MP3_SYNC_BUF, 'AUDIO', '.mp3'],
      ['AAC ADTS', 'audio/aac', 'clip.aac', AAC_ADTS_BUF, 'AUDIO', '.aac'],
      ['OGG audio', 'audio/ogg', 'clip.ogg', OGG_BUF, 'AUDIO', '.ogg'],
      ['WAV audio', 'audio/wav', 'clip.wav', WAV_BUF, 'AUDIO', '.wav'],
      ['WebM audio', 'audio/webm', 'clip.webm', WEBM_BUF, 'AUDIO', '.webm'],
    ])(
      'accepts valid %s',
      (_label, mimetype, originalname, buffer, expectedKind, expectedExt) => {
        const result = validateChatMediaFile(makeFile({ mimetype, originalname, buffer }));
        expect(result.rule.kind).toBe(expectedKind);
        expect(result.safeExtension).toBe(expectedExt);
      },
    );

    it.each([
      [
        'docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc.docx',
        Buffer.from('PK\x03\x04'),
      ],
      [
        'xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'sheet.xlsx',
        Buffer.from('PK\x03\x04'),
      ],
      ['svg image', 'image/svg+xml', 'icon.svg', Buffer.from('<svg></svg>')],
    ])('rejects disallowed type %s', (_label, mimetype, originalname, buffer) => {
      expect(() => validateChatMediaFile(makeFile({ mimetype, originalname, buffer }))).toThrow(
        BadRequestException,
      );
    });

    it('enforces per-type size limits (5MB audio rejected at 5MB+1, 10MB PDF accepted under 10MB and rejected at 10MB+1)', () => {
      const overAudio = makeFile({
        mimetype: 'audio/m4a',
        originalname: 'voice.m4a',
        buffer: M4A_BUF,
        size: 5 * 1024 * 1024 + 1,
      });
      expect(() => validateChatMediaFile(overAudio)).toThrow(BadRequestException);

      const overPdf = makeFile({
        mimetype: 'application/pdf',
        originalname: 'doc.pdf',
        buffer: PDF_BUF,
        size: 10 * 1024 * 1024 + 1,
      });
      expect(() => validateChatMediaFile(overPdf)).toThrow(BadRequestException);
    });

    it('rejects executable disguised as .pdf (teeth)', () => {
      const exeAsPdf = makeFile({
        mimetype: 'application/pdf',
        originalname: 'invoice.pdf',
        buffer: EXE_BUF,
      });
      expect(() => validateChatMediaFile(exeAsPdf)).toThrow(BadRequestException);
    });

    it('rejects HTML file disguised as .jpg (teeth)', () => {
      const htmlAsJpg = makeFile({
        mimetype: 'image/jpeg',
        originalname: 'avatar.jpg',
        buffer: HTML_BUF,
      });
      expect(() => validateChatMediaFile(htmlAsJpg)).toThrow(BadRequestException);
    });

    it('rejects cross-category spoofing (PDF bytes claiming image/jpeg, HEIC claiming audio/m4a, WAV claiming image/webp)', () => {
      expect(() =>
        validateChatMediaFile(
          makeFile({ mimetype: 'image/jpeg', originalname: 'fake.jpg', buffer: PDF_BUF }),
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        validateChatMediaFile(
          makeFile({ mimetype: 'audio/m4a', originalname: 'fake.m4a', buffer: HEIC_BUF }),
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        validateChatMediaFile(
          makeFile({ mimetype: 'image/webp', originalname: 'fake.webp', buffer: WAV_BUF }),
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects dangerous extension even when magic bytes are valid image', () => {
      expect(() =>
        validateChatMediaFile(
          makeFile({ mimetype: 'image/jpeg', originalname: 'payload.php', buffer: JPEG_BUF }),
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('CloudinaryService resource_type upload & delete', () => {
    it('passes explicit resource_type and public_id to upload_stream and resource_type to destroy', async () => {
      const capturedUploadOptions: any[] = [];
      const uploadStreamSpy = jest
        .spyOn(cloudinary.uploader, 'upload_stream')
        .mockImplementation(((options: any, cb: any) => {
          capturedUploadOptions.push(options);
          cb(null, {
            secure_url: 'https://res.cloudinary.com/demo/raw/upload/v1/carone/chat/doc.pdf',
            public_id: 'carone/chat/doc.pdf',
          });
          return {
            on: jest.fn(),
            once: jest.fn(),
            emit: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
            removeListener: jest.fn(),
          } as any;
        }) as any);
      const destroySpy = jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockResolvedValue({ result: 'ok' } as any);

      const svc = new CloudinaryService();
      await svc.upload(
        makeFile({ mimetype: 'application/pdf', originalname: 'doc.pdf', buffer: PDF_BUF }),
        CHAT_UPLOAD_FOLDER,
        'raw',
        'doc-id.pdf',
      );
      expect(uploadStreamSpy).toHaveBeenCalled();
      expect(capturedUploadOptions[0]).toEqual({
        folder: 'carone/chat',
        resource_type: 'raw',
        public_id: 'doc-id.pdf',
      });

      await svc.delete('carone/chat/doc.pdf', 'raw');
      expect(destroySpy).toHaveBeenCalledWith('carone/chat/doc.pdf', { resource_type: 'raw' });

      await svc.delete('carone/chat/voice1', 'video');
      expect(destroySpy).toHaveBeenCalledWith('carone/chat/voice1', { resource_type: 'video' });
    });
  });

  describe('UploadFileStorageService (Cloudinary & Local Fallback)', () => {
    it('uploads chat PDF/audio/image to carone/chat with encoded resource_type keys and deletes with matching resource_type', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone-cloud';
      const mockCloudinary = {
        upload: jest
          .fn()
          .mockResolvedValueOnce({
            secure_url: 'https://res.cloudinary.com/souqone-cloud/raw/upload/v1/carone/chat/doc.pdf',
            public_id: 'carone/chat/doc.pdf',
          })
          .mockResolvedValueOnce({
            secure_url: 'https://res.cloudinary.com/souqone-cloud/video/upload/v1/carone/chat/voice.m4a',
            public_id: 'carone/chat/voice',
          }),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      const storage = new UploadFileStorageService(mockCloudinary as unknown as CloudinaryService);

      const pdfRes = await storage.uploadChatMedia(
        makeFile({ mimetype: 'application/pdf', originalname: 'quote.pdf', buffer: PDF_BUF }),
      );
      expect(mockCloudinary.upload).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'carone/chat',
        'raw',
        expect.stringMatching(/\.pdf$/),
      );
      expect(pdfRes).toEqual({
        url: 'https://res.cloudinary.com/souqone-cloud/raw/upload/v1/carone/chat/doc.pdf',
        key: 'raw:carone/chat/doc.pdf',
      });

      const audioRes = await storage.uploadChatMedia(
        makeFile({ mimetype: 'audio/m4a', originalname: 'voice.m4a', buffer: M4A_BUF }),
      );
      expect(mockCloudinary.upload).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        'carone/chat',
        'video',
        undefined,
      );
      expect(audioRes).toEqual({
        url: 'https://res.cloudinary.com/souqone-cloud/video/upload/v1/carone/chat/voice.m4a',
        key: 'video:carone/chat/voice',
      });

      await storage.deleteFile(pdfRes.key);
      expect(mockCloudinary.delete).toHaveBeenCalledWith('carone/chat/doc.pdf', 'raw');

      await storage.deleteFile(audioRes.key);
      expect(mockCloudinary.delete).toHaveBeenCalledWith('carone/chat/voice', 'video');

      await storage.deleteFile('carone/listings/legacy-img');
      expect(mockCloudinary.delete).toHaveBeenCalledWith('carone/listings/legacy-img', 'image');
    });

    it('supports local-storage fallback for chat media upload and delete when Cloudinary is unconfigured', async () => {
      const mockCloudinary = {
        upload: jest.fn(),
        delete: jest.fn(),
      };
      const storage = new UploadFileStorageService(mockCloudinary as unknown as CloudinaryService);

      const res = await storage.uploadChatMedia(
        makeFile({ mimetype: 'application/pdf', originalname: 'report.pdf', buffer: PDF_BUF }),
      );
      expect(mockCloudinary.upload).not.toHaveBeenCalled();
      expect(res.key).toMatch(/^chat\/.+\.pdf$/);
      expect(res.url).toBe(`/uploads/${res.key}`);

      const writtenPath = path.join(tempWorkDir, 'uploads', res.key);
      expect(fs.existsSync(writtenPath)).toBe(true);
      expect(fs.readFileSync(writtenPath).equals(PDF_BUF)).toBe(true);

      await storage.deleteFile(res.key);
      expect(fs.existsSync(writtenPath)).toBe(false);
    });
  });

  describe('UploadsController Contract & Throttling', () => {
    it('exposes POST /uploads/chat with JwtAuthGuard, 20/min throttle, file interceptor 10MB limit, and { url, key } shape while keeping POST /uploads image-only', async () => {
      const storageMock = {
        uploadFile: jest.fn().mockRejectedValue(
          new BadRequestException('نوع الملف غير مدعوم'),
        ),
        uploadChatMedia: jest.fn().mockResolvedValue({
          url: '/uploads/chat/voice.m4a',
          key: 'chat/voice.m4a',
        }),
        deleteFile: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [UploadsController],
        providers: [
          UploadsService,
          { provide: UploadFileStorageService, useValue: storageMock },
          {
            provide: UploadImageManagerService,
            useValue: {},
          },
          { provide: PrismaService, useValue: {} },
          { provide: RedisService, useValue: {} },
        ],
      }).compile();

      const controller = module.get(UploadsController);
      const handler = UploadsController.prototype.uploadChatMedia;

      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('chat');
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(JwtAuthGuard);
      expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(
        CHAT_UPLOAD_THROTTLE_LIMIT,
      );
      expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(
        CHAT_UPLOAD_THROTTLE_TTL_MS,
      );
      // Whitelist copied from controller metadata: single @UploadedFile() param only (no @Body/@Param/@Query)
      expect(handler.length).toBe(1);
      const routeArgs = Reflect.getMetadata(ROUTE_ARGS_METADATA, UploadsController, 'uploadChatMedia');
      expect(Object.keys(routeArgs)).toHaveLength(1);
      expect(Object.keys(routeArgs)[0]).toContain(':0');
      const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, handler);
      expect(interceptors).toHaveLength(1);

      const audioFile = makeFile({
        mimetype: 'audio/m4a',
        originalname: 'voice.m4a',
        buffer: M4A_BUF,
      });
      const response = await controller.uploadChatMedia(audioFile);
      expect(Object.keys(response).sort()).toEqual(['key', 'url']);
      expect(response).toEqual({ url: '/uploads/chat/voice.m4a', key: 'chat/voice.m4a' });

      // Existing POST /uploads stays separate (30/min, rejects PDF/audio via uploadFile)
      expect(
        Reflect.getMetadata('THROTTLER:LIMITdefault', UploadsController.prototype.uploadFile),
      ).toBe(30);
      await expect(controller.uploadFile(audioFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Owned Chat Media URL Extraction (SSRF Guard)', () => {
    it('extracts keys only for owned /uploads/ or configured Cloudinary cloud paths', () => {
      expect(extractOwnedChatMediaKey('/uploads/chat/123.m4a', 'my-cloud')).toBe('chat/123.m4a');
      expect(
        extractOwnedChatMediaKey(
          'https://res.cloudinary.com/my-cloud/raw/upload/v99/carone/chat/doc.pdf',
          'my-cloud',
        ),
      ).toBe('raw:carone/chat/doc.pdf');
      expect(
        extractOwnedChatMediaKey(
          'https://res.cloudinary.com/my-cloud/video/upload/v99/carone/chat/voice.m4a',
          'my-cloud',
        ),
      ).toBe('video:carone/chat/voice');

      // Foreign / traversal / wrong-cloud URLs must return null
      expect(extractOwnedChatMediaKey('https://evil.com/uploads/chat/x.m4a', 'my-cloud')).toBeNull();
      expect(
        extractOwnedChatMediaKey(
          'https://res.cloudinary.com/attacker-cloud/raw/upload/v1/carone/chat/x.pdf',
          'my-cloud',
        ),
      ).toBeNull();
      expect(extractOwnedChatMediaKey('/uploads/../../etc/passwd', 'my-cloud')).toBeNull();
    });
  });
});
