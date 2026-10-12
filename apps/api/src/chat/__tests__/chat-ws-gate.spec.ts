import { WsException } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { ChatGateway } from '../chat.gateway';
import { assertVerifiedAccessPayload } from '../../auth/auth-token.validator';
import { AccessTokenGate } from '../../auth/access-token-gate.service';

describe('Chat WebSocket Verification Gate Specification (AUTH-VERIFY-GATE)', () => {
  const secret = 'super-secret-key-at-least-32-chars-long-for-test!!';

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  describe('1. assertVerifiedAccessPayload unit checks', () => {
    it('passes when token is verified and has no purpose', () => {
      const payload = { sub: 'u1', email: 'a@b.com', username: 'u1', role: 'USER', verified: true };
      expect(() => assertVerifiedAccessPayload(payload)).not.toThrow();
    });

    it('throws UnauthorizedException with EMAIL_NOT_VERIFIED when verified is false', () => {
      const payload = { sub: 'u1', email: 'a@b.com', username: 'u1', role: 'USER', verified: false };
      expect(() => assertVerifiedAccessPayload(payload)).toThrowError(
        expect.objectContaining({
          response: expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' }),
        }),
      );
    });

    it('throws UnauthorizedException with EMAIL_NOT_VERIFIED when verified is missing', () => {
      const payload = { sub: 'u1', email: 'a@b.com', username: 'u1', role: 'USER' };
      expect(() => assertVerifiedAccessPayload(payload)).toThrowError(
        expect.objectContaining({
          response: expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' }),
        }),
      );
    });

    it('throws UnauthorizedException with INVALID_TOKEN_PURPOSE when purpose is email-verify', () => {
      const payload = { sub: 'u1', purpose: 'email-verify' as const };
      expect(() => assertVerifiedAccessPayload(payload)).toThrowError(
        expect.objectContaining({
          response: expect.objectContaining({ code: 'INVALID_TOKEN_PURPOSE' }),
        }),
      );
    });

    it('throws UnauthorizedException when payload is null or non-object', () => {
      expect(() => assertVerifiedAccessPayload(null)).toThrow();
      expect(() => assertVerifiedAccessPayload(undefined)).toThrow();
    });
  });

  describe('2. WsJwtGuard authentication & verification checks', () => {
    let guard: WsJwtGuard;

    beforeEach(() => {
      guard = new WsJwtGuard({ validate: jest.fn().mockResolvedValue(undefined) } as any);
    });

    function createWsContext(token?: string) {
      const client: any = {
        handshake: {
          auth: token ? { token } : {},
          headers: {},
        },
        data: {},
      };
      return {
        context: {
          switchToWs: () => ({
            getClient: () => client,
          }),
        } as any,
        client,
      };
    }

    it('allows connection and attaches user when token is verified (verified: true)', async () => {
      const token = jwt.sign(
        { sub: 'u-100', email: 'verified@souqone.om', username: 'vuser', role: 'USER', verified: true },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const { context, client } = createWsContext(token);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(client.data.user).toMatchObject({
        sub: 'u-100',
        verified: true,
      });
    });

    it('throws WsException with Arabic message when token is not verified (verified: false)', () => {
      const token = jwt.sign(
        { sub: 'u-unverified', email: 'unverified@souqone.om', role: 'USER', verified: false },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const { context } = createWsContext(token);
      expect(() => guard.canActivate(context)).toThrow(WsException);
      expect(() => guard.canActivate(context)).toThrow(/يرجى توثيق البريد الإلكتروني أولاً/);
    });

    it('throws WsException with Arabic message when token has purpose: email-verify', () => {
      const token = jwt.sign(
        { sub: 'u-purpose', purpose: 'email-verify' },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const { context } = createWsContext(token);
      expect(() => guard.canActivate(context)).toThrow(WsException);
      expect(() => guard.canActivate(context)).toThrow(/رمز غير صالح لهذا المسار/);
    });

    it('throws WsException when no token is provided', () => {
      const { context } = createWsContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(WsException);
    });

    it('throws WsException when token is expired or invalid', () => {
      const token = jwt.sign(
        { sub: 'u-expired', verified: true },
        'wrong-secret-key-that-will-fail-verification-completely!',
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const { context } = createWsContext(token);
      expect(() => guard.canActivate(context)).toThrow(WsException);
    });
  });

  describe('3. ChatGateway.handleConnection verification checks', () => {
    let gateway: ChatGateway;
    let mockChatService: any;
    let mockRedis: any;

    beforeEach(() => {
      mockChatService = {
        getConversationIds: jest.fn().mockResolvedValue(['conv-1', 'conv-2']),
      };
      mockRedis = {
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
      };
      gateway = new ChatGateway(
        mockChatService,
        mockRedis,
        { validate: jest.fn().mockResolvedValue(undefined) } as any,
      );
    });

    function createMockSocket(token?: string) {
      return {
        id: 'socket-test-1',
        handshake: {
          auth: token ? { token } : {},
          headers: {},
        },
        data: {} as any,
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as any;
    }

    it('accepts connection for verified user, sets online in Redis, joins rooms, and emits connected', async () => {
      const token = jwt.sign(
        { sub: 'user-ws-ok', username: 'verifiedGuy', role: 'USER', verified: true },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const client = createMockSocket(token);
      await gateway.handleConnection(client);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.user).toMatchObject({ sub: 'user-ws-ok', verified: true });
      expect(mockRedis.set).toHaveBeenCalledWith('user:online:user-ws-ok', '1', 600);
      expect(client.join).toHaveBeenCalledWith('user:user-ws-ok');
      expect(client.join).toHaveBeenCalledWith('conversation:conv-1');
      expect(client.join).toHaveBeenCalledWith('conversation:conv-2');
      expect(client.emit).toHaveBeenCalledWith('connected', {
        userId: 'user-ws-ok',
        username: 'verifiedGuy',
      });
    });

    it('rejects unverified user (verified: false), emits error with EMAIL_NOT_VERIFIED, and disconnects', async () => {
      const token = jwt.sign(
        { sub: 'user-unverified', username: 'unverifiedGuy', role: 'USER', verified: false },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const client = createMockSocket(token);
      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'يرجى توثيق البريد الإلكتروني أولاً',
        code: 'EMAIL_NOT_VERIFIED',
      });
      expect(client.disconnect).toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('rejects purpose token (purpose: email-verify), emits error with INVALID_TOKEN_PURPOSE, and disconnects', async () => {
      const token = jwt.sign(
        { sub: 'user-purpose', purpose: 'email-verify' },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const client = createMockSocket(token);
      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'رمز غير صالح لهذا المسار',
        code: 'INVALID_TOKEN_PURPOSE',
      });
      expect(client.disconnect).toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('rejects token without verified claim, emits error with EMAIL_NOT_VERIFIED, and disconnects', async () => {
      const token = jwt.sign(
        { sub: 'user-no-claim', username: 'noClaimUser', role: 'USER' },
        secret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const client = createMockSocket(token);
      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'يرجى توثيق البريد الإلكتروني أولاً',
        code: 'EMAIL_NOT_VERIFIED',
      });
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnects immediately when no token is provided', async () => {
      const client = createMockSocket(undefined);
      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.emit).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });
});
