import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const governoratesData = [
  {
    nameAr: 'مسقط',
    nameEn: 'Muscat',
    wilayas: [
      { nameAr: 'مسقط', nameEn: 'Muscat' },
      { nameAr: 'مطرح', nameEn: 'Muttrah' },
      { nameAr: 'بوشر', nameEn: 'Bawshar' },
      { nameAr: 'السيب', nameEn: 'Al Seeb' },
      { nameAr: 'العامرات', nameEn: 'Al Amerat' },
      { nameAr: 'قريات', nameEn: 'Qurayyat' },
    ],
  },
  {
    nameAr: 'ظفار',
    nameEn: 'Dhofar',
    wilayas: [
      { nameAr: 'صلالة', nameEn: 'Salalah' },
      { nameAr: 'طاقة', nameEn: 'Taqah' },
      { nameAr: 'مرباط', nameEn: 'Mirbat' },
      { nameAr: 'سدح', nameEn: 'Sadah' },
      { nameAr: 'ثمريت', nameEn: 'Thumrait' },
      { nameAr: 'ضلكوت', nameEn: 'Dhalkut' },
      { nameAr: 'رخيوت', nameEn: 'Rakhyut' },
      { nameAr: 'مقشن', nameEn: 'Muqshin' },
      { nameAr: 'شليم وجزر الحلانيات', nameEn: 'Shalim and the Hallaniyat Islands' },
      { nameAr: 'المزيونة', nameEn: 'Al Mazyunah' },
    ],
  },
  {
    nameAr: 'مسندم',
    nameEn: 'Musandam',
    wilayas: [
      { nameAr: 'خصب', nameEn: 'Khasab' },
      { nameAr: 'بخاء', nameEn: 'Bukha' },
      { nameAr: 'دباء', nameEn: 'Dibba' },
      { nameAr: 'مدحاء', nameEn: 'Madha' },
    ],
  },
  {
    nameAr: 'البريمي',
    nameEn: 'Al Buraimi',
    wilayas: [
      { nameAr: 'البريمي', nameEn: 'Al Buraimi' },
      { nameAr: 'محضة', nameEn: 'Mahdah' },
      { nameAr: 'السنينة', nameEn: 'Al Sunaynah' },
    ],
  },
  {
    nameAr: 'الداخلية',
    nameEn: 'Ad Dakhiliyah',
    wilayas: [
      { nameAr: 'نزوى', nameEn: 'Nizwa' },
      { nameAr: 'بهلاء', nameEn: 'Bahla' },
      { nameAr: 'منح', nameEn: 'Manah' },
      { nameAr: 'الحمراء', nameEn: 'Al Hamra' },
      { nameAr: 'أدم', nameEn: 'Adam' },
      { nameAr: 'إزكي', nameEn: 'Izki' },
      { nameAr: 'سمائل', nameEn: 'Samail' },
      { nameAr: 'بدبد', nameEn: 'Bidbid' },
      { nameAr: 'الجبل الأخضر', nameEn: 'Al Jabal Al Akhdar' },
    ],
  },
  {
    nameAr: 'شمال الباطنة',
    nameEn: 'Al Batinah North',
    wilayas: [
      { nameAr: 'صحار', nameEn: 'Sohar' },
      { nameAr: 'شناص', nameEn: 'Shinas' },
      { nameAr: 'لوى', nameEn: 'Liwa' },
      { nameAr: 'صحم', nameEn: 'Saham' },
      { nameAr: 'الخابورة', nameEn: 'Al Khaburah' },
      { nameAr: 'السويق', nameEn: 'Al Suwayq' },
    ],
  },
  {
    nameAr: 'جنوب الباطنة',
    nameEn: 'Al Batinah South',
    wilayas: [
      { nameAr: 'الرستاق', nameEn: 'Rustaq' },
      { nameAr: 'العوابي', nameEn: 'Al Awabi' },
      { nameAr: 'نخل', nameEn: 'Nakhal' },
      { nameAr: 'وادي المعاول', nameEn: 'Wadi Al Maawil' },
      { nameAr: 'بركاء', nameEn: 'Barka' },
      { nameAr: 'المصنعة', nameEn: 'Al Musanaah' },
    ],
  },
  {
    nameAr: 'جنوب الشرقية',
    nameEn: 'Ash Sharqiyah South',
    wilayas: [
      { nameAr: 'صور', nameEn: 'Sur' },
      { nameAr: 'الكامل والوافي', nameEn: 'Al Kamil Wal Wafi' },
      { nameAr: 'جعلان بني بو حسن', nameEn: 'Jalan Bani Bu Hassan' },
      { nameAr: 'جعلان بني بو علي', nameEn: 'Jalan Bani Bu Ali' },
      { nameAr: 'مصيرة', nameEn: 'Masirah' },
    ],
  },
  {
    nameAr: 'شمال الشرقية',
    nameEn: 'Ash Sharqiyah North',
    wilayas: [
      { nameAr: 'إبراء', nameEn: 'Ibra' },
      { nameAr: 'المضيبي', nameEn: 'Al Mudhaibi' },
      { nameAr: 'بدية', nameEn: 'Bidiya' },
      { nameAr: 'القابل', nameEn: 'Al Qabil' },
      { nameAr: 'وادي بني خالد', nameEn: 'Wadi Bani Khalid' },
      { nameAr: 'دماء والطائيين', nameEn: 'Dima W\'attayeen' },
      { nameAr: 'سناو', nameEn: 'Sinaw' },
    ],
  },
  {
    nameAr: 'الظاهرة',
    nameEn: 'Ad Dhahirah',
    wilayas: [
      { nameAr: 'عبري', nameEn: 'Ibri' },
      { nameAr: 'ينقل', nameEn: 'Yanqul' },
      { nameAr: 'ضنك', nameEn: 'Dhank' },
    ],
  },
  {
    nameAr: 'الوسطى',
    nameEn: 'Al Wusta',
    wilayas: [
      { nameAr: 'هيما', nameEn: 'Haima' },
      { nameAr: 'محوت', nameEn: 'Mahout' },
      { nameAr: 'الدقم', nameEn: 'Duqm' },
      { nameAr: 'الجازر', nameEn: 'Al Jazir' },
    ],
  },
];

async function main() {
  console.log('Start seeding locations...');
  for (const govData of governoratesData) {
    const { wilayas, ...govInfo } = govData;
    
    const gov = await prisma.governorate.upsert({
      where: { nameEn: govInfo.nameEn },
      update: {},
      create: {
        ...govInfo,
        wilayas: {
          create: wilayas,
        },
      },
    });
    console.log(`Upserted Governorate: ${gov.nameEn} with ${wilayas.length} wilayas`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
