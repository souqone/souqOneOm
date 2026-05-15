import { PrismaClient, BusType } from '@prisma/client';

const prisma = new PrismaClient();

const data: {
  name: string;
  nameAr: string;
  country: string;
  models: {
    name: string;
    nameAr: string;
    busType: BusType;
    capacity: number;
    aliases: string[];
  }[];
}[] = [
  {
    name: 'Toyota', nameAr: 'تويوتا', country: 'Japan',
    models: [
      { name: 'Coaster', nameAr: 'كوستر', busType: BusType.COASTER, capacity: 30, aliases: ['كوستر', 'Coaster', 'توبيوس', 'تويوتا كوستر'] },
      { name: 'HiAce', nameAr: 'هاياس', busType: BusType.MINI_BUS, capacity: 14, aliases: ['هايس', 'هاياس', 'HiAce', 'هايس مرسيدس'] },
      { name: 'HiAce Commuter', nameAr: 'هاياس كومتر', busType: BusType.MINI_BUS, capacity: 15, aliases: ['كومتر', 'Commuter'] },
    ],
  },
  {
    name: 'Mitsubishi', nameAr: 'ميتسوبيشي', country: 'Japan',
    models: [
      { name: 'Rosa', nameAr: 'روزا', busType: BusType.MINI_BUS, capacity: 26, aliases: ['روزا', 'Rosa', 'ميتسوبيشي روزا'] },
      { name: 'Fuso Rosa', nameAr: 'فوسو روزا', busType: BusType.MINI_BUS, capacity: 29, aliases: ['فوسو', 'Fuso', 'Rosa Fuso'] },
      { name: 'Fuso Aero Midi', nameAr: 'فوسو ايرو ميدي', busType: BusType.MEDIUM_BUS, capacity: 45, aliases: ['ايرو ميدي', 'Aero Midi', 'فوسو ميدي'] },
    ],
  },
  {
    name: 'Isuzu', nameAr: 'ايسوزو', country: 'Japan',
    models: [
      { name: 'Journey', nameAr: 'جيرني', busType: BusType.MINI_BUS, capacity: 22, aliases: ['جيرني', 'Journey', 'ايسوزو جيرني'] },
      { name: 'NQR', nameAr: 'NQR', busType: BusType.MEDIUM_BUS, capacity: 33, aliases: ['NQR', 'ايسوزو NQR'] },
    ],
  },
  {
    name: 'Hyundai', nameAr: 'هيونداي', country: 'South Korea',
    models: [
      { name: 'County', nameAr: 'كاونتي', busType: BusType.MINI_BUS, capacity: 25, aliases: ['كاونتي', 'County', 'هيونداي كاونتي'] },
      { name: 'Universe', nameAr: 'يونيفيرس', busType: BusType.LARGE_BUS, capacity: 45, aliases: ['يونيفيرس', 'Universe'] },
      { name: 'Aero City', nameAr: 'ايرو سيتي', busType: BusType.LARGE_BUS, capacity: 45, aliases: ['ايرو سيتي', 'Aero City'] },
      { name: 'Super Aero City', nameAr: 'سوبر ايرو سيتي', busType: BusType.LARGE_BUS, capacity: 47, aliases: ['سوبر ايرو', 'Super Aero'] },
    ],
  },
  {
    name: 'Kia', nameAr: 'كيا', country: 'South Korea',
    models: [
      { name: 'Granbird', nameAr: 'جرانبيرد', busType: BusType.LARGE_BUS, capacity: 45, aliases: ['جرانبيرد', 'Granbird', 'كيا جرانبيرد'] },
      { name: 'Combi', nameAr: 'كومبي', busType: BusType.MINI_BUS, capacity: 24, aliases: ['كومبي', 'Combi'] },
      { name: 'Besta', nameAr: 'بيستا', busType: BusType.MINI_BUS, capacity: 12, aliases: ['بيستا', 'Besta'] },
    ],
  },
  {
    name: 'Higer', nameAr: 'هيجر', country: 'China',
    models: [
      { name: 'KLQ6109', nameAr: 'هيجر كبير', busType: BusType.LARGE_BUS, capacity: 55, aliases: ['هيجر', 'Higer', 'هيجر 55'] },
      { name: 'KLQ6796', nameAr: 'هيجر متوسط', busType: BusType.MEDIUM_BUS, capacity: 35, aliases: ['هيجر 35', 'KLQ6796'] },
      { name: 'H6', nameAr: 'هيجر H6', busType: BusType.MINI_BUS, capacity: 26, aliases: ['H6', 'هيجر H6'] },
    ],
  },
  {
    name: 'Yutong', nameAr: 'يوتونج', country: 'China',
    models: [
      { name: 'ZK6122H', nameAr: 'يوتونج كبير', busType: BusType.LARGE_BUS, capacity: 55, aliases: ['يوتونج', 'Yutong', 'يوتونج 55'] },
      { name: 'ZK6852H', nameAr: 'يوتونج متوسط', busType: BusType.MEDIUM_BUS, capacity: 39, aliases: ['يوتونج متوسط', 'ZK6852H'] },
      { name: 'ZK6530', nameAr: 'يوتونج صغير', busType: BusType.MINI_BUS, capacity: 23, aliases: ['يوتونج صغير', 'ZK6530'] },
    ],
  },
  {
    name: 'King Long', nameAr: 'كينج لونج', country: 'China',
    models: [
      { name: 'XMQ6127', nameAr: 'كينج لونج كبير', busType: BusType.LARGE_BUS, capacity: 53, aliases: ['كينج لونج', 'King Long'] },
      { name: 'XMQ6900', nameAr: 'كينج لونج متوسط', busType: BusType.MEDIUM_BUS, capacity: 37, aliases: ['كينج لونج متوسط', 'XMQ6900'] },
    ],
  },
  {
    name: 'Golden Dragon', nameAr: 'جولدن دراجون', country: 'China',
    models: [
      { name: 'XML6127', nameAr: 'جولدن دراجون كبير', busType: BusType.LARGE_BUS, capacity: 53, aliases: ['جولدن دراجون', 'Golden Dragon'] },
      { name: 'XML6840', nameAr: 'جولدن دراجون متوسط', busType: BusType.MEDIUM_BUS, capacity: 33, aliases: ['جولدن متوسط', 'XML6840'] },
    ],
  },
  {
    name: 'Mercedes-Benz', nameAr: 'مرسيدس بنز', country: 'Germany',
    models: [
      { name: 'Sprinter', nameAr: 'سبرينتر', busType: BusType.MINI_BUS, capacity: 20, aliases: ['سبرينتر', 'Sprinter', 'مرسيدس سبرينتر'] },
      { name: 'Tourismo', nameAr: 'توريسمو', busType: BusType.LARGE_BUS, capacity: 49, aliases: ['توريسمو', 'Tourismo', 'مرسيدس سياحي'] },
      { name: 'Intouro', nameAr: 'انتورو', busType: BusType.LARGE_BUS, capacity: 45, aliases: ['انتورو', 'Intouro'] },
      { name: 'Citaro', nameAr: 'سيتارو', busType: BusType.LARGE_BUS, capacity: 50, aliases: ['سيتارو', 'Citaro'] },
    ],
  },
  {
    name: 'Volvo', nameAr: 'فولفو', country: 'Sweden',
    models: [
      { name: 'B8R', nameAr: 'فولفو B8R', busType: BusType.LARGE_BUS, capacity: 50, aliases: ['فولفو', 'Volvo B8R', 'B8R'] },
      { name: '9700', nameAr: 'فولفو 9700', busType: BusType.LARGE_BUS, capacity: 55, aliases: ['فولفو 9700', 'Volvo 9700'] },
    ],
  },
  {
    name: 'Scania', nameAr: 'سكانيا', country: 'Sweden',
    models: [
      { name: 'Touring', nameAr: 'سكانيا توريج', busType: BusType.LARGE_BUS, capacity: 49, aliases: ['سكانيا', 'Scania Touring'] },
      { name: 'Interlink', nameAr: 'انترلينك', busType: BusType.LARGE_BUS, capacity: 55, aliases: ['انترلينك', 'Interlink'] },
      { name: 'OmniCity', nameAr: 'اومني سيتي', busType: BusType.LARGE_BUS, capacity: 50, aliases: ['اومني سيتي', 'OmniCity'] },
    ],
  },
  {
    name: 'Zhongtong', nameAr: 'زونجتونج', country: 'China',
    models: [
      { name: 'LCK6128H', nameAr: 'زونجتونج كبير', busType: BusType.LARGE_BUS, capacity: 55, aliases: ['زونجتونج', 'Zhongtong'] },
      { name: 'LCK6790H', nameAr: 'زونجتونج متوسط', busType: BusType.MEDIUM_BUS, capacity: 35, aliases: ['زونجتونج متوسط'] },
    ],
  },
];

async function main() {
  console.log('Seeding bus manufacturers and models...');
  let totalModels = 0;

  for (const mfr of data) {
    const manufacturer = await prisma.busManufacturer.upsert({
      where: { name: mfr.name },
      update: {},
      create: { name: mfr.name, nameAr: mfr.nameAr, country: mfr.country },
    });

    for (const m of mfr.models) {
      await prisma.busModel.upsert({
        where: { manufacturerId_name: { manufacturerId: manufacturer.id, name: m.name } },
        update: {},
        create: {
          name: m.name,
          nameAr: m.nameAr,
          busType: m.busType,
          capacity: m.capacity,
          aliases: m.aliases,
          manufacturerId: manufacturer.id,
        },
      });
      totalModels++;
    }

    console.log(`  ✓ ${mfr.name} (${mfr.models.length} models)`);
  }

  console.log(`\nDone — ${data.length} manufacturers, ${totalModels} models seeded.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
