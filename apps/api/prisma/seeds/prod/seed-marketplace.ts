/**
 * Seed Script — بيانات اختبارية واقعية لسوق وان
 * يمسح كل الإعلانات الموجودة ويضيف 10 إعلانات لكل قسم
 * Run: npx ts-node prisma/seed-marketplace.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  CARS, CAR_IMGS,
  PARTS, PART_IMGS,
  SERVICES, SVC_IMGS,
  TRANSPORTS, TRUCK_IMGS,
  RENTALS,
  TRIPS, INSURANCE, JOBS,
} from './seed-data';

const prisma = new PrismaClient();

function slug(prefix: string, idx: number): string {
  return `${prefix}-${idx}-${Date.now().toString(36)}`;
}

async function main() {
  console.log('🧹 مسح كل البيانات القديمة...');

  // Delete in correct FK order
  await prisma.jobApplication.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.sparePartImage.deleteMany();
  await prisma.sparePart.deleteMany();
  await prisma.carServiceImage.deleteMany();
  await prisma.carService.deleteMany();
  await prisma.transportImage.deleteMany();
  await prisma.transportService.deleteMany();
  await prisma.tripService.deleteMany();
  await prisma.insuranceOffer.deleteMany();
  await prisma.driverJob.deleteMany();

  console.log('✅ تم مسح كل الإعلانات');

  // ─── Create / Find seed user ───
  const hash = await bcrypt.hash('Test1234!', 10);
  let user = await prisma.user.findUnique({ where: { email: 'seed@souqone.om' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'seed@souqone.om',
        username: 'souqone_test',
        displayName: 'معرض سوق وان للاختبار',
        phone: '+96891234567',
        governorate: 'مسقط',
        passwordHash: hash,
        isVerified: true,
      },
    });
    console.log('👤 تم إنشاء مستخدم الاختبار: seed@souqone.om / Test1234!');
  } else {
    console.log('👤 مستخدم الاختبار موجود');
  }

  const uid = user.id;

  // ════════════════════════════════════════════
  // 1) سيارات — Listings (10)
  // ════════════════════════════════════════════
  console.log('\n🚗 إضافة 10 إعلانات سيارات...');
  for (let i = 0; i < CARS.length; i++) {
    const c = CARS[i];
    const listing = await prisma.listing.create({
      data: {
        title: c.title, slug: slug(c.make + '-' + c.model, i),
        description: c.desc,
        make: c.make, model: c.model, year: c.year, mileage: c.mileage,
        fuelType: c.fuel, transmission: c.trans, bodyType: c.body,
        exteriorColor: c.color, interior: c.interior, engineSize: c.engine,
        horsepower: c.hp, doors: c.doors, seats: c.seats, driveType: c.drive,
        price: c.price, condition: c.cond,
        isPriceNegotiable: c.neg ?? false,
        governorate: c.gov, city: c.city,
        status: 'ACTIVE', listingType: 'SALE',
        sellerId: uid,
      },
    });
    const imgIdx = i % CAR_IMGS.length;
    await prisma.listingImage.createMany({
      data: [
        { listingId: listing.id, url: CAR_IMGS[imgIdx], isPrimary: true, order: 0 },
        { listingId: listing.id, url: CAR_IMGS[(imgIdx + 1) % CAR_IMGS.length], isPrimary: false, order: 1 },
      ],
    });
  }
  console.log('  ✅ 10 سيارات بيع');

  // ════════════════════════════════════════════
  // 1b) سيارات إيجار — Rental Listings (10)
  // ════════════════════════════════════════════
  console.log('🚘 إضافة 10 سيارات إيجار...');
  for (let i = 0; i < RENTALS.length; i++) {
    const r = RENTALS[i];
    const listing = await prisma.listing.create({
      data: {
        title: r.title, slug: slug('rental-' + r.make + '-' + r.model, i),
        description: r.desc,
        make: r.make, model: r.model, year: r.year, mileage: r.mileage,
        fuelType: r.fuel, transmission: r.trans, bodyType: r.body,
        exteriorColor: r.color, interior: r.interior, engineSize: r.engine,
        horsepower: r.hp, doors: r.doors, seats: r.seats, driveType: r.drive,
        price: 0, condition: 'USED',
        listingType: 'RENTAL',
        dailyPrice: r.daily, weeklyPrice: r.weekly, monthlyPrice: r.monthly,
        depositAmount: r.deposit, kmLimitPerDay: r.kmLimit,
        withDriver: r.withDriver, deliveryAvailable: r.delivery,
        insuranceIncluded: r.insurance,
        cancellationPolicy: r.cancel,
        governorate: r.gov, city: r.city,
        status: 'ACTIVE',
        sellerId: uid,
      },
    });
    const imgIdx = i % CAR_IMGS.length;
    await prisma.listingImage.createMany({
      data: [
        { listingId: listing.id, url: CAR_IMGS[imgIdx], isPrimary: true, order: 0 },
        { listingId: listing.id, url: CAR_IMGS[(imgIdx + 1) % CAR_IMGS.length], isPrimary: false, order: 1 },
      ],
    });
  }
  console.log('  ✅ 10 سيارات إيجار');

  // ════════════════════════════════════════════
  // 2) قطع غيار — SpareParts (10)
  // ════════════════════════════════════════════
  console.log('🔧 إضافة 10 قطع غيار...');
  for (let i = 0; i < PARTS.length; i++) {
    const p = PARTS[i];
    const part = await prisma.sparePart.create({
      data: {
        title: p.title, slug: slug('part', i), description: p.desc,
        partCategory: p.cat, condition: p.cond,
        compatibleMakes: p.makes, compatibleModels: p.models,
        yearFrom: p.yf, yearTo: p.yt, isOriginal: p.orig,
        price: p.price, governorate: p.gov, city: p.city,
        contactPhone: p.phone, whatsapp: p.phone,
        status: 'ACTIVE', sellerId: uid,
      },
    });
    await prisma.sparePartImage.create({
      data: { sparePartId: part.id, url: PART_IMGS[i % PART_IMGS.length], isPrimary: true, order: 0 },
    });
  }
  console.log('  ✅ 10 قطع غيار');

  // ════════════════════════════════════════════
  // 3) خدمات سيارات — CarServices (10)
  // ════════════════════════════════════════════
  console.log('🔩 إضافة 10 خدمات سيارات...');
  for (let i = 0; i < SERVICES.length; i++) {
    const s = SERVICES[i];
    const svc = await prisma.carService.create({
      data: {
        title: s.title, slug: slug('svc', i), description: s.desc,
        serviceType: s.type, providerType: s.ptype, providerName: s.pname,
        specializations: s.specs,
        priceFrom: s.pf, priceTo: s.pt,
        isHomeService: s.home,
        workingHoursOpen: s.open, workingHoursClose: s.close,
        workingDays: s.days,
        governorate: s.gov, city: s.city,
        contactPhone: s.phone, whatsapp: s.phone,
        status: 'ACTIVE', userId: uid,
      },
    });
    await prisma.carServiceImage.create({
      data: { carServiceId: svc.id, url: SVC_IMGS[i % SVC_IMGS.length], isPrimary: true, order: 0 },
    });
  }
  console.log('  ✅ 10 خدمات سيارات');

  // ════════════════════════════════════════════
  // 4) خدمات نقل — TransportServices (10)
  // ════════════════════════════════════════════
  console.log('🚚 إضافة 10 خدمات نقل...');
  for (let i = 0; i < TRANSPORTS.length; i++) {
    const t = TRANSPORTS[i];
    const ts = await prisma.transportService.create({
      data: {
        title: t.title, slug: slug('transport', i), description: t.desc,
        transportType: t.type, vehicleType: t.veh,
        vehicleCapacity: t.cap, coverageAreas: t.areas,
        pricingType: t.pricing, basePrice: t.base, pricePerKm: t.pkm,
        hasInsurance: t.ins, hasTracking: t.track,
        providerName: t.pname, providerType: t.ptype,
        governorate: t.gov, city: t.city,
        contactPhone: t.phone, whatsapp: t.phone,
        status: 'ACTIVE', userId: uid,
      },
    });
    await prisma.transportImage.create({
      data: { transportServiceId: ts.id, url: TRUCK_IMGS[i % TRUCK_IMGS.length], isPrimary: true, order: 0 },
    });
  }
  console.log('  ✅ 10 خدمات نقل');

  // ════════════════════════════════════════════
  // 5) رحلات واشتراكات — TripServices (10)
  // ════════════════════════════════════════════
  console.log('🚌 إضافة 10 رحلات واشتراكات...');
  for (let i = 0; i < TRIPS.length; i++) {
    const t = TRIPS[i];
    await prisma.tripService.create({
      data: {
        title: t.title, slug: slug('trip', i), description: t.desc,
        tripType: t.type, routeFrom: t.from, routeTo: t.to,
        routeStops: t.stops, scheduleType: t.sched,
        departureTimes: t.times, operatingDays: t.days,
        pricePerTrip: t.pt, priceMonthly: t.pm,
        vehicleType: t.veh, capacity: t.cap, availableSeats: t.seats,
        features: t.feat,
        providerName: t.pname, governorate: t.gov, city: t.city,
        contactPhone: t.phone, whatsapp: t.phone,
        status: 'ACTIVE', userId: uid,
      },
    });
  }
  console.log('  ✅ 10 رحلات واشتراكات');

  // ════════════════════════════════════════════
  // 6) تأمين وتمويل — InsuranceOffers (10)
  // ════════════════════════════════════════════
  console.log('🛡️ إضافة 10 عروض تأمين وتمويل...');
  for (let i = 0; i < INSURANCE.length; i++) {
    const ins = INSURANCE[i];
    await prisma.insuranceOffer.create({
      data: {
        title: ins.title, slug: slug('ins', i), description: ins.desc,
        offerType: ins.type, providerName: ins.pname,
        coverageType: ins.cov, priceFrom: ins.price,
        features: ins.feat,
        contactPhone: ins.phone,
        governorate: ins.gov,
        status: 'ACTIVE', userId: uid,
      },
    });
  }
  console.log('  ✅ 10 عروض تأمين وتمويل');

  // ════════════════════════════════════════════
  // 7) وظائف سائقين — DriverJobs (10)
  // ════════════════════════════════════════════
  console.log('🧑‍✈️ إضافة 10 وظائف سائقين...');
  for (let i = 0; i < JOBS.length; i++) {
    const j = JOBS[i];
    await prisma.driverJob.create({
      data: {
        title: j.title, slug: slug('job', i), description: j.desc,
        jobType: j.jtype, employmentType: j.etype,
        salary: j.salary, salaryPeriod: j.period,
        licenseTypes: j.license, experienceYears: j.exp,
        minAge: j.minAge, maxAge: j.maxAge,
        languages: j.langs,
        vehicleTypes: j.veh,
        hasOwnVehicle: j.hasVeh ?? false,
        governorate: j.gov, city: j.city,
        contactPhone: j.phone, whatsapp: j.phone,
        status: 'ACTIVE', userId: uid,
      },
    });
  }
  console.log('  ✅ 10 وظائف سائقين');

  console.log('\n🎉 تم الانتهاء! تمت إضافة 80 إعلان (10 لكل قسم)');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
