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
import { OwnerContentVisibilityService } from '../src/common/services/owner-content-visibility.service';
import { VisibilityReconciliationCron } from '../src/common/crons/visibility-reconciliation.cron';
import { SellerContactGate } from '../src/common/services/seller-contact-gate.service';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ENTITY_TYPES } from '../src/common/constants/entity-types.constants';

describe('Owner Content Visibility & Lifecycle Integration (e2e)', () => {
  let visibilityService: OwnerContentVisibilityService;
  let reconciliationCron: VisibilityReconciliationCron;
  let sellerContactGate: SellerContactGate;

  beforeAll(async () => {
    await createTestApp();
    visibilityService = getApp().get(OwnerContentVisibilityService);
    reconciliationCron = getApp().get(VisibilityReconciliationCron);
    sellerContactGate = getApp().get(SellerContactGate);
  });

  afterAll(async () => {
    await closeTestApp();
  });
  const waitFor = async <T>(
    predicate: () => Promise<T> | T,
    options: { timeoutMs?: number; intervalMs?: number; description?: string } = {},
  ): Promise<T> => {
    const timeoutMs = options.timeoutMs ?? 5000;
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

  describe('User Ban and Unban Lifecycle Event Trigger', () => {
    it('should hide all owner content across verticals on ban and restore on unban', async () => {
      const prisma = getPrisma();
      const admin = await registerAdmin({
        email: 'vis_admin_1@example.test',
        username: 'visadmin1',
      });
      const target = await registerUser({
        email: 'vis_target_1@example.test',
        username: 'vistarget1',
      });
      const targetId = target.user.id;

      const { brandId, carModelId } = await getTestBrandAndModel();

      // Seed 3 car listings with different original statuses
      const carActive = await prisma.listing.create({
        data: {
          title: 'Car Active',
          slug: `car-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Car Active Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 9000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId: targetId,
          brandId,
          carModelId,
        },
      });

      const carSold = await prisma.listing.create({
        data: {
          title: 'Car Sold',
          slug: `car-sold-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Car Sold Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2021,
          price: 8000,
          status: 'SOLD',
          hiddenByOwnerStatus: false,
          sellerId: targetId,
          brandId,
          carModelId,
        },
      });

      const carArchived = await prisma.listing.create({
        data: {
          title: 'Car Archived',
          slug: `car-archived-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Car Archived Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: 7000,
          status: 'ARCHIVED',
          hiddenByOwnerStatus: false,
          sellerId: targetId,
          brandId,
          carModelId,
        },
      });

      // Seed BusListing (Search indexed)
      const busActive = await prisma.busListing.create({
        data: {
          title: 'Bus Active',
          slug: `bus-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Bus Active Desc',
          make: 'Toyota',
          model: 'Coaster',
          year: 2021,
          capacity: 30,
          busListingType: 'BUS_SALE',
          busType: 'COASTER',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: targetId,
        },
      });

      // Seed DriverJob (Search indexed)
      const jobActive = await prisma.driverJob.create({
        data: {
          title: 'Driver Job Active',
          slug: `job-active-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Driver Job Active Desc',
          jobType: 'HIRING',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          userId: targetId,
        },
      });

      // Seed DriverProfile (Search non-indexed)
      const driverProfile = await prisma.driverProfile.create({
        data: {
          userId: targetId,
          isAvailable: true,
          hiddenByOwnerStatus: false,
        },
      });

      // Step 1: Admin bans target user
      await request(getApp().getHttpServer())
        .post(`/api/admin/users/${targetId}/ban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Terms of service violation' })
        .expect(200);

      // Wait until async event listener completes and entities are hidden
      await waitFor(
        async () => {
          const profile = await prisma.driverProfile.findUnique({ where: { id: driverProfile.id } });
          return profile?.hiddenByOwnerStatus === true;
        },
        { timeoutMs: 5000, intervalMs: 50, description: 'driverProfile hiddenByOwnerStatus === true after ban' },
      );

      // Verify all entities in DB have hiddenByOwnerStatus: true
      const bCars = await prisma.listing.findMany({ where: { sellerId: targetId } });
      expect(bCars).toHaveLength(3);
      for (const car of bCars) {
        expect(car.hiddenByOwnerStatus).toBe(true);
      }
      // Verify original status preserved
      expect(bCars.find((c) => c.id === carActive.id)?.status).toBe('ACTIVE');
      expect(bCars.find((c) => c.id === carSold.id)?.status).toBe('SOLD');
      expect(bCars.find((c) => c.id === carArchived.id)?.status).toBe('ARCHIVED');

      const bBus = await prisma.busListing.findUnique({ where: { id: busActive.id } });
      expect(bBus?.hiddenByOwnerStatus).toBe(true);
      expect(bBus?.status).toBe('ACTIVE');

      const bJob = await prisma.driverJob.findUnique({ where: { id: jobActive.id } });
      expect(bJob?.hiddenByOwnerStatus).toBe(true);
      expect(bJob?.status).toBe('ACTIVE');

      const bProfile = await prisma.driverProfile.findUnique({ where: { id: driverProfile.id } });
      expect(bProfile?.hiddenByOwnerStatus).toBe(true);

      // Verify Outbox Events: DELETE for search-indexed entities, none for DriverProfile
      const deleteOutbox = await prisma.outboxEvent.findMany({
        where: {
          entityId: {
            in: [carActive.id, carSold.id, carArchived.id, busActive.id, jobActive.id, driverProfile.id],
          },
        },
      });

      const carOutbox = deleteOutbox.filter((e) => e.entityType === ENTITY_TYPES.LISTING);
      expect(carOutbox).toHaveLength(3);
      expect(carOutbox.every((e) => e.action === 'DELETE')).toBe(true);

      const busOutbox = deleteOutbox.filter((e) => e.entityType === ENTITY_TYPES.BUS_LISTING);
      expect(busOutbox).toHaveLength(1);
      expect(busOutbox[0].action === 'DELETE').toBe(true);

      const jobOutbox = deleteOutbox.filter((e) => e.entityType === ENTITY_TYPES.JOB);
      expect(jobOutbox).toHaveLength(1);
      expect(jobOutbox[0].action === 'DELETE').toBe(true);

      const profileOutbox = deleteOutbox.filter((e) => e.entityId === driverProfile.id);
      expect(profileOutbox).toHaveLength(0);

      // Step 2: Admin unbans target user
      await request(getApp().getHttpServer())
        .post(`/api/admin/users/${targetId}/unban`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Reinstated upon review' })
        .expect(200);

      // Wait until async event listener completes and entities are restored
      await waitFor(
        async () => {
          const profile = await prisma.driverProfile.findUnique({ where: { id: driverProfile.id } });
          return profile?.hiddenByOwnerStatus === false;
        },
        { timeoutMs: 5000, intervalMs: 50, description: 'driverProfile hiddenByOwnerStatus === false after unban' },
      );

      // Verify all entities in DB restored to hiddenByOwnerStatus: false
      const rCars = await prisma.listing.findMany({ where: { sellerId: targetId } });
      for (const car of rCars) {
        expect(car.hiddenByOwnerStatus).toBe(false);
      }
      expect(rCars.find((c) => c.id === carActive.id)?.status).toBe('ACTIVE');
      expect(rCars.find((c) => c.id === carSold.id)?.status).toBe('SOLD');
      expect(rCars.find((c) => c.id === carArchived.id)?.status).toBe('ARCHIVED');

      const rBus = await prisma.busListing.findUnique({ where: { id: busActive.id } });
      expect(rBus?.hiddenByOwnerStatus).toBe(false);
      expect(rBus?.status).toBe('ACTIVE');

      const rJob = await prisma.driverJob.findUnique({ where: { id: jobActive.id } });
      expect(rJob?.hiddenByOwnerStatus).toBe(false);
      expect(rJob?.status).toBe('ACTIVE');

      const rProfile = await prisma.driverProfile.findUnique({ where: { id: driverProfile.id } });
      expect(rProfile?.hiddenByOwnerStatus).toBe(false);

      // Verify Outbox Events: UPSERT created for restoration
      const upsertOutbox = await prisma.outboxEvent.findMany({
        where: {
          action: 'UPSERT',
          entityId: {
            in: [carActive.id, carSold.id, carArchived.id, busActive.id, jobActive.id, driverProfile.id],
          },
        },
      });

      expect(upsertOutbox.filter((e) => e.entityType === ENTITY_TYPES.LISTING)).toHaveLength(3);
      expect(upsertOutbox.filter((e) => e.entityType === ENTITY_TYPES.BUS_LISTING)).toHaveLength(1);
      expect(upsertOutbox.filter((e) => e.entityType === ENTITY_TYPES.JOB)).toHaveLength(1);
      expect(upsertOutbox.filter((e) => e.entityId === driverProfile.id)).toHaveLength(0);
    });
  });

  describe('User Suspend and Unsuspend Lifecycle Event Trigger', () => {
    it('should hide content on suspend and restore on unsuspend', async () => {
      const prisma = getPrisma();
      const admin = await registerAdmin({
        email: 'vis_admin_2@example.test',
        username: 'visadmin2',
      });
      const target = await registerUser({
        email: 'vis_target_2@example.test',
        username: 'vistarget2',
      });
      const targetId = target.user.id;
      const { brandId, carModelId } = await getTestBrandAndModel();

      const car = await prisma.listing.create({
        data: {
          title: 'Suspended User Car',
          slug: `susp-car-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          price: 10000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId: targetId,
          brandId,
          carModelId,
        },
      });

      // Suspend
      await request(getApp().getHttpServer())
        .post(`/api/admin/users/${targetId}/suspend`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Investigation in progress' })
        .expect(200);

      await waitFor(
        async () => {
          const suspended = await prisma.listing.findUnique({ where: { id: car.id } });
          return suspended?.hiddenByOwnerStatus === true;
        },
        { timeoutMs: 5000, intervalMs: 50, description: 'car hiddenByOwnerStatus === true after suspend' },
      );

      const suspendedCar = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(suspendedCar?.hiddenByOwnerStatus).toBe(true);

      // Unsuspend
      await request(getApp().getHttpServer())
        .post(`/api/admin/users/${targetId}/unsuspend`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Investigation cleared' })
        .expect(200);

      await waitFor(
        async () => {
          const unsuspended = await prisma.listing.findUnique({ where: { id: car.id } });
          return unsuspended?.hiddenByOwnerStatus === false;
        },
        { timeoutMs: 5000, intervalMs: 50, description: 'car hiddenByOwnerStatus === false after unsuspend' },
      );

      const unsuspendedCar = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(unsuspendedCar?.hiddenByOwnerStatus).toBe(false);
    });
  });

  describe('Direct Service Idempotency', () => {
    it('should handle repeated hide and restore calls safely without errors or data corruption', async () => {
      const prisma = getPrisma();
      const user = await registerUser({
        email: 'vis_idemp@example.test',
        username: 'visidemp',
      });
      const { brandId, carModelId } = await getTestBrandAndModel();

      const car = await prisma.listing.create({
        data: {
          title: 'Idempotency Car',
          slug: `idemp-car-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          price: 11000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId: user.user.id,
          brandId,
          carModelId,
        },
      });

      // Set user status to BANNED to match hide requirement (not ACTIVE)
      await prisma.user.update({
        where: { id: user.user.id },
        data: { status: 'BANNED' },
      });

      // First hide
      const hide1 = await visibilityService.hideAllForUser(user.user.id);
      expect(hide1.affectedCounts[ENTITY_TYPES.LISTING]).toBe(1);
      expect(hide1.totalAffected).toBe(1);

      // Second hide (already hidden -> affected 0)
      const hide2 = await visibilityService.hideAllForUser(user.user.id);
      expect(hide2.affectedCounts[ENTITY_TYPES.LISTING]).toBe(0);
      expect(hide2.totalAffected).toBe(0);

      const checkHidden = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(checkHidden?.hiddenByOwnerStatus).toBe(true);

      // Set user status to ACTIVE to match restore requirement (ACTIVE)
      await prisma.user.update({
        where: { id: user.user.id },
        data: { status: 'ACTIVE' },
      });

      // First restore
      const restore1 = await visibilityService.restoreAllForUser(user.user.id);
      expect(restore1.affectedCounts[ENTITY_TYPES.LISTING]).toBe(1);
      expect(restore1.totalAffected).toBe(1);

      // Second restore (already visible -> affected 0)
      const restore2 = await visibilityService.restoreAllForUser(user.user.id);
      expect(restore2.affectedCounts[ENTITY_TYPES.LISTING]).toBe(0);
      expect(restore2.totalAffected).toBe(0);

      const checkRestored = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(checkRestored?.hiddenByOwnerStatus).toBe(false);
    });
  });

  describe('Visibility Reconciliation Cron Drift Repair', () => {
    it('should detect and repair drift in both directions', async () => {
      const prisma = getPrisma();
      const { brandId, carModelId } = await getTestBrandAndModel();

      // Drift 1: Banned user with unhidden listing
      const bannedUser = await registerUser({
        email: 'drift_banned@example.test',
        username: 'driftbanned',
      });
      await prisma.user.update({
        where: { id: bannedUser.user.id },
        data: { status: 'BANNED' },
      });

      const driftedUnhiddenCar = await prisma.listing.create({
        data: {
          title: 'Drifted Unhidden Car',
          slug: `drift-unhidden-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 9500,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false, // Drift! Should be true
          sellerId: bannedUser.user.id,
          brandId,
          carModelId,
        },
      });

      // Drift 2: Active user with hidden listing
      const activeUser = await registerUser({
        email: 'drift_active@example.test',
        username: 'driftactive',
      });

      const driftedHiddenCar = await prisma.listing.create({
        data: {
          title: 'Drifted Hidden Car',
          slug: `drift-hidden-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Desc',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 9500,
          status: 'ACTIVE',
          hiddenByOwnerStatus: true, // Drift! Should be false
          sellerId: activeUser.user.id,
          brandId,
          carModelId,
        },
      });

      // Run cron scan & repair
      await reconciliationCron.reconcile();

      // Verify drift repaired
      const repairedUnhidden = await prisma.listing.findUnique({
        where: { id: driftedUnhiddenCar.id },
      });
      expect(repairedUnhidden?.hiddenByOwnerStatus).toBe(true);

      const repairedHidden = await prisma.listing.findUnique({
        where: { id: driftedHiddenCar.id },
      });
      expect(repairedHidden?.hiddenByOwnerStatus).toBe(false);
    });
  });

  describe('SellerContactGate Status Restrictions', () => {
    it('should reject BANNED seller with 403 ACCOUNT_BANNED', async () => {
      const prisma = getPrisma();
      const user = await registerUser({
        email: 'gate_banned@example.test',
        username: 'gatebanned',
      });
      await prisma.user.update({
        where: { id: user.user.id },
        data: { status: 'BANNED' },
      });

      await expect(sellerContactGate.assertCanPublish(user.user.id)).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          response: expect.objectContaining({ code: 'ACCOUNT_BANNED' }),
        }),
      );
    });

    it('should reject SUSPENDED seller with 403 ACCOUNT_SUSPENDED', async () => {
      const prisma = getPrisma();
      const user = await registerUser({
        email: 'gate_suspended@example.test',
        username: 'gatesuspended',
      });
      await prisma.user.update({
        where: { id: user.user.id },
        data: { status: 'SUSPENDED' },
      });

      await expect(sellerContactGate.assertCanPublish(user.user.id)).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          response: expect.objectContaining({ code: 'ACCOUNT_SUSPENDED' }),
        }),
      );
    });

    it('should reject DELETED seller with 401 UnauthorizedException', async () => {
      const prisma = getPrisma();
      const user = await registerUser({
        email: 'gate_deleted@example.test',
        username: 'gatedeleted',
      });
      await prisma.user.update({
        where: { id: user.user.id },
        data: { status: 'DELETED' },
      });

      await expect(sellerContactGate.assertCanPublish(user.user.id)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow ACTIVE seller with verified phone to publish and return phone', async () => {
      const user = await registerUser({
        email: 'gate_active@example.test',
        username: 'gateactive',
      });

      const phone = await sellerContactGate.assertCanPublish(user.user.id);
      expect(phone).toBeDefined();
      expect(typeof phone).toBe('string');
      expect(phone.length).toBeGreaterThan(0);
    });
  });

  describe('Account Deletion Lifecycle with Scheduled Deletion Visibility Guard (PR 2A)', () => {
    it('should hide content on delete-account, keep hidden across cron and admin unsuspension, and restore on cancel-deletion', async () => {
      const prisma = getPrisma();
      const admin = await registerAdmin({
        email: 'del_admin_1@example.test',
        username: 'deladmin1',
      });
      const user = await registerUser({
        email: 'del_user_1@example.test',
        username: 'deluser1',
        password: 'Password123!',
      });
      const userId = user.user.id;
      const { brandId, carModelId } = await getTestBrandAndModel();

      // 1. Create an ACTIVE listing for the user with hiddenByOwnerStatus = false
      const car = await prisma.listing.create({
        data: {
          title: 'Car For Deletion Test',
          slug: `car-del-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: 'Car For Deletion Test Desc',
          make: 'Toyota',
          model: 'Land Cruiser',
          year: 2023,
          price: 15000,
          status: 'ACTIVE',
          hiddenByOwnerStatus: false,
          sellerId: userId,
          brandId,
          carModelId,
        },
      });

      // 2. User requests account deletion via POST /api/users/me/delete-account
      await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          password: 'Password123!',
          confirmation: 'حذف حسابي',
        })
        .expect(201);

      // Verify user has deletionScheduledAt set and status is ACTIVE
      const dbUserAfterSchedule = await prisma.user.findUnique({ where: { id: userId } });
      expect(dbUserAfterSchedule?.deletionScheduledAt).not.toBeNull();
      expect(dbUserAfterSchedule?.status).toBe('ACTIVE');

      // Verify hiddenByOwnerStatus = true in DB
      await waitFor(
        async () => {
          const updatedCar = await prisma.listing.findUnique({ where: { id: car.id } });
          return updatedCar?.hiddenByOwnerStatus === true;
        },
        { timeoutMs: 5000, intervalMs: 50, description: 'listing hiddenByOwnerStatus === true after delete-account' },
      );

      const hiddenCar = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(hiddenCar?.hiddenByOwnerStatus).toBe(true);

      // 3. Run VisibilityReconciliationCron.reconcile() and verify listing remains hidden
      await reconciliationCron.reconcile();

      const carAfterCron = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(carAfterCron?.hiddenByOwnerStatus).toBe(true);

      // 4. Admin unsuspends user (status changed to ACTIVE) while deletionScheduledAt is set
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED', suspendedUntil: new Date(Date.now() + 86400000) },
      });

      await request(getApp().getHttpServer())
        .post(`/api/admin/users/${userId}/unsuspend`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Admin unsuspension test while deletion scheduled' })
        .expect(200);

      // Allow async event listener to run
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify listing is STILL hidden
      const carAfterUnsuspend = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(carAfterUnsuspend?.hiddenByOwnerStatus).toBe(true);

      // 5. User cancels deletion via POST /api/users/me/cancel-deletion
      // Login again to get a fresh valid token since tokenVersion was incremented
      const userLogin = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'del_user_1@example.test',
          password: 'Password123!',
        })
        .expect(201);

      await request(getApp().getHttpServer())
        .post('/api/users/me/cancel-deletion')
        .set('Authorization', `Bearer ${userLogin.body.accessToken}`)
        .expect(201);

      // Verify deletionScheduledAt is now null
      const dbUserAfterCancel = await prisma.user.findUnique({ where: { id: userId } });
      expect(dbUserAfterCancel?.deletionScheduledAt).toBeNull();

      // Verify listing returns visible (hiddenByOwnerStatus === false)
      await waitFor(
        async () => {
          const restoredCar = await prisma.listing.findUnique({ where: { id: car.id } });
          return restoredCar?.hiddenByOwnerStatus === false;
        },
        { timeoutMs: 5000, intervalMs: 50, description: 'listing hiddenByOwnerStatus === false after cancel-deletion' },
      );

      const finalCar = await prisma.listing.findUnique({ where: { id: car.id } });
      expect(finalCar?.hiddenByOwnerStatus).toBe(false);
    });
  });
});
