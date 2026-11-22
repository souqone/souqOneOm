import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PartsService } from '../parts.service';
import { PartsController } from '../parts.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { GeoService } from '../../locations/geo.service';
import { SellerContactGate } from '../../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../../common/services/active-listings-limit.service';

describe('D-B17 Requirement 3: PartsService.findOne IP-rate-limited view counting', () => {
  let service: PartsService;
  let controller: PartsController;
  let prismaMock: any;
  let redisMock: any;

  const mockActivePart = {
    id: 'part-100',
    sellerId: 'seller-1',
    status: 'ACTIVE',
    hiddenByOwnerStatus: false,
    deletedAt: null,
    viewCount: 5,
  };

  beforeEach(async () => {
    prismaMock = {
      sparePart: {
        findUnique: jest.fn().mockResolvedValue(mockActivePart),
        update: jest.fn().mockResolvedValue(mockActivePart),
      },
    };
    redisMock = {
      setNX: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    const mod = await Test.createTestingModule({
      controllers: [PartsController],
      providers: [
        PartsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: GeoService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: {} },
        { provide: ActiveListingsLimitService, useValue: {} },
      ],
    }).compile();

    service = mod.get(PartsService);
    controller = mod.get(PartsController);
  });

  it('increments viewCount on first visit from an IP via shared incrementViewCount (view:SPARE_PART:<id>:<ip>)', async () => {
    redisMock.setNX.mockResolvedValueOnce(true);

    await service.findOne('part-100', undefined, '203.0.113.10');

    expect(redisMock.setNX).toHaveBeenCalledWith('view:SPARE_PART:part-100:203.0.113.10', '1', 3600);
    expect(prismaMock.sparePart.update).toHaveBeenCalledWith({
      where: { id: 'part-100' },
      data: { viewCount: { increment: 1 } },
    });
  });

  it('does NOT increment viewCount on duplicate visit from the same IP within the 1-hour cooldown', async () => {
    redisMock.setNX.mockResolvedValueOnce(false);

    await service.findOne('part-100', undefined, '203.0.113.10');

    expect(redisMock.setNX).toHaveBeenCalledWith('view:SPARE_PART:part-100:203.0.113.10', '1', 3600);
    expect(prismaMock.sparePart.update).not.toHaveBeenCalled();
  });

  it('PartsController.findOne forwards req.ip and user to PartsService.findOne', async () => {
    const spy = jest.spyOn(service, 'findOne');
    await controller.findOne('part-100', { ip: '198.51.100.7' } as any, { sub: 'viewer-1' } as any);
    expect(spy).toHaveBeenCalledWith('part-100', { sub: 'viewer-1' }, '198.51.100.7');
  });
});
