export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum BookingEntityType {
  LISTING = 'LISTING',
  BUS_LISTING = 'BUS_LISTING',
  EQUIPMENT_LISTING = 'EQUIPMENT_LISTING',
}

export interface IBooking {
  id: string;
  entityType: BookingEntityType;
  entityId: string;
  renterId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateBooking {
  entityType: BookingEntityType;
  entityId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}
