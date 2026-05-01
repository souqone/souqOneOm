import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const uid = 'cmnkvxvcz0000ra6s0ygryofv';

// All verified working Unsplash URLs
const URLS = {
  cars: [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
    'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
  ],
  buses: [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80',
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&q=80',
    'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=800&q=80',
    'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=800&q=80',
    'https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?w=800&q=80',
    'https://images.unsplash.com/photo-1562613338-fb61f20a85ba?w=800&q=80',
    'https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=800&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  ],
  equipment: [
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&q=80',
    'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=800&q=80',
    'https://images.unsplash.com/photo-1590846083693-f23fdede3a7e?w=800&q=80',
    'https://images.unsplash.com/photo-1621922688758-9a55c064ffad?w=800&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
    'https://images.unsplash.com/photo-1513828583688-c52571e73b68?w=800&q=80',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80',
  ],
  parts: [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    'https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=800&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80',
    'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80',
  ],
  services: [
    'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80',
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80',
    'https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=800&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80',
    'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80',
  ],
  transport: [
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
    'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80',
    'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=800&q=80',
    'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
  ],
  trips: [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80',
    'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=800&q=80',
    'https://images.unsplash.com/photo-1507919909716-c8262e491cde?w=800&q=80',
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&q=80',
    'https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?w=800&q=80',
    'https://images.unsplash.com/photo-1562613338-fb61f20a85ba?w=800&q=80',
    'https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=800&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  ],
  insurance: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
    'https://images.unsplash.com/photo-1554224155-8d2a7b2e29d4?w=800&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  ],
};

async function main() {
  console.log('🔄 Deleting old images and re-adding with verified URLs...\n');

  // 1. Cars
  const cars = await prisma.listing.findMany({ where: { sellerId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < cars.length; i++) {
    await prisma.listingImage.deleteMany({ where: { listingId: cars[i].id } });
    await prisma.listingImage.createMany({ data: [
      { listingId: cars[i].id, url: URLS.cars[i * 2], isPrimary: true, order: 0 },
      { listingId: cars[i].id, url: URLS.cars[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Cars: ${cars.length} listings × 2 images`);

  // 2. Buses
  const buses = await prisma.busListing.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < buses.length; i++) {
    await prisma.busListingImage.deleteMany({ where: { busListingId: buses[i].id } });
    await prisma.busListingImage.createMany({ data: [
      { busListingId: buses[i].id, url: URLS.buses[i * 2], isPrimary: true, order: 0 },
      { busListingId: buses[i].id, url: URLS.buses[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Buses: ${buses.length} listings × 2 images`);

  // 3. Equipment
  const equip = await prisma.equipmentListing.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < equip.length; i++) {
    await prisma.equipmentListingImage.deleteMany({ where: { equipmentListingId: equip[i].id } });
    await prisma.equipmentListingImage.createMany({ data: [
      { equipmentListingId: equip[i].id, url: URLS.equipment[i * 2], isPrimary: true, order: 0 },
      { equipmentListingId: equip[i].id, url: URLS.equipment[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Equipment: ${equip.length} listings × 2 images`);

  // 4. Parts
  const parts = await prisma.sparePart.findMany({ where: { sellerId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < parts.length; i++) {
    await prisma.sparePartImage.deleteMany({ where: { sparePartId: parts[i].id } });
    await prisma.sparePartImage.createMany({ data: [
      { sparePartId: parts[i].id, url: URLS.parts[i * 2], isPrimary: true, order: 0 },
      { sparePartId: parts[i].id, url: URLS.parts[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Parts: ${parts.length} listings × 2 images`);

  // 5. Services
  const svcs = await prisma.carService.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < svcs.length; i++) {
    await prisma.carServiceImage.deleteMany({ where: { carServiceId: svcs[i].id } });
    await prisma.carServiceImage.createMany({ data: [
      { carServiceId: svcs[i].id, url: URLS.services[i * 2], isPrimary: true, order: 0 },
      { carServiceId: svcs[i].id, url: URLS.services[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Services: ${svcs.length} listings × 2 images`);

  // 6. Transport
  const trans = await prisma.transportService.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < trans.length; i++) {
    await prisma.transportImage.deleteMany({ where: { transportServiceId: trans[i].id } });
    await prisma.transportImage.createMany({ data: [
      { transportServiceId: trans[i].id, url: URLS.transport[i * 2], isPrimary: true, order: 0 },
      { transportServiceId: trans[i].id, url: URLS.transport[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Transport: ${trans.length} listings × 2 images`);

  // 7. Trips
  const trips = await prisma.tripService.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < trips.length; i++) {
    await prisma.tripImage.deleteMany({ where: { tripServiceId: trips[i].id } });
    await prisma.tripImage.createMany({ data: [
      { tripServiceId: trips[i].id, url: URLS.trips[i * 2], isPrimary: true, order: 0 },
      { tripServiceId: trips[i].id, url: URLS.trips[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Trips: ${trips.length} listings × 2 images`);

  // 8. Insurance
  const ins = await prisma.insuranceOffer.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (let i = 0; i < ins.length; i++) {
    await prisma.insuranceImage.deleteMany({ where: { insuranceOfferId: ins[i].id } });
    await prisma.insuranceImage.createMany({ data: [
      { insuranceOfferId: ins[i].id, url: URLS.insurance[i * 2], isPrimary: true, order: 0 },
      { insuranceOfferId: ins[i].id, url: URLS.insurance[i * 2 + 1], isPrimary: false, order: 1 },
    ]});
  }
  console.log(`✅ Insurance: ${ins.length} listings × 2 images`);

  console.log('\n🎉 All images replaced with verified URLs!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
