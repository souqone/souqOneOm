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
  console.log('');
  console.log('📋 Test accounts:');
  console.log('   shipper@souqone.om / Test1234');
  console.log('   carrier@souqone.om / Test1234');
  console.log('   other@souqone.om   / Test1234');
  console.log('');
  console.log('📦 Seed IDs:');
  console.log('   seed-tr-open-001   (OPEN, owned by shipper)');
  console.log('   seed-tr-other-002  (OPEN, owned by other)');
  console.log('   seed-tr-quoted-003 (QUOTED, has pending quote)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
