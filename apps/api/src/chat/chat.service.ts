import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { CHAT_EVENTS } from './chat.events';
import { NotificationsService } from '../notifications/notifications.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import {
  resolveMessageNotificationBody,
  validateSendMessagePayload,
} from './chat-message.utils';
import {
  CHAT_REACTION_ALLOWED_EMOJI_SET,
  CHAT_REACTION_DELETED_MSG,
  CHAT_REACTION_EMOJI_MAX_LENGTH,
  CHAT_REACTION_INVALID_EMOJI_MSG,
} from './chat-security.constants';
import {
  batchResolveEntityMetadata,
  buildEnrichedConversationResponse,
  entitySummaryKey,
  ResolvedEntityMeta,
  toValidDateOrNull,
} from './chat-conversation.utils';
import { isEntityPubliclyVisible } from '../common/public-visibility';
import { VisibilityPrismaDelegateName } from '../common/constants/owner-visibility.registry';
import { UploadsService } from '../uploads/uploads.service';
import { extractOwnedChatMediaKey } from '../uploads/chat-media.validator';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly notifications: NotificationsService,
    @Optional() private readonly uploadsService?: UploadsService,
  ) {}

  /* ───── RESOLVE ENTITY OWNER ───── */
  private async resolveEntityOwner(entityType: string, entityId: string): Promise<{
    ownerId: string;
    title: string;
    imageUrl: string | null;
    entity: any;
    model: VisibilityPrismaDelegateName;
  }> {
    const imgSelect = {
      select: { url: true },
      orderBy: [{ isPrimary: 'desc' as const }, { order: 'asc' as const }],
      take: 1,
    };

    switch (entityType) {
      case 'LISTING': {
        const e = await this.prisma.listing.findUnique({
          where: { id: entityId },
          select: { sellerId: true, title: true, status: true, hiddenByOwnerStatus: true, images: imgSelect },
        });
        if (!e) throw new NotFoundException('الإعلان غير موجود');
        return { ownerId: e.sellerId, title: e.title, imageUrl: e.images?.[0]?.url ?? null, entity: e, model: 'listing' };
      }
      case 'BUS_LISTING': {
        const e = await this.prisma.busListing.findUnique({
          where: { id: entityId },
          select: { userId: true, title: true, status: true, hiddenByOwnerStatus: true, deletedAt: true, images: imgSelect },
        });
        if (!e) throw new NotFoundException('الحافلة غير موجودة');
        return { ownerId: e.userId, title: e.title, imageUrl: e.images?.[0]?.url ?? null, entity: e, model: 'busListing' };
      }
      case 'SPARE_PART': {
        const e = await this.prisma.sparePart.findUnique({
          where: { id: entityId },
          select: { sellerId: true, title: true, status: true, hiddenByOwnerStatus: true, deletedAt: true, images: imgSelect },
        });
        if (!e) throw new NotFoundException('قطعة الغيار غير موجودة');
        return { ownerId: e.sellerId, title: e.title, imageUrl: e.images?.[0]?.url ?? null, entity: e, model: 'sparePart' };
      }
      case 'CAR_SERVICE': {
        const e = await this.prisma.carService.findUnique({
          where: { id: entityId },
          select: { userId: true, title: true, status: true, hiddenByOwnerStatus: true, deletedAt: true, images: imgSelect },
        });
        if (!e) throw new NotFoundException('الخدمة غير موجودة');
        return { ownerId: e.userId, title: e.title, imageUrl: e.images?.[0]?.url ?? null, entity: e, model: 'carService' };
      }
      case 'JOB':
      case 'DRIVER_JOB': {
        const e = await this.prisma.driverJob.findUnique({
          where: { id: entityId },
          select: { userId: true, title: true, status: true, hiddenByOwnerStatus: true },
        });
        if (!e) throw new NotFoundException('الوظيفة غير موجودة');
        return { ownerId: e.userId, title: e.title, imageUrl: null, entity: e, model: 'driverJob' };
      }
      case 'EQUIPMENT_LISTING': {
        const e = await this.prisma.equipmentListing.findUnique({
          where: { id: entityId },
          select: { userId: true, title: true, status: true, hiddenByOwnerStatus: true, deletedAt: true, images: imgSelect },
        });
        if (!e) throw new NotFoundException('إعلان المعدة غير موجود');
        return { ownerId: e.userId, title: e.title, imageUrl: e.images?.[0]?.url ?? null, entity: e, model: 'equipmentListing' };
      }
      case 'OPERATOR_LISTING': {
        const e = await this.prisma.operatorListing.findUnique({
          where: { id: entityId },
          select: { userId: true, title: true, status: true, hiddenByOwnerStatus: true, profileImageUrl: true },
        });
        if (!e) throw new NotFoundException('إعلان المشغل غير موجود');
        return { ownerId: e.userId, title: e.title, imageUrl: e.profileImageUrl ?? null, entity: e, model: 'operatorListing' };
      }
      case 'TRANSPORT_REQUEST': {
        const e = await this.prisma.transportRequest.findUnique({
          where: { id: entityId },
          select: { userId: true, cargoDescription: true, status: true, hiddenByOwnerStatus: true },
        });
        if (!e) throw new NotFoundException('طلب النقل غير موجود');
        return { ownerId: e.userId, title: e.cargoDescription, imageUrl: null, entity: e, model: 'transportRequest' };
      }
      default:
        throw new BadRequestException('نوع كيان غير معروف');
    }
  }

  private async fetchUnreadCountsMap(
    userId: string,
    conversationIds: string[],
  ): Promise<Map<string, number>> {
    if (conversationIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.$queryRaw<
      Array<{ conversationId: string; unreadCount: number }>
    >(
      Prisma.sql`
        SELECT m."conversationId" AS "conversationId", COUNT(*)::int AS "unreadCount"
        FROM "messages" m
        INNER JOIN "conversation_participants" cp
          ON cp."conversationId" = m."conversationId"
         AND cp."userId" = ${userId}
        WHERE m."isDeleted" = false
          AND m."senderId" <> ${userId}
          AND (cp."lastReadAt" IS NULL OR m."createdAt" > cp."lastReadAt")
          AND m."conversationId" IN (${Prisma.join(conversationIds)})
        GROUP BY m."conversationId"
      `,
    );
    return new Map(rows.map((row) => [row.conversationId, Number(row.unreadCount) || 0]));
  }

  async createOrGetConversation(dto: CreateConversationDto, userId: string) {
    // Backward compat: old clients sending listingId only
    const entityType = dto.entityType || ENTITY_TYPES.LISTING;
    const entityId = dto.entityId || dto.listingId!;

    if (!entityId) throw new BadRequestException('معرف الكيان مطلوب');

    const { ownerId, title, imageUrl, entity, model } = await this.resolveEntityOwner(entityType, entityId);

    if (ownerId === userId) {
      throw new BadRequestException('لا يمكنك بدء محادثة مع نفسك');
    }

    const entityMeta: ResolvedEntityMeta = { ownerId, title, imageUrl };
    const listingIncludeSelect = {
      id: true,
      title: true,
      slug: true,
      sellerId: true,
      images: { take: 1, orderBy: [{ isPrimary: 'desc' as const }, { order: 'asc' as const }] },
    };

    // البحث عن محادثة موجودة بين المستخدم وصاحب الخدمة لهذا الكيان
    const existing = await this.prisma.conversation.findFirst({
      where: {
        entityType,
        entityId,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: ownerId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: this.userSelect } } },
        listing: { select: listingIncludeSelect },
        messages: {
          where: { isDeleted: false },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
    });

    if (existing) {
      const callerParticipant = existing.participants.find((p) => p.userId === userId);
      if (callerParticipant?.isArchived && callerParticipant.id) {
        await this.prisma.conversationParticipant.update({
          where: { id: callerParticipant.id },
          data: { isArchived: false },
        });
      }

      const unreadMap = await this.fetchUnreadCountsMap(userId, [existing.id]);
      this.events.emit(CHAT_EVENTS.CONVERSATION_JOIN, {
        conversationId: existing.id,
        participantUserIds: [userId],
      });

      return buildEnrichedConversationResponse(existing, userId, {
        entityType,
        entityId,
        entityMeta,
        unreadCount: unreadMap.get(existing.id) ?? 0,
        archivedOverride: false,
      });
    }

    // للمحادثة الجديدة: التحقق من ظهور الكيان ومن حالة نشاط المالك
    if (!isEntityPubliclyVisible(model, entity)) {
      throw new NotFoundException('الكيان غير متاح لبدء محادثة');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { status: true },
    });

    if (!owner || owner.status !== 'ACTIVE') {
      throw new BadRequestException('لا يمكن بدء محادثة لأن صاحب الإعلان غير نشط');
    }

    // إنشاء محادثة جديدة
    const created = await this.prisma.conversation.create({
      data: {
        entityType,
        entityId,
        listingId: entityType === ENTITY_TYPES.LISTING ? entityId : undefined,
        participants: {
          create: [
            { userId },
            { userId: ownerId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: this.userSelect } } },
        listing: { select: listingIncludeSelect },
      },
    });

    this.events.emit(CHAT_EVENTS.CONVERSATION_JOIN, {
      conversationId: created.id,
      participantUserIds: created.participants.map((p) => p.userId),
    });

    return buildEnrichedConversationResponse(created, userId, {
      entityType,
      entityId,
      entityMeta,
      unreadCount: 0,
      archivedOverride: false,
    });
  }

  async getConversations(userId: string, search?: string, includeArchived = false) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId, isArchived: includeArchived ? undefined : false } },
        messages: { some: { isDeleted: false } },
        ...(search ? {
          OR: [
            { listing: { title: { contains: search, mode: 'insensitive' } } },
            { participants: { some: { user: { OR: [{ displayName: { contains: search, mode: 'insensitive' } }, { username: { contains: search, mode: 'insensitive' } }] }, userId: { not: userId } } } },
          ],
        } : {}),
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            sellerId: true,
            images: { take: 1, orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
          },
        },
        participants: { include: { user: { select: this.userSelect } } },
        messages: {
          where: { isDeleted: false },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const unreadMap = await this.fetchUnreadCountsMap(
      userId,
      conversations.map((c) => c.id),
    );

    const inlineMeta = new Map<string, ResolvedEntityMeta>();
    const missingRefs: Array<{ entityType: string; entityId: string }> = [];

    for (const conv of conversations) {
      if (conv.entityType === ENTITY_TYPES.LISTING && conv.listing?.sellerId) {
        inlineMeta.set(entitySummaryKey(conv.entityType, conv.entityId), {
          ownerId: conv.listing.sellerId,
          title: conv.listing.title,
          imageUrl: conv.listing.images?.[0]?.url ?? null,
        });
      } else {
        missingRefs.push({ entityType: conv.entityType, entityId: conv.entityId });
      }
    }

    const fetchedMeta = await batchResolveEntityMetadata(this.prisma, missingRefs);

    return conversations.map((conv) => {
      const key = entitySummaryKey(conv.entityType, conv.entityId);
      const entityMeta = inlineMeta.get(key) ?? fetchedMeta.get(key);
      return buildEnrichedConversationResponse(conv, userId, {
        entityType: conv.entityType,
        entityId: conv.entityId,
        entityMeta,
        unreadCount: unreadMap.get(conv.id) ?? 0,
      });
    });
  }

  async getMessages(conversationId: string, query: GetMessagesDto, userId: string) {
    // التحقق أن المستخدم مشارك في المحادثة + قراءة آخر قراءة للطرف الآخر
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true, lastReadAt: true },
    });

    const participant = participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new ForbiddenException('لا يمكنك الوصول لهذه المحادثة');
    }

    const otherParticipant = participants.find((p) => p.userId !== userId);
    const otherLastReadDate = toValidDateOrNull(otherParticipant?.lastReadAt);
    const otherLastReadAt = otherLastReadDate ? otherLastReadDate.toISOString() : null;

    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const messageInclude = {
      sender: { select: this.userSelect },
      reactions: { include: { user: { select: { id: true, username: true, displayName: true } } } },
    };
    const countWhere = { conversationId, isDeleted: false };

    let rawMessages: Array<{
      id: string;
      senderId: string;
      createdAt: Date;
      isRead: boolean;
      [key: string]: unknown;
    }>;
    let total: number;
    let nextCursor: string | null = null;
    let effectivePage = page;

    if (query.before) {
      const cursorMsg = await this.prisma.message.findUnique({
        where: { id: query.before },
        select: { id: true, conversationId: true, createdAt: true },
      });
      if (!cursorMsg || cursorMsg.conversationId !== conversationId) {
        throw new BadRequestException('معرف الرسالة المرجعية غير صالح لهذه المحادثة');
      }

      const cursorWhere = {
        conversationId,
        isDeleted: false,
        OR: [
          { createdAt: { lt: cursorMsg.createdAt } },
          { createdAt: cursorMsg.createdAt, id: { lt: cursorMsg.id } },
        ],
      };

      const [rows, count] = await this.prisma.$transaction([
        this.prisma.message.findMany({
          where: cursorWhere,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: limit + 1,
          include: messageInclude,
        }),
        this.prisma.message.count({ where: countWhere }),
      ]);

      const hasMore = rows.length > limit;
      rawMessages = hasMore ? rows.slice(0, limit) : rows;
      total = count;
      effectivePage = 1;
      nextCursor = hasMore ? rawMessages[rawMessages.length - 1]?.id ?? null : null;
    } else {
      const skip = (page - 1) * limit;
      const [rows, count] = await this.prisma.$transaction([
        this.prisma.message.findMany({
          where: countWhere,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit,
          include: messageInclude,
        }),
        this.prisma.message.count({ where: countWhere }),
      ]);

      rawMessages = rows;
      total = count;
      nextCursor =
        skip + rawMessages.length < total
          ? rawMessages[rawMessages.length - 1]?.id ?? null
          : null;
    }

    const otherLastReadMs = otherLastReadDate?.getTime() ?? null;
    const items = rawMessages.map((msg) => {
      if (msg.senderId !== userId) {
        return msg;
      }
      const msgCreatedAtMs = toValidDateOrNull(msg.createdAt)?.getTime() ?? null;
      const computedIsRead =
        otherLastReadMs !== null && msgCreatedAtMs !== null && msgCreatedAtMs <= otherLastReadMs;
      return {
        ...msg,
        isRead: computedIsRead,
      };
    });

    return {
      items,
      meta: {
        total,
        page: effectivePage,
        limit,
        totalPages: Math.ceil(total / limit),
        nextCursor,
        otherLastReadAt,
      },
    };
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, userId: string) {
    // التحقق أن المستخدم مشارك
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('لا يمكنك إرسال رسالة في هذه المحادثة');
    }

    validateSendMessagePayload(dto);

    const message = await this.prisma.message.create({
      data: {
        content: dto.content ?? '',
        type: dto.type ?? 'TEXT',
        mediaUrl: dto.mediaUrl ?? undefined,
        senderId: userId,
        conversationId,
      },
      include: {
        sender: { select: this.userSelect },
        reactions: true,
      },
    });

    // تحديث وقت المحادثة + قراءة حالة الأرشفة قبل فك الأرشفة لجميع المشاركين المؤرشفين
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const otherParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });

    const previouslyArchivedUserIds: string[] = [];
    if (participant.isArchived) {
      previouslyArchivedUserIds.push(userId);
    }
    for (const p of otherParticipants) {
      if (p.isArchived) {
        previouslyArchivedUserIds.push(p.userId);
      }
    }

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, isArchived: true },
      data: { isArchived: false },
    });

    // إنشاء إشعار للمستلم — routed through NotificationsService so it 
    // reaches Web Push AND Expo Push (mobile), not just the in-app list

    for (const p of otherParticipants) {
      try {
        await this.notifications.create({
          type: 'MESSAGE',
          title: 'رسالة جديدة',
          body: resolveMessageNotificationBody(dto.type, dto.content),
          userId: p.userId,
          data: {
            conversationId,
            messageId: message.id,
            entityType: ENTITY_TYPES.ROOM,
            entityId: conversationId,
          },
        });
      } catch (err) {
        this.logger.error(
          `Failed to send message notification to ${p.userId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    // Fire event — Gateway joins only previously-archived sockets and broadcasts via Redis
    this.events.emit(CHAT_EVENTS.MESSAGE_SENT, {
      conversationId,
      message,
      participantUserIds: previouslyArchivedUserIds,
    });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('لا يمكنك الوصول لهذه المحادثة');
    }

    const now = new Date();
    const existingLastRead = toValidDateOrNull(participant.lastReadAt);
    const effectiveLastReadAt =
      existingLastRead && existingLastRead.getTime() > now.getTime()
        ? existingLastRead
        : now;

    if (!existingLastRead || effectiveLastReadAt.getTime() > existingLastRead.getTime()) {
      await this.prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: effectiveLastReadAt },
      });
    }

    return { message: 'تم تحديد المحادثة كمقروءة', lastReadAt: effectiveLastReadAt };
  }

  /* ───── DELETE MESSAGE (soft) ───── */
  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('الرسالة غير موجودة');
    if (msg.senderId !== userId) throw new ForbiddenException('لا يمكنك حذف هذه الرسالة');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), content: '', mediaUrl: null },
    });

    if (msg.mediaUrl && this.uploadsService) {
      const storageKey = extractOwnedChatMediaKey(
        msg.mediaUrl,
        process.env.CLOUDINARY_CLOUD_NAME,
      );
      if (storageKey) {
        try {
          const otherRefCount = await this.prisma.message.count({
            where: {
              id: { not: messageId },
              isDeleted: false,
              mediaUrl: msg.mediaUrl,
            },
          });
          if ((otherRefCount ?? 0) === 0) {
            await this.uploadsService.deleteFile(storageKey);
          }
        } catch (err) {
          this.logger.warn(
            `Failed to delete stored chat media for message ${messageId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }

    const result = { messageId, conversationId: msg.conversationId };

    // Fire event — Gateway listens and broadcasts via Redis
    this.events.emit(CHAT_EVENTS.MESSAGE_DELETED, result);

    return result;
  }

  /* ───── ARCHIVE / UNARCHIVE CONVERSATION ───── */
  async archiveConversation(conversationId: string, userId: string, archive = true) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) throw new ForbiddenException('لا يمكنك الوصول لهذه المحادثة');

    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { isArchived: archive },
    });

    return { message: archive ? 'تم أرشفة المحادثة' : 'تم إلغاء الأرشفة' };
  }

  /* ───── REACTIONS ───── */
  async toggleReaction(messageId: string, userId: string, emoji: string) {
    if (
      typeof emoji !== 'string' ||
      emoji.length === 0 ||
      emoji.length > CHAT_REACTION_EMOJI_MAX_LENGTH ||
      !CHAT_REACTION_ALLOWED_EMOJI_SET.has(emoji)
    ) {
      throw new BadRequestException(CHAT_REACTION_INVALID_EMOJI_MSG);
    }

    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('الرسالة غير موجودة');

    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: msg.conversationId, userId },
    });
    if (!participant) throw new ForbiddenException('غير مصرح');

    if (msg.isDeleted) {
      throw new BadRequestException(CHAT_REACTION_DELETED_MSG);
    }

    const existing = await this.prisma.messageReaction.findUnique({
      where: { userId_messageId_emoji: { userId, messageId, emoji } },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
      return { action: 'removed', messageId, emoji, conversationId: msg.conversationId };
    }

    const reaction = await this.prisma.messageReaction.create({
      data: { userId, messageId, emoji },
      include: { user: { select: { id: true, username: true, displayName: true } } },
    });
    return { action: 'added', messageId, emoji, reaction, conversationId: msg.conversationId };
  }

  /* ───── SEARCH MESSAGES ───── */
  async searchMessages(conversationId: string, userId: string, query: string, page = 1, limit = 20) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) throw new ForbiddenException('لا يمكنك الوصول لهذه المحادثة');

    const skip = (page - 1) * limit;
    const where = {
      conversationId,
      isDeleted: false,
      content: { contains: query, mode: 'insensitive' as const },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { sender: { select: this.userSelect } },
      }),
      this.prisma.message.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /* ───── PARTICIPANT CHECKS ───── */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const p = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
      select: { id: true },
    });
    return !!p;
  }

  /**
   * Single indexed check for whether two users share at least one conversation.
   */
  async sharesConversationWith(callerUserId: string, targetUserId: string): Promise<boolean> {
    if (!callerUserId || !targetUserId) {
      return false;
    }
    if (callerUserId === targetUserId) {
      return true;
    }
    const shared = await this.prisma.conversationParticipant.findFirst({
      where: {
        userId: targetUserId,
        conversation: {
          participants: { some: { userId: callerUserId } },
        },
      },
      select: { id: true },
    });
    return !!shared;
  }

  /** Lightweight — returns IDs only, used by Gateway on connection */
  async getConversationIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.conversationParticipant.findMany({
      where: { userId, isArchived: false },
      select: { conversationId: true },
    });
    return rows.map(r => r.conversationId);
  }

  /* ───── CHECK ONLINE STATUS ───── */
  async isOnline(_userId: string): Promise<boolean> {
    // Will be delegated to gateway/redis — placeholder
    return false;
  }

  private readonly userSelect = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
  };
}
