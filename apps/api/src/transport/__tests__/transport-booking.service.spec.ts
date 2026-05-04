import { Test, TestingModule } from '@nestjs/testing';
import { TransportBookingService } from '../transport-booking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  transportBooking: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  transportRequest: { update: jest.fn() },
  carrierProfile: { update: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotifications = { create: jest.fn() };

describe('TransportBookingService', () => {
  let service: TransportBookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportBookingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TransportBookingService>(TransportBookingService);
    jest.clearAllMocks();
  });

  describe('markInProgress', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue(null);
      await expect(service.markInProgress('bad', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the carrier', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'ACCEPTED', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'other-carrier' } },
      });
      await expect(service.markInProgress('b1', 'attacker')).rejects.toThrow(ForbiddenException);
    });

    it('should start the booking and notify shipper', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'ACCEPTED', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'carrier1' } },
      });
      mockPrisma.$transaction.mockImplementation(async () => ({ id: 'b1', status: 'IN_PROGRESS' }));

      const result = await service.markInProgress('b1', 'carrier1');
      expect(result.status).toBe('IN_PROGRESS');
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('should throw ForbiddenException if not the shipper', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'IN_PROGRESS', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'carrier1' }, carrierId: 'c1' },
      });
      await expect(service.complete('b1', 'carrier1')).rejects.toThrow(ForbiddenException);
    });

    it('should complete booking and increment carrier trips', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'IN_PROGRESS', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'carrier1' }, carrierId: 'c1' },
      });
      mockPrisma.$transaction.mockImplementation(async () => ({ id: 'b1', status: 'COMPLETED' }));

      const result = await service.complete('b1', 'shipper');
      expect(result.status).toBe('COMPLETED');
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should throw ForbiddenException if neither shipper nor carrier', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'IN_PROGRESS', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'carrier1' } },
      });
      await expect(service.cancel('b1', 'stranger')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already completed', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'COMPLETED', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'carrier1' } },
      });
      await expect(service.cancel('b1', 'shipper')).rejects.toThrow(BadRequestException);
    });

    it('should cancel and notify the other party', async () => {
      mockPrisma.transportBooking.findUnique.mockResolvedValue({
        id: 'b1', status: 'IN_PROGRESS', requestId: 'r1',
        request: { userId: 'shipper' },
        quote: { carrier: { userId: 'carrier1' } },
      });
      mockPrisma.$transaction.mockImplementation(async () => ({ id: 'b1', status: 'CANCELLED' }));

      const result = await service.cancel('b1', 'shipper', 'تغيرت الخطة');
      expect(result.status).toBe('CANCELLED');
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });
});
