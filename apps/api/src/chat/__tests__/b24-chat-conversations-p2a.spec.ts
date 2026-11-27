import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ALL_STRUCTURED_VALIDATION_DTOS,
  createAppValidationPipe,
} from '../../common/pipes/validation-field-errors';
import { CHAT_EVENTS } from '../chat.events';
import { ChatGateway } from '../chat.gateway';
import { ChatService } from '../chat.service';
import { GetMessagesDto } from '../dto/get-messages.dto';

describe('D-B24 Chat Conversations API P2a', () => {
  let service: ChatService;
  let mockPrisma: any;
  let mockEvents: { emit: jest.Mock };
  let mockNotifications: { create: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEvents = { emit: jest.fn() };
    mockNotifications = { create: jest.fn().mockResolvedValue({}) };
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn(),
      listing: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      busListing: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      sparePart: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      carService: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      driverJob: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      equipmentListing: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      operatorListing: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      transportRequest: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      user: { findUnique: jest.fn() },
      conversation: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      conversationParticipant: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      message: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ChatService(
      mockPrisma,
      mockEvents as unknown as EventEmitter2,
      mockNotifications as any,
      { deleteFile: jest.fn() } as any,
    );
  });

  describe('1. getConversations: N+1 elimination, empty/deleted filtering, batch entitySummary & otherLastReadAt', () => {
    it('avoids N+1 unread/title queries and uses one $queryRaw ignoring isDeleted messages', async () => {
      const now = new Date('2026-11-27T12:00:00.000Z');
      const convs = Array.from({ length: 12 }, (_, idx) => ({
        id: `conv-${idx}`,
        entityType: idx % 2 === 0 ? 'LISTING' : 'BUS_LISTING',
        entityId: `ent-${idx}`,
        listingId: idx % 2 === 0 ? `ent-${idx}` : null,
        listing:
          idx % 2 === 0
            ? {
                id: `ent-${idx}`,
                title: `Car ${idx}`,
                slug: `car-${idx}`,
                sellerId: idx === 0 ? 'caller-1' : `seller-${idx}`,
                images: [{ url: `/uploads/car-${idx}.jpg` }],
              }
            : null,
        participants: [
          {
            id: `cp-caller-${idx}`,
            userId: 'caller-1',
            lastReadAt: new Date('2026-11-27T10:00:00.000Z'),
            isArchived: false,
            user: { id: 'caller-1', username: 'caller', displayName: 'Caller', avatarUrl: null },
          },
          {
            id: `cp-other-${idx}`,
            userId: `seller-${idx}`,
            lastReadAt: idx === 0 ? now : null,
            isArchived: false,
            user: { id: `seller-${idx}`, username: `s${idx}`, displayName: `Seller ${idx}`, avatarUrl: null },
          },
        ],
        messages: [
          {
            id: `msg-${idx}`,
            content: 'hello',
            type: 'TEXT',
            senderId: `seller-${idx}`,
            createdAt: now,
            isDeleted: false,
          },
        ],
      }));

      mockPrisma.conversation.findMany.mockResolvedValue(convs);
      mockPrisma.$queryRaw.mockResolvedValue([
        { conversationId: 'conv-0', unreadCount: 3 },
        { conversationId: 'conv-5', unreadCount: 1 },
      ]);
      mockPrisma.busListing.findMany.mockResolvedValue([
        {
          id: 'ent-1',
          userId: 'seller-1',
          title: 'Bus 1',
          images: [{ url: '/uploads/bus-1.jpg' }],
        },
        {
          id: 'ent-3',
          userId: 'caller-1',
          title: 'Bus 3',
          images: [{ url: '/uploads/bus-3.jpg' }],
        },
      ]);

      const result = await service.getConversations('caller-1');

      expect(result).toHaveLength(12);
      // Zero per-conversation count() or findUnique() calls (O(1) queries regardless of N=12)
      expect(mockPrisma.message.count).not.toHaveBeenCalled();
      expect(mockPrisma.listing.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.busListing.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(mockPrisma.busListing.findMany).toHaveBeenCalledTimes(1);

      // Verify SQL filters isDeleted = false on messages
      const rawSqlArg = mockPrisma.$queryRaw.mock.calls[0][0];
      const rawText = Array.isArray(rawSqlArg?.strings)
        ? rawSqlArg.strings.join(' ')
        : String(rawSqlArg);
      expect(rawText).toContain('"isDeleted" = false');
      expect(rawText).toContain('"lastReadAt"');

      expect(result[0].unreadCount).toBe(3);
      expect(result[2].unreadCount).toBe(0);
      expect(result[5].unreadCount).toBe(1);
    });

    it('filters out empty conversations, filters lastMessage where isDeleted:false, and hides archived unless includeArchived=true', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([]);
      await service.getConversations('caller-1');

      const callArg = mockPrisma.conversation.findMany.mock.calls[0][0];
      expect(callArg.where.messages).toEqual({ some: { isDeleted: false } });
      expect(callArg.include.messages.where).toEqual({ isDeleted: false });
      expect(callArg.where.participants.some).toEqual({ userId: 'caller-1', isArchived: false });
    });

    it('batches entitySummary across verticals, sets isSeller true/false, returns imageUrl:null for jobs/missing entities safely', async () => {
      const readTs = new Date('2026-11-27T11:30:00.000Z');
      mockPrisma.conversation.findMany.mockResolvedValue([
        {
          id: 'c-operator',
          entityType: 'OPERATOR_LISTING',
          entityId: 'op-1',
          listingId: null,
          listing: null,
          participants: [
            {
              userId: 'me-1',
              lastReadAt: null,
              isArchived: false,
              user: { id: 'me-1', username: 'me', displayName: 'Me', avatarUrl: null },
            },
            {
              userId: 'other-1',
              lastReadAt: readTs,
              isArchived: false,
              user: { id: 'other-1', username: 'other', displayName: 'Other', avatarUrl: null },
            },
          ],
          messages: [{ id: 'm1', content: 'hi', createdAt: readTs }],
        },
        {
          id: 'c-job',
          entityType: 'JOB',
          entityId: 'job-1',
          listingId: null,
          listing: null,
          participants: [
            {
              userId: 'me-1',
              lastReadAt: null,
              isArchived: false,
              user: { id: 'me-1', username: 'me', displayName: 'Me', avatarUrl: null },
            },
            {
              userId: 'other-2',
              lastReadAt: null,
              isArchived: false,
              user: { id: 'other-2', username: 'o2', displayName: 'O2', avatarUrl: null },
            },
          ],
          messages: [{ id: 'm2', content: 'job?', createdAt: readTs }],
        },
        {
          id: 'c-missing',
          entityType: 'SPARE_PART',
          entityId: 'deleted-part',
          listingId: null,
          listing: null,
          participants: [
            {
              userId: 'me-1',
              lastReadAt: null,
              isArchived: false,
              user: { id: 'me-1', username: 'me', displayName: 'Me', avatarUrl: null },
            },
            {
              userId: 'other-3',
              lastReadAt: null,
              isArchived: false,
              user: { id: 'other-3', username: 'o3', displayName: 'O3', avatarUrl: null },
            },
          ],
          messages: [{ id: 'm3', content: 'part?', createdAt: readTs }],
        },
      ]);

      mockPrisma.operatorListing.findMany.mockResolvedValue([
        { id: 'op-1', userId: 'me-1', title: 'Crane Operator', profileImageUrl: '/uploads/op1.jpg' },
      ]);
      mockPrisma.driverJob.findMany.mockResolvedValue([
        { id: 'job-1', userId: 'other-2', title: 'Heavy Truck Driver' },
      ]);
      mockPrisma.sparePart.findMany.mockResolvedValue([]); // entity deleted/missing

      const list: any[] = await service.getConversations('me-1');

      expect(list[0].entityTitle).toBe('Crane Operator');
      expect(list[0].entitySummary).toEqual({
        type: 'OPERATOR_LISTING',
        id: 'op-1',
        title: 'Crane Operator',
        imageUrl: '/uploads/op1.jpg',
        isSeller: true,
        ownerId: 'me-1',
      });
      expect(list[0].otherLastReadAt).toBe(readTs.toISOString());

      expect(list[1].entitySummary).toEqual({
        type: 'JOB',
        id: 'job-1',
        title: 'Heavy Truck Driver',
        imageUrl: null,
        isSeller: false,
        ownerId: 'other-2',
      });
      expect(list[1].otherLastReadAt).toBeNull();

      expect(list[2].entityTitle).toBe('');
      expect(list[2].entitySummary).toEqual({
        type: 'SPARE_PART',
        id: 'deleted-part',
        title: '',
        imageUrl: null,
        isSeller: false,
        ownerId: null,
      });
    });
  });

  describe('2. Read Receipts (getMessages meta.otherLastReadAt & computed isRead) + markAsRead timestamp', () => {
    it('computes isRead from otherLastReadAt without writing Message.isRead and attaches meta.otherLastReadAt', async () => {
      const t1 = new Date('2026-11-27T10:00:00.000Z');
      const otherRead = new Date('2026-11-27T10:05:00.000Z');
      const t2 = new Date('2026-11-27T10:10:00.000Z');

      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        { userId: 'caller-1', lastReadAt: new Date('2026-11-27T09:00:00.000Z') },
        { userId: 'other-1', lastReadAt: otherRead },
      ]);
      mockPrisma.$transaction.mockResolvedValue([
        [
          { id: 'm-new', senderId: 'caller-1', createdAt: t2, isRead: false, content: 'unread' },
          { id: 'm-old', senderId: 'caller-1', createdAt: t1, isRead: false, content: 'read' },
          { id: 'm-theirs', senderId: 'other-1', createdAt: t1, isRead: false, content: 'reply' },
        ],
        3,
      ]);

      const res: any = await service.getMessages('conv-1', { page: 1, limit: 30 }, 'caller-1');

      expect(res.meta.otherLastReadAt).toBe(otherRead.toISOString());
      expect(res.meta.nextCursor).toBeNull();
      expect(res.items.find((m: any) => m.id === 'm-new').isRead).toBe(false);
      expect(res.items.find((m: any) => m.id === 'm-old').isRead).toBe(true);
      expect(res.items.find((m: any) => m.id === 'm-theirs').isRead).toBe(false);
      expect(mockPrisma.message.update).not.toHaveBeenCalled();
    });

    it('markAsRead stores ONE timestamp, returns that exact value, and never moves lastReadAt backwards', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValueOnce({
        id: 'cp-1',
        userId: 'caller-1',
        lastReadAt: new Date('2020-01-01T00:00:00.000Z'),
      });
      const res = await service.markAsRead('conv-1', 'caller-1');
      const writtenDate = mockPrisma.conversationParticipant.update.mock.calls[0][0].data.lastReadAt;
      expect(writtenDate).toBeInstanceOf(Date);
      expect(res.lastReadAt.getTime()).toBe(writtenDate.getTime());

      // Future existing lastReadAt must NOT move backwards
      mockPrisma.conversationParticipant.update.mockClear();
      const futureDate = new Date(Date.now() + 3600_000);
      mockPrisma.conversationParticipant.findFirst.mockResolvedValueOnce({
        id: 'cp-1',
        userId: 'caller-1',
        lastReadAt: futureDate,
      });
      const resBack = await service.markAsRead('conv-1', 'caller-1');
      expect(resBack.lastReadAt.getTime()).toBe(futureDate.getTime());
      expect(mockPrisma.conversationParticipant.update).not.toHaveBeenCalled();
    });
  });

  describe('3. Unarchive on sendMessage & Socket room join (including Redis adapter)', () => {
    it('unarchives both archived recipient and caller via one updateMany and emits participantUserIds', async () => {
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
        id: 'cp-sender',
        userId: 'sender-1',
        isArchived: true,
      });
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1', content: 'hi' });
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'recipient-1' }]);

      await service.sendMessage('conv-1', { content: 'hi' }, 'sender-1');

      expect(mockPrisma.conversationParticipant.updateMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.conversationParticipant.updateMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1', isArchived: true },
        data: { isArchived: false },
      });
      expect(mockEvents.emit).toHaveBeenCalledWith(
        CHAT_EVENTS.MESSAGE_SENT,
        expect.objectContaining({
          conversationId: 'conv-1',
          participantUserIds: ['sender-1', 'recipient-1'],
        }),
      );
    });

    it('joins participant user rooms to conversation room via server.in().socketsJoin and delivers without duplicates', () => {
      const convEmit = jest.fn();
      const userExceptEmit = jest.fn();
      const socketsJoinFn = jest.fn();
      const mockServer: any = {
        in: jest.fn().mockReturnValue({ socketsJoin: socketsJoinFn }),
        to: jest.fn((room: string) => {
          if (room.startsWith('conversation:')) {
            return { emit: convEmit };
          }
          return {
            emit: jest.fn(),
            except: jest.fn().mockReturnValue({ emit: userExceptEmit }),
          };
        }),
      };

      const gateway = new ChatGateway(
        service,
        { set: jest.fn(), del: jest.fn(), exists: jest.fn(), expire: jest.fn(), incr: jest.fn() } as any,
        { validate: jest.fn() } as any,
      );
      gateway.server = mockServer;

      gateway.onMessageSent({
        conversationId: 'conv-9',
        message: { id: 'm-99', content: 'hello' },
        participantUserIds: ['sender-1', 'recipient-1'],
      });

      expect(mockServer.in).toHaveBeenCalledWith('user:sender-1');
      expect(mockServer.in).toHaveBeenCalledWith('user:recipient-1');
      expect(socketsJoinFn).toHaveBeenCalledWith('conversation:conv-9');
      expect(convEmit).toHaveBeenCalledWith('message', { id: 'm-99', content: 'hello' });
      expect(userExceptEmit).toHaveBeenCalledWith('message', { id: 'm-99', content: 'hello' });
    });
  });

  describe('4. Dual cursor getMessages (before + legacy page/limit) & DTO query whitelist', () => {
    it('supports before cursor boundaries (first page, middle, end, empty, foreign id rejected 400)', async () => {
      const anchorTs = new Date('2026-11-27T12:00:00.000Z');
      mockPrisma.conversationParticipant.findFirst.mockResolvedValue({
        id: 'cp-1',
        userId: 'caller-1',
        lastReadAt: null,
      });
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        { userId: 'caller-1', lastReadAt: null },
        { userId: 'other-1', lastReadAt: null },
      ]);

      // First page (page=1, limit=2, total=5 -> nextCursor='m-4')
      mockPrisma.$transaction.mockResolvedValueOnce([
        [
          { id: 'm-5', senderId: 'other-1', createdAt: new Date('2026-11-27T12:10:00.000Z'), isRead: false },
          { id: 'm-4', senderId: 'caller-1', createdAt: anchorTs, isRead: false },
        ],
        5,
      ]);
      const firstPage: any = await service.getMessages('conv-1', { page: 1, limit: 2 }, 'caller-1');
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.meta.nextCursor).toBe('m-4');

      // Foreign conversation cursor -> 400 BadRequestException
      mockPrisma.message.findUnique.mockResolvedValueOnce({
        id: 'foreign-msg',
        conversationId: 'other-conv',
        createdAt: anchorTs,
      });
      await expect(
        service.getMessages('conv-1', { before: 'foreign-msg', limit: 2 }, 'caller-1'),
      ).rejects.toThrow(BadRequestException);

      // Middle page (before='m-4', limit = 2, DB returns 3 rows -> hasMore = true, nextCursor = 'm-2')
      mockPrisma.message.findUnique.mockResolvedValueOnce({
        id: 'm-4',
        conversationId: 'conv-1',
        createdAt: anchorTs,
      });
      mockPrisma.$transaction.mockResolvedValueOnce([
        [
          { id: 'm-3', senderId: 'other-1', createdAt: new Date('2026-11-27T11:50:00.000Z'), isRead: false },
          { id: 'm-2', senderId: 'caller-1', createdAt: new Date('2026-11-27T11:40:00.000Z'), isRead: false },
          { id: 'm-1', senderId: 'other-1', createdAt: new Date('2026-11-27T11:30:00.000Z'), isRead: false },
        ],
        5,
      ]);
      const midPage: any = await service.getMessages('conv-1', { before: 'm-4', limit: 2 }, 'caller-1');
      expect(midPage.items).toHaveLength(2);
      expect(midPage.meta.nextCursor).toBe('m-2');

      // Verify strict < cursor + tie-break query
      const findArgs = mockPrisma.message.findMany.mock.calls[1][0];
      expect(findArgs.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
      expect(findArgs.take).toBe(3);

      // End page (limit = 2, DB returns 1 row -> nextCursor = null)
      mockPrisma.message.findUnique.mockResolvedValueOnce({
        id: 'm-2',
        conversationId: 'conv-1',
        createdAt: new Date('2026-11-27T11:40:00.000Z'),
      });
      mockPrisma.$transaction.mockResolvedValueOnce([
        [{ id: 'm-1', senderId: 'other-1', createdAt: new Date('2026-11-27T11:30:00.000Z'), isRead: false }],
        5,
      ]);
      const endPage: any = await service.getMessages('conv-1', { before: 'm-2', limit: 2 }, 'caller-1');
      expect(endPage.items).toHaveLength(1);
      expect(endPage.meta.nextCursor).toBeNull();

      // Past oldest message (0 rows -> items=[], nextCursor=null)
      mockPrisma.message.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        conversationId: 'conv-1',
        createdAt: new Date('2026-11-27T11:30:00.000Z'),
      });
      mockPrisma.$transaction.mockResolvedValueOnce([[], 5]);
      const emptyBefore: any = await service.getMessages('conv-1', { before: 'm-1', limit: 2 }, 'caller-1');
      expect(emptyBefore.items).toEqual([]);
      expect(emptyBefore.meta.nextCursor).toBeNull();
    });

    it('keeps legacy page/limit pagination unchanged and enforces GetMessagesDto query param whitelist', async () => {
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        { userId: 'caller-1', lastReadAt: null },
      ]);
      mockPrisma.$transaction.mockResolvedValueOnce([
        [{ id: 'm-page2', senderId: 'caller-1', createdAt: new Date('2026-11-27T10:00:00.000Z'), isRead: false }],
        4,
      ]);

      const page2: any = await service.getMessages('conv-1', { page: 2, limit: 2 }, 'caller-1');
      expect(mockPrisma.message.findMany.mock.calls[0][0].skip).toBe(2);
      expect(mockPrisma.message.findMany.mock.calls[0][0].take).toBe(2);
      expect(page2.meta).toEqual(
        expect.objectContaining({
          total: 4,
          page: 2,
          limit: 2,
          totalPages: 2,
          otherLastReadAt: null,
        }),
      );

      // Whitelist contract test copied from DTO: ONLY page, limit, before
      const pipe: ValidationPipe = createAppValidationPipe(ALL_STRUCTURED_VALIDATION_DTOS);
      const allowedKeys = new Set(['page', 'limit', 'before']);
      const valid = await pipe.transform(
        { page: '1', limit: '20', before: 'msg-123' },
        { type: 'query', metatype: GetMessagesDto },
      );
      expect(valid).toEqual({ page: 1, limit: 20, before: 'msg-123' });
      for (const k of Object.keys(valid)) {
        expect(allowedKeys.has(k)).toBe(true);
      }

      await expect(
        pipe.transform(
          { page: '1', limit: '20', unexpectedParam: 'hack' },
          { type: 'query', metatype: GetMessagesDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. createOrGetConversation enriched shape & caller unarchive', () => {
    it('returns enriched shape and unarchives existing conversation if archived by caller', async () => {
      const otherRead = new Date('2026-11-27T09:00:00.000Z');
      mockPrisma.listing.findUnique.mockResolvedValue({
        sellerId: 'seller-1',
        title: 'Nissan Patrol',
        status: 'ACTIVE',
        hiddenByOwnerStatus: false,
        images: [{ url: '/uploads/patrol.jpg' }],
      });
      mockPrisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-existing',
        entityType: 'LISTING',
        entityId: 'listing-1',
        listingId: 'listing-1',
        listing: {
          id: 'listing-1',
          title: 'Nissan Patrol',
          slug: 'nissan-patrol',
          images: [{ url: '/uploads/patrol.jpg' }],
        },
        participants: [
          {
            id: 'cp-buyer',
            userId: 'buyer-1',
            lastReadAt: null,
            isArchived: true,
            user: { id: 'buyer-1', username: 'buyer', displayName: 'Buyer', avatarUrl: null },
          },
          {
            id: 'cp-seller',
            userId: 'seller-1',
            lastReadAt: otherRead,
            isArchived: false,
            user: { id: 'seller-1', username: 'seller', displayName: 'Seller', avatarUrl: null },
          },
        ],
        messages: [],
      });

      const res: any = await service.createOrGetConversation(
        { entityType: 'LISTING', entityId: 'listing-1' },
        'buyer-1',
      );

      expect(mockPrisma.conversationParticipant.update).toHaveBeenCalledWith({
        where: { id: 'cp-buyer' },
        data: { isArchived: false },
      });
      expect(res.archived).toBe(false);
      expect(res.unreadCount).toBe(0);
      expect(res.isSeller).toBe(false);
      expect(res.otherLastReadAt).toBe(otherRead.toISOString());
      expect(res.entitySummary).toEqual({
        type: 'LISTING',
        id: 'listing-1',
        title: 'Nissan Patrol',
        imageUrl: '/uploads/patrol.jpg',
        isSeller: false,
        ownerId: 'seller-1',
      });
      expect(res.participants[1].lastReadAt).toEqual(otherRead);
    });

    it('returns enriched list-item shape on newly created conversation without extra entity query', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        sellerId: 'seller-2',
        title: 'Toyota Land Cruiser',
        status: 'ACTIVE',
        hiddenByOwnerStatus: false,
        images: [{ url: '/uploads/lc.jpg' }],
      });
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'seller-2', status: 'ACTIVE' });
      mockPrisma.conversation.create.mockResolvedValue({
        id: 'conv-new',
        entityType: 'LISTING',
        entityId: 'listing-2',
        listingId: 'listing-2',
        listing: {
          id: 'listing-2',
          title: 'Toyota Land Cruiser',
          slug: 'toyota-lc',
          sellerId: 'seller-2',
          images: [{ url: '/uploads/lc.jpg' }],
        },
        participants: [
          {
            id: 'cp-b',
            userId: 'buyer-1',
            lastReadAt: null,
            isArchived: false,
            user: { id: 'buyer-1', username: 'buyer', displayName: 'Buyer', avatarUrl: null },
          },
          {
            id: 'cp-s',
            userId: 'seller-2',
            lastReadAt: null,
            isArchived: false,
            user: { id: 'seller-2', username: 'seller2', displayName: 'Seller 2', avatarUrl: null },
          },
        ],
      });

      const created: any = await service.createOrGetConversation(
        { entityType: 'LISTING', entityId: 'listing-2' },
        'buyer-1',
      );

      expect(created.id).toBe('conv-new');
      expect(created.unreadCount).toBe(0);
      expect(created.archived).toBe(false);
      expect(created.isSeller).toBe(false);
      expect(created.otherLastReadAt).toBeNull();
      expect(created.lastMessage).toBeNull();
      expect(created.entitySummary).toEqual({
        type: 'LISTING',
        id: 'listing-2',
        title: 'Toyota Land Cruiser',
        imageUrl: '/uploads/lc.jpg',
        isSeller: false,
        ownerId: 'seller-2',
      });
    });
  });
});
