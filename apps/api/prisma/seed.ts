import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...');

  // Create test user
  const passwordHash = await bcrypt.hash('Test1234', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@carone.om' },
    update: { passwordHash, isVerified: true },
    create: {
      email: 'seller@carone.om',
      username: 'auto_dealer',
      displayName: 'معرض الخليج للسيارات',
      passwordHash,
      phone: '+96891234567',
      isVerified: true,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'ahmed@carone.om' },
    update: { passwordHash, isVerified: true },
    create: {
      email: 'ahmed@carone.om',
      username: 'ahmed_cars',
      displayName: 'أحمد الحارثي',
      passwordHash,
      phone: '+96899887766',
      isVerified: true,
    },
  });

  console.log('✅ تم إنشاء المستخدمين');

  // Car images from Unsplash
  const carImages = [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
  ];

  const listings = [
    {
      title: 'تويوتا لاند كروزر VXR 2024',
      slug: 'toyota-land-cruiser-vxr-2024',
      description: 'لاند كروزر VXR فل كامل، بانوراما، كاميرات 360، نظام JBL الصوتي، مثبت سرعة تكيفي، شاشة كبيرة، جلد طبيعي، حالة الوكالة، كفالة سارية حتى 2027.',
      make: 'Toyota',
      model: 'Land Cruiser',
      year: 2024,
      mileage: 12000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'أبيض لؤلؤي',
      interior: 'جلد بيج',
      engineSize: '3.5L V6 Twin Turbo',
      horsepower: 409,
      doors: 5,
      seats: 7,
      driveType: '4WD',
      price: 28500,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'LIKE_NEW' as const,
      status: 'ACTIVE' as const,
      isPremium: true,
      governorate: 'مسقط',
      city: 'بوشر',
      sellerId: seller.id,
      images: [carImages[0], carImages[1]],
    },
    {
      title: 'مرسيدس بنز S500 AMG 2023',
      slug: 'mercedes-s500-amg-2023',
      description: 'مرسيدس S500 AMG لاين، باكج كامل، مواصفات خليجية، بيرماتيك، شاشة MBUX، إضاءة أمبيانس 64 لون، مقاعد مساج، تعليق هوائي، حالة ممتازة.',
      make: 'Mercedes-Benz',
      model: 'S500',
      year: 2023,
      mileage: 25000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan',
      exteriorColor: 'أسود أوبسيديان',
      interior: 'جلد نابا أسود',
      engineSize: '3.0L I6 Turbo',
      horsepower: 449,
      doors: 4,
      seats: 5,
      driveType: '4MATIC',
      price: 35000,
      currency: 'OMR',
      isPriceNegotiable: false,
      condition: 'USED' as const,
      status: 'ACTIVE' as const,
      isPremium: true,
      governorate: 'مسقط',
      city: 'الخوض',
      sellerId: seller.id,
      images: [carImages[2], carImages[3]],
    },
    {
      title: 'بي إم دبليو X5 M Sport 2023',
      slug: 'bmw-x5-m-sport-2023',
      description: 'BMW X5 xDrive40i M Sport باكج، بانوراما، هاربمان كاردون، شاشة منحنية، مقاعد فنتيلايتد، هيد أب ديسبلاي، حساسات أمامية وخلفية، كاميرا خلفية.',
      make: 'BMW',
      model: 'X5',
      year: 2023,
      mileage: 18000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'رمادي منيرال',
      interior: 'جلد كوجناك',
      engineSize: '3.0L I6 Turbo',
      horsepower: 375,
      doors: 5,
      seats: 5,
      driveType: 'xDrive',
      price: 22000,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'USED' as const,
      status: 'ACTIVE' as const,
      isPremium: false,
      governorate: 'مسقط',
      city: 'السيب',
      sellerId: seller2.id,
      images: [carImages[4], carImages[5]],
    },
    {
      title: 'رنج روفر فوج SE 2022',
      slug: 'range-rover-vogue-se-2022',
      description: 'رنج روفر فوج SE الجيل الجديد، تصميم عصري، شاشة 13 إنش، تعليق هوائي، مقاعد كهربائية مع ذاكرة، فتحة سقف بانورامية، نظام ميريديان الصوتي.',
      make: 'Land Rover',
      model: 'Range Rover',
      year: 2022,
      mileage: 35000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'أخضر بريطاني',
      interior: 'جلد أبيض',
      engineSize: '3.0L I6 Turbo',
      horsepower: 395,
      doors: 5,
      seats: 5,
      driveType: '4WD',
      price: 32000,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'USED' as const,
      status: 'ACTIVE' as const,
      isPremium: true,
      governorate: 'ظفار',
      city: 'صلالة',
      sellerId: seller.id,
      images: [carImages[6], carImages[7]],
    },
    {
      title: 'نيسان باترول بلاتينيوم 2024',
      slug: 'nissan-patrol-platinum-2024',
      description: 'باترول بلاتينيوم V8 فل كامل، شاشات خلفية، كاميرات 360، مثبت سرعة، تحكم بالجوال، جلد طبيعي، حالة ممتازة جداً، ماشي قليل.',
      make: 'Nissan',
      model: 'Patrol',
      year: 2024,
      mileage: 8000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'فضي',
      interior: 'جلد بني',
      engineSize: '5.6L V8',
      horsepower: 400,
      doors: 5,
      seats: 8,
      driveType: '4WD',
      price: 19500,
      currency: 'OMR',
      isPriceNegotiable: false,
      condition: 'LIKE_NEW' as const,
      status: 'ACTIVE' as const,
      isPremium: false,
      governorate: 'مسقط',
      city: 'العامرات',
      sellerId: seller2.id,
      images: [carImages[8], carImages[9]],
    },
    {
      title: 'لكزس ES 350 F-Sport 2023',
      slug: 'lexus-es350-fsport-2023',
      description: 'لكزس ES 350 F-Sport، تصميم رياضي أنيق، شاشة 12.3 إنش، نظام Mark Levinson، مقاعد جلد مبردة ومُدفأة، نظام أمان متكامل Lexus Safety System+.',
      make: 'Lexus',
      model: 'ES 350',
      year: 2023,
      mileage: 20000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan',
      exteriorColor: 'أبيض',
      interior: 'جلد أحمر',
      engineSize: '3.5L V6',
      horsepower: 302,
      doors: 4,
      seats: 5,
      driveType: 'FWD',
      price: 14500,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'USED' as const,
      status: 'ACTIVE' as const,
      isPremium: false,
      governorate: 'شمال الباطنة',
      city: 'صحار',
      sellerId: seller.id,
      images: [carImages[0], carImages[4]],
    },
    {
      title: 'بورشه كايين GTS 2022',
      slug: 'porsche-cayenne-gts-2022',
      description: 'بورشه كايين GTS، محرك V8 توربو مزدوج، نظام تعليق PASM، مقاعد رياضية، عجلات 21 إنش، باكج GTS كامل، صيانة وكالة بالكامل.',
      make: 'Porsche',
      model: 'Cayenne GTS',
      year: 2022,
      mileage: 30000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'أحمر كارمين',
      interior: 'جلد أسود',
      engineSize: '4.0L V8 Twin Turbo',
      horsepower: 453,
      doors: 5,
      seats: 5,
      driveType: 'AWD',
      price: 38000,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'GOOD' as const,
      status: 'ACTIVE' as const,
      isPremium: true,
      governorate: 'مسقط',
      city: 'مسقط',
      sellerId: seller2.id,
      images: [carImages[6], carImages[2]],
    },
    {
      title: 'هيونداي توسان 2024 جديدة',
      slug: 'hyundai-tucson-2024-new',
      description: 'هيونداي توسان 2024 زيرو كيلومتر، مواصفات خليجية، شاشة 10.25 إنش، Apple CarPlay، كاميرا خلفية، حساسات ركن، تشغيل عن بعد، ضمان 5 سنوات.',
      make: 'Hyundai',
      model: 'Tucson',
      year: 2024,
      mileage: 0,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'أزرق',
      interior: 'قماش رمادي',
      engineSize: '2.0L',
      horsepower: 156,
      doors: 5,
      seats: 5,
      driveType: 'FWD',
      price: 8500,
      currency: 'OMR',
      isPriceNegotiable: false,
      condition: 'NEW' as const,
      status: 'ACTIVE' as const,
      isPremium: false,
      governorate: 'الداخلية',
      city: 'نزوى',
      sellerId: seller.id,
      images: [carImages[8], carImages[3]],
    },
    {
      title: 'كيا K5 GT-Line 2023',
      slug: 'kia-k5-gt-line-2023',
      description: 'كيا K5 GT-Line، تصميم رياضي جذاب، شاشة 10.25 إنش، مقاعد جلد، فتحة سقف، Apple CarPlay و Android Auto، كاميرا خلفية، مثبت سرعة.',
      make: 'Kia',
      model: 'K5',
      year: 2023,
      mileage: 15000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'Sedan',
      exteriorColor: 'رمادي داكن',
      interior: 'جلد أسود',
      engineSize: '2.5L',
      horsepower: 191,
      doors: 4,
      seats: 5,
      driveType: 'FWD',
      price: 6800,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'USED' as const,
      status: 'ACTIVE' as const,
      isPremium: false,
      governorate: 'جنوب الباطنة',
      city: 'الرستاق',
      sellerId: seller2.id,
      images: [carImages[5], carImages[9]],
    },
    {
      title: 'أودي Q7 S-Line 2023',
      slug: 'audi-q7-sline-2023',
      description: 'أودي Q7 55 TFSI S-Line، محرك V6 توربو، نظام MMI Touch، شاشة مزدوجة، مقاعد فنتيلايتد، باكج S-Line خارجي وداخلي، عجلات 21 إنش، B&O صوتيات.',
      make: 'Audi',
      model: 'Q7',
      year: 2023,
      mileage: 22000,
      fuelType: 'PETROL' as const,
      transmission: 'AUTOMATIC' as const,
      bodyType: 'SUV',
      exteriorColor: 'كحلي',
      interior: 'جلد بيج',
      engineSize: '3.0L V6 TFSI',
      horsepower: 335,
      doors: 5,
      seats: 7,
      driveType: 'Quattro',
      price: 24000,
      currency: 'OMR',
      isPriceNegotiable: true,
      condition: 'USED' as const,
      status: 'ACTIVE' as const,
      isPremium: false,
      governorate: 'مسقط',
      city: 'القرم',
      sellerId: seller.id,
      images: [carImages[7], carImages[1]],
    },
  ];

  for (const listing of listings) {
    const { images, ...data } = listing;
    const created = await prisma.listing.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });

    // Add images
    const existingImages = await prisma.listingImage.count({ where: { listingId: created.id } });
    if (existingImages === 0) {
      for (let i = 0; i < images.length; i++) {
        await prisma.listingImage.create({
          data: {
            url: images[i],
            alt: data.title,
            order: i,
            isPrimary: i === 0,
            listingId: created.id,
          },
        });
      }
    }

    console.log(`✅ ${data.title}`);
  }

  console.log('\n🎉 تم إضافة 10 إعلانات تجريبية بنجاح!');
  console.log('👤 بيانات الدخول: seller@carone.om / Test1234');
  console.log('👤 بيانات الدخول: ahmed@carone.om / Test1234');

  // ─── Transport Test Users ────────────────────────────────────────────────────

  const transportShipper = await prisma.user.upsert({
    where: { email: 'shipper@souqone.om' },
    update: {},
    create: {
      email: 'shipper@souqone.om',
      username: 'transport_shipper',
      displayName: 'شاحن تجريبي',
      passwordHash: await bcrypt.hash('Test1234', 10),
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
      passwordHash: await bcrypt.hash('Test1234', 10),
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
      passwordHash: await bcrypt.hash('Test1234', 10),
      role: 'USER',
      isVerified: true,
    },
  });

  // ─── Carrier Profile ──────────────────────────────────────────────────────────

  const carrierProfile = await prisma.carrierProfile.upsert({
    where: { userId: transportCarrierUser.id },
    update: {},
    create: {
      userId: transportCarrierUser.id,
      companyName: 'شركة النقل التجريبية',
      governorate: 'مسقط',
      vehicleTypes: ['TRUCK_SMALL', 'PICKUP'],
      serviceAreas: ['مسقط', 'صلالة'],
      isAvailable: true,
      isVerified: true,
      bio: 'ناقل تجريبي للـ E2E tests',
    },
  });

  // ─── Seed Transport Requests ──────────────────────────────────────────────────

  // Request 1: OPEN — owned by shipper (main test subject)
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

  // Request 2: OPEN — owned by other user (for ownership/security tests)
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

  console.log('✅ Transport seed data created');
  console.log('   shipper@souqone.om / Test1234');
  console.log('   carrier@souqone.om / Test1234');
  console.log('   other@souqone.om   / Test1234');
  console.log('   Requests: seed-tr-open-001, seed-tr-other-002, seed-tr-quoted-003');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
