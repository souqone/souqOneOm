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
import { RedisService } from '../src/redis/redis.service';

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

  describe('Contact Endpoint & Remaining Verticals Visibility Gating', () => {
    it('should block contact reveals and detail views for banned seller across all 11 verticals without consuming quota, and restore on unban', async () => {
      const prisma = getPrisma();
      const server = getApp().getHttpServer();
      const redis = getApp().get(RedisService);

      const admin = await registerAdmin({
        email: 'pv_contact_admin@example.test',
        username: 'pvcontactadmin',
      });
      const seller = await registerUser({
        email: 'pv_contact_seller@example.test',
        username: 'pvcontactseller',
      });
      const sellerId = seller.user.id;

      const buyer = await registerUser({
        email: 'pv_contact_buyer@example.test',
        username: 'pvcontactbuyer',
      });

      const { brandId, carModelId } = await getTestBrandAndModel();

      // Seed all 11 entities for seller
      const car = await prisma.listing.create({
        data: {
          title: 'Contact Car',
          slug: `car-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Corolla',
          year: 2021,
          price: 5000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId,
          brandId,
          carModelId,
          whatsappEnabled: true,
        },
      });

      const bus = await prisma.busListing.create({
        data: {
          title: 'Contact Bus',
          slug: `bus-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Coaster',
          busType: 'COASTER',
          busListingType: 'BUS_SALE',
          capacity: 30,
          year: 2021,
          price: 20000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: sellerId,
          whatsappEnabled: true,
        },
      });

      const eq = await prisma.equipmentListing.create({
        data: {
          title: 'Contact Equipment',
          slug: `eq-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          equipmentType: 'EXCAVATOR',
          listingType: 'EQUIPMENT_SALE',
          make: 'CAT',
          model: '320D',
          year: 2020,
          price: 25000,
          currency: 'OMR',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: sellerId,
          whatsappEnabled: true,
        },
      });

      const op = await prisma.operatorListing.create({
        data: {
          title: 'Contact Operator',
          slug: `op-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          operatorType: 'OPERATOR',
          specializations: [],
          equipmentTypes: [],
          certifications: [],
          governorateId: 1,
          wilayaId: 1,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: sellerId,
          whatsappEnabled: true,
        },
      });

      const part = await prisma.sparePart.create({
        data: {
          title: 'Contact Part',
          slug: `part-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          partCategory: 'BRAKES',
          compatibleMakes: [],
          compatibleModels: [],
          price: 30,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId,
          whatsappEnabled: true,
        },
      });

      const svc = await prisma.carService.create({
        data: {
          title: 'Contact Service',
          slug: `svc-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          serviceType: 'MAINTENANCE',
          providerType: 'WORKSHOP',
          providerName: 'Auto Workshop',
          specializations: [],
          workingDays: [],
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: sellerId,
          whatsappEnabled: true,
        },
      });

      const job = await prisma.driverJob.create({
        data: {
          title: 'Contact Job',
          slug: `job-contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          jobType: 'HIRING',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: sellerId,
          whatsappEnabled: true,
        },
      });

      const dp = await prisma.driverProfile.create({
        data: {
          userId: sellerId,
          isAvailable: true,
          hiddenByOwnerStatus: false,
          whatsappEnabled: true,
        },
      });

      const ep = await prisma.employerProfile.create({
        data: {
          userId: sellerId,
          companyName: 'Contact Company',
          industry: 'Logistics',
          hiddenByOwnerStatus: false,
          whatsappEnabled: true,
        },
      });

      const cp = await prisma.carrierProfile.create({
        data: {
          userId: sellerId,
          companyName: 'Contact Carrier',
          serviceTypes: ['GOODS'],
          vehicleTypes: ['PICKUP'],
          isAvailable: true,
          hiddenByOwnerStatus: false,
          whatsappEnabled: true,
        },
      });

      const tr = await prisma.transportRequest.create({
        data: {
          userId: sellerId,
          serviceType: 'FURNITURE',
          cargoDescription: 'Moving Office Furniture',
          fromAddress: 'Muscat',
          toAddress: 'Sohar',
          status: 'OPEN',
          hiddenByOwnerStatus: false,
        },
      });

      // Verification before ban: all detail and contact endpoints return 200
      await request(server).get(`/api/equipment/${eq.id}`).expect(200);
      await request(server).get(`/api/operators/${op.id}`).expect(200);
      await request(server).get(`/api/parts/${part.id}`).expect(200);
      await request(server).get(`/api/services/${svc.id}`).expect(200);
      await request(server).get(`/api/jobs/drivers/${dp.id}`).expect(200);
      await request(server).get(`/api/jobs/employers/${ep.id}`).expect(200);

      // Contact reveal works initially
      const contactInitial = await request(server)
        .get(`/api/contact/LISTING/${car.id}`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .expect(200);
      expect(contactInitial.body.phone).toBeDefined();

      const today = new Date().toISOString().split('T')[0];
      const countKey = `contact-cap:${buyer.user.id}:${today}:count`;
      const initialCount = await redis.get<number>(countKey);
      expect(Number(initialCount)).toBe(1);

      // STEP 1: Admin bans seller
      await request(server)
        .post(`/api/admin/users/${sellerId}/ban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Security policy violation' })
        .expect(200);

      await waitFor(
        async () => {
          const [updatedCar, updatedTr] = await Promise.all([
            prisma.listing.findUnique({ where: { id: car.id }, select: { hiddenByOwnerStatus: true } }),
            prisma.transportRequest.findUnique({ where: { id: tr.id }, select: { hiddenByOwnerStatus: true } }),
          ]);
          return updatedCar?.hiddenByOwnerStatus === true && updatedTr?.hiddenByOwnerStatus === true;
        },
        { timeoutMs: 6000, description: 'seller items hiddenByOwnerStatus === true after ban' },
      );

      // Detail endpoints for the remaining verticals must all return 404
      await request(server).get(`/api/equipment/${eq.id}`).expect(404);
      await request(server).get(`/api/operators/${op.id}`).expect(404);
      await request(server).get(`/api/parts/${part.id}`).expect(404);
      await request(server).get(`/api/services/${svc.id}`).expect(404);
      await request(server).get(`/api/jobs/drivers/${dp.id}`).expect(404);
      await request(server).get(`/api/jobs/employers/${ep.id}`).expect(404);

      // Contact endpoints for all 11 verticals must all return 404
      const targets = [
        ['LISTING', car.id],
        ['BUS_LISTING', bus.id],
        ['EQUIPMENT_LISTING', eq.id],
        ['OPERATOR_LISTING', op.id],
        ['SPARE_PART', part.id],
        ['CAR_SERVICE', svc.id],
        ['DRIVER_JOB', job.id],
        ['DRIVER_PROFILE', dp.id],
        ['EMPLOYER_PROFILE', ep.id],
        ['CARRIER_PROFILE', cp.id],
        ['TRANSPORT_REQUEST', tr.id],
      ];

      for (const [entityType, entityId] of targets) {
        await request(server)
          .get(`/api/contact/${entityType}/${entityId}`)
          .set('Authorization', `Bearer ${buyer.accessToken}`)
          .expect(404);
      }

      // CRITICAL: Daily reveal quota was NOT consumed by the 11 failed attempts on banned seller
      const postBanCount = await redis.get<number>(countKey);
      expect(Number(postBanCount)).toBe(Number(initialCount));

      // STEP 2: Admin unbans seller
      await request(server)
        .post(`/api/admin/users/${sellerId}/unban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Reinstated' })
        .expect(200);

      await waitFor(
        async () => {
          const [restoredCar, restoredTr] = await Promise.all([
            prisma.listing.findUnique({ where: { id: car.id }, select: { hiddenByOwnerStatus: true } }),
            prisma.transportRequest.findUnique({ where: { id: tr.id }, select: { hiddenByOwnerStatus: true } }),
          ]);
          return restoredCar?.hiddenByOwnerStatus === false && restoredTr?.hiddenByOwnerStatus === false;
        },
        { timeoutMs: 6000, description: 'seller items restored after unban' },
      );

      // Detail endpoints restored
      await request(server).get(`/api/equipment/${eq.id}`).expect(200);
      await request(server).get(`/api/operators/${op.id}`).expect(200);
      await request(server).get(`/api/parts/${part.id}`).expect(200);
      await request(server).get(`/api/services/${svc.id}`).expect(200);
      await request(server).get(`/api/jobs/drivers/${dp.id}`).expect(200);
      await request(server).get(`/api/jobs/employers/${ep.id}`).expect(200);

      // Contact endpoints restored (e.g. equipment)
      const resRestored = await request(server)
        .get(`/api/contact/EQUIPMENT_LISTING/${eq.id}`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .expect(200);
      expect(resRestored.body.phone).toBeDefined();

      const finalCount = await redis.get<number>(countKey);
      expect(Number(finalCount)).toBe(Number(initialCount) + 1);
    });
  });
});
