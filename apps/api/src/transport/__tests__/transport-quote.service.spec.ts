import { Test, TestingModule } from '@nestjs/testing';
import { TransportQuoteService } from '../transport-quote.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  carrierProfile: { findUnique: jest.fn() },
  transportRequest: { findUnique: jest.fn(), update: jest.fn() },
  transportQuote: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  transportBooking: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotifications = { create: jest.fn() };

describe('TransportQuoteService', () => {
  let service: TransportQuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportQuoteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TransportQuoteService>(TransportQuoteService);
    jest.clearAllMocks();
  });

  describe('submitQuote', () => {
    it('should throw NotFoundException if no carrier profile', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.submitQuote('r1', 'user1', { price: 10 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if request not found', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'c1', userId: 'user1' });
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.submitQuote('bad', 'user1', { price: 10 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if quoting own request', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'c1', userId: 'user1' });
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: 'r1', userId: 'user1', status: 'OPEN' });
      await expect(
        service.submitQuote('r1', 'user1', { price: 10 } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException on duplicate quote', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'c1', userId: 'user1' });
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: 'r1', userId: 'other', status: 'OPEN' });
      mockPrisma.transportQuote.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.submitQuote('r1', 'user1', { price: 10 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a quote and notify shipper', async () => {
      mockPrisma.carrierProfile.findUnique.mockResolvedValue({ id: 'c1', userId: 'user1' });
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: 'r1', userId: 'shipper', status: 'OPEN' });
      mockPrisma.transportQuote.findUnique.mockResolvedValue(null);
      mockPrisma.transportQuote.create.mockResolvedValue({ id: 'q1', price: 10 });

      const result = await service.submitQuote('r1', 'user1', { price: 10 } as any);
      expect(result.id).toBe('q1');
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });

  describe('acceptQuote', () => {
    it('should throw ForbiddenException if not request owner', async () => {
      mockPrisma.transportQuote.findUnique.mockResolvedValue({
        id: 'q1', status: 'PENDING', requestId: 'r1',
        request: { userId: 'other', status: 'QUOTED' },
        carrier: { userId: 'carrier1' },
      });
      await expect(service.acceptQuote('q1', 'attacker')).rejects.toThrow(ForbiddenException);
    });

    it('should accept quote in transaction and notify carrier', async () => {
      mockPrisma.transportQuote.findUnique.mockResolvedValue({
        id: 'q1', status: 'PENDING', requestId: 'r1',
        request: { userId: 'shipper', status: 'QUOTED' },
        carrier: { userId: 'carrier1', id: 'c1' },
      });
      const booking = { id: 'b1', requestId: 'r1', quoteId: 'q1' };
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        return booking;
      });

      const result = await service.acceptQuote('q1', 'shipper');
      expect(result.id).toBe('b1');
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });

  describe('withdrawQuote', () => {
    it('should throw ForbiddenException if not quote owner', async () => {
      mockPrisma.transportQuote.findUnique.mockResolvedValue({
        id: 'q1', status: 'PENDING',
        carrier: { userId: 'other' },
      });
      await expect(service.withdrawQuote('q1', 'attacker')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if not PENDING', async () => {
      mockPrisma.transportQuote.findUnique.mockResolvedValue({
        id: 'q1', status: 'ACCEPTED',
        carrier: { userId: 'user1' },
      });
      await expect(service.withdrawQuote('q1', 'user1')).rejects.toThrow(BadRequestException);
    });
  });
});
