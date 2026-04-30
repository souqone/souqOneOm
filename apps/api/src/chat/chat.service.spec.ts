import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

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
  },
  notification: { createMany: jest.fn() },
  $transaction: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('createOrGetConversation', () => {
    it('should create a new conversation', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'seller-1', title: 'Car' });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'buyer-1');

      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).toHaveBeenCalledTimes(1);
    });

    it('should return existing conversation', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'seller-1', title: 'Car' });
      mockPrisma.conversation.findFirst.mockResolvedValue(mockConversation);

      const result = await service.createOrGetConversation({ entityType: 'LISTING', entityId: 'listing-1' }, 'buyer-1');

      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
    });

    it('should throw if listing not found', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrGetConversation({ entityType: 'LISTING', entityId: 'nonexistent' }, 'buyer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if seller tries to message themselves', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'seller-1', title: 'Car' });

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
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

      const result = await service.sendMessage('conv-1', { content: 'مرحبا' }, 'buyer-1');

      expect(result.content).toBe('مرحبا');
      expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1);
    });

    it('should throw if user is not a participant', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage('conv-1', { content: 'test' }, 'outsider'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({ id: 'p-1', userId: 'buyer-1' });
      mockPrisma.conversationParticipant.update.mockResolvedValue({});

      const result = await service.markAsRead('conv-1', 'buyer-1');
      expect(result.message).toContain('مقروءة');
    });
  });
});
