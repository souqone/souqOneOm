import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding transport E2E test data...');

  const passwordHash = await bcrypt.hash('Test1234', 10);

  // ─── Users ────────────────────────────────────────────────────────────────────

  const transportShipper = await prisma.user.upsert({
    where: { email: 'shipper@souqone.om' },
    update: {},
    create: {
      email: 'shipper@souqone.om',
      username: 'transport_shipper',
      displayName: 'شاحن تجريبي',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const transportCarrierUser = await prisma.user.upsert({
    where: { email: 'carrier@souqone.om' },
    update: {},
    create: {
      email: 'carrier@souqone.om',
      username: 'transport_carrier',
      displayName: 'ناقل تجريبي',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const transportOtherUser = await prisma.user.upsert({
    where: { email: 'other@souqone.om' },
    update: {},
    create: {
      email: 'other@souqone.om',
      username: 'transport_other',
      displayName: 'مستخدم آخر',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const transportCarrierNoProfile = await prisma.user.upsert({
    where: { email: 'carrierNoProfile@souqone.om' },
    update: {},
    create: {
      email: 'carrierNoProfile@souqone.om',
      username: 'transport_carrier_np',
      displayName: 'ناقل بلا ملف',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('✅ Users ready');

  // ─── Carrier Profile ──────────────────────────────────────────────────────────

  const carrierProfile = await prisma.carrierProfile.upsert({
    where: { userId: transportCarrierUser.id },
    update: {},
    create: {
      userId: transportCarrierUser.id,
      companyName: 'شركة النقل التجريبية',
      governorate: 'مسقط',
      vehicleTypes: ['TRUCK_SMALL', 'PICKUP'],
      isAvailable: true,
      isVerified: true,
      bio: 'ناقل تجريبي للـ E2E tests',
    },
  });

  console.log('✅ Carrier profile ready');

  // ─── Transport Requests ───────────────────────────────────────────────────────

  // Request 1: OPEN — owned by shipper
  await prisma.transportRequest.upsert({
    where: { id: 'seed-tr-open-001' },
    update: {},
    create: {
      id: 'seed-tr-open-001',
      userId: transportShipper.id,
      serviceType: 'GOODS',
      fromGovernorate: 'مسقط',
      fromCity: 'الموالح',
      fromAddress: 'شارع الموالح، بناية 5',
      toGovernorate: 'صلالة',
      toCity: 'المدينة',
      toAddress: 'شارع صلالة الرئيسي',
      cargoDescription: 'أثاث منزلي — صناديق متنوعة للتجربة',
      weightTons: 2.5,
      budgetMin: 50,
      budgetMax: 150,
      status: 'OPEN',
    },
  });

  // Request 2: OPEN — owned by other user (ownership/security tests)
  await prisma.transportRequest.upsert({
    where: { id: 'seed-tr-other-002' },
    update: {},
    create: {
      id: 'seed-tr-other-002',
      userId: transportOtherUser.id,
      serviceType: 'FURNITURE',
      fromGovernorate: 'مسقط',
      fromCity: 'بوشر',
      fromAddress: 'حي بوشر',
      toGovernorate: 'نزوى',
      toCity: 'نزوى',
      toAddress: 'وسط المدينة',
      cargoDescription: 'أثاث مكتبي — خزائن ومكاتب',
      weightTons: 1.0,
      budgetMin: 80,
      budgetMax: 200,
      status: 'OPEN',
    },
  });

  // Request 3: QUOTED — owned by shipper, has pending quote from carrier
  const quotedRequest = await prisma.transportRequest.upsert({
    where: { id: 'seed-tr-quoted-003' },
    update: {},
    create: {
      id: 'seed-tr-quoted-003',
      userId: transportShipper.id,
      serviceType: 'GOODS',
      fromGovernorate: 'مسقط',
      fromCity: 'الرحاب',
      fromAddress: 'طريق السلطان قابوس',
      toGovernorate: 'مسقط',
      toCity: 'العذيبة',
      toAddress: 'المنطقة الصناعية',
      cargoDescription: 'بضائع تجارية — طرود صغيرة',
      weightTons: 0.5,
      budgetMin: 30,
      budgetMax: 80,
      status: 'QUOTED',
    },
  });

  await prisma.transportQuote.upsert({
    where: { id: 'seed-tq-pending-001' },
    update: {},
    create: {
      id: 'seed-tq-pending-001',
      requestId: quotedRequest.id,
      carrierId: carrierProfile.id,
      price: 60,
      estimatedHours: 3,
      message: 'يسعدني تنفيذ هذه الرحلة بأفضل خدمة',
      status: 'PENDING',
    },
  });

  console.log('✅ Transport requests ready');
  // ─── Jobs Users ───────────────────────────────────────────────────────────────

  const jobsEmployer = await prisma.user.upsert({
    where: { email: 'employer@souqone.om' },
    update: {},
    create: {
      email: 'employer@souqone.om',
      username: 'jobs_employer',
      displayName: 'صاحب عمل تجريبي',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const jobsDriver = await prisma.user.upsert({
    where: { email: 'driver@souqone.om' },
    update: {},
    create: {
      email: 'driver@souqone.om',
      username: 'jobs_driver',
      displayName: 'سائق تجريبي',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const jobsApplicant = await prisma.user.upsert({
    where: { email: 'applicant@souqone.om' },
    update: {},
    create: {
      email: 'applicant@souqone.om',
      username: 'jobs_applicant',
      displayName: 'مقدم طلب تجريبي',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  const jobsNoProfile = await prisma.user.upsert({
    where: { email: 'noprofile@souqone.om' },
    update: {},
    create: {
      email: 'noprofile@souqone.om',
      username: 'jobs_noprofile',
      displayName: 'مستخدم بلا بروفايل',
      passwordHash,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('✅ Jobs users ready');

  // ─── Jobs Profiles ────────────────────────────────────────────────────────────

  const employerProfile = await prisma.employerProfile.upsert({
    where: { userId: jobsEmployer.id },
    update: {},
    create: {
      userId: jobsEmployer.id,
      companyName: 'شركة الوظائف ذ.م.م',
      governorate: 'مسقط',
      bio: 'شركة تبحث عن سائقين للوظائف',
    },
  });

  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: jobsDriver.id },
    update: {},
    create: {
      userId: jobsDriver.id,
      governorate: 'مسقط',
      bio: 'سائق محترف يبحث عن عمل',
      licenseTypes: ['HEAVY'],
      isVerified: true,
    },
  });

  const applicantProfile = await prisma.driverProfile.upsert({
    where: { userId: jobsApplicant.id },
    update: {},
    create: {
      userId: jobsApplicant.id,
      governorate: 'صلالة',
      bio: 'سائق يقدم على الوظائف',
      licenseTypes: ['LIGHT'],
      isVerified: true,
    },
  });

  console.log('✅ Jobs profiles ready');

  // ─── Jobs Postings ────────────────────────────────────────────────────────────

  const activeJob = await prisma.driverJob.upsert({
    where: { id: 'seed-job-active-001' },
    update: {},
    create: {
      id: 'seed-job-active-001',
      userId: jobsEmployer.id,
      jobType: 'HIRING',
      employmentType: 'FULL_TIME',
      title: 'مطلوب سائق شاحنة خفيفة',
      slug: 'light-truck-driver',
      description: 'نبحث عن سائق ذو خبرة في توصيل الطلبات داخل مسقط.',
      governorate: 'مسقط',
      city: 'السيب',
      status: 'ACTIVE',
    },
  });

  const pendingApp = await prisma.jobApplication.upsert({
    where: { id: 'seed-app-pending-001' },
    update: {},
    create: {
      id: 'seed-app-pending-001',
      jobId: activeJob.id,
      applicantId: jobsApplicant.id,
      status: 'PENDING',
      message: 'مرحباً، لدي خبرة 3 سنوات وأرغب بالتقديم على الوظيفة.',
    },
  });

  const closedJob = await prisma.driverJob.upsert({
    where: { id: 'seed-job-closed-002' },
    update: {},
    create: {
      id: 'seed-job-closed-002',
      userId: jobsEmployer.id,
      jobType: 'HIRING',
      employmentType: 'PART_TIME',
      title: 'سائق حافلة مطلوب',
      slug: 'bus-driver-needed',
      description: 'مطلوب سائق حافلة متوسطة بعقد جزئي.',
      governorate: 'ظفار',
      city: 'صلالة',
      status: 'CLOSED',
    },
  });

  console.log('✅ Jobs postings ready');

  console.log('');
  console.log('📋 Transport Test accounts:');
  console.log('   shipper@souqone.om / Test1234');
  console.log('   carrier@souqone.om / Test1234');
  console.log('   other@souqone.om   / Test1234');
  console.log('');
  console.log('📋 Jobs Test accounts:');
  console.log('   employer@souqone.om   / Test1234');
  console.log('   driver@souqone.om     / Test1234');
  console.log('   applicant@souqone.om  / Test1234');
  console.log('   noprofile@souqone.om  / Test1234');
  console.log('');
  console.log('📦 Transport Seed IDs:');
  console.log('   seed-tr-open-001   (OPEN, owned by shipper)');
  console.log('   seed-tr-other-002  (OPEN, owned by other)');
  console.log('   seed-tr-quoted-003 (QUOTED, has pending quote)');
  console.log('');
  console.log('📦 Jobs Seed IDs:');
  console.log('   seed-job-active-001 (ACTIVE, owned by employer)');
  console.log('   seed-job-closed-002 (CLOSED, owned by employer)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
