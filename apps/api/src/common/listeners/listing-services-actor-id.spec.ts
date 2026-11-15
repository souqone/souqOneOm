import { ListingsService } from '../../listings/listings.service';
import { BusesService } from '../../buses/buses.service';
import { EquipmentListingsService } from '../../equipment/equipment-listings.service';
import { PartsService } from '../../parts/parts.service';
import { BaseListingService } from '../services/base-listing.service';
import { LISTING_EVENTS } from '../events/listing.events';
import { ENTITY_TYPES } from '../constants/entity-types.constants';

describe('Five Listing Services — emit actorId = requester (D-344)', () => {
  it('ListingsService (cars) emits actorId = requester for create/update/status_changed/deleted', () => {
    const eventEmitter = { emit: jest.fn() };
    const svc = Object.create(ListingsService.prototype);
    svc.eventEmitter = eventEmitter;
    svc.logger = { error: jest.fn() };

    const item = { id: 'car-1', title: 'Camry', sellerId: 'owner-1' };
    svc.emitListingEvent(LISTING_EVENTS.CREATED, item, undefined, 'req-1');
    svc.emitListingEvent(LISTING_EVENTS.UPDATED, item, undefined, 'req-2');
    svc.emitListingEvent(LISTING_EVENTS.STATUS_CHANGED, item, 'SOLD', 'req-3');
    svc.emitListingEvent(LISTING_EVENTS.DELETED, item, undefined, 'req-4');

    expect(eventEmitter.emit.mock.calls.map((c) => [c[0], c[1].actorId, c[1].userId])).toEqual([
      [LISTING_EVENTS.CREATED, 'req-1', 'owner-1'],
      [LISTING_EVENTS.UPDATED, 'req-2', 'owner-1'],
      [LISTING_EVENTS.STATUS_CHANGED, 'req-3', 'owner-1'],
      [LISTING_EVENTS.DELETED, 'req-4', 'owner-1'],
    ]);
  });

  it('BusesService emits actorId = requester for create/update/status_changed/deleted', () => {
    const eventEmitter = { emit: jest.fn() };
    const svc = Object.create(BusesService.prototype);
    svc.eventEmitter = eventEmitter;
    svc.logger = { error: jest.fn() };

    const item = { id: 'bus-1', title: 'Coaster', userId: 'owner-2' };
    svc.emitListingEvent(LISTING_EVENTS.CREATED, item, undefined, 'req-1');
    svc.emitListingEvent(LISTING_EVENTS.UPDATED, item, undefined, 'req-2');
    svc.emitListingEvent(LISTING_EVENTS.STATUS_CHANGED, item, 'ACTIVE', 'req-3');
    svc.emitListingEvent(LISTING_EVENTS.DELETED, item, undefined, 'req-4');

    expect(eventEmitter.emit.mock.calls.map((c) => [c[0], c[1].actorId, c[1].userId])).toEqual([
      [LISTING_EVENTS.CREATED, 'req-1', 'owner-2'],
      [LISTING_EVENTS.UPDATED, 'req-2', 'owner-2'],
      [LISTING_EVENTS.STATUS_CHANGED, 'req-3', 'owner-2'],
      [LISTING_EVENTS.DELETED, 'req-4', 'owner-2'],
    ]);
  });

  it('EquipmentListingsService emits actorId = requester for create/update/status_changed/deleted', () => {
    const eventEmitter = { emit: jest.fn() };
    const svc = Object.create(EquipmentListingsService.prototype);
    svc.eventEmitter = eventEmitter;
    svc.logger = { error: jest.fn() };

    const item = { id: 'eq-1', title: 'Excavator', userId: 'owner-3' };
    svc.emitListingEvent(LISTING_EVENTS.CREATED, item, undefined, 'req-1');
    svc.emitListingEvent(LISTING_EVENTS.UPDATED, item, undefined, 'req-2');
    svc.emitListingEvent(LISTING_EVENTS.STATUS_CHANGED, item, 'ACTIVE', 'req-3');
    svc.emitListingEvent(LISTING_EVENTS.DELETED, item, undefined, 'req-4');

    expect(eventEmitter.emit.mock.calls.map((c) => [c[0], c[1].actorId, c[1].userId])).toEqual([
      [LISTING_EVENTS.CREATED, 'req-1', 'owner-3'],
      [LISTING_EVENTS.UPDATED, 'req-2', 'owner-3'],
      [LISTING_EVENTS.STATUS_CHANGED, 'req-3', 'owner-3'],
      [LISTING_EVENTS.DELETED, 'req-4', 'owner-3'],
    ]);
  });

  it('PartsService emits actorId = requester for create/update/deleted', () => {
    const eventEmitter = { emit: jest.fn() };
    const svc = Object.create(PartsService.prototype);
    svc.eventEmitter = eventEmitter;
    svc.logger = { error: jest.fn() };

    const item = { id: 'part-1', title: 'Alternator', sellerId: 'owner-4' };
    svc.emitListingEvent(LISTING_EVENTS.CREATED, item, undefined, 'req-1');
    svc.emitListingEvent(LISTING_EVENTS.UPDATED, item, undefined, 'req-2');
    svc.emitListingEvent(LISTING_EVENTS.DELETED, item, undefined, 'req-3');

    expect(eventEmitter.emit.mock.calls.map((c) => [c[0], c[1].actorId, c[1].userId])).toEqual([
      [LISTING_EVENTS.CREATED, 'req-1', 'owner-4'],
      [LISTING_EVENTS.UPDATED, 'req-2', 'owner-4'],
      [LISTING_EVENTS.DELETED, 'req-3', 'owner-4'],
    ]);
  });

  it('BaseListingService (services) emits actorId = requester for create/update/deleted/status_changed', () => {
    const eventEmitter = { emit: jest.fn() };
    const svc = Object.create(BaseListingService.prototype);
    svc.eventEmitter = eventEmitter;
    svc.logger = { error: jest.fn() };
    svc.config = { entityType: ENTITY_TYPES.CAR_SERVICE };

    const item = { id: 'srv-1', title: 'Car Wash', userId: 'owner-5' };
    svc.emitEvent(LISTING_EVENTS.CREATED, item, undefined, 'req-1');
    svc.emitEvent(LISTING_EVENTS.UPDATED, item, undefined, 'req-2');
    svc.emitEvent(LISTING_EVENTS.DELETED, item, undefined, 'req-3');
    svc.emitEvent(LISTING_EVENTS.STATUS_CHANGED, item, 'ARCHIVED', 'req-4');

    expect(eventEmitter.emit.mock.calls.map((c) => [c[0], c[1].actorId, c[1].userId])).toEqual([
      [LISTING_EVENTS.CREATED, 'req-1', 'owner-5'],
      [LISTING_EVENTS.UPDATED, 'req-2', 'owner-5'],
      [LISTING_EVENTS.DELETED, 'req-3', 'owner-5'],
      [LISTING_EVENTS.STATUS_CHANGED, 'req-4', 'owner-5'],
    ]);
  });
});
