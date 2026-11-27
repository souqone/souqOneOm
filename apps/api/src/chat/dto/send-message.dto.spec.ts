import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import {
  ALL_STRUCTURED_VALIDATION_DTOS,
  createAppValidationPipe,
} from '../../common/pipes/validation-field-errors';
import { SendMessageDto } from './send-message.dto';

describe('SendMessageDto', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = createAppValidationPipe(ALL_STRUCTURED_VALIDATION_DTOS);
  });

  const validateBody = (payload: Record<string, unknown>) =>
    pipe.transform(payload, { type: 'body', metatype: SendMessageDto });

  it('allows TEXT message with content and without mediaUrl', async () => {
    const result = await validateBody({ content: 'مرحبا', type: MessageType.TEXT });
    expect(result).toBeInstanceOf(SendMessageDto);
    expect(result.content).toBe('مرحبا');
    expect(result.type).toBe(MessageType.TEXT);
  });

  it('allows omitted type with content', async () => {
    const result = await validateBody({ content: 'رسالة افتراضية' });
    expect(result.content).toBe('رسالة افتراضية');
  });

  it('rejects SYSTEM message from clients (D-B23)', async () => {
    await expect(
      validateBody({ content: 'تم الإغلاق', type: MessageType.SYSTEM }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects TEXT message with empty content using Arabic message', async () => {
    let caught: unknown;
    try {
      await validateBody({ content: '', type: MessageType.TEXT });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    expect(JSON.stringify((caught as BadRequestException).getResponse())).toContain(
      'محتوى الرسالة مطلوب',
    );
  });

  it('rejects omitted type when content is missing', async () => {
    await expect(validateBody({})).rejects.toThrow(BadRequestException);
  });

  it('rejects SYSTEM message even when content is empty', async () => {
    await expect(
      validateBody({ content: '', type: MessageType.SYSTEM }),
    ).rejects.toThrow(BadRequestException);
  });

  it.each([
    [MessageType.IMAGE, '/uploads/chat/photo.jpg'],
    [MessageType.FILE, '/uploads/chat/spec.pdf'],
    [MessageType.AUDIO, '/uploads/chat/voice.m4a'],
  ])('allows %s message without caption when mediaUrl is provided', async (type, mediaUrl) => {
    const result = await validateBody({ type, mediaUrl });
    expect(result.type).toBe(type);
    expect(result.mediaUrl).toBe(mediaUrl);
    expect(result.content).toBeUndefined();
  });

  it.each([
    [MessageType.IMAGE, '/uploads/chat/photo.jpg'],
    [MessageType.FILE, '/uploads/chat/spec.pdf'],
    [MessageType.AUDIO, '/uploads/chat/voice.m4a'],
  ])('allows %s message with empty string content when mediaUrl is provided', async (type, mediaUrl) => {
    const result = await validateBody({ type, content: '', mediaUrl });
    expect(result.type).toBe(type);
    expect(result.content).toBe('');
    expect(result.mediaUrl).toBe(mediaUrl);
  });

  it('allows media message with both mediaUrl and caption', async () => {
    const result = await validateBody({
      type: MessageType.FILE,
      content: 'كتالوج الشاحنة',
      mediaUrl: '/uploads/chat/catalog.pdf',
    });
    expect(result.content).toBe('كتالوج الشاحنة');
    expect(result.mediaUrl).toBe('/uploads/chat/catalog.pdf');
  });

  it.each([MessageType.IMAGE, MessageType.FILE, MessageType.AUDIO])(
    'rejects %s message when mediaUrl is missing',
    async (type) => {
      let caught: unknown;
      try {
        await validateBody({ type, content: 'توضيح' });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(BadRequestException);
      expect(JSON.stringify((caught as BadRequestException).getResponse())).toContain(
        'رابط الوسائط مطلوب',
      );
    },
  );

  it('rejects IMAGE message when mediaUrl is empty string', async () => {
    await expect(
      validateBody({ type: MessageType.IMAGE, mediaUrl: '' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unknown MessageType values', async () => {
    await expect(
      validateBody({ type: 'VIDEO', mediaUrl: 'https://cdn.example.com/v.mp4' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('still enforces forbidNonWhitelisted: true on extra fields', async () => {
    await expect(
      validateBody({
        type: MessageType.IMAGE,
        mediaUrl: '/uploads/chat/photo.jpg',
        unexpectedField: 'hack',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
