import request from 'supertest';
import { createTestApp, closeTestApp, getApp } from './setup';
import { SearchService } from '../src/search/search.service';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('Search API (e2e)', () => {
  describe('GET /api/search', () => {
    it('should fallback to postgresql when meilisearch throws error', async () => {
      const searchService = getApp().get(SearchService);
      
      // Provide a dummy object if null, so spyOn works
      if (!(searchService as any).meili) {
        (searchService as any).meili = {};
      }
      (searchService as any).meili.multiSearch = jest.fn();
      jest.spyOn((searchService as any).meili, 'multiSearch').mockRejectedValue(new Error('Meilisearch down'));

      const res = await request(getApp().getHttpServer())
        .get('/api/search?q=test')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBeTruthy();
      expect(res.body.meta).toBeDefined();
    });

    it('should fallback to postgresql for single index search when meilisearch throws error', async () => {
      const searchService = getApp().get(SearchService);
      
      if (!(searchService as any).meili) {
        (searchService as any).meili = {};
      }
      (searchService as any).meili.index = jest.fn();
      jest.spyOn((searchService as any).meili, 'index').mockReturnValue({
        search: jest.fn().mockRejectedValue(new Error('Meilisearch down')),
      } as any);

      const res = await request(getApp().getHttpServer())
        .get('/api/search?q=test&entityType=listings')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBeTruthy();
      expect(res.body.meta).toBeDefined();
    });
  });
});
