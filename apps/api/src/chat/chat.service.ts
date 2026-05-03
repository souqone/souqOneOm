import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { CHAT_EVENTS } from './chat.events';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /* ───── RESOLVE ENTITY OWNER ───── */
  private async resolveEntityOwner(entityType: string, entityId: string): Promise<{ ownerId: string; title: string }> {
    switch (entityType) {
      case 'LISTING': {
        const e = await this.prisma.listing.findUnique({ where: { id: entityId }, select: { sellerId: true, title: true } });
        if (!e) throw new NotFoundException('الإعلان غير موجود');
        return { ownerId: e.sellerId, title: e.title };
      }
      case 'BUS_LISTING': {
        const e = await this.prisma.busListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('الحافلة غير موجودة');
        return { ownerId: e.userId, title: e.title };
      }
      case 'SPARE_PART': {
        const e = await this.prisma.sparePart.findUnique({ where: { id: entityId }, select: { sellerId: true, title: true } });
        if (!e) throw new NotFoundException('قطعة الغيار غير موجودة');
        return { ownerId: e.sellerId, title: e.title };
      }
      case 'CAR_SERVICE': {
        const e = await this.prisma.carService.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('الخدمة غير موجودة');
        return { ownerId: e.userId, title: e.title };
      }
      case 'JOB': {
        const e = await this.prisma.driverJob.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('الوظيفة غير موجودة');
        return { ownerId: e.userId, title: e.title };
      }
      case 'EQUIPMENT_LISTING': {
        const e = await this.prisma.equipmentListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('إعلان المعدة غير موجود');
        return { ownerId: e.userId, title: e.title };
      }
      case 'EQUIPMENT_REQUEST': {
        const e = await this.prisma.equipmentRequest.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('طلب المعدة غير موجود');
        return { ownerId: e.userId, title: e.title };
      }
      case 'OPERATOR_LISTING': {
        const e = await this.prisma.operatorListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('إعلان المشغل غير موجود');
        return { ownerId: e.userId, title: e.title };
      }
      default:
        throw new BadRequestException('نوع كيان غير معروف');
    }
  }

  /* ───── RESOLVE ENTITY TITLE (for existing conversations) ───── */
  private async resolveEntityTitle(entityType: string, entityId: string): Promise<string> {
    try {
      const { title } = await this.resolveEntityOwner(entityType, entityId);
      return title;
    } catch (err) {
      this.logger.warn(`Failed to resolve entity title: ${entityType}/${entityId} — ${err}`);
      return '';
    }
  }

  async createOrGetConversation(dto: CreateConversationDto, userId: string) {
    // Backward compat: old clients sending listingId only
    const entityType = dto.entityType || 'LISTING';
    const entityId = dto.entityId || dto.listingId!;

    if (!entityId) throw new BadRequestException('معرف الكيان مطلوب');

    const { ownerId } = await this.resolveEntityOwner(entityType, entityId);

    if (ownerId === userId) {
      throw new BadRequestException('لا يمكنك بدء محادثة مع نفسك');
    }

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
        listing: { select: { id: true, title: true, slug: true } },
      },
    });

    if (existing) {
      return {
        ...existing,
        entityType,
        entityId,
        participants: existing.participants.map(p => p.user),
      };
    }

    // إنشاء محادثة جديدة
    const created = await this.prisma.conversation.create({
      data: {
        entityType,
        entityId,
        listingId: entityType === 'LISTING' ? entityId : undefined,
        participants: {
          create: [
            { userId },
            { userId: ownerId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: this.userSelect } } },
        listing: { select: { id: true, title: true, slug: true } },
      },
    });

    return {
      ...created,
      participants: created.participants.map(p => p.user),
    };
  }

  async getConversations(userId: string, search?: string, includeArchived = false) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId, isArchived: includeArchived ? undefined : false } },
        ...(search ? {
          OR: [
            { listing: { title: { contains: search, mode: 'insensitive' } } },
            { participants: { some: { user: { OR: [{ displayName: { contains: search, mode: 'insensitive' } }, { username: { contains: search, mode: 'insensitive' } }] }, userId: { not: userId } } } },
          ],
        } : {}),
      },
      include: {
        listing: { select: { id: true, title: true, slug: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        participants: { include: { user: { select: this.userSelect } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // حساب عدد الرسائل غير المقروءة + حل عنوان الكيان
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = participant?.lastReadAt ?? new Date(0);

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
          },
        });

        // Resolve entity title for non-listing entities
        const entityTitle = conv.listing?.title
          || await this.resolveEntityTitle(conv.entityType, conv.entityId);

        return {
          ...conv,
          entityType: conv.entityType,
          entityId: conv.entityId,
          entityTitle,
          archived: participant?.isArchived ?? false,
          participants: conv.participants.map(p => ({
            ...p.user,
            lastReadAt: p.lastReadAt,
          })),
          createdById: conv.participants[0]?.userId ?? null,
          unreadCount,
          lastMessage: conv.messages[0] ?? null,
        };
      }),
    );

    return result;
  }

  async getMessages(conversationId: string, query: GetMessagesDto, userId: string) {
    // التحقق أن المستخدم مشارك في المحادثة
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('لا يمكنك الوصول لهذه المحادثة');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;

    const msgWhere = { conversationId, isDeleted: false };

    const [messages, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: msgWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: this.userSelect },
          reactions: { include: { user: { select: { id: true, username: true, displayName: true } } } },
        },
      }),
      this.prisma.message.count({ where: msgWhere }),
    ]);

    return {
      items: messages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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

    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
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

    // تحديث وقت المحادثة
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // إنشاء إشعار للمستلم
    const otherParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    });

    if (otherParticipants.length > 0) {
      await this.prisma.notification.createMany({
        data: otherParticipants.map((p) => ({
          type: 'MESSAGE' as const,
          title: 'رسالة جديدة',
          body: dto.content.substring(0, 100),
          userId: p.userId,
          data: { conversationId, messageId: message.id },
        })),
      });
    }

    // Fire event — Gateway listens and broadcasts via Redis
    this.events.emit(CHAT_EVENTS.MESSAGE_SENT, { conversationId, message });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('لا يمكنك الوصول لهذه المحادثة');
    }

    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });

    return { message: 'تم تحديد المحادثة كمقروءة', lastReadAt: new Date() };
  }

  /* ───── DELETE MESSAGE (soft) ───── */
  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('الرسالة غير موجودة');
    if (msg.senderId !== userId) throw new ForbiddenException('لا يمكنك حذف هذه الرسالة');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), content: '' },
    });

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
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('الرسالة غير موجودة');

    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: msg.conversationId, userId },
    });
    if (!participant) throw new ForbiddenException('غير مصرح');

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
