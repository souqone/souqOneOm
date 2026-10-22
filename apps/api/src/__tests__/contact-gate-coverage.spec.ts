import { BadRequestException, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { stripDeprecatedContactFields } from '../common/utils/contact.utils';
import { CONTACT_REGISTRY, ContactRegistryEntry, CONTACT_ENTITY_TYPES } from '../contact/contact.registry';
import { ContactService } from '../contact/contact.service';
import { ListingStatus, JobStatus } from '@prisma/client';

import { UpdateJobDto } from '../jobs/dto/update-job.dto';
import { UpdateListingDto } from '../listings/dto/update-listing.dto';
import { UpdateBusListingDto } from '../buses/dto/update-bus-listing.dto';
import { UpdateEquipmentListingDto } from '../equipment/dto/update-equipment-listing.dto';
import { UpdateOperatorListingDto } from '../equipment/dto/update-operator-listing.dto';
import { UpdatePartDto } from '../parts/dto/update-part.dto';
import { UpdateServiceDto } from '../services/dto/update-service.dto';
import { UpdateDriverProfileDto } from '../jobs/dto/update-driver-profile.dto';
import { UpdateEmployerProfileDto } from '../jobs/dto/update-employer-profile.dto';
import { UpdateCarrierProfileDto } from '../transport/dto/update-carrier-profile.dto';

import { ListingsService } from '../listings/listings.service';
import { BusesService } from '../buses/buses.service';
import { EquipmentListingsService } from '../equipment/equipment-listings.service';
import { OperatorsService } from '../operators/operators.service';
import { PartsService } from '../parts/parts.service';
import { BaseListingService } from '../common/services/base-listing.service';
import { ServicesService } from '../services/services.service';
import { JobsService } from '../jobs/jobs.service';
import { DriverProfileService } from '../jobs/driver-profile.service';
import { EmployerProfileService } from '../jobs/employer-profile.service';
import { CarrierProfileService } from '../transport/carrier-profile.service';

describe('Part 6a: Contact Gate Coverage & Registry Unit Tests', () => {
  describe('SellerContactGate', () => {
    let gate: SellerContactGate;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        user: {
          findUnique: jest.fn(),
        },
      };
      gate = new SellerContactGate(mockPrisma);
    });

    it('returns normalized phone when user has a valid profile phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '91234567',
      });

      const phone = await gate.assertCanPublish('user-1');
      expect(phone).toBe('+96891234567');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, phone: true, status: true, suspendedUntil: true },
      });
    });

    it('throws ACCOUNT_BANNED (ForbiddenException) when user is BANNED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-banned',
        phone: '91234567',
        status: 'BANNED',
      });

      await expect(gate.assertCanPublish('user-banned')).rejects.toMatchObject({
        response: {
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
        },
      });
    });

    it('throws ACCOUNT_SUSPENDED (ForbiddenException) when user is active SUSPENDED', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-suspended',
        phone: '91234567',
        status: 'SUSPENDED',
        suspendedUntil: futureDate,
      });

      await expect(gate.assertCanPublish('user-suspended')).rejects.toMatchObject({
        response: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم إيقاف حسابك مؤقتاً',
          suspendedUntil: futureDate.toISOString(),
        },
      });
    });

    it('throws UnauthorizedException when user status is DELETED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-deleted',
        phone: '91234567',
        status: 'DELETED',
      });

      await expect(gate.assertCanPublish('user-deleted')).rejects.toThrow(
        'بيانات الدخول غير صحيحة',
      );
    });

    it('throws PROFILE_PHONE_REQUIRED (BadRequestException) when user has no phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        phone: null,
      });

      await expect(gate.assertCanPublish('user-2')).rejects.toThrow(BadRequestException);
      try {
        await gate.assertCanPublish('user-2');
      } catch (err: any) {
        expect(err.getResponse()).toMatchObject({
          code: 'PROFILE_PHONE_REQUIRED',
        });
      }
    });

    it('throws PROFILE_PHONE_REQUIRED when user phone is empty string', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-3',
        phone: '   ',
      });

      await expect(gate.assertCanPublish('user-3')).rejects.toThrow(BadRequestException);
    });

    it('throws PROFILE_PHONE_REQUIRED when user is not found in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(gate.assertCanPublish('non-existent')).rejects.toThrow(BadRequestException);
    });
  });

  describe('stripDeprecatedContactFields', () => {
    it('removes contactPhone and whatsapp while preserving all other properties', () => {
      const input = {
        title: 'Toyota Camry 2024',
        price: 8500,
        version: 2,
        contactPhone: '+96899887766',
        whatsapp: '+96899887766',
        whatsappEnabled: true,
        features: ['GPS', 'Sunroof'],
      };

      const result = stripDeprecatedContactFields(input);

      expect(result).toEqual({
        title: 'Toyota Camry 2024',
        price: 8500,
        version: 2,
        whatsappEnabled: true,
        features: ['GPS', 'Sunroof'],
      });
      expect(result).not.toHaveProperty('contactPhone');
      expect(result).not.toHaveProperty('whatsapp');
    });

    it('returns empty object when only deprecated fields are passed', () => {
      const input = {
        contactPhone: '+96891112222',
        whatsapp: '+96891112222',
      };

      const result = stripDeprecatedContactFields(input);
      expect(result).toEqual({});
    });

    it('handles falsy or non-object inputs safely', () => {
      expect(stripDeprecatedContactFields(null as any)).toBeNull();
      expect(stripDeprecatedContactFields(undefined as any)).toBeUndefined();
      expect(stripDeprecatedContactFields('string' as any)).toBe('string');
    });
  });

  describe('CONTACT_REGISTRY', () => {
    it('covers all entity types without omissions', () => {
      const expectedTypes = [
        'LISTING',
        'BUS_LISTING',
        'EQUIPMENT_LISTING',
        'OPERATOR_LISTING',
        'SPARE_PART',
        'CAR_SERVICE',
        'JOB',
        'DRIVER_JOB',
        'DRIVER_PROFILE',
        'EMPLOYER_PROFILE',
        'CARRIER_PROFILE',
        'TRANSPORT_REQUEST',
      ];

      for (const type of expectedTypes) {
        expect(CONTACT_REGISTRY).toHaveProperty(type);
        const entry = CONTACT_REGISTRY[type as keyof typeof CONTACT_REGISTRY] as ContactRegistryEntry;
        expect(entry).toBeDefined();
        expect(typeof entry.loadTarget).toBe('function');
        expect(entry.entityType).toBe(type);
      }
    });

    it('matches CONTACT_ENTITY_TYPES array exactly', () => {
      const registryKeys = Object.keys(CONTACT_REGISTRY).sort();
      const constantKeys = [...CONTACT_ENTITY_TYPES].sort();
      expect(registryKeys).toEqual(constantKeys);
      expect(constantKeys.length).toBe(12);
    });
  });

  describe('ContactService Polymorphic Lookup & Rules', () => {
    let service: ContactService;
    let mockPrisma: any;
    let mockRedis: any;

    beforeEach(() => {
      mockPrisma = {
        listing: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
      };

      mockRedis = {
        exists: jest.fn().mockResolvedValue(false),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(1),
      };

      service = new ContactService(mockPrisma, mockRedis);
    });

    it('throws CANNOT_CONTACT_SELF (BadRequestException) when viewer is the owner', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-1',
        sellerId: 'user-same',
        status: ListingStatus.ACTIVE,
        whatsappEnabled: true,
      });

      await expect(
        service.getContact('LISTING', 'listing-1', 'user-same'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns whatsappNumber as null when whatsappEnabled is false', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-2',
        sellerId: 'owner-1',
        status: ListingStatus.ACTIVE,
        whatsappEnabled: false,
        hiddenByOwnerStatus: false,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        phone: '+96891234567',
        status: 'ACTIVE',
      });

      const res = await service.getContact('LISTING', 'listing-2', 'viewer-2');
      expect(res.phone).toBe('+96891234567');
      expect(res.whatsappNumber).toBeNull();
    });

    it('returns whatsappNumber when whatsappEnabled is true', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-3',
        sellerId: 'owner-1',
        status: ListingStatus.ACTIVE,
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        phone: '+96891234567',
        status: 'ACTIVE',
      });

      const res = await service.getContact('LISTING', 'listing-3', 'viewer-2');
      expect(res.phone).toBe('+96891234567');
      expect(res.whatsappNumber).toBe('+96891234567');
    });

    it('enforces daily view cap (throws 429 after 50 contact reveals)', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'listing-4',
        sellerId: 'owner-1',
        status: ListingStatus.ACTIVE,
        whatsappEnabled: true,
        hiddenByOwnerStatus: false,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        phone: '+96891234567',
        status: 'ACTIVE',
      });

      // Simulate redis get returning 50 (reached cap)
      mockRedis.exists.mockResolvedValue(false);
      mockRedis.get.mockResolvedValue(50);

      await expect(
        service.getContact('LISTING', 'listing-4', 'viewer-spammer'),
      ).rejects.toThrow(HttpException);

      try {
        await service.getContact('LISTING', 'listing-4', 'viewer-spammer');
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  describe('Publishing Gate Enforced Across All 10 Entities on create', () => {
    let mockGateThrows: any;

    beforeEach(() => {
      mockGateThrows = {
        assertCanPublish: jest.fn().mockRejectedValue(
          new BadRequestException({ code: 'PROFILE_PHONE_REQUIRED', message: 'PROFILE_PHONE_REQUIRED' }),
        ),
      };
    });

    it('1. Listing (cars) create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new ListingsService(
        {} as any, {} as any, {} as any, {} as any, {} as any, mockGateThrows, {} as any,
      );
      await expect(s.create({} as any, 'user-1')).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('2. BusListing create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new BusesService(
        {} as any, {} as any, {} as any, {} as any, mockGateThrows, {} as any,
      );
      await expect(s.create({} as any, 'user-1')).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('3. EquipmentListing create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new EquipmentListingsService(
        {} as any, {} as any, {} as any, mockGateThrows, {} as any, {} as any,
      );
      await expect(s.create({} as any, 'user-1')).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('4. OperatorListing create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new OperatorsService(
        {} as any, {} as any, {} as any, mockGateThrows, {} as any,
      );
      await expect(s.create({} as any, 'user-1')).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('5. SparePart create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new PartsService(
        {} as any, {} as any, {} as any, mockGateThrows, {} as any,
      );
      await expect(s.create({} as any, 'user-1')).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('6. CarService (ServicesService) create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new ServicesService(
        { validateLocationPair: jest.fn() } as any, {} as any, {} as any, {} as any, mockGateThrows, {} as any,
      );
      await expect(s.create({} as any, 'user-1')).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('7. DriverJob create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new JobsService(
        {} as any, {} as any, {} as any, {} as any, mockGateThrows, {} as any,
      );
      await expect(s.create('user-1', {} as any)).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('8. DriverProfile create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new DriverProfileService(
        {} as any, {} as any, mockGateThrows,
      );
      await expect(s.create('user-1', {} as any)).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('9. EmployerProfile create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new EmployerProfileService(
        {} as any, {} as any, mockGateThrows,
      );
      await expect(s.create('user-1', {} as any)).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('10. CarrierProfile create throws PROFILE_PHONE_REQUIRED when profile lacks phone', async () => {
      const s = new CarrierProfileService(
        {} as any, {} as any, mockGateThrows,
      );
      await expect(s.create('user-1', {} as any)).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGateThrows.assertCanPublish).toHaveBeenCalledWith('user-1');
    });
  });

  describe('JobsService Status ACTIVE Gate Leak (update)', () => {
    let mockGate: any;
    let mockPrisma: any;
    let mockRedis: any;
    let service: JobsService;

    beforeEach(() => {
      mockGate = {
        assertCanPublish: jest.fn(),
      };
      mockPrisma = {
        driverJob: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'job-1',
            userId: 'user-1',
            status: 'ACTIVE',
            governorateId: 1,
            wilayaId: 1,
          }),
          update: jest.fn(),
        },
      };
      mockRedis = {
        del: jest.fn().mockResolvedValue(1),
        delPattern: jest.fn().mockResolvedValue(1),
      };
      service = new JobsService(
        { validateLocationPair: jest.fn() } as any,
        mockPrisma,
        mockRedis,
        {} as any,
        mockGate,
        {} as any,
      );
    });

    it('throws PROFILE_PHONE_REQUIRED when updating job to ACTIVE without a phone', async () => {
      mockGate.assertCanPublish.mockRejectedValueOnce(
        new BadRequestException({ code: 'PROFILE_PHONE_REQUIRED' }),
      );

      await expect(
        service.update('job-1', 'user-1', { status: JobStatus.ACTIVE }),
      ).rejects.toMatchObject({
        response: { code: 'PROFILE_PHONE_REQUIRED' },
      });
      expect(mockGate.assertCanPublish).toHaveBeenCalledWith('user-1');
    });

    it('does NOT call assertCanPublish when updating status to CLOSED', async () => {
      mockPrisma.driverJob.update.mockResolvedValue({ id: 'job-1', status: 'CLOSED' });
      mockPrisma.jobApplication = { findMany: jest.fn().mockResolvedValue([]) };
      mockPrisma.$transaction = jest.fn().mockImplementation((fn: any) => fn(mockPrisma));
      mockPrisma.outboxEvent = { create: jest.fn() };

      await service.update('job-1', 'user-1', { status: JobStatus.CLOSED });
      expect(mockGate.assertCanPublish).not.toHaveBeenCalled();
    });
  });

  describe('ValidationPipe with Deprecated Contact Fields & Strip Behavior', () => {
    let pipe: ValidationPipe;

    beforeEach(() => {
      pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
    });

    it('accepts contactPhone and whatsapp on UpdateJobDto and strips them before DB', async () => {
      const payload = {
        title: 'Senior Driver Wanted',
        contactPhone: '+96891234567',
        whatsapp: '+96891234567',
        whatsappEnabled: true,
      };

      const transformed = await pipe.transform(payload, {
        type: 'body',
        metatype: UpdateJobDto,
      });

      expect(transformed).toMatchObject({
        title: 'Senior Driver Wanted',
        contactPhone: '+96891234567',
        whatsapp: '+96891234567',
        whatsappEnabled: true,
      });

      const clean = stripDeprecatedContactFields(transformed);
      expect(clean).toEqual({
        title: 'Senior Driver Wanted',
        whatsappEnabled: true,
      });
      expect(clean).not.toHaveProperty('contactPhone');
      expect(clean).not.toHaveProperty('whatsapp');
    });

    it('rejects unknown properties under forbidNonWhitelisted: true', async () => {
      const payload = {
        title: 'Senior Driver Wanted',
        unknownHackerField: 'malicious-data',
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: UpdateJobDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts deprecated contact fields on all DTOs and verifies stripDeprecatedContactFields', async () => {
      const dtosToVerify = [
        UpdateListingDto,
        UpdateBusListingDto,
        UpdateEquipmentListingDto,
        UpdateOperatorListingDto,
        UpdatePartDto,
        UpdateServiceDto,
        UpdateDriverProfileDto,
        UpdateEmployerProfileDto,
        UpdateCarrierProfileDto,
      ];

      for (const DtoClass of dtosToVerify) {
        const payload: Record<string, any> = {
          contactPhone: '+96891234567',
          whatsapp: '+96891234567',
          whatsappEnabled: true,
        };

        if (DtoClass === UpdateListingDto || DtoClass === UpdateBusListingDto) {
          payload.version = 1;
        }

        const validated = await pipe.transform(payload, {
          type: 'body',
          metatype: DtoClass,
        });

        expect(validated).toBeDefined();
        const cleaned = stripDeprecatedContactFields(validated);
        expect(cleaned).not.toHaveProperty('contactPhone');
        expect(cleaned).not.toHaveProperty('whatsapp');
        expect(cleaned.whatsappEnabled).toBe(true);
      }
    });
  });
});
