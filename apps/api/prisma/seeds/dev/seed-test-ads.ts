import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

async function main() {
  console.log('🌱 Adding 5 test ads per section...');

  // Find or fail for the test user
  const user = await prisma.user.findUnique({
    where: { email: 'mahmmouudmuhamed2097@gmail.com' },
  });
  if (!user) {
    console.error('❌ User mahmmouudmuhamed2097@gmail.com not found! Please register first.');
    process.exit(1);
  }
  const uid = user.id;
  console.log(`✅ Found user: ${user.displayName || user.username} (${uid})`);

  // ═══════════════════════════════════════
  // 1. Cars (Listing)
  // ═══════════════════════════════════════
  const cars = [
    { title: 'تويوتا كامري 2024 فل كامل', make: 'Toyota', model: 'Camry', year: 2024, price: 12500, mileage: 8000, fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const, condition: 'LIKE_NEW' as const, bodyType: 'Sedan', exteriorColor: 'أبيض لؤلؤي', governorate: 'مسقط', city: 'بوشر' },
    { title: 'نيسان باترول بلاتينيوم 2023', make: 'Nissan', model: 'Patrol', year: 2023, price: 22000, mileage: 25000, fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const, condition: 'USED' as const, bodyType: 'SUV', exteriorColor: 'أسود', governorate: 'مسقط', city: 'السيب' },
    { title: 'هيونداي توسان 2024 نص فل', make: 'Hyundai', model: 'Tucson', year: 2024, price: 8500, mileage: 5000, fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const, condition: 'NEW' as const, bodyType: 'SUV', exteriorColor: 'رمادي', governorate: 'ظفار', city: 'صلالة' },
    { title: 'كيا سبورتاج 2023 GT Line', make: 'Kia', model: 'Sportage', year: 2023, price: 9200, mileage: 15000, fuelType: 'PETROL' as const, transmission: 'AUTOMATIC' as const, condition: 'USED' as const, bodyType: 'SUV', exteriorColor: 'أزرق', governorate: 'مسقط', city: 'الخوض' },
    { title: 'تويوتا لاند كروزر GXR 2022', make: 'Toyota', model: 'Land Cruiser', year: 2022, price: 25000, mileage: 40000, fuelType: 'DIESEL' as const, transmission: 'AUTOMATIC' as const, condition: 'USED' as const, bodyType: 'SUV', exteriorColor: 'فضي', governorate: 'الباطنة شمال', city: 'صحار' },
  ];
  for (const c of cars) {
    await prisma.listing.create({
      data: {
        ...c,
        slug: slug(c.title),
        description: `${c.title} - حالة ممتازة، صيانة وكالة، جاهز للبيع. تواصل معنا للمزيد من التفاصيل.`,
        currency: 'OMR',
        isPriceNegotiable: true,
        status: 'ACTIVE',
        sellerId: uid,
      },
    });
  }
  console.log('✅ 5 Cars created');

  // ═══════════════════════════════════════
  // 2. Buses (BusListing)
  // ═══════════════════════════════════════
  const buses = [
    { title: 'باص تويوتا كوستر 2023 للبيع', busListingType: 'BUS_SALE' as const, busType: 'COASTER' as const, make: 'Toyota', model: 'Coaster', year: 2023, capacity: 30, price: 18000, mileage: 20000, governorate: 'مسقط' },
    { title: 'باص مرسيدس 50 راكب للإيجار', busListingType: 'BUS_RENT' as const, busType: 'LARGE_BUS' as const, make: 'Mercedes-Benz', model: 'Tourismo', year: 2022, capacity: 50, dailyPrice: 85, monthlyPrice: 2000, mileage: 50000, governorate: 'مسقط' },
    { title: 'ميني باص هيونداي 15 راكب', busListingType: 'BUS_SALE' as const, busType: 'MINI_BUS' as const, make: 'Hyundai', model: 'County', year: 2021, capacity: 15, price: 8500, mileage: 60000, governorate: 'ظفار' },
    { title: 'باص مدرسي ميتسوبيشي 2024', busListingType: 'BUS_SALE_WITH_CONTRACT' as const, busType: 'SCHOOL_BUS' as const, make: 'Mitsubishi', model: 'Rosa', year: 2024, capacity: 25, price: 15000, contractType: 'SCHOOL' as const, contractMonthly: 800, contractDuration: 12, governorate: 'الباطنة شمال' },
    { title: 'مطلوب باص 40 راكب لعقد شركة', busListingType: 'BUS_REQUEST' as const, busType: 'LARGE_BUS' as const, make: 'Any', model: 'Any', year: 2020, capacity: 40, requestPassengers: 40, requestRoute: 'مسقط - صحار', requestSchedule: 'يوميًا', governorate: 'مسقط' },
  ];
  for (const b of buses) {
    const { price, dailyPrice, monthlyPrice, contractMonthly, mileage, ...rest } = b;
    await prisma.busListing.create({
      data: {
        ...rest,
        slug: slug(b.title),
        description: `${b.title} - حالة ممتازة، صيانة دورية منتظمة. تواصل للمعاينة.`,
        ...(price !== undefined ? { price } : {}),
        ...(dailyPrice !== undefined ? { dailyPrice } : {}),
        ...(monthlyPrice !== undefined ? { monthlyPrice } : {}),
        ...(contractMonthly !== undefined ? { contractMonthly } : {}),
        ...(mileage !== undefined ? { mileage } : {}),
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Buses created');

  // ═══════════════════════════════════════
  // 3. Equipment (EquipmentListing)
  // ═══════════════════════════════════════
  const equipment = [
    { title: 'حفارة كاتربيلر 320 للبيع', equipmentType: 'EXCAVATOR' as const, listingType: 'EQUIPMENT_SALE' as const, make: 'Caterpillar', model: '320', year: 2021, price: 35000, condition: 'USED' as const, governorate: 'مسقط' },
    { title: 'رافعة تادانو 50 طن للإيجار', equipmentType: 'CRANE' as const, listingType: 'EQUIPMENT_RENT' as const, make: 'Tadano', model: 'GR-500', year: 2022, dailyPrice: 120, monthlyPrice: 2800, condition: 'USED' as const, governorate: 'ظفار' },
    { title: 'مولد كهربائي كاتربيلر 200 كيلو', equipmentType: 'GENERATOR' as const, listingType: 'EQUIPMENT_SALE' as const, make: 'Caterpillar', model: 'C9', year: 2023, price: 8000, condition: 'LIKE_NEW' as const, governorate: 'مسقط' },
    { title: 'شيول كوماتسو WA380 للبيع', equipmentType: 'LOADER' as const, listingType: 'EQUIPMENT_SALE' as const, make: 'Komatsu', model: 'WA380', year: 2020, price: 28000, condition: 'USED' as const, governorate: 'الداخلية' },
    { title: 'فوركلفت تويوتا 3 طن للإيجار', equipmentType: 'FORKLIFT' as const, listingType: 'EQUIPMENT_RENT' as const, make: 'Toyota', model: '8FD30', year: 2023, dailyPrice: 25, weeklyPrice: 150, monthlyPrice: 500, condition: 'LIKE_NEW' as const, governorate: 'مسقط' },
  ];
  for (const e of equipment) {
    const { price, dailyPrice, weeklyPrice, monthlyPrice, ...rest } = e;
    await prisma.equipmentListing.create({
      data: {
        ...rest,
        slug: slug(e.title),
        description: `${e.title} - معدة بحالة جيدة، ساعات عمل قليلة. تواصل للمعاينة والتفاوض.`,
        ...(price !== undefined ? { price } : {}),
        ...(dailyPrice !== undefined ? { dailyPrice } : {}),
        ...(weeklyPrice !== undefined ? { weeklyPrice } : {}),
        ...(monthlyPrice !== undefined ? { monthlyPrice } : {}),
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Equipment created');

  // ═══════════════════════════════════════
  // 4. Jobs (DriverJob)
  // ═══════════════════════════════════════
  const jobs = [
    { title: 'مطلوب سائق توصيل طلبات - مسقط', jobType: 'HIRING' as const, employmentType: 'FULL_TIME' as const, salary: 350, salaryPeriod: 'MONTHLY' as const, licenseTypes: ['LIGHT' as const], experienceYears: 2, governorate: 'مسقط' },
    { title: 'سائق باص مدرسي - صحار', jobType: 'HIRING' as const, employmentType: 'FULL_TIME' as const, salary: 400, salaryPeriod: 'MONTHLY' as const, licenseTypes: ['BUS' as const], experienceYears: 5, governorate: 'الباطنة شمال' },
    { title: 'سائق نقل ثقيل خبرة', jobType: 'HIRING' as const, employmentType: 'CONTRACT' as const, salary: 500, salaryPeriod: 'MONTHLY' as const, licenseTypes: ['HEAVY' as const, 'TRANSPORT' as const], experienceYears: 8, governorate: 'ظفار' },
    { title: 'أبحث عن عمل - سائق خاص', jobType: 'OFFERING' as const, employmentType: 'FULL_TIME' as const, salary: 300, salaryPeriod: 'MONTHLY' as const, licenseTypes: ['LIGHT' as const], experienceYears: 10, governorate: 'مسقط' },
    { title: 'مطلوب سائق تاكسي - صلالة', jobType: 'HIRING' as const, employmentType: 'PART_TIME' as const, salary: 15, salaryPeriod: 'DAILY' as const, licenseTypes: ['LIGHT' as const, 'TRANSPORT' as const], experienceYears: 3, governorate: 'ظفار' },
  ];
  for (const j of jobs) {
    await prisma.driverJob.create({
      data: {
        ...j,
        slug: slug(j.title),
        description: `${j.title} - فرصة عمل مميزة. يرجى التواصل للمزيد من التفاصيل والشروط.`,
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Jobs created');

  // ═══════════════════════════════════════
  // 5. Spare Parts (SparePart)
  // ═══════════════════════════════════════
  const parts = [
    { title: 'محرك تويوتا 2GR-FE مستعمل', partCategory: 'ENGINE' as const, condition: 'USED' as const, price: 850, compatibleMakes: ['Toyota'], compatibleModels: ['Camry', 'Aurion'], yearFrom: 2012, yearTo: 2018 },
    { title: 'صدام أمامي نيسان باترول أصلي', partCategory: 'BODY' as const, condition: 'NEW' as const, price: 280, compatibleMakes: ['Nissan'], compatibleModels: ['Patrol'], isOriginal: true },
    { title: 'بطارية فارتا 80 أمبير', partCategory: 'BATTERIES' as const, condition: 'NEW' as const, price: 35, compatibleMakes: ['Toyota', 'Nissan', 'Hyundai', 'Kia'] },
    { title: 'طقم فرامل سيراميك لاند كروزر', partCategory: 'BRAKES' as const, condition: 'NEW' as const, price: 120, compatibleMakes: ['Toyota'], compatibleModels: ['Land Cruiser'], yearFrom: 2016, yearTo: 2024, isOriginal: true },
    { title: 'إطارات بريجستون 265/65R17', partCategory: 'TIRES' as const, condition: 'NEW' as const, price: 45, compatibleMakes: ['Toyota', 'Nissan', 'Mitsubishi'] },
  ];
  for (const p of parts) {
    const { isOriginal, compatibleMakes, compatibleModels, yearFrom, yearTo, ...rest } = p;
    await prisma.sparePart.create({
      data: {
        ...rest,
        slug: slug(p.title),
        description: `${p.title} - قطعة بحالة ممتازة. الشحن متاح لجميع محافظات السلطنة.`,
        currency: 'OMR',
        governorate: 'مسقط',
        city: 'السيب',
        status: 'ACTIVE',
        sellerId: uid,
        ...(isOriginal !== undefined ? { isOriginal } : {}),
        ...(compatibleMakes ? { compatibleMakes } : {}),
        ...(compatibleModels ? { compatibleModels } : {}),
        ...(yearFrom !== undefined ? { yearFrom } : {}),
        ...(yearTo !== undefined ? { yearTo } : {}),
      },
    });
  }
  console.log('✅ 5 Spare Parts created');

  // ═══════════════════════════════════════
  // 6. Car Services (CarService)
  // ═══════════════════════════════════════
  const services = [
    { title: 'ورشة الخليج للصيانة العامة', serviceType: 'MAINTENANCE' as const, providerType: 'WORKSHOP' as const, providerName: 'ورشة الخليج', priceFrom: 15, priceTo: 500, governorate: 'مسقط', city: 'الخوض' },
    { title: 'مغسلة بريميوم كار واش', serviceType: 'CLEANING' as const, providerType: 'COMPANY' as const, providerName: 'بريميوم كار واش', priceFrom: 3, priceTo: 25, isHomeService: true, governorate: 'مسقط', city: 'بوشر' },
    { title: 'فحص سيارات قبل الشراء', serviceType: 'INSPECTION' as const, providerType: 'INDIVIDUAL' as const, providerName: 'مهندس أحمد', priceFrom: 15, priceTo: 30, isHomeService: true, governorate: 'مسقط' },
    { title: 'ورشة سمكرة ودهان متنقلة', serviceType: 'BODYWORK' as const, providerType: 'MOBILE' as const, providerName: 'ورشة المتميز', priceFrom: 20, priceTo: 200, isHomeService: true, governorate: 'ظفار', city: 'صلالة' },
    { title: 'تركيب إكسسوارات وتظليل', serviceType: 'ACCESSORIES_INSTALL' as const, providerType: 'WORKSHOP' as const, providerName: 'اوتو ستايل', priceFrom: 10, priceTo: 150, governorate: 'مسقط', city: 'السيب' },
  ];
  for (const s of services) {
    await prisma.carService.create({
      data: {
        ...s,
        slug: slug(s.title),
        description: `${s.title} - خدمة احترافية بأسعار منافسة. تواصل معنا لحجز موعد.`,
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Car Services created');

  // ═══════════════════════════════════════
  // 7. Transport (TransportService)
  // ═══════════════════════════════════════
  const transports = [
    { title: 'نقل بضائع داخل مسقط', transportType: 'CARGO' as const, providerType: 'COMPANY' as const, providerName: 'شركة النقل السريع', pricingType: 'PER_TRIP' as const, basePrice: 25, governorate: 'مسقط' },
    { title: 'نقل أثاث منازل - عمان', transportType: 'FURNITURE' as const, providerType: 'COMPANY' as const, providerName: 'نقل الأمان', pricingType: 'FIXED' as const, basePrice: 80, governorate: 'مسقط' },
    { title: 'خدمة توصيل طرود سريعة', transportType: 'DELIVERY' as const, providerType: 'INDIVIDUAL' as const, providerName: 'توصيل إكسبرس', pricingType: 'PER_KM' as const, pricePerKm: 0.5, governorate: 'مسقط' },
    { title: 'نقل معدات ثقيلة - لوبد', transportType: 'HEAVY_TRANSPORT' as const, providerType: 'COMPANY' as const, providerName: 'النقل الثقيل', pricingType: 'NEGOTIABLE_PRICE' as const, basePrice: 200, governorate: 'الباطنة شمال' },
    { title: 'إيجار شاحنات بيك أب', transportType: 'TRUCK_RENTAL' as const, providerType: 'INDIVIDUAL' as const, providerName: 'أبو محمد للنقل', pricingType: 'HOURLY' as const, basePrice: 8, governorate: 'ظفار' },
  ];
  for (const tr of transports) {
    const { basePrice, pricePerKm, ...rest } = tr;
    await prisma.transportService.create({
      data: {
        ...rest,
        slug: slug(tr.title),
        description: `${tr.title} - خدمة نقل موثوقة وآمنة. اتصل بنا لحجز موعد.`,
        ...(basePrice !== undefined ? { basePrice } : {}),
        ...(pricePerKm !== undefined ? { pricePerKm } : {}),
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Transport Services created');

  // ═══════════════════════════════════════
  // 8. Trips (TripService)
  // ═══════════════════════════════════════
  const trips = [
    { title: 'اشتراك باص مسقط - صحار يومي', tripType: 'BUS_SUBSCRIPTION' as const, routeFrom: 'مسقط', routeTo: 'صحار', scheduleType: 'SCHEDULE_DAILY' as const, priceMonthly: 45, providerName: 'النقل المشترك', governorate: 'مسقط', capacity: 40, availableSeats: 15 },
    { title: 'نقل مدرسي - مدرسة النور', tripType: 'SCHOOL_TRANSPORT' as const, routeFrom: 'السيب', routeTo: 'بوشر', scheduleType: 'SCHEDULE_DAILY' as const, priceMonthly: 25, providerName: 'مدرسة النور', governorate: 'مسقط', capacity: 25, availableSeats: 8 },
    { title: 'رحلة سياحية إلى جبل شمس', tripType: 'TOURISM' as const, routeFrom: 'مسقط', routeTo: 'جبل شمس', scheduleType: 'ONE_TIME' as const, pricePerTrip: 15, providerName: 'عمان تورز', governorate: 'الداخلية', capacity: 20, availableSeats: 20 },
    { title: 'باص موظفين - المنطقة الصناعية', tripType: 'CORPORATE' as const, routeFrom: 'مسقط', routeTo: 'صحار المنطقة الصناعية', scheduleType: 'SCHEDULE_DAILY' as const, priceMonthly: 35, providerName: 'شركة النقل الجماعي', governorate: 'الباطنة شمال', capacity: 50, availableSeats: 10 },
    { title: 'كاربول مسقط - نزوى أسبوعي', tripType: 'CARPOOLING' as const, routeFrom: 'مسقط', routeTo: 'نزوى', scheduleType: 'SCHEDULE_WEEKLY' as const, pricePerTrip: 5, providerName: 'مشاركة الرحلات', governorate: 'مسقط', capacity: 4, availableSeats: 3 },
  ];
  for (const t of trips) {
    const { pricePerTrip, priceMonthly, ...rest } = t;
    await prisma.tripService.create({
      data: {
        ...rest,
        slug: slug(t.title),
        description: `${t.title} - رحلات منتظمة ومريحة. احجز مقعدك الآن.`,
        ...(pricePerTrip !== undefined ? { pricePerTrip } : {}),
        ...(priceMonthly !== undefined ? { priceMonthly } : {}),
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Trips created');

  // ═══════════════════════════════════════
  // 9. Insurance (InsuranceOffer)
  // ═══════════════════════════════════════
  const insurances = [
    { title: 'تأمين شامل - شركة ظفار للتأمين', offerType: 'CAR_COMPREHENSIVE' as const, providerName: 'ظفار للتأمين', priceFrom: 180, coverageType: 'شامل كامل', governorate: 'مسقط' },
    { title: 'تأمين ضد الغير - الأهلية للتأمين', offerType: 'CAR_THIRD_PARTY' as const, providerName: 'الأهلية للتأمين', priceFrom: 55, coverageType: 'ضد الغير', governorate: 'مسقط' },
    { title: 'تأمين بحري للقوارب', offerType: 'MARINE_INSURANCE' as const, providerName: 'عمان للتأمين', priceFrom: 250, coverageType: 'بحري شامل', governorate: 'مسقط' },
    { title: 'تمويل سيارات بدون دفعة أولى', offerType: 'FINANCING' as const, providerName: 'بنك مسقط', priceFrom: 0, coverageType: 'تمويل إسلامي' },
    { title: 'تأجير تمويلي - ليس', offerType: 'LEASE' as const, providerName: 'شركة أوريكس للتأجير', priceFrom: 150, coverageType: 'تأجير تمويلي' },
  ];
  for (const i of insurances) {
    await prisma.insuranceOffer.create({
      data: {
        ...i,
        slug: slug(i.title),
        description: `${i.title} - عروض مميزة وأسعار تنافسية. تواصل معنا للحصول على عرض سعر.`,
        currency: 'OMR',
        features: ['خدمة عملاء 24/7', 'شبكة ورش معتمدة'],
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Insurance Offers created');

  // ═══════════════════════════════════════
  // 10. Operators (OperatorListing)
  // ═══════════════════════════════════════
  const operators = [
    { title: 'سائق معدات ثقيلة - خبرة 10 سنوات', operatorType: 'DRIVER' as const, specializations: ['حفارات', 'شيول'], experienceYears: 10, dailyRate: 25, governorate: 'مسقط' },
    { title: 'مشغل رافعة برجية معتمد', operatorType: 'OPERATOR' as const, specializations: ['رافعات برجية', 'رافعات متحركة'], experienceYears: 8, dailyRate: 35, governorate: 'ظفار' },
    { title: 'فني صيانة معدات هيدروليك', operatorType: 'TECHNICIAN' as const, specializations: ['هيدروليك', 'محركات ديزل'], experienceYears: 12, hourlyRate: 8, governorate: 'مسقط' },
    { title: 'فني صيانة مولدات كهربائية', operatorType: 'MAINTENANCE' as const, specializations: ['مولدات', 'كهرباء صناعية'], experienceYears: 6, dailyRate: 20, governorate: 'الداخلية' },
    { title: 'مشغل بلدوزر وجرافة', operatorType: 'OPERATOR' as const, specializations: ['بلدوزر', 'جرافة'], experienceYears: 15, dailyRate: 30, governorate: 'الباطنة شمال' },
  ];
  for (const o of operators) {
    const { dailyRate, hourlyRate, ...rest } = o;
    await prisma.operatorListing.create({
      data: {
        ...rest,
        slug: slug(o.title),
        description: `${o.title} - متاح للعمل فورًا. شهادات معتمدة وخبرة واسعة.`,
        ...(dailyRate !== undefined ? { dailyRate } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate } : {}),
        currency: 'OMR',
        status: 'ACTIVE',
        userId: uid,
      },
    });
  }
  console.log('✅ 5 Operators created');

  console.log('\n🎉 Done! 50 test ads created (5 per section × 10 sections)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
