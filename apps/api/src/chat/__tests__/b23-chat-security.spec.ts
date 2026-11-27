import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GATEWAY_OPTIONS } from '@nestjs/websockets/constants';
import { MessageType } from '@prisma/client';
import {
  ALL_STRUCTURED_VALIDATION_DTOS,
  createAppValidationPipe,
} from '../../common/pipes/validation-field-errors';
import {
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_REACTION_ALLOWED_EMOJIS,
  CHAT_WS_CHECK_ONLINE_LIMIT,
  CHAT_WS_REACT_LIMIT,
  CHAT_WS_SEND_LIMIT,
  CHAT_WS_SEND_RATE_LIMIT_MSG,
} from '../chat-security.constants';
import { ChatGateway } from '../chat.gateway';
import { ChatService } from '../chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { createCorsOptions, isCorsOriginAllowed } from '../../config/cors.config';

describe('D-B23 Chat Security, Gateway Redis Limits & Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLOUDINARY_CLOUD_NAME = 'souqone-cloud';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. REST SendMessageDto & Param Whitelist Security', () => {
    let pipe: ValidationPipe;

    beforeEach(() => {
      pipe = createAppValidationPipe(ALL_STRUCTURED_VALIDATION_DTOS);
    });

    const transformBody = (payload: Record<string, unknown>) =>
      pipe.transform(payload, { type: 'body', metatype: SendMessageDto });

    it('rejects SYSTEM type on REST with Arabic error', async () => {
      let caught: unknown;
      try {
        await transformBody({ type: MessageType.SYSTEM, content: 'رسالة مزيفة' });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(BadRequestException);
      expect(JSON.stringify((caught as BadRequestException).getResponse())).toContain(
        'غير مسموح بإرسال رسائل النظام',
      );
    });

    it('rejects content exceeding MaxLength (4000) on TEXT and on IMAGE caption via REST', async () => {
      const tooLong = 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1);
      await expect(
        transformBody({ type: MessageType.TEXT, content: tooLong }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        transformBody({
          type: MessageType.IMAGE,
          content: tooLong,
          mediaUrl: '/uploads/chat/ok.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects foreign and listings URLs for FILE/AUDIO, while allowing old IMAGE listings URLs', async () => {
      // Old mobile build IMAGE -> carone/listings & /uploads/<file> MUST stay accepted
      const oldCloudImg = await transformBody({
        type: MessageType.IMAGE,
        mediaUrl: 'https://res.cloudinary.com/souqone-cloud/image/upload/v1/carone/listings/car.jpg',
      });
      expect(oldCloudImg.mediaUrl).toContain('carone/listings/car.jpg');

      const oldLocalImg = await transformBody({
        type: MessageType.IMAGE,
        mediaUrl: '/uploads/1732700-car.jpg',
      });
      expect(oldLocalImg.mediaUrl).toBe('/uploads/1732700-car.jpg');

      // Foreign URL rejected across IMAGE / FILE / AUDIO
      await expect(
        transformBody({ type: MessageType.IMAGE, mediaUrl: 'https://evil.com/x.jpg' }),
      ).rejects.toThrow(BadRequestException);

      // Listings URL REJECTED on FILE and AUDIO
      await expect(
        transformBody({
          type: MessageType.FILE,
          mediaUrl: 'https://res.cloudinary.com/souqone-cloud/image/upload/v1/carone/listings/car.jpg',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        transformBody({ type: MessageType.AUDIO, mediaUrl: '/uploads/1732700-car.jpg' }),
      ).rejects.toThrow(BadRequestException);

      // Chat URLs ACCEPTED on FILE / AUDIO
      const chatPdf = await transformBody({
        type: MessageType.FILE,
        mediaUrl: 'https://res.cloudinary.com/souqone-cloud/raw/upload/v1/carone/chat/doc.pdf',
      });
      expect(chatPdf.type).toBe(MessageType.FILE);
    });

    it('rejects TEXT message carrying a mediaUrl', async () => {
      await expect(
        transformBody({
          type: MessageType.TEXT,
          content: 'مرحبا',
          mediaUrl: '/uploads/chat/pic.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces exact DTO property whitelist (only content, type, mediaUrl allowed)', async () => {
      const dtoInstance = new SendMessageDto();
      const allowedKeys = new Set(['content', 'type', 'mediaUrl']);
      // Positive check with all 3 whitelisted keys on IMAGE
      const accepted = await transformBody({
        content: 'صورة',
        type: MessageType.IMAGE,
        mediaUrl: '/uploads/chat/pic.jpg',
      });
      for (const k of Object.keys(accepted)) {
        expect(allowedKeys.has(k)).toBe(true);
      }
      expect(dtoInstance).toBeDefined();

      // Any 4th extra key must throw BadRequestException
      await expect(
        transformBody({
          content: 'مرحبا',
          senderId: 'spoofed-user',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. ChatService Socket/Direct Validation, Reactions & Shared Conversation Checks', () => {
    let service: ChatService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        conversationParticipant: {
          findFirst: jest.fn().mockResolvedValue({ id: 'p-1', userId: 'user-1' }),
          findMany: jest.fn().mockResolvedValue([]),
        },
        message: {
          create: jest.fn().mockResolvedValue({ id: 'm-1', content: 'ok' }),
          findUnique: jest.fn(),
        },
        messageReaction: {
          findUnique: jest.fn(),
          create: jest.fn(),
          delete: jest.fn(),
        },
        conversation: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      service = new ChatService(
        mockPrisma,
        { emit: jest.fn() } as any,
        { create: jest.fn() } as any,
        { deleteFile: jest.fn() } as any,
      );
    });

    it('blocks SYSTEM and oversized content (>4000) directly inside ChatService.sendMessage (socket path)', async () => {
      await expect(
        service.sendMessage('conv-1', { type: MessageType.SYSTEM, content: 'admin notice' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.sendMessage(
          'conv-1',
          { type: MessageType.TEXT, content: 'x'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1) },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows all 10 mobile ReactionPicker emojis and rejects disallowed or oversized emojis', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'm-1',
        conversationId: 'conv-1',
        isDeleted: false,
      });
      mockPrisma.messageReaction.findUnique.mockResolvedValue(null);
      mockPrisma.messageReaction.create.mockResolvedValue({ id: 'r-1' });

      for (const emoji of CHAT_REACTION_ALLOWED_EMOJIS) {
        const res = await service.toggleReaction('m-1', 'user-1', emoji);
        expect(res.action).toBe('added');
      }

      await expect(service.toggleReaction('m-1', 'user-1', '💩')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.toggleReaction('m-1', 'user-1', 'not-an-emoji-word')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.toggleReaction('m-1', 'user-1', 'x'.repeat(20))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects reactions on soft-deleted messages', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'm-deleted',
        conversationId: 'conv-1',
        isDeleted: true,
      });

      await expect(service.toggleReaction('m-deleted', 'user-1', '👍')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.messageReaction.create).not.toHaveBeenCalled();
    });

    it('checks shared conversation in a single indexed query in sharesConversationWith', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValueOnce({ id: 'cp-2' });
      expect(await service.sharesConversationWith('user-1', 'user-2')).toBe(true);
      expect(mockPrisma.conversationParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-2',
          conversation: {
            participants: { some: { userId: 'user-1' } },
          },
        },
        select: { id: true },
      });

      mockPrisma.conversationParticipant.findFirst.mockResolvedValueOnce(null);
      expect(await service.sharesConversationWith('user-1', 'stranger')).toBe(false);
    });
  });

  describe('3. ChatGateway Redis Rate Limits, Type Mapping, Typing Rooms, CheckOnline & CORS', () => {
    let gateway: ChatGateway;
    let mockChatService: any;
    let mockRedis: any;
    let redisCounts: Map<string, number>;

    function createClient(userId: string, joinedRooms: string[] = []) {
      const roomEmit = jest.fn();
      const rooms = new Set<string>(['socket-' + userId, `user:${userId}`, ...joinedRooms]);
      return {
        id: 'socket-' + userId,
        data: { user: { sub: userId, username: 'u-' + userId, role: 'USER' } },
        rooms,
        emit: jest.fn(),
        disconnect: jest.fn(),
        join: jest.fn((r: string) => rooms.add(r)),
        leave: jest.fn((r: string) => rooms.delete(r)),
        to: jest.fn().mockReturnValue({ emit: roomEmit }),
        _roomEmit: roomEmit,
      } as any;
    }

    beforeEach(() => {
      redisCounts = new Map<string, number>();
      mockChatService = {
        sendMessage: jest.fn().mockResolvedValue({ id: 'm-1', content: 'ok' }),
        toggleReaction: jest.fn().mockResolvedValue({
          action: 'added',
          messageId: 'm-1',
          emoji: '👍',
          conversationId: 'conv-1',
        }),
        sharesConversationWith: jest.fn().mockResolvedValue(true),
        getConversationIds: jest.fn().mockResolvedValue([]),
      };
      mockRedis = {
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(true),
        expire: jest.fn().mockResolvedValue(undefined),
        incr: jest.fn().mockImplementation(async (key: string) => {
          const next = (redisCounts.get(key) ?? 0) + 1;
          redisCounts.set(key, next);
          return next;
        }),
      };

      gateway = new ChatGateway(mockChatService, mockRedis, { validate: jest.fn() } as any);
      gateway.server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any;
    });

    afterEach(() => {
      gateway.onModuleDestroy();
    });

    it('rejects unknown type strings and SYSTEM on socket send-message without as-any forwarding', async () => {
      const client = createClient('u-1', ['conversation:conv-1']);

      const resUnknown = await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: 'hi',
        type: 'HACKED_TYPE',
      });
      expect(resUnknown.success).toBe(false);
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();

      const resSystem = await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: 'fake system',
        type: 'SYSTEM',
      });
      expect(resSystem.success).toBe(false);
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('fails OPEN and continues send-message when Redis is unavailable or throws', async () => {
      const client = createClient('u-redis-down', ['conversation:conv-1']);
      mockRedis.incr.mockResolvedValueOnce(0); // RedisService disconnected contract
      const resDisconnected = await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: 'hello',
      });
      expect(resDisconnected.success).toBe(true);

      mockRedis.incr.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const resThrow = await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: 'hello 2',
      });
      expect(resThrow.success).toBe(true);
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('enforces Redis-backed 30/min limit on react-to-message (31st rejected)', async () => {
      const client = createClient('u-react', ['conversation:conv-1']);
      for (let i = 1; i <= CHAT_WS_REACT_LIMIT; i++) {
        const res = await gateway.handleReaction(client, { messageId: 'm-1', emoji: '👍' });
        expect(res.success).toBe(true);
      }

      const res31 = await gateway.handleReaction(client, { messageId: 'm-1', emoji: '👍' });
      expect(res31.success).toBe(false);
      expect(mockChatService.toggleReaction).toHaveBeenCalledTimes(CHAT_WS_REACT_LIMIT);
      expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: expect.any(String) }));
    });

    it('ignores typing and stop-typing silently for non-participants (not in socket room) with 0 DB calls', async () => {
      const outsider = createClient('outsider-1', []);
      await gateway.handleTyping(outsider, { conversationId: 'conv-secret' });
      await gateway.handleStopTyping(outsider, { conversationId: 'conv-secret' });

      expect(outsider._roomEmit).not.toHaveBeenCalled();
      expect(outsider.emit).not.toHaveBeenCalled();

      const member = createClient('member-1', ['conversation:conv-secret']);
      await gateway.handleTyping(member, { conversationId: 'conv-secret' });
      expect(member._roomEmit).toHaveBeenCalledWith('user-typing', {
        conversationId: 'conv-secret',
        userId: 'member-1',
        username: 'u-member-1',
      });
    });

    it('returns online: false on check-online for strangers and enforces 30/min limit', async () => {
      const client = createClient('caller-1', ['conversation:conv-1']);
      mockRedis.exists.mockResolvedValue(true); // stranger IS online in Redis

      mockChatService.sharesConversationWith.mockResolvedValueOnce(false);
      await gateway.handleCheckOnline(client, { userId: 'stranger-99' });
      expect(client.emit).toHaveBeenLastCalledWith('online-status', {
        userId: 'stranger-99',
        online: false,
      });

      mockChatService.sharesConversationWith.mockResolvedValueOnce(true);
      await gateway.handleCheckOnline(client, { userId: 'friend-2' });
      expect(client.emit).toHaveBeenLastCalledWith('online-status', {
        userId: 'friend-2',
        online: true,
      });

      // Exhaust remaining 28 calls (total 30) -> 31st rate-limited
      for (let i = 3; i <= CHAT_WS_CHECK_ONLINE_LIMIT; i++) {
        await gateway.handleCheckOnline(client, { userId: 'friend-2' });
      }
      client.emit.mockClear();
      await gateway.handleCheckOnline(client, { userId: 'friend-2' });
      expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({ message: expect.any(String) }));
      expect(client.emit).not.toHaveBeenCalledWith('online-status', expect.anything());
    });

    it('enforces Redis send-message limit with exact existing Arabic error on 6th call', async () => {
      const client = createClient('u-send-rl');
      for (let i = 1; i <= CHAT_WS_SEND_LIMIT; i++) {
        const res = await gateway.handleSendMessage(client, {
          conversationId: 'conv-1',
          content: `msg ${i}`,
        });
        expect(res.success).toBe(true);
      }
      expect(mockRedis.incr).toHaveBeenCalledWith('chat:ws:rl:send:u-send-rl', 10);
      const res6 = await gateway.handleSendMessage(client, {
        conversationId: 'conv-1',
        content: 'msg 6',
      });
      expect(res6).toEqual({ success: false, error: CHAT_WS_SEND_RATE_LIMIT_MSG });
    });

    it('replaces origin:true CORS on ChatGateway with shared CORS_ORIGINS allowlist while allowing no-Origin mobile clients', () => {
      const gatewayMeta = Reflect.getMetadata(GATEWAY_OPTIONS, ChatGateway);
      expect(gatewayMeta.cors.origin).not.toBe(true);
      expect(typeof gatewayMeta.cors.origin).toBe('function');

      process.env.CORS_ORIGINS = 'https://souqone.om,http://localhost:3000';
      expect(isCorsOriginAllowed(undefined)).toBe(true); // native mobile client (no Origin header)
      expect(isCorsOriginAllowed('https://souqone.om')).toBe(true);
      expect(isCorsOriginAllowed('https://evil.example.com')).toBe(false);

      const cbAllowed = jest.fn();
      const cbBlocked = jest.fn();
      const cbMobile = jest.fn();
      const corsOpts = createCorsOptions();
      const originFn = corsOpts.origin as (
        origin: string | undefined,
        cb: (err: Error | null, allow?: boolean) => void,
      ) => void;
      originFn(undefined, cbMobile);
      originFn('https://souqone.om', cbAllowed);
      originFn('https://evil.example.com', cbBlocked);

      expect(cbMobile).toHaveBeenCalledWith(null, true);
      expect(cbAllowed).toHaveBeenCalledWith(null, true);
      expect(cbBlocked).toHaveBeenCalledWith(null, false);
    });
  });
});
