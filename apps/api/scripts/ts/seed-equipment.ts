import { PrismaClient, EquipmentType, EquipmentListingType, ItemCondition, ListingStatus } from '@prisma/client';

const prisma = new PrismaClient();

const USER_ID = 'cmnkvxvcz0000ra6s0ygryofv';

const equipmentData = [
  { titleAr: 'حفارة كوماتسو PC200-8 موديل 2018', type: 'EXCAVATOR', make: 'Komatsu', model: 'PC200-8', year: 2018, price: 25000 },
  { titleAr: 'رافعة شوكية تويوتا 3 طن ديزل', type: 'FORKLIFT', make: 'Toyota', model: '7FD30', year: 2020, price: 8500 },
  { titleAr: 'شيول كاتربيلر 966H بحالة ممتازة', type: 'LOADER', make: 'Caterpillar', model: '966H', year: 2015, price: 32000 },
  { titleAr: 'كرين تادانو 50 طن موديل 2012', type: 'CRANE', make: 'Tadano', model: 'GR-500XL', year: 2012, price: 45000 },
  { titleAr: 'بولدوزر كاتربيلر D8R للبيع', type: 'BULLDOZER', make: 'Caterpillar', model: 'D8R', year: 2010, price: 28000 },
  { titleAr: 'شاحنة مرسيدس اكتروس 2040 قلاب', type: 'DUMP_TRUCK', make: 'Mercedes', model: 'Actros 2040', year: 2014, price: 18000 },
  { titleAr: 'مولد كهرباء بيركنز 100 كيلو فولت', type: 'GENERATOR', make: 'Perkins', model: '100kVA', year: 2021, price: 4200 },
  { titleAr: 'خلاطة خرسانة مان 2016', type: 'CONCRETE_MIXER', make: 'MAN', model: 'TGS 33.400', year: 2016, price: 22000 },
  { titleAr: 'حفارة هيدروليكية هيونداي 210', type: 'EXCAVATOR', make: 'Hyundai', model: 'R210LC-7', year: 2017, price: 19500 },
  { titleAr: 'رافعة شوكية هلي 5 طن جديدة', type: 'FORKLIFT', make: 'Heli', model: 'CPCD50', year: 2023, price: 12000 },
  { titleAr: 'شيول كوماتسو WA470 نظيف جدا', type: 'LOADER', make: 'Komatsu', model: 'WA470-6', year: 2013, price: 26000 },
  { titleAr: 'بوبكات S130 موديل 2019', type: 'OTHER_EQUIPMENT', make: 'Bobcat', model: 'S130', year: 2019, price: 7500 },
  { titleAr: 'شاحنة ماء ايسوزو 2015', type: 'WATER_TANKER', make: 'Isuzu', model: 'FVR', year: 2015, price: 14000 },
  { titleAr: 'رافع تلسكوبي جيه سي بي 17 متر', type: 'OTHER_EQUIPMENT', make: 'JCB', model: '540-170', year: 2018, price: 21000 },
  { titleAr: 'مدحلة اسفلت داينباك 2012', type: 'OTHER_EQUIPMENT', make: 'Dynapac', model: 'CC424HF', year: 2012, price: 15500 },
  { titleAr: 'كمبريسر هواء اطلس كوبكو', type: 'COMPRESSOR', make: 'Atlas Copco', model: 'XAS 97', year: 2020, price: 3800 },
  { titleAr: 'رافعة شوكية كهربائية لاندي 2 طن', type: 'FORKLIFT', make: 'Linde', model: 'E20', year: 2019, price: 9500 },
  { titleAr: 'قلاب فولفو FMX 400 موديل 2017', type: 'DUMP_TRUCK', make: 'Volvo', model: 'FMX 400', year: 2017, price: 24000 },
  { titleAr: 'حفارة كوماتسو PC300 للبيع', type: 'EXCAVATOR', make: 'Komatsu', model: 'PC300-7', year: 2011, price: 21000 },
  { titleAr: 'شيول كاتربيلر 950GC بحالة الوكالة', type: 'LOADER', make: 'Caterpillar', model: '950GC', year: 2022, price: 38000 },
];

const governorates = ['Muscat', 'Dhofar', 'North Al Batinah', 'South Al Batinah', 'Al Dakhiliyah'];

async function main() {
  console.log('Start seeding equipment listings...');

  for (let i = 0; i < equipmentData.length; i++) {
    const data = equipmentData[i];
    const slug = `${data.type.toLowerCase()}-${data.make.toLowerCase()}-${data.model.toLowerCase().replace(/ /g, '-')}-${Math.random().toString(36).substring(7)}`;
    
    // Choose images based on type if possible, but we only have 6 total.
    // Let's just rotate them and pick 5.
    const imageIndices = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 5);

    await prisma.equipmentListing.create({
      data: {
        title: data.titleAr,
        slug: slug,
        description: `للبيع ${data.titleAr} بحالة جيدة جداً، الموديل ${data.year}، الماركة ${data.make}. المعدة موجودة في سلطنة عمان وجاهزة للمعاينة ومفحوصة بالكامل. السعر قابل للتفاوض البسيط للجادين.`,
        equipmentType: data.type as EquipmentType,
        listingType: 'EQUIPMENT_SALE',
        make: data.make,
        model: data.model,
        year: data.year,
        price: data.price,
        currency: 'OMR',
        governorate: governorates[Math.floor(Math.random() * governorates.length)],
        status: 'ACTIVE',
        userId: USER_ID,
        images: {
          create: imageIndices.map((idx, order) => ({
            url: `/uploads/eq_${idx}.png`,
            isPrimary: order === 0,
            order: order,
          }))
        }
      }
    });
    console.log(`Created listing: ${data.titleAr}`);
  }

  console.log('Seeding finished!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
