import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { stripDeprecatedContactFields } from '../common/utils/contact.utils';
import { CONTACT_REGISTRY, ContactRegistryEntry, CONTACT_ENTITY_TYPES } from '../contact/contact.registry';
import { ContactService } from '../contact/contact.service';
import { ListingStatus } from '@prisma/client';

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
        select: { phone: true },
      });
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
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        phone: '+96891234567',
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
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        phone: '+96891234567',
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
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        phone: '+96891234567',
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
});
