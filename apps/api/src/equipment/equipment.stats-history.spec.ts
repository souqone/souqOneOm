import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EquipmentListingsService } from './equipment-listings.service';
import { EquipmentController } from './equipment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { stripSensitive } from '../common/interceptors/sanitize.interceptor';

describe('EquipmentListingsService - Stats and Status History', () => {
  let service: EquipmentListingsService;
  let controller: EquipmentController;
  let prismaMock: any;

  const mockEquipment = {
    id: 'eq-123',
    userId: 'owner-1',
    title: 'Excavator Komatsu PC200',
    slug: 'excavator-komatsu-pc200-eq123',
    status: 'ACTIVE',
    viewCount: 142,
    version: 1,
    createdAt: new Date('2026-10-18T10:00:00.000Z'),
    updatedAt: new Date('2026-10-21T12:00:00.000Z'),
    governorateId: 1,
    wilayaId: 101,
    images: [],
    governorateRef: { id: 1, name: 'Muscat', nameAr: 'مسقط' },
    wilayaRef: { id: 101, name: 'Bowsher', nameAr: 'بوشر' },
    user: { id: 'owner-1', displayName: 'Al Remal Corp' },
  };

  const mockLogs = [
    {
      id: 'log-2',
      equipmentListingId: 'eq-123',
      fromStatus: 'ACTIVE',
      toStatus: 'RENTED',
      changedBy: 'owner-1',
      createdAt: new Date('2026-10-20T16:00:00.000Z'),
    },
    {
      id: 'log-1',
      equipmentListingId: 'eq-123',
      fromStatus: 'DRAFT',
      toStatus: 'ACTIVE',
      changedBy: 'owner-1',
      createdAt: new Date('2026-10-18T10:05:00.000Z'),
    },
  ];

  beforeEach(async () => {
    prismaMock = {
      equipmentListing: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(mockEquipment),
      },
      equipmentListingStatusLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      favorite: {
        count: jest.fn(),
      },
      conversation: {
        count: jest.fn(),
      },
      outboxEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prismaMock)),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        EquipmentListingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GeoService, useValue: { validateLocationPair: jest.fn(), syncLocation: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: SellerContactGate, useValue: { assertCanPublish: jest.fn().mockResolvedValue(undefined) } },
        { provide: ActiveListingsLimitService, useValue: { assertWithinLimit: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = moduleRef.get<EquipmentListingsService>(EquipmentListingsService);
    controller = moduleRef.get<EquipmentController>(EquipmentController);
  });

  describe('getStatusHistory', () => {
    it('returns status history ordered createdAt desc for the owner', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(mockEquipment);
      prismaMock.equipmentListingStatusLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getStatusHistory('eq-123', 'owner-1');

      expect(prismaMock.equipmentListingStatusLog.findMany).toHaveBeenCalledWith({
        where: { equipmentListingId: 'eq-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('log-2');
      expect(result[1].id).toBe('log-1');
    });

    it('rejects non-owner with 403 ForbiddenException', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(mockEquipment);

      await expect(
        service.getStatusHistory('eq-123', 'other-user'),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.equipmentListingStatusLog.findMany).not.toHaveBeenCalled();
    });

    it('rejects missing listing with 404 NotFoundException', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(null);

      await expect(
        service.getStatusHistory('non-existent', 'owner-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('returns exact Contract 3 shape for the owner, querying polymorphic counts with EQUIPMENT_LISTING', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(mockEquipment);
      prismaMock.favorite.count.mockResolvedValue(18);
      prismaMock.conversation.count.mockResolvedValue(7);
      prismaMock.equipmentListingStatusLog.findMany.mockResolvedValue(mockLogs);

      const stats = await service.getStats('eq-123', 'owner-1');

      expect(prismaMock.favorite.count).toHaveBeenCalledWith({
        where: {
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: 'eq-123',
        },
      });
      expect(prismaMock.conversation.count).toHaveBeenCalledWith({
        where: {
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: 'eq-123',
        },
      });
      expect(prismaMock.equipmentListingStatusLog.findMany).toHaveBeenCalledWith({
        where: { equipmentListingId: 'eq-123' },
        orderBy: { createdAt: 'desc' },
      });

      expect(stats).toEqual({
        viewCount: 142,
        favoritesCount: 18,
        conversationsCount: 7,
        status: 'ACTIVE',
        createdAt: mockEquipment.createdAt,
        statusHistory: mockLogs,
      });
    });

    it('rejects non-owner with 403 ForbiddenException', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(mockEquipment);

      await expect(
        service.getStats('eq-123', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects missing listing with 404 NotFoundException', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(null);

      await expect(
        service.getStats('non-existent', 'owner-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Controller routing & Contract details', () => {
    it('controller delegates getStatusHistory correctly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(mockEquipment);
      prismaMock.equipmentListingStatusLog.findMany.mockResolvedValue(mockLogs);

      const res = await controller.getStatusHistory('eq-123', { sub: 'owner-1' } as any);
      expect(res).toEqual(mockLogs);
    });

    it('controller delegates getStats correctly', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue(mockEquipment);
      prismaMock.favorite.count.mockResolvedValue(5);
      prismaMock.conversation.count.mockResolvedValue(2);
      prismaMock.equipmentListingStatusLog.findMany.mockResolvedValue([]);

      const res = await controller.getStats('eq-123', { sub: 'owner-1' } as any);
      expect(res.viewCount).toBe(142);
      expect(res.favoritesCount).toBe(5);
      expect(res.conversationsCount).toBe(2);
    });

    it('detail responses include version and strip sensitive contact numbers', async () => {
      prismaMock.equipmentListing.findUnique.mockResolvedValue({
        ...mockEquipment,
        contactPhone: '+96891234567',
        whatsapp: '+96891234567',
        phoneE164: '+96891234567',
      });

      const rawDetail = await service.findOne('eq-123');
      const sanitized: any = stripSensitive(rawDetail);

      expect(sanitized.version).toBe(1);
      expect(sanitized.id).toBe('eq-123');
      expect(sanitized.contactPhone).toBeUndefined();
      expect(sanitized.whatsapp).toBeUndefined();
      expect(sanitized.phoneE164).toBeUndefined();
    });
  });
});
