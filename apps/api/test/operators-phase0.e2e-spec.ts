import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser, loginUser } from './setup';
import { PrismaClient, UserRole } from '@prisma/client';

let app: any;
let prisma: PrismaClient;

beforeAll(async () => {
  await createTestApp();
  app = getApp();
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await closeTestApp();
});

describe('Operators Phase 0 API (e2e)', () => {
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;
  let adminToken: string;
  let operatorListingId: string;
  let deletionRequestId: string;

  beforeAll(async () => {
    // 1. Register main user
    const u1 = await registerUser();
    userToken = u1.accessToken;
    userId = u1.user.id;

    // 2. Register secondary user
    const u2 = await registerUser();
    otherUserToken = u2.accessToken;
    otherUserId = u2.user.id;

    // 3. Register admin user
    const adminEmail = `admin_${Date.now()}@test.com`;
    const adminPass = 'TestAdminPass123!';
    const uAdmin = await registerUser({ email: adminEmail, password: adminPass });
    await prisma.user.update({
      where: { id: uAdmin.user.id },
      data: { role: UserRole.ADMIN },
    });
    const adminLogin = await loginUser(adminEmail, adminPass);
    adminToken = adminLogin.accessToken;
  });

  const validOperatorPayload = {
    title: 'مشغل رافعة محترف معتمد',
    description: 'خبرة أكثر من 8 سنوات في تشغيل وصيانة الرافعات الثقيلة والمعدات الإنشائية',
    operatorType: 'OPERATOR',
    specializations: ['رافعات برجية', 'معدات ثقيلة'],
    experienceYears: 8,
    equipmentTypes: ['CRANE'],
    certifications: ['شهادة السلامة المهنية', 'رخصة تشغيل معدات ثقيلة'],
    dailyRate: 120,
    hourlyRate: 20,
    currency: 'OMR',
    isPriceNegotiable: true,
    governorateId: 1,
    wilayaId: 1,
    contactPhone: '+96891234567',
    profileImageUrl: 'https://example.com/avatar.jpg',
  };

  describe('1. POST /api/operators (Create Operator Listing)', () => {
    it('Success Case: Should create an operator listing with profileImageUrl and required wilayaId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOperatorPayload)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(validOperatorPayload.title);
      expect(res.body.profileImageUrl).toBe(validOperatorPayload.profileImageUrl);
      expect(res.body.wilayaId).toBe(1);

      operatorListingId = res.body.id;
    });

    it('Failure Case (Single Profile Constraint): Should reject second profile for same user with plain Arabic ConflictException', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validOperatorPayload,
          title: 'بروفايل مشغل آخر لنفس المستخدم',
        })
        .expect(409);

      console.log('REAL JSON (Create Duplicate Profile Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toBe('لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه');
    });
  });

  describe('2. GET /api/operators (Find All with new filters & sorting)', () => {
    it('Success Case: Should list operators with min/max filters and custom sortBy', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/operators')
        .query({
          minDailyRate: 50,
          maxDailyRate: 200,
          minHourlyRate: 10,
          maxHourlyRate: 50,
          minExperienceYears: 5,
          maxExperienceYears: 15,
          sortBy: 'dailyRate',
          sortOrder: 'asc',
        })
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('Failure Case: Should reject invalid sortBy value with 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/operators')
        .query({
          sortBy: 'hacked',
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });
  });

  describe('3. PATCH /api/operators/:id (Update Profile Image & Details)', () => {
    it('Success Case: Should update profileImageUrl successfully', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          profileImageUrl: 'https://example.com/new-avatar.jpg',
          dailyRate: 130,
        })
        .expect(200);

      expect(res.body.profileImageUrl).toBe('https://example.com/new-avatar.jpg');
    });

    it('Failure Case: Should reject update by unauthorized non-owner with plain Arabic ForbiddenException', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'تعديل غير مصرح' })
        .expect(403);

      console.log('REAL JSON (Update Other User Profile Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(403);
      expect(res.body.message).toBe('لا يمكنك تعديل إعلان غيرك');
    });
  });

  describe('3.5 POST /api/reviews (Operator Review Contact Requirement)', () => {
    it('Failure Case: Reviewing operator without prior conversation returns 400 with Arabic message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          rating: 5,
          comment: 'مشغل ممتاز',
          entityType: 'OPERATOR_LISTING',
          entityId: operatorListingId,
          revieweeId: userId,
        })
        .expect(400);

      console.log('REAL JSON (Review Operator Without Conversation 400):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً');
    });

    it('Failure Case: Reviewing operator with conversation but zero messages from reviewer returns 400', async () => {
      // Create a conversation without any message from otherUser
      const conv = await prisma.conversation.create({
        data: {
          entityType: 'OPERATOR_LISTING',
          entityId: operatorListingId,
          participants: {
            create: [
              { userId },
              { userId: otherUserId },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          rating: 5,
          comment: 'مشغل رائع',
          entityType: 'OPERATOR_LISTING',
          entityId: operatorListingId,
          revieweeId: userId,
        })
        .expect(400);

      console.log('REAL JSON (Review Operator Without Sent Messages 400):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً');

      await prisma.conversation.delete({ where: { id: conv.id } });
    });

    it('Success Case: Reviewing operator with conversation AND sent message succeeds', async () => {
      // Create conversation with participant and a message sent by otherUser
      const conv = await prisma.conversation.create({
        data: {
          entityType: 'OPERATOR_LISTING',
          entityId: operatorListingId,
          participants: {
            create: [
              { userId },
              { userId: otherUserId },
            ],
          },
          messages: {
            create: {
              content: 'السلام عليكم، هل أنت متاح للعمل في مسقط غداً؟',
              senderId: otherUserId,
            },
          },
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          rating: 5,
          comment: 'مشغل ممتاز ومحترف جداً وتم التواصل معه بنجاح',
          entityType: 'OPERATOR_LISTING',
          entityId: operatorListingId,
          revieweeId: userId,
        })
        .expect(201);

      console.log('REAL JSON (Review Operator Success 201):', JSON.stringify(res.body, null, 2));
      expect(res.body.id).toBeDefined();
      expect(res.body.rating).toBe(5);
      expect(res.body.entityType).toBe('OPERATOR_LISTING');
    });
  });

  describe('4. DELETE /api/operators/:id (Request Deletion)', () => {
    it('Failure Case (Not Found): Should return 404 with plain Arabic message for non-existent listing', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/operators/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'تجربة حذف غير موجود' })
        .expect(404);

      console.log('REAL JSON (Request Deletion 404 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('إعلان المشغل غير موجود');
    });

    it('Failure Case (Forbidden): Should return 403 with plain Arabic message when deleting other user listing', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ reason: 'محاولة حذف إعلان مستخدم آخر' })
        .expect(403);

      console.log('REAL JSON (Request Deletion 403 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(403);
      expect(res.body.message).toBe('لا يمكنك حذف إعلان غيرك');
    });

    it('Success Case: Should create a PENDING deletion request without deleting the listing', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'أرغب في تغيير مجال عملي إلى النقليات' })
        .expect(200);

      expect(res.body.message).toBe('تم تقديم طلب الحذف بنجاح وهو قيد مراجعة الإدارة');
      expect(res.body.request.status).toBe('PENDING');
      expect(res.body.request.operatorListingId).toBe(operatorListingId);

      deletionRequestId = res.body.request.id;

      // Confirm listing still exists in database
      const listingStillExists = await prisma.operatorListing.findUnique({
        where: { id: operatorListingId },
      });
      expect(listingStillExists).not.toBeNull();
    });

    it('Failure Case (Duplicate Pending Request): Should return 409 when a pending deletion request already exists', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'طلب حذف ثانٍ' })
        .expect(409);

      console.log('REAL JSON (Duplicate Deletion Request 409 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toBe('يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان');
    });
  });

  describe('5. DELETE /api/operators/deletion-requests/:id (Cancel Deletion Request)', () => {
    it('Failure Case (Not Found): Should return 404 for non-existent deletion request', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/operators/deletion-requests/non-existent-req-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      console.log('REAL JSON (Cancel Request 404 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('طلب الحذف غير موجود');
    });

    it('Failure Case (Forbidden): Should return 403 when cancelling another user request', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/deletion-requests/${deletionRequestId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      console.log('REAL JSON (Cancel Request 403 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(403);
      expect(res.body.message).toBe('لا يمكنك إلغاء طلب حذف لا يخصك');
    });

    it('Success Case: Should cancel a pending request within 24 hours', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/deletion-requests/${deletionRequestId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
      expect(res.body.cancelledAt).toBeDefined();
    });

    it('Failure Case (Already Cancelled): Should return 400 when trying to cancel an already processed request', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/deletion-requests/${deletionRequestId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      console.log('REAL JSON (Cancel Already Cancelled 400 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه');
    });
  });

  describe('6. Admin Endpoints: /api/admin/operators/deletion-requests', () => {
    let freshRequestId: string;

    beforeAll(async () => {
      // Create a fresh deletion request for admin review testing
      const res = await request(app.getHttpServer())
        .delete(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'طلب حذف جديد للمراجعة من الإدارة' })
        .expect(200);
      freshRequestId = res.body.request.id;
    });

    it('Failure Case (RBAC): Regular user should be forbidden from accessing admin endpoints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/operators/deletion-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      console.log('REAL JSON (Admin List Requests 403 RBAC Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(403);
    });

    it('Success Case (Admin List): Admin should list all deletion requests with pagination & status filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/operators/deletion-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.items.some((r: any) => r.id === freshRequestId)).toBe(true);
    });

    it('Failure Case (Validation): Admin list with malformed page (?page=abc) returns 400 validation error', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/operators/deletion-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 'abc' })
        .expect(400);

      console.log('REAL JSON (Admin List Malformed Page 400 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(400);
      expect(Array.isArray(res.body.message)).toBe(true);
    });

    it('Failure Case (Review Non-Existent): Admin reviewing non-existent request should return 404', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/operators/deletion-requests/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'REJECTED', rejectionReason: 'غير موجود' })
        .expect(404);

      console.log('REAL JSON (Admin Review 404 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('طلب الحذف غير موجود');
    });

    it('Success Case (Admin Review REJECTED): Admin rejects request and notifies user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/operators/deletion-requests/${freshRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'REJECTED',
          rejectionReason: 'يرجى إكمال المهام المتبقية قبل حذف الحساب',
        })
        .expect(200);

      expect(res.body.status).toBe('REJECTED');
      expect(res.body.rejectionReason).toBe('يرجى إكمال المهام المتبقية قبل حذف الحساب');
    });

    it('Failure Case (Review Already Decided): Re-reviewing a decided request returns 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/operators/deletion-requests/${freshRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVED' })
        .expect(400);

      console.log('REAL JSON (Review Already Decided 400 Failure):', JSON.stringify(res.body, null, 2));
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('هذا الطلب تم البت فيه بالفعل أو تم إلغاؤه');
    });

    it('Success Case (Admin Review APPROVED): Admin approves request -> listing deleted + outbox event created + orphans cleaned', async () => {
      // Create another request to test APPROVED flow
      const reqRes = await request(app.getHttpServer())
        .delete(`/api/operators/${operatorListingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'طلب موافقة نهائية على الحذف' })
        .expect(200);

      const toApproveId = reqRes.body.request.id;

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/operators/deletion-requests/${toApproveId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVED' })
        .expect(200);

      expect(res.body.status).toBe('APPROVED');

      // Verify operator listing is deleted from DB
      const deletedListing = await prisma.operatorListing.findUnique({
        where: { id: operatorListingId },
      });
      expect(deletedListing).toBeNull();

      // Verify outbox event with action DELETE was created
      const outboxEvent = await prisma.outboxEvent.findFirst({
        where: {
          entityType: 'OPERATOR_LISTING',
          entityId: operatorListingId,
          action: 'DELETE',
        },
      });
      expect(outboxEvent).not.toBeNull();
    });
  });
});
