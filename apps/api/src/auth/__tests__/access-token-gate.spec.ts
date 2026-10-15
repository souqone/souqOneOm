import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenGate } from '../access-token-gate.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AccountStatus, UserRole } from '@prisma/client';
import { JwtStrategy } from '../jwt.strategy';

describe('AccessTokenGate (Unit Tests)', () => {
  let gate: AccessTokenGate;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGate,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    gate = module.get<AccessTokenGate>(AccessTokenGate);
  });

  it('rejects with 401 if payload.sub is missing', async () => {
    await expect(gate.validate({ sub: '', role: 'USER' } as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('accepts token without tv claim (grace period transition)', async () => {
    mockRedis.get.mockResolvedValue({ tv: 3, status: AccountStatus.ACTIVE, role: UserRole.USER });

    const result = await gate.validate({ sub: 'user-1', role: 'USER' });
    expect(result).toEqual({ tv: 3, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects with 401 if payload.tv is less than current tokenVersion', async () => {
    mockRedis.get.mockResolvedValue({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });

    await expect(
      gate.validate({ sub: 'user-1', role: 'USER', tv: 1 }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts token if payload.tv matches current tokenVersion', async () => {
    mockRedis.get.mockResolvedValue({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });

    const result = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(result).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });
  });

  it('rejects with 401 if user status is BANNED, SUSPENDED, or DELETED', async () => {
    mockRedis.get.mockResolvedValue({ tv: 1, status: AccountStatus.BANNED, role: UserRole.USER });
    await expect(gate.validate({ sub: 'user-1', role: 'USER', tv: 1 })).rejects.toThrow(
      UnauthorizedException,
    );

    mockRedis.get.mockResolvedValue({ tv: 1, status: AccountStatus.SUSPENDED, role: UserRole.USER });
    await expect(gate.validate({ sub: 'user-1', role: 'USER', tv: 1 })).rejects.toThrow(
      UnauthorizedException,
    );

    mockRedis.get.mockResolvedValue({ tv: 1, status: AccountStatus.DELETED, role: UserRole.USER });
    await expect(gate.validate({ sub: 'user-1', role: 'USER', tv: 1 })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('falls back to Postgres on Redis cache miss / offline, and populates cache with role', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 4,
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
    });

    const result = await gate.validate({ sub: 'user-1', role: 'USER', tv: 4 });
    expect(result).toEqual({ tv: 4, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, tokenVersion: true, status: true, role: true },
    });
    expect(mockRedis.set).toHaveBeenCalledWith(
      'auth:tv:user-1',
      { tv: 4, status: AccountStatus.ACTIVE, role: UserRole.USER },
      300,
    );
  });

  it('treats legacy cache entry missing role as a cache miss and falls back to Postgres', async () => {
    // Legacy Redis payload before Part 6c lacked the role field
    mockRedis.get.mockResolvedValue({ tv: 2, status: AccountStatus.ACTIVE });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 2,
      status: AccountStatus.ACTIVE,
      role: UserRole.ADMIN,
    });

    const result = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(result).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.ADMIN });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, tokenVersion: true, status: true, role: true },
    });
    expect(mockRedis.set).toHaveBeenCalledWith(
      'auth:tv:user-1',
      { tv: 2, status: AccountStatus.ACTIVE, role: UserRole.ADMIN },
      300,
    );
  });

  it('treats unknown role string as a cache miss and falls back to Postgres (دور غير معروف في الكاش)', async () => {
    mockRedis.get.mockResolvedValue({ tv: 2, status: AccountStatus.ACTIVE, role: 'NON_EXISTENT_ROLE' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 2,
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
    });

    const result = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(result).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, tokenVersion: true, status: true, role: true },
    });
  });

  it('falls back to Postgres when Redis is offline / throws error (Redis واقع)', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis connection refused / ECONNREFUSED'));
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 2,
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
    });

    const result = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(result).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, tokenVersion: true, status: true, role: true },
    });
  });

  it('fails closed with 401 UnauthorizedException if Postgres query throws an exception when Redis is down', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis offline'));
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Postgres connection timeout / dead pool'));

    await expect(
      gate.validate({ sub: 'user-1', role: 'USER', tv: 1 }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects with 401 on cache miss if user is not found in database', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      gate.validate({ sub: 'user-missing', role: 'USER', tv: 1 }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('invalidate removes the redis cache key', async () => {
    await gate.invalidate('user-1');
    expect(mockRedis.del).toHaveBeenCalledWith('auth:tv:user-1');
  });

  it('setCache writes tokenVersion, status, and role to redis with 300s TTL', async () => {
    await gate.setCache('user-1', 5, AccountStatus.ACTIVE, UserRole.ADMIN);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'auth:tv:user-1',
      { tv: 5, status: AccountStatus.ACTIVE, role: UserRole.ADMIN },
      300,
    );
  });

  it('treats corrupted or unexpected Redis data as a cache miss and falls back to Postgres', async () => {
    // 1. Corrupted primitive string instead of object
    mockRedis.get.mockResolvedValue('corrupted-non-json-string');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 2,
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
    });

    const res1 = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(res1).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, tokenVersion: true, status: true, role: true },
    });

    // 2. Unexpected object missing tv or status or role
    mockPrisma.user.findUnique.mockClear();
    mockRedis.get.mockResolvedValue({ foo: 'bar' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 2,
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
    });

    const res2 = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(res2).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);

    // 3. Redis.get throwing an error (e.g. JSON syntax error / network exception)
    mockPrisma.user.findUnique.mockClear();
    mockRedis.get.mockRejectedValue(new Error('Redis syntax error'));
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 2,
      status: AccountStatus.ACTIVE,
      role: UserRole.USER,
    });

    const res3 = await gate.validate({ sub: 'user-1', role: 'USER', tv: 2 });
    expect(res3).toEqual({ tv: 2, status: AccountStatus.ACTIVE, role: UserRole.USER });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  describe('JwtStrategy role sourcing from gate', () => {
    it('sets request.user.role to the live role from the gate even if the token payload has a different role', async () => {
      const mockGate: any = {
        validate: jest.fn().mockResolvedValue({
          tv: 1,
          status: AccountStatus.ACTIVE,
          role: UserRole.ADMIN,
        }),
      };
      const strategy = new JwtStrategy(mockGate);

      // Incoming JWT payload claims role: 'USER'
      const payload: any = {
        sub: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        verified: true,
      };

      const user = await strategy.validate(payload);

      // request.user.role must match the gate's live role (ADMIN), overriding the token
      expect(user.role).toBe(UserRole.ADMIN);
      expect(mockGate.validate).toHaveBeenCalledWith(payload);
    });
  });
});

