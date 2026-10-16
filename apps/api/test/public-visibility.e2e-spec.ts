import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getApp,
  getPrisma,
  registerUser,
  registerAdmin,
  getTestBrandAndModel,
} from './setup';
import { ENTITY_TYPES } from '../src/common/constants/entity-types.constants';

describe('Public Visibility Lifecycle & Detail Gating (e2e)', () => {
  beforeAll(async () => {
    await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  const waitFor = async <T>(
    predicate: () => Promise<T> | T,
    options: { timeoutMs?: number; intervalMs?: number; description?: string } = {},
  ): Promise<T> => {
    const timeoutMs = options.timeoutMs ?? 7000;
    const intervalMs = options.intervalMs ?? 50;
    const description = options.description ?? 'condition to be met';
    const startTime = Date.now();

    while (true) {
      try {
        const result = await predicate();
        if (result) {
          return result;
        }
      } catch {
        // Retry until timeout
      }

      if (Date.now() - startTime >= timeoutMs) {
        throw new Error(`Timed out after ${timeoutMs}ms waiting for: ${description}`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  };

  describe('Cars Detail Visibility & ViewCount Gating by Status', () => {
    it('should allow public access to ACTIVE, SOLD, and RENTED cars while returning 404 for DRAFT and ARCHIVED to non-owners', async () => {
      const prisma = getPrisma();
      const server = getApp().getHttpServer();

      const seller = await registerUser({
        email: 'pv_seller_1@example.test',
        username: 'pvseller1',
      });
      const buyer = await registerUser({
        email: 'pv_buyer_1@example.test',
        username: 'pvbuyer1',
      });
      const admin = await registerAdmin({
        email: 'pv_admin_1@example.test',
        username: 'pvadmin1',
      });

      const { brandId, carModelId } = await getTestBrandAndModel();

      // Create cars with different statuses
      const carActive = await prisma.listing.create({
        data: {
          title: 'Car Active Test',
          slug: `car-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 9000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId: seller.user.id,
          brandId,
          carModelId,
          viewCount: 0,
        },
      });

      const carSold = await prisma.listing.create({
        data: {
          title: 'Car Sold Test',
          slug: `car-sold-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2021,
          price: 8000,
          status: 'SOLD',
          hiddenByOwnerStatus: false,
          sellerId: seller.user.id,
          brandId,
          carModelId,
          viewCount: 0,
        },
      });

      const carRented = await prisma.listing.create({
        data: {
          title: 'Car Rented Test',
          slug: `car-rented-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: 7000,
          status: 'RENTED',
          hiddenByOwnerStatus: false,
          sellerId: seller.user.id,
          brandId,
          carModelId,
          viewCount: 0,
        },
      });

      const carDraft = await prisma.listing.create({
        data: {
          title: 'Car Draft Test',
          slug: `car-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2019,
          price: 6000,
          status: 'DRAFT',
          hiddenByOwnerStatus: false,
          sellerId: seller.user.id,
          brandId,
          carModelId,
          viewCount: 0,
        },
      });

      const carArchived = await prisma.listing.create({
        data: {
          title: 'Car Archived Test',
          slug: `car-archived-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2018,
          price: 5000,
          status: 'ARCHIVED',
          hiddenByOwnerStatus: false,
          sellerId: seller.user.id,
          brandId,
          carModelId,
          viewCount: 0,
        },
      });

      // 1. Anonymous visitor checks
      // ACTIVE -> 200
      const resActive = await request(server).get(`/api/listings/${carActive.id}`).expect(200);
      expect(resActive.body.id).toBe(carActive.id);

      // SOLD -> 200 (mandatory requirement)
      const resSold = await request(server).get(`/api/listings/${carSold.id}`).expect(200);
      expect(resSold.body.id).toBe(carSold.id);

      // RENTED -> 200
      const resRented = await request(server).get(`/api/listings/${carRented.id}`).expect(200);
      expect(resRented.body.id).toBe(carRented.id);

      // DRAFT -> 404 (mandatory requirement)
      await request(server).get(`/api/listings/${carDraft.id}`).expect(404);

      // ARCHIVED -> 404 (mandatory requirement)
      await request(server).get(`/api/listings/${carArchived.id}`).expect(404);

      // Verify viewCount: incremented for ACTIVE, SOLD, RENTED, but NOT for DRAFT and ARCHIVED
      const dbCarActive = await prisma.listing.findUnique({ where: { id: carActive.id } });
      expect(dbCarActive?.viewCount).toBe(1);

      const dbCarSold = await prisma.listing.findUnique({ where: { id: carSold.id } });
      expect(dbCarSold?.viewCount).toBe(1);

      const dbCarDraft = await prisma.listing.findUnique({ where: { id: carDraft.id } });
      expect(dbCarDraft?.viewCount).toBe(0);

      const dbCarArchived = await prisma.listing.findUnique({ where: { id: carArchived.id } });
      expect(dbCarArchived?.viewCount).toBe(0);

      // 2. Non-owner authenticated user (Buyer)
      await request(server)
        .get(`/api/listings/${carDraft.id}`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .expect(404);

      await request(server)
        .get(`/api/listings/${carArchived.id}`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .expect(404);

      // 3. Owner authenticated user (Seller)
      const ownerDraft = await request(server)
        .get(`/api/listings/${carDraft.id}`)
        .set('Authorization', `Bearer ${seller.accessToken}`)
        .expect(200);
      expect(ownerDraft.body.id).toBe(carDraft.id);

      const ownerArchived = await request(server)
        .get(`/api/listings/${carArchived.id}`)
        .set('Authorization', `Bearer ${seller.accessToken}`)
        .expect(200);
      expect(ownerArchived.body.id).toBe(carArchived.id);

      // 4. Admin authenticated user
      const adminDraft = await request(server)
        .get(`/api/listings/${carDraft.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);
      expect(adminDraft.body.id).toBe(carDraft.id);

      const adminArchived = await request(server)
        .get(`/api/listings/${carArchived.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);
      expect(adminArchived.body.id).toBe(carArchived.id);
    });
  });

  describe('Non-ListingStatus Models & Legacy Leak Closure', () => {
    it('should respect soft-deletion on buses, and allow ACTIVE, CLOSED, EXPIRED on driverJob', async () => {
      const prisma = getPrisma();
      const server = getApp().getHttpServer();

      const user = await registerUser({
        email: 'pv_other_1@example.test',
        username: 'pvother1',
      });
      const userId = user.user.id;

      // 1. Bus: deletedAt != null returns 404
      const activeBus = await prisma.busListing.create({
        data: {
          title: 'Active Bus',
          slug: `bus-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Bus Desc',
          make: 'Toyota',
          model: 'Coaster',
          busType: 'COASTER',
          busListingType: 'BUS_SALE',
          capacity: 30,
          year: 2020,
          price: 15000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          deletedAt: null,
          userId,
        },
      });

      const deletedBus = await prisma.busListing.create({
        data: {
          title: 'Deleted Bus',
          slug: `bus-deleted-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Bus Desc',
          make: 'Toyota',
          model: 'Coaster',
          busType: 'COASTER',
          busListingType: 'BUS_SALE',
          capacity: 50,
          year: 2021,
          price: 25000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          deletedAt: new Date(),
          userId,
        },
      });

      await request(server).get(`/api/buses/${activeBus.id}`).expect(200);
      await request(server).get(`/api/buses/${deletedBus.id}`).expect(404);

      // 2. DriverJob: ACTIVE, CLOSED, EXPIRED remain publicly viewable unless hiddenByOwnerStatus: true
      const jobActive = await prisma.driverJob.create({
        data: {
          title: 'Active Job',
          slug: `job-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Job Desc',
          jobType: 'HIRING',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId,
        },
      });

      const jobClosed = await prisma.driverJob.create({
        data: {
          title: 'Closed Job',
          slug: `job-closed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Job Desc',
          jobType: 'HIRING',
          employmentType: 'FULL_TIME',
          status: 'CLOSED',
          hiddenByOwnerStatus: false,
          userId,
        },
      });

      const jobExpired = await prisma.driverJob.create({
        data: {
          title: 'Expired Job',
          slug: `job-expired-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Job Desc',
          jobType: 'HIRING',
          employmentType: 'FULL_TIME',
          status: 'EXPIRED',
          hiddenByOwnerStatus: false,
          userId,
        },
      });

      await request(server).get(`/api/jobs/${jobActive.id}`).expect(200);
      await request(server).get(`/api/jobs/${jobClosed.id}`).expect(200);
      await request(server).get(`/api/jobs/${jobExpired.id}`).expect(200);

      // 3. CarrierProfile: isAvailable: false is NOT hidden
      const carrier = await prisma.carrierProfile.create({
        data: {
          userId,
          companyName: 'Express Carrier',
          serviceTypes: ['GOODS', 'FURNITURE'],
          vehicleTypes: ['PICKUP'],
          isAvailable: false,
          hiddenByOwnerStatus: false,
        },
      });
      await request(server).get(`/api/transport/carriers/${carrier.id}`).expect(200);

      // 4. TransportRequest: status != OPEN is NOT hidden
      const transportReq = await prisma.transportRequest.create({
        data: {
          userId,
          serviceType: 'FURNITURE',
          cargoDescription: 'Moving Office Furniture',
          fromAddress: 'Muscat',
          toAddress: 'Sohar',
          status: 'IN_PROGRESS',
          hiddenByOwnerStatus: false,
        },
      });
      await request(server).get(`/api/transport/requests/${transportReq.id}`).expect(200);
    });
  });

  describe('User Ban Lifecycle & Cross-Vertical Visibility Gating', () => {
    it('should hide entities across lists, details, profile stats, favorites, and reject new chats when owner is banned, and restore on unban', async () => {
      const prisma = getPrisma();
      const server = getApp().getHttpServer();

      const admin = await registerAdmin({
        email: 'pv_ban_admin@example.test',
        username: 'pvbanadmin',
      });
      const target = await registerUser({
        email: 'pv_ban_target@example.test',
        username: 'pvbantarget',
      });
      const targetId = target.user.id;

      const observer = await registerUser({
        email: 'pv_ban_observer@example.test',
        username: 'pvbanobserver',
      });

      const { brandId, carModelId } = await getTestBrandAndModel();

      // Seed car
      const car = await prisma.listing.create({
        data: {
          title: 'Target Car For Ban Test',
          slug: `car-bantest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Corolla',
          year: 2021,
          price: 5500,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId: targetId,
          brandId,
          carModelId,
        },
      });

      // Observer favorites target's car
      await request(server)
        .post(`/api/favorites/LISTING/${car.id}`)
        .set('Authorization', `Bearer ${observer.accessToken}`)
        .expect(201);

      // Verify car is in observer favorites initially
      const initFavs = await request(server)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${observer.accessToken}`)
        .expect(200);
      expect(initFavs.body.items.some((i: any) => i.entityId === car.id)).toBe(true);

      // Verify car in public listing list initially
      const initListings = await request(server).get('/api/listings').expect(200);
      expect(initListings.body.items.some((i: any) => i.id === car.id)).toBe(true);

      // Verify target's public profile shows totalListings >= 1
      const initProfile = await request(server).get(`/api/users/${targetId}`).expect(200);
      expect(initProfile.body.totalListings).toBeGreaterThanOrEqual(1);

      // STEP 1: Admin bans target user
      await request(server)
        .post(`/api/admin/users/${targetId}/ban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Suspicious activities' })
        .expect(200);

      // Wait until async event completes and car is marked hidden
      await waitFor(
        async () => {
          const updatedCar = await prisma.listing.findUnique({ where: { id: car.id } });
          return updatedCar?.hiddenByOwnerStatus === true;
        },
        { timeoutMs: 6000, description: 'car hiddenByOwnerStatus === true after ban' },
      );

      // 1. Car must be excluded from public listings list
      const bannedListings = await request(server).get('/api/listings').expect(200);
      expect(bannedListings.body.items.some((i: any) => i.id === car.id)).toBe(false);

      // 2. Car detail returns 404 to visitor and observer
      await request(server).get(`/api/listings/${car.id}`).expect(404);
      await request(server)
        .get(`/api/listings/${car.id}`)
        .set('Authorization', `Bearer ${observer.accessToken}`)
        .expect(404);

      // 3. Admin can view detail of hidden listing
      await request(server)
        .get(`/api/listings/${car.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      // 4. Public profile totalListings is 0
      const bannedProfile = await request(server).get(`/api/users/${targetId}`).expect(200);
      expect(bannedProfile.body.totalListings).toBe(0);

      // 5. Observer's favorites does NOT include the hidden car
      const bannedFavs = await request(server)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${observer.accessToken}`)
        .expect(200);
      expect(bannedFavs.body.items.some((i: any) => i.entityId === car.id)).toBe(false);

      // 6. Creating a new chat on target's car fails (rejected because entity hidden & owner banned)
      await request(server)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${observer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: car.id })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });

      // STEP 2: Admin unbans target user
      await request(server)
        .post(`/api/admin/users/${targetId}/unban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Appeal accepted' })
        .expect(200);

      // Wait until async event completes and car is restored
      await waitFor(
        async () => {
          const restoredCar = await prisma.listing.findUnique({ where: { id: car.id } });
          return restoredCar?.hiddenByOwnerStatus === false;
        },
        { timeoutMs: 6000, description: 'car hiddenByOwnerStatus === false after unban' },
      );

      // 1. Car appears in public listings list again
      const restoredListings = await request(server).get('/api/listings').expect(200);
      expect(restoredListings.body.items.some((i: any) => i.id === car.id)).toBe(true);

      // 2. Car detail returns 200 to visitor again
      await request(server).get(`/api/listings/${car.id}`).expect(200);

      // 3. Observer favorites contains car again
      const restoredFavs = await request(server)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${observer.accessToken}`)
        .expect(200);
      expect(restoredFavs.body.items.some((i: any) => i.entityId === car.id)).toBe(true);
    });
  });
});
