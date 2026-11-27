import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, UseGuards, OnModuleDestroy } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { userOnlineKey } from '../redis/presence.helper';
import { SendMessageDto } from './dto/send-message.dto';
import { CHAT_EVENTS } from './chat.events';
import { NOTIFICATION_EVENTS } from '../notifications/notification.events';
import { verifyAccessToken } from '../config/jwt.config';
import { createCorsOptions } from '../config/cors.config';
import type { JwtPayload } from '../auth/auth.types';
import { assertVerifiedAccessPayload } from '../auth/auth-token.validator';
import { AccessTokenGate } from '../auth/access-token-gate.service';
import { parseClientMessageType } from './chat-message.utils';
import {
  CHAT_WS_CHECK_ONLINE_KEY_PREFIX,
  CHAT_WS_CHECK_ONLINE_LIMIT,
  CHAT_WS_CHECK_ONLINE_WINDOW_SEC,
  CHAT_WS_ONLINE_RATE_LIMIT_MSG,
  CHAT_WS_REACT_KEY_PREFIX,
  CHAT_WS_REACT_LIMIT,
  CHAT_WS_REACT_RATE_LIMIT_MSG,
  CHAT_WS_REACT_WINDOW_SEC,
  CHAT_WS_SEND_KEY_PREFIX,
  CHAT_WS_SEND_LIMIT,
  CHAT_WS_SEND_RATE_LIMIT_MSG,
  CHAT_WS_SEND_WINDOW_SEC,
} from './chat-security.constants';

@SkipThrottle()
@WebSocketGateway({
  cors: createCorsOptions(),
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId → Set<socketId>
  private readonly typingCooldown = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly redis: RedisService,
    private readonly accessTokenGate: AccessTokenGate,
  ) {}

  async afterInit() {
    this.logger.log('ChatGateway initialized');
  }

  onModuleDestroy() {
    for (const timer of this.typingCooldown.values()) {
      clearTimeout(timer);
    }
    this.typingCooldown.clear();
  }

  /**
   * Atomic Redis rate limit (INCR + EXPIRE on first increment).
   * Fails OPEN when Redis is unavailable (returns 0 or throws) while logging a warning.
   */
  private async checkWsRateLimit(
    client: Socket,
    userId: string,
    keyPrefix: string,
    limit: number,
    windowSec: number,
    errorMessage: string,
    actionLabel: string,
  ): Promise<boolean> {
    try {
      const count = await this.redis.incr(`${keyPrefix}${userId}`, windowSec);
      if (count === 0) {
        this.logger.warn(`Redis unavailable for WS rate limit (${actionLabel}); failing open`);
        return true;
      }
      if (count > limit) {
        client.emit('error', { message: errorMessage });
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `WS rate limit check failed for ${actionLabel} (failing open): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return true;
    }
  }

  private getClientJoinedRooms(client: Socket): Set<string> | undefined {
    return (client as unknown as { rooms?: Set<string> }).rooms;
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const user = verifyAccessToken<JwtPayload>(token);
      assertVerifiedAccessPayload(user);
      await this.accessTokenGate.validate(user);
      client.data.user = user;

      // Multi-socket: add this socket to the user's set
      const sockets = this.connectedUsers.get(user.sub) ?? new Set<string>();
      sockets.add(client.id);
      this.connectedUsers.set(user.sub, sockets);
      await this.redis.set(userOnlineKey(user.sub), '1', 600);

      this.logger.log(`User ${user.username} connected (${client.id})`);

      // Join user's personal room for notifications
      client.join(`user:${user.sub}`);

      // Lightweight: join conversation rooms by ID only
      const ids = await this.chatService.getConversationIds(user.sub);
      for (const id of ids) {
        client.join(`conversation:${id}`);
      }

      client.emit('connected', { userId: user.sub, username: user.username });
    } catch (err: any) {
      const message = err?.response?.message || err?.message || 'خطأ في المصادقة';
      const code = err?.response?.code || 'UNAUTHORIZED';
      this.logger.error(`Connection error: ${message}`);
      client.emit('error', { message, code });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as JwtPayload;
    if (user) {
      const sockets = this.connectedUsers.get(user.sub);
      sockets?.delete(client.id);

      // Only remove user if no sockets remain
      if (!sockets?.size) {
        this.connectedUsers.delete(user.sub);
        await this.redis.del(userOnlineKey(user.sub));
      }

      this.logger.log(`User ${user.username} disconnected (${client.id})`);
    }
  }

  async disconnectUser(userId: string, code?: string): Promise<void> {
    try {
      const room = `user:${userId}`;
      if (this.server) {
        if (code) {
          this.server.to(room).emit('account-status', { code });
        }
        this.server.in(room).disconnectSockets(true);
      }
      this.connectedUsers.delete(userId);
      await this.redis.del(userOnlineKey(userId));
    } catch (err: any) {
      this.logger.error(`Failed to disconnect sockets for user ${userId}: ${err?.message || err}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user as JwtPayload;

    // Verify user is participant via service method
    const ok = await this.chatService.isParticipant(data.conversationId, user.sub);

    if (!ok) {
      client.emit('error', { message: 'لا يمكنك الانضمام لهذه المحادثة' });
      return;
    }

    client.join(`conversation:${data.conversationId}`);
    client.emit('joined-conversation', { conversationId: data.conversationId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    client.emit('left-conversation', { conversationId: data.conversationId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content?: string; type?: string; mediaUrl?: string },
  ) {
    const user = client.data.user as JwtPayload;

    const allowed = await this.checkWsRateLimit(
      client,
      user.sub,
      CHAT_WS_SEND_KEY_PREFIX,
      CHAT_WS_SEND_LIMIT,
      CHAT_WS_SEND_WINDOW_SEC,
      CHAT_WS_SEND_RATE_LIMIT_MSG,
      'send-message',
    );
    if (!allowed) {
      return { success: false, error: CHAT_WS_SEND_RATE_LIMIT_MSG };
    }

    try {
      const parsedType = parseClientMessageType(data?.type);
      const dto: SendMessageDto = {
        content: data?.content,
        type: parsedType,
        mediaUrl: data?.mediaUrl,
      };

      const message = await this.chatService.sendMessage(data.conversationId, dto, user.sub);
      // Broadcast is handled by @OnEvent → direct emit via Socket.IO Redis Adapter
      return { success: true, message };
    } catch (err: any) {
      client.emit('error', { message: err.message || 'فشل إرسال الرسالة' });
      return { success: false, error: err.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const rooms = this.getClientJoinedRooms(client);
    if (!data?.conversationId || !rooms?.has(`conversation:${data.conversationId}`)) {
      return;
    }

    const user = client.data.user as JwtPayload;
    const key = `${user.sub}:${data.conversationId}`;

    // Server-side throttle: 1 event per 2 seconds per user per conversation
    if (this.typingCooldown.has(key)) return;
    const timer = setTimeout(() => this.typingCooldown.delete(key), 2000);
    timer.unref?.();
    this.typingCooldown.set(key, timer);

    client.to(`conversation:${data.conversationId}`).emit('user-typing', {
      conversationId: data.conversationId,
      userId: user.sub,
      username: user.username,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stop-typing')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const rooms = this.getClientJoinedRooms(client);
    if (!data?.conversationId || !rooms?.has(`conversation:${data.conversationId}`)) {
      return;
    }

    const user = client.data.user as JwtPayload;

    client.to(`conversation:${data.conversationId}`).emit('user-stop-typing', {
      conversationId: data.conversationId,
      userId: user.sub,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user as JwtPayload;

    try {
      const result = await this.chatService.markAsRead(data.conversationId, user.sub);

      // Broadcast read receipt to others
      client.to(`conversation:${data.conversationId}`).emit('messages-read', {
        conversationId: data.conversationId,
        userId: user.sub,
        lastReadAt: result.lastReadAt,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const user = client.data.user as JwtPayload;

    try {
      await this.chatService.deleteMessage(data.messageId, user.sub);
      // Broadcast is handled by @OnEvent → direct emit via Socket.IO Redis Adapter
      return { success: true };
    } catch (err: any) {
      client.emit('error', { message: err.message || 'فشل حذف الرسالة' });
      return { success: false, error: err.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('react-to-message')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    const user = client.data.user as JwtPayload;

    const allowed = await this.checkWsRateLimit(
      client,
      user.sub,
      CHAT_WS_REACT_KEY_PREFIX,
      CHAT_WS_REACT_LIMIT,
      CHAT_WS_REACT_WINDOW_SEC,
      CHAT_WS_REACT_RATE_LIMIT_MSG,
      'react-to-message',
    );
    if (!allowed) {
      return { success: false, error: CHAT_WS_REACT_RATE_LIMIT_MSG };
    }

    try {
      const result = await this.chatService.toggleReaction(data.messageId, user.sub, data.emoji);

      // Broadcast reaction to conversation room
      this.server.to(`conversation:${result.conversationId}`).emit('message-reaction', {
        messageId: result.messageId,
        emoji: result.emoji,
        action: result.action,
        userId: user.sub,
        username: user.username,
      });

      return { success: true, action: result.action };
    } catch (err: any) {
      client.emit('error', { message: err.message || 'فشل التفاعل' });
      return { success: false, error: err.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtPayload;
    await this.redis.expire(userOnlineKey(user.sub), 600);
    client.emit('pong');
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('check-online')
  async handleCheckOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const user = client.data.user as JwtPayload;

    const allowed = await this.checkWsRateLimit(
      client,
      user.sub,
      CHAT_WS_CHECK_ONLINE_KEY_PREFIX,
      CHAT_WS_CHECK_ONLINE_LIMIT,
      CHAT_WS_CHECK_ONLINE_WINDOW_SEC,
      CHAT_WS_ONLINE_RATE_LIMIT_MSG,
      'check-online',
    );
    if (!allowed) {
      return;
    }

    const targetId = data?.userId;
    if (!targetId || typeof targetId !== 'string') {
      client.emit('online-status', { userId: targetId, online: false });
      return;
    }

    const sharesConversation = await this.chatService.sharesConversationWith(user.sub, targetId);
    if (!sharesConversation) {
      client.emit('online-status', { userId: targetId, online: false });
      return;
    }

    const online = await this.isUserOnline(targetId);
    client.emit('online-status', { userId: targetId, online });
  }

  /* ───── EVENT-DRIVEN BROADCAST ───── */

  private joinParticipantsToConversationRoom(
    conversationId: string,
    participantUserIds?: readonly string[],
  ): void {
    if (!this.server || !participantUserIds || participantUserIds.length === 0) {
      return;
    }
    const conversationRoom = `conversation:${conversationId}`;
    const seen = new Set<string>();
    for (const uid of participantUserIds) {
      if (!uid || seen.has(uid)) {
        continue;
      }
      seen.add(uid);
      this.server.in?.(`user:${uid}`)?.socketsJoin?.(conversationRoom);
    }
  }

  @OnEvent(CHAT_EVENTS.CONVERSATION_JOIN)
  onConversationJoin(payload: { conversationId: string; participantUserIds: string[] }) {
    this.joinParticipantsToConversationRoom(payload.conversationId, payload.participantUserIds);
  }

  @OnEvent(CHAT_EVENTS.MESSAGE_SENT)
  onMessageSent(payload: {
    conversationId: string;
    message: unknown;
    participantUserIds?: string[];
  }) {
    const conversationRoom = `conversation:${payload.conversationId}`;
    // Ensure sockets connected before creation or while archived join conversation room across Redis adapter
    this.joinParticipantsToConversationRoom(payload.conversationId, payload.participantUserIds);

    // Emit to joined conversation room
    this.server.to(conversationRoom).emit('message', payload.message);

    // Deliver immediately to sockets in user:<id> not yet in conversation:<id> during async Redis REMOTE_JOIN
    if (payload.participantUserIds) {
      for (const uid of new Set(payload.participantUserIds)) {
        this.server
          .to?.(`user:${uid}`)
          ?.except?.(conversationRoom)
          ?.emit?.('message', payload.message);
      }
    }
  }

  @OnEvent(CHAT_EVENTS.MESSAGE_DELETED)
  onMessageDeleted(payload: { messageId: string; conversationId: string }) {
    // The Socket.IO Redis Adapter fans this out to all instances automatically
    this.server.to(`conversation:${payload.conversationId}`).emit('message-deleted', payload);
  }

  // Helper method to check if user is online
  async isUserOnline(userId: string): Promise<boolean> {
    return this.redis.exists(userOnlineKey(userId));
  }

  /* ───── NOTIFICATION BROADCAST ───── */

  @OnEvent(NOTIFICATION_EVENTS.CREATED)
  onNotificationCreated(payload: { userId: string; notification: any }) {
    // The Socket.IO Redis Adapter fans this out to all instances automatically
    this.server.to(`user:${payload.userId}`).emit('notification', payload.notification);
  }

  // Send notification via WebSocket if user is online (kept for direct calls if needed)
  async sendNotification(userId: string, notification: any) {
    const isOnline = await this.isUserOnline(userId);
    if (isOnline) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }
}
