import { BusesController } from '../buses/buses.controller';
import { EquipmentController } from '../equipment/equipment.controller';
import { PartsController } from '../parts/parts.controller';
import { ServicesController } from '../services/services.controller';
import { JobsController } from '../jobs/jobs.controller';
import { TransportController } from '../transport/transport.controller';
import { UploadsController } from '../uploads/uploads.controller';
import { ChatController } from '../chat/chat.controller';
import { ReviewsController } from '../reviews/reviews.controller';
import { CarsController } from '../cars/cars.controller';
import { SearchController } from '../search/search.controller';
import { ListingsController } from '../listings/listings.controller';

function getThrottleLimit(target: any, propertyKey: string): number | undefined {
  return Reflect.getMetadata('THROTTLER:LIMITdefault', target.prototype[propertyKey]);
}

function getThrottleTtl(target: any, propertyKey: string): number | undefined {
  return Reflect.getMetadata('THROTTLER:TTLdefault', target.prototype[propertyKey]);
}

describe('Rate Limit Part 2 — Metadata Verification', () => {
  describe('Verticals Mutation Routes (10 requests / 60 seconds)', () => {
    it('BusesController mutation routes have limit: 10, ttl: 60000', () => {
      const endpoints = ['create', 'update', 'remove', 'addImages', 'removeImage'];
      for (const endpoint of endpoints) {
        expect(getThrottleLimit(BusesController, endpoint)).toBe(10);
        expect(getThrottleTtl(BusesController, endpoint)).toBe(60000);
      }
    });

    it('EquipmentController mutation routes have limit: 10, ttl: 60000', () => {
      const endpoints = ['create', 'update', 'remove', 'addImages', 'removeImage'];
      for (const endpoint of endpoints) {
        expect(getThrottleLimit(EquipmentController, endpoint)).toBe(10);
        expect(getThrottleTtl(EquipmentController, endpoint)).toBe(60000);
      }
    });

    it('PartsController mutation routes have limit: 10, ttl: 60000', () => {
      const endpoints = ['create', 'update', 'remove'];
      for (const endpoint of endpoints) {
        expect(getThrottleLimit(PartsController, endpoint)).toBe(10);
        expect(getThrottleTtl(PartsController, endpoint)).toBe(60000);
      }
    });

    it('ServicesController mutation routes have limit: 10, ttl: 60000', () => {
      const endpoints = ['create', 'toggleStatus', 'update', 'remove'];
      for (const endpoint of endpoints) {
        expect(getThrottleLimit(ServicesController, endpoint)).toBe(10);
        expect(getThrottleTtl(ServicesController, endpoint)).toBe(60000);
      }
    });

    it('JobsController mutation routes have limit: 10, ttl: 60000', () => {
      const endpoints = [
        'create',
        'createDriverProfile',
        'updateDriverProfile',
        'createEmployerProfile',
        'updateEmployerProfile',
        'submitVerification',
        'update',
        'remove',
        'apply',
      ];
      for (const endpoint of endpoints) {
        expect(getThrottleLimit(JobsController, endpoint)).toBe(10);
        expect(getThrottleTtl(JobsController, endpoint)).toBe(60000);
      }
    });

    it('TransportController mutation routes have limit: 10, ttl: 60000', () => {
      const endpoints = [
        'createCarrierProfile',
        'updateCarrierProfile',
        'createRequest',
        'updateRequest',
        'repostRequest',
        'submitQuote',
        'createReview',
      ];
      for (const endpoint of endpoints) {
        expect(getThrottleLimit(TransportController, endpoint)).toBe(10);
        expect(getThrottleTtl(TransportController, endpoint)).toBe(60000);
      }
    });
  });

  describe('UploadsController Rate Limits', () => {
    it('uploadMultiple has limit: 10, ttl: 60000', () => {
      expect(getThrottleLimit(UploadsController, 'uploadMultiple')).toBe(10);
      expect(getThrottleTtl(UploadsController, 'uploadMultiple')).toBe(60000);
    });

    it('uploadFile remains at limit: 30, ttl: 60000', () => {
      expect(getThrottleLimit(UploadsController, 'uploadFile')).toBe(30);
      expect(getThrottleTtl(UploadsController, 'uploadFile')).toBe(60000);
    });

    it('individual image link, delete, and reorder routes have limit: 30, ttl: 60000', () => {
      const routes30 = [
        'addImage',
        'addImageByUrl',
        'removeImage',
        'reorderImages',
        'addPartImage',
        'removePartImage',
        'addServiceImage',
        'removeServiceImage',
        'addBusImage',
        'addEquipmentImage',
      ];
      for (const endpoint of routes30) {
        expect(getThrottleLimit(UploadsController, endpoint)).toBe(30);
        expect(getThrottleTtl(UploadsController, endpoint)).toBe(60000);
      }
    });
  });

  describe('ChatController HTTP Limits', () => {
    it('createConversation has limit: 10, ttl: 60000', () => {
      expect(getThrottleLimit(ChatController, 'createConversation')).toBe(10);
      expect(getThrottleTtl(ChatController, 'createConversation')).toBe(60000);
    });

    it('sendMessage has limit: 30, ttl: 60000', () => {
      expect(getThrottleLimit(ChatController, 'sendMessage')).toBe(30);
      expect(getThrottleTtl(ChatController, 'sendMessage')).toBe(60000);
    });
  });

  describe('ReviewsController Limits', () => {
    it('create and reply have limit: 5, ttl: 60000', () => {
      expect(getThrottleLimit(ReviewsController, 'create')).toBe(5);
      expect(getThrottleTtl(ReviewsController, 'create')).toBe(60000);
      expect(getThrottleLimit(ReviewsController, 'reply')).toBe(5);
      expect(getThrottleTtl(ReviewsController, 'reply')).toBe(60000);
    });
  });

  describe('GET Routes Intentional Exclusions (No custom @Throttle)', () => {
    it('GET /cars/full has no custom @Throttle', () => {
      expect(getThrottleLimit(CarsController, 'getFullTree')).toBeUndefined();
    });

    it('GET /search has no custom @Throttle', () => {
      expect(getThrottleLimit(SearchController, 'search')).toBeUndefined();
    });

    it('GET /listings has no custom @Throttle', () => {
      expect(getThrottleLimit(ListingsController, 'findAll')).toBeUndefined();
    });

    it('Verticals GET routes have no custom @Throttle', () => {
      expect(getThrottleLimit(BusesController, 'findAll')).toBeUndefined();
      expect(getThrottleLimit(BusesController, 'findOne')).toBeUndefined();
      expect(getThrottleLimit(EquipmentController, 'findAll')).toBeUndefined();
      expect(getThrottleLimit(EquipmentController, 'findOne')).toBeUndefined();
      expect(getThrottleLimit(PartsController, 'findAll')).toBeUndefined();
      expect(getThrottleLimit(PartsController, 'findOne')).toBeUndefined();
      expect(getThrottleLimit(ServicesController, 'findAll')).toBeUndefined();
      expect(getThrottleLimit(ServicesController, 'findOne')).toBeUndefined();
      expect(getThrottleLimit(JobsController, 'findAll')).toBeUndefined();
      expect(getThrottleLimit(JobsController, 'findOne')).toBeUndefined();
      expect(getThrottleLimit(TransportController, 'findAllRequests')).toBeUndefined();
      expect(getThrottleLimit(TransportController, 'findOneRequest')).toBeUndefined();
      expect(getThrottleLimit(UploadsController, 'getImages')).toBeUndefined();
      expect(getThrottleLimit(ChatController, 'getConversations')).toBeUndefined();
      expect(getThrottleLimit(ChatController, 'getMessages')).toBeUndefined();
      expect(getThrottleLimit(ReviewsController, 'findAll')).toBeUndefined();
    });
  });
});
