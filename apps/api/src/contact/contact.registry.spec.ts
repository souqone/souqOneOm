import { NotFoundException } from '@nestjs/common';
import { CONTACT_REGISTRY } from './contact.registry';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

describe('CONTACT_REGISTRY targets unit tests', () => {
  const createMockPrisma = () => ({
    listing: { findUnique: jest.fn() },
    busListing: { findFirst: jest.fn() },
    equipmentListing: { findFirst: jest.fn(), findUnique: jest.fn() },
    operatorListing: { findUnique: jest.fn() },
    sparePart: { findUnique: jest.fn() },
    carService: { findUnique: jest.fn() },
    driverJob: { findFirst: jest.fn() },
    driverProfile: { findUnique: jest.fn() },
    employerProfile: { findUnique: jest.fn() },
    carrierProfile: { findUnique: jest.fn() },
    transportRequest: { findUnique: jest.fn() },
  });

  describe('LISTING (Cars)', () => {
    it('returns target when visible (ACTIVE and not hidden)', async () => {
      const prisma = createMockPrisma();
      prisma.listing.findUnique.mockResolvedValue({
        id: 'car-1',
        sellerId: 'user-1',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.LISTING].loadTarget(prisma as any, 'car-1');
      expect(res).toEqual({ ownerId: 'user-1', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.listing.findUnique.mockResolvedValue({
        id: 'car-1',
        sellerId: 'user-1',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.LISTING].loadTarget(prisma as any, 'car-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when status is DRAFT', async () => {
      const prisma = createMockPrisma();
      prisma.listing.findUnique.mockResolvedValue({
        id: 'car-1',
        sellerId: 'user-1',
        status: 'DRAFT',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.LISTING].loadTarget(prisma as any, 'car-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('BUS_LISTING', () => {
    it('returns target when visible (ACTIVE, not hidden, deletedAt null)', async () => {
      const prisma = createMockPrisma();
      prisma.busListing.findFirst.mockResolvedValue({
        id: 'bus-1',
        userId: 'user-2',
        status: 'ACTIVE',
        whatsappEnabled: false,
        hiddenByOwnerStatus: false,
        deletedAt: null,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.BUS_LISTING].loadTarget(prisma as any, 'bus-1');
      expect(res).toEqual({ ownerId: 'user-2', whatsappEnabled: false });
    });

    it('throws NotFoundException when bus is soft deleted', async () => {
      const prisma = createMockPrisma();
      prisma.busListing.findFirst.mockResolvedValue({
        id: 'bus-1',
        userId: 'user-2',
        status: 'ACTIVE',
        whatsappEnabled: false,
        hiddenByOwnerStatus: false,
        deletedAt: new Date(),
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.BUS_LISTING].loadTarget(prisma as any, 'bus-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.busListing.findFirst.mockResolvedValue({
        id: 'bus-1',
        userId: 'user-2',
        status: 'ACTIVE',
        whatsappEnabled: false,
        hiddenByOwnerStatus: true,
        deletedAt: null,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.BUS_LISTING].loadTarget(prisma as any, 'bus-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('EQUIPMENT_LISTING', () => {
    it('returns target when visible', async () => {
      const prisma = createMockPrisma();
      prisma.equipmentListing.findFirst.mockResolvedValue({
        id: 'eq-1',
        userId: 'user-3',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
        deletedAt: null,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.EQUIPMENT_LISTING].loadTarget(prisma as any, 'eq-1');
      expect(res).toEqual({ ownerId: 'user-3', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.equipmentListing.findFirst.mockResolvedValue({
        id: 'eq-1',
        userId: 'user-3',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
        deletedAt: null,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.EQUIPMENT_LISTING].loadTarget(prisma as any, 'eq-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when deletedAt is not null', async () => {
      const prisma = createMockPrisma();
      prisma.equipmentListing.findFirst.mockResolvedValue(null);

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.EQUIPMENT_LISTING].loadTarget(prisma as any, 'eq-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('OPERATOR_LISTING', () => {
    it('returns target when visible', async () => {
      const prisma = createMockPrisma();
      prisma.operatorListing.findUnique.mockResolvedValue({
        id: 'op-1',
        userId: 'user-4',
        status: 'ACTIVE',
        whatsappEnabled: false,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.OPERATOR_LISTING].loadTarget(prisma as any, 'op-1');
      expect(res).toEqual({ ownerId: 'user-4', whatsappEnabled: false });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.operatorListing.findUnique.mockResolvedValue({
        id: 'op-1',
        userId: 'user-4',
        status: 'ACTIVE',
        whatsappEnabled: false,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.OPERATOR_LISTING].loadTarget(prisma as any, 'op-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SPARE_PART', () => {
    it('returns target when visible', async () => {
      const prisma = createMockPrisma();
      prisma.sparePart.findUnique.mockResolvedValue({
        id: 'part-1',
        sellerId: 'user-5',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.SPARE_PART].loadTarget(prisma as any, 'part-1');
      expect(res).toEqual({ ownerId: 'user-5', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.sparePart.findUnique.mockResolvedValue({
        id: 'part-1',
        sellerId: 'user-5',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.SPARE_PART].loadTarget(prisma as any, 'part-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('CAR_SERVICE', () => {
    it('returns target when visible', async () => {
      const prisma = createMockPrisma();
      prisma.carService.findUnique.mockResolvedValue({
        id: 'svc-1',
        userId: 'user-6',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.CAR_SERVICE].loadTarget(prisma as any, 'svc-1');
      expect(res).toEqual({ ownerId: 'user-6', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.carService.findUnique.mockResolvedValue({
        id: 'svc-1',
        userId: 'user-6',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.CAR_SERVICE].loadTarget(prisma as any, 'svc-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DRIVER_JOB & JOB', () => {
    it('returns target when ACTIVE and not hidden', async () => {
      const prisma = createMockPrisma();
      prisma.driverJob.findFirst.mockResolvedValue({
        id: 'job-1',
        userId: 'user-7',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.DRIVER_JOB].loadTarget(prisma as any, 'job-1');
      expect(res).toEqual({ ownerId: 'user-7', whatsappEnabled: true });
    });

    it('throws NotFoundException when status is not ACTIVE', async () => {
      const prisma = createMockPrisma();
      prisma.driverJob.findFirst.mockResolvedValue({
        id: 'job-1',
        userId: 'user-7',
        status: 'CLOSED',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.DRIVER_JOB].loadTarget(prisma as any, 'job-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.driverJob.findFirst.mockResolvedValue({
        id: 'job-1',
        userId: 'user-7',
        status: 'ACTIVE',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.DRIVER_JOB].loadTarget(prisma as any, 'job-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DRIVER_PROFILE', () => {
    it('returns target when not hidden', async () => {
      const prisma = createMockPrisma();
      prisma.driverProfile.findUnique.mockResolvedValue({
        id: 'dp-1',
        userId: 'user-8',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.DRIVER_PROFILE].loadTarget(prisma as any, 'dp-1');
      expect(res).toEqual({ ownerId: 'user-8', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.driverProfile.findUnique.mockResolvedValue({
        id: 'dp-1',
        userId: 'user-8',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.DRIVER_PROFILE].loadTarget(prisma as any, 'dp-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('EMPLOYER_PROFILE', () => {
    it('returns target when not hidden', async () => {
      const prisma = createMockPrisma();
      prisma.employerProfile.findUnique.mockResolvedValue({
        id: 'ep-1',
        userId: 'user-9',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.EMPLOYER_PROFILE].loadTarget(prisma as any, 'ep-1');
      expect(res).toEqual({ ownerId: 'user-9', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.employerProfile.findUnique.mockResolvedValue({
        id: 'ep-1',
        userId: 'user-9',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.EMPLOYER_PROFILE].loadTarget(prisma as any, 'ep-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('CARRIER_PROFILE', () => {
    it('returns target when not hidden', async () => {
      const prisma = createMockPrisma();
      prisma.carrierProfile.findUnique.mockResolvedValue({
        id: 'cp-1',
        userId: 'user-10',
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.CARRIER_PROFILE].loadTarget(prisma as any, 'cp-1');
      expect(res).toEqual({ ownerId: 'user-10', whatsappEnabled: true });
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.carrierProfile.findUnique.mockResolvedValue({
        id: 'cp-1',
        userId: 'user-10',
        whatsappEnabled: true,
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.CARRIER_PROFILE].loadTarget(prisma as any, 'cp-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('TRANSPORT_REQUEST', () => {
    it('returns target when OPEN and not hidden', async () => {
      const prisma = createMockPrisma();
      prisma.transportRequest.findUnique.mockResolvedValue({
        id: 'tr-1',
        userId: 'user-11',
        status: 'OPEN',
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.TRANSPORT_REQUEST].loadTarget(prisma as any, 'tr-1');
      expect(res).toEqual({ ownerId: 'user-11', whatsappEnabled: false });
    });

    it('returns target when QUOTED and not hidden', async () => {
      const prisma = createMockPrisma();
      prisma.transportRequest.findUnique.mockResolvedValue({
        id: 'tr-1',
        userId: 'user-11',
        status: 'QUOTED',
        hiddenByOwnerStatus: false,
      });

      const res = await CONTACT_REGISTRY[ENTITY_TYPES.TRANSPORT_REQUEST].loadTarget(prisma as any, 'tr-1');
      expect(res).toEqual({ ownerId: 'user-11', whatsappEnabled: false });
    });

    it('throws NotFoundException when status is CANCELLED', async () => {
      const prisma = createMockPrisma();
      prisma.transportRequest.findUnique.mockResolvedValue({
        id: 'tr-1',
        userId: 'user-11',
        status: 'CANCELLED',
        hiddenByOwnerStatus: false,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.TRANSPORT_REQUEST].loadTarget(prisma as any, 'tr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when hiddenByOwnerStatus is true', async () => {
      const prisma = createMockPrisma();
      prisma.transportRequest.findUnique.mockResolvedValue({
        id: 'tr-1',
        userId: 'user-11',
        status: 'OPEN',
        hiddenByOwnerStatus: true,
      });

      await expect(
        CONTACT_REGISTRY[ENTITY_TYPES.TRANSPORT_REQUEST].loadTarget(prisma as any, 'tr-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
