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
import { Logger, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CHAT_EVENTS } from './chat.events';
import { NOTIFICATION_EVENTS } from '../notifications/notification.events';
import { getJwtSecret } from '../config/jwt.config';
import type { JwtPayload } from '../auth/auth.types';

@SkipThrottle()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId → Set<socketId>
  private readonly typingCooldown = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async afterInit() {
    this.logger.log('ChatGateway initialized');
    await this.redis.waitForReady();
    this.subscribeToRedis();
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: getJwtSecret(),
      });
      client.data.user = user;

      if (!user) {
        client.disconnect();
        return;
      }

      // Multi-socket: add this socket to the user's set
      const sockets = this.connectedUsers.get(user.sub) ?? new Set<string>();
      sockets.add(client.id);
      this.connectedUsers.set(user.sub, sockets);
      await this.redis.set(`user:online:${user.sub}`, '1', 600);

      this.logger.log(`User ${user.username} connected (${client.id})`);

      // Join user's personal room for notifications
      client.join(`user:${user.sub}`);

      // Lightweight: join conversation rooms by ID only
      const ids = await this.chatService.getConversationIds(user.sub);
      for (const id of ids) {
        client.join(`conversation:${id}`);
      }

      client.emit('connected', { userId: user.sub, username: user.username });
    } catch (err) {
      this.logger.error('Connection error', err instanceof Error ? err.stack : String(err));
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
        await this.redis.del(`user:online:${user.sub}`);
      }

      this.logger.log(`User ${user.username} disconnected (${client.id})`);
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
    @MessageBody() data: { conversationId: string; content: string; type?: string; mediaUrl?: string },
  ) {
    const user = client.data.user as JwtPayload;

    try {
      const dto: SendMessageDto = {
        content: data.content,
        type: data.type as any,
        mediaUrl: data.mediaUrl,
      };

      const message = await this.chatService.sendMessage(data.conversationId, dto, user.sub);
      // Broadcast is handled by @OnEvent → Redis publish → subscriber emit
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
    const user = client.data.user as JwtPayload;
    const key = `${user.sub}:${data.conversationId}`;

    // Server-side throttle: 1 event per 2 seconds per user per conversation
    if (this.typingCooldown.has(key)) return;
    this.typingCooldown.set(key, setTimeout(() => this.typingCooldown.delete(key), 2000));

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
      // Broadcast is handled by @OnEvent → Redis publish → subscriber emit
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
    await this.redis.expire(`user:online:${user.sub}`, 600);
    client.emit('pong');
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('check-online')
  async handleCheckOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const online = await this.isUserOnline(data.userId);
    client.emit('online-status', { userId: data.userId, online });
  }

  /* ───── EVENT-DRIVEN BROADCAST ───── */

  @OnEvent(CHAT_EVENTS.MESSAGE_SENT)
  async onMessageSent(payload: { conversationId: string; message: any }) {
    await this.redis.publish('chat:message', payload);
  }

  @OnEvent(CHAT_EVENTS.MESSAGE_DELETED)
  async onMessageDeleted(payload: { messageId: string; conversationId: string }) {
    await this.redis.publish('chat:message-deleted', payload);
  }

  // Subscribe to Redis Pub/Sub for multi-instance support
  private subscribeToRedis() {
    this.redis.subscribe('chat:message', (data: { conversationId: string; message: any }) => {
      this.server.to(`conversation:${data.conversationId}`).emit('message', data.message);
    });

    this.redis.subscribe('chat:message-deleted', (data: { messageId: string; conversationId: string }) => {
      this.server.to(`conversation:${data.conversationId}`).emit('message-deleted', data);
    });

    // Notifications: published by any pod, delivered by whichever pod holds the socket
    this.redis.subscribe('notification:created', (data: { userId: string; notification: any }) => {
      this.server.to(`user:${data.userId}`).emit('notification', data.notification);
    });
  }

  // Helper method to check if user is online
  async isUserOnline(userId: string): Promise<boolean> {
    return this.redis.exists(`user:online:${userId}`);
  }

  /* ───── NOTIFICATION BROADCAST ───── */

  @OnEvent(NOTIFICATION_EVENTS.CREATED)
  async onNotificationCreated(payload: { userId: string; notification: any }) {
    // Publish to Redis so ALL pods can deliver to their connected sockets
    await this.redis.publish('notification:created', payload);
  }

  // Send notification via WebSocket if user is online (kept for direct calls if needed)
  async sendNotification(userId: string, notification: any) {
    const isOnline = await this.isUserOnline(userId);
    if (isOnline) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }
}
