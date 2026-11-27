import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageType } from '@prisma/client';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';

const mockConversation = {
  id: 'conv-1',
  listingId: 'listing-1',
  participants: [
    { userId: 'buyer-1', user: { id: 'buyer-1', username: 'buyer', displayName: 'Buyer', avatarUrl: null } },
    { userId: 'seller-1', user: { id: 'seller-1', username: 'seller', displayName: 'Seller', avatarUrl: null } },
  ],
  listing: { id: 'listing-1', title: 'Test Car', slug: 'test-car' },
};

const mockMessage = {
  id: 'msg-1',
  content: 'مرحبا',
  type: 'TEXT',
  senderId: 'buyer-1',
  conversationId: 'conv-1',
  sender: { id: 'buyer-1', username: 'buyer', displayName: 'Buyer', avatarUrl: null },
};

const mockPrisma = {
  listing: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  conversation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  conversationParticipant: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  notification: { createMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotifications = {
  create: jest.fn(),
};

const mockUploads = {
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: UploadsService, useValue: mockUploads },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('createOrGetConversation', () => {
    it('should create a new conversation when entity is visible and owner active', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        sellerId: 'seller-1',
        title: 'Car',
        status: 'ACTIVE',
        hiddenByOwnerStatus: false,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'seller-1', status: 'ACTIVE' });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'buyer-1');

      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).toHaveBeenCalledTimes(1);
    });

    it('should return existing conversation without re-checking active status', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        sellerId: 'seller-1',
        title: 'Car',
        status: 'ACTIVE',
        hiddenByOwnerStatus: true,
      });
      mockPrisma.conversation.findFirst.mockResolvedValue(mockConversation);

      const result = await service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'buyer-1');

      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if new conversation target entity is hidden', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        sellerId: 'seller-1',
        title: 'Car',
        status: 'ACTIVE',
        hiddenByOwnerStatus: true,
      });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'buyer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if new conversation target owner is not ACTIVE', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        sellerId: 'seller-1',
        title: 'Car',
        status: 'ACTIVE',
        hiddenByOwnerStatus: false,
      });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'seller-1', status: 'BANNED' });

      await expect(
        service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'buyer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if listing not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrGetConversation({ entityType: 'LISTING', entityId: 'nonexistent' }, 'buyer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if seller tries to message themselves', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        sellerId: 'seller-1',
        title: 'Car',
        status: 'ACTIVE',
        hiddenByOwnerStatus: false,
      });

      await expect(
        service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'seller-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendMessage', () => {
    it('should send a message and create notifications', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({ id: 'p-1', userId: 'buyer-1' });
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'seller-1' }]);
      mockNotifications.create.mockResolvedValue({});

      const result = await service.sendMessage('conv-1', { content: 'مرحبا' }, 'buyer-1');

      expect(result.content).toBe('مرحبا');
      expect(mockNotifications.create).toHaveBeenCalledTimes(1);
      expect(mockNotifications.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'MESSAGE',
        userId: 'seller-1',
      }));
    });

    it('should throw if user is not a participant', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage('conv-1', { content: 'test' }, 'outsider'),
      ).rejects.toThrow(ForbiddenException);
    });

    it.each([
      [MessageType.IMAGE, 'https://cdn.example.com/photo.jpg', 'صورة'],
      [MessageType.FILE, 'https://cdn.example.com/spec.pdf', 'ملف'],
      [MessageType.AUDIO, 'https://cdn.example.com/voice.m4a', 'رسالة صوتية'],
    ])(
      'persists content="" and sets fallback notification body for %s without caption',
      async (type, mediaUrl, expectedBody) => {
        mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
          id: 'p-1',
          userId: 'buyer-1',
        });
        mockPrisma.message.create.mockResolvedValue({
          ...mockMessage,
          content: '',
          type,
          mediaUrl,
        });
        mockPrisma.conversation.update.mockResolvedValue({});
        mockPrisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'seller-1' }]);
        mockNotifications.create.mockResolvedValue({});

        const result = await service.sendMessage(
          'conv-1',
          { type, mediaUrl },
          'buyer-1',
        );

        expect(result.content).toBe('');
        expect(mockPrisma.message.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              content: '',
              type,
              mediaUrl,
            }),
          }),
        );
        expect(mockNotifications.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'MESSAGE',
            body: expectedBody,
            userId: 'seller-1',
          }),
        );
      },
    );

    it('uses fallback notification body when IMAGE has whitespace-only caption', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
        id: 'p-1',
        userId: 'buyer-1',
      });
      mockPrisma.message.create.mockResolvedValue({
        ...mockMessage,
        content: '   ',
        type: MessageType.IMAGE,
        mediaUrl: 'https://cdn.example.com/photo.jpg',
      });
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'seller-1' }]);
      mockNotifications.create.mockResolvedValue({});

      await service.sendMessage(
        'conv-1',
        { type: MessageType.IMAGE, content: '   ', mediaUrl: 'https://cdn.example.com/photo.jpg' },
        'buyer-1',
      );

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'صورة',
        }),
      );
    });

    it('uses caption for notification body when media message has non-empty content', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
        id: 'p-1',
        userId: 'buyer-1',
      });
      mockPrisma.message.create.mockResolvedValue({
        ...mockMessage,
        content: 'فاتورة الفحص',
        type: MessageType.FILE,
        mediaUrl: 'https://cdn.example.com/invoice.pdf',
      });
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'seller-1' }]);
      mockNotifications.create.mockResolvedValue({});

      await service.sendMessage(
        'conv-1',
        {
          type: MessageType.FILE,
          content: 'فاتورة الفحص',
          mediaUrl: 'https://cdn.example.com/invoice.pdf',
        },
        'buyer-1',
      );

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'فاتورة الفحص',
        }),
      );
    });

    it.each([
      { content: '', type: MessageType.TEXT },
      { content: '   ', type: undefined },
      { content: '   ', type: MessageType.SYSTEM },
    ])(
      'rejects empty/whitespace content via socket-style call without ValidationPipe: %j',
      async (dtoPayload) => {
        mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
          id: 'p-1',
          userId: 'buyer-1',
        });

        await expect(
          service.sendMessage('conv-1', dtoPayload as any, 'buyer-1'),
        ).rejects.toThrow(new BadRequestException('محتوى الرسالة مطلوب'));
        expect(mockPrisma.message.create).not.toHaveBeenCalled();
      },
    );

    it.each([
      { type: MessageType.IMAGE },
      { type: MessageType.FILE, mediaUrl: '' },
      { type: MessageType.AUDIO, mediaUrl: '   ' },
    ])(
      'rejects media message without mediaUrl via socket-style call: %j',
      async (dtoPayload) => {
        mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
          id: 'p-1',
          userId: 'buyer-1',
        });

        await expect(
          service.sendMessage('conv-1', dtoPayload as any, 'buyer-1'),
        ).rejects.toThrow(BadRequestException);
        expect(mockPrisma.message.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({ id: 'p-1', userId: 'buyer-1' });
      mockPrisma.conversationParticipant.update.mockResolvedValue({});

      const result = await service.markAsRead('conv-1', 'buyer-1');
      expect(result.message).toContain('مقروءة');
    });
  });

  describe('deleteMessage (media cleanup & SSRF protection)', () => {
    const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;

    afterEach(() => {
      if (originalCloudName === undefined) {
        delete process.env.CLOUDINARY_CLOUD_NAME;
      } else {
        process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
      }
    });

    it('clears mediaUrl to null and deletes owned local file /uploads/chat/...', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'msg-local-1',
        conversationId: 'conv-1',
        senderId: 'buyer-1',
        mediaUrl: '/uploads/chat/1732700-voice.m4a',
      });
      mockPrisma.message.update.mockResolvedValue({});

      const res = await service.deleteMessage('msg-local-1', 'buyer-1');

      expect(res).toEqual({ messageId: 'msg-local-1', conversationId: 'conv-1' });
      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-local-1' },
        data: { isDeleted: true, deletedAt: expect.any(Date), content: '', mediaUrl: null },
      });
      expect(mockUploads.deleteFile).toHaveBeenCalledWith('chat/1732700-voice.m4a');
    });

    it('deletes owned Cloudinary raw PDF and video audio with resource_type key prefix', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone-cloud';
      mockPrisma.message.findUnique.mockResolvedValueOnce({
        id: 'msg-pdf-1',
        conversationId: 'conv-1',
        senderId: 'buyer-1',
        mediaUrl: 'https://res.cloudinary.com/souqone-cloud/raw/upload/v123/carone/chat/doc-1.pdf',
      });
      mockPrisma.message.update.mockResolvedValue({});

      await service.deleteMessage('msg-pdf-1', 'buyer-1');
      expect(mockUploads.deleteFile).toHaveBeenCalledWith('raw:carone/chat/doc-1.pdf');

      mockUploads.deleteFile.mockClear();
      mockPrisma.message.findUnique.mockResolvedValueOnce({
        id: 'msg-audio-1',
        conversationId: 'conv-1',
        senderId: 'buyer-1',
        mediaUrl: 'https://res.cloudinary.com/souqone-cloud/video/upload/v123/carone/chat/rec-1.m4a',
      });

      await service.deleteMessage('msg-audio-1', 'buyer-1');
      expect(mockUploads.deleteFile).toHaveBeenCalledWith('video:carone/chat/rec-1');
    });

    it('clears mediaUrl to null in DB but NEVER calls storage delete for foreign or wrong-cloud URLs (SSRF guard)', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'souqone-cloud';
      mockPrisma.message.findUnique
        .mockResolvedValueOnce({
          id: 'msg-foreign-1',
          conversationId: 'conv-1',
          senderId: 'buyer-1',
          mediaUrl: 'https://evil.example.com/uploads/chat/steal.pdf',
        })
        .mockResolvedValueOnce({
          id: 'msg-other-cloud',
          conversationId: 'conv-1',
          senderId: 'buyer-1',
          mediaUrl: 'https://res.cloudinary.com/attacker-cloud/raw/upload/v1/carone/chat/doc.pdf',
        });
      mockPrisma.message.update.mockResolvedValue({});

      await service.deleteMessage('msg-foreign-1', 'buyer-1');
      await service.deleteMessage('msg-other-cloud', 'buyer-1');

      expect(mockPrisma.message.update).toHaveBeenCalledTimes(2);
      expect(mockUploads.deleteFile).not.toHaveBeenCalled();
    });

    it('succeeds cleanly even when storage deleteFile rejects (best-effort cleanup)', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'msg-err-1',
        conversationId: 'conv-1',
        senderId: 'buyer-1',
        mediaUrl: '/uploads/chat/voice.m4a',
      });
      mockPrisma.message.update.mockResolvedValue({});
      mockUploads.deleteFile.mockRejectedValueOnce(new Error('Storage unreachable'));

      const res = await service.deleteMessage('msg-err-1', 'buyer-1');
      expect(res).toEqual({ messageId: 'msg-err-1', conversationId: 'conv-1' });
      expect(mockUploads.deleteFile).toHaveBeenCalledTimes(1);
    });
  });
});
