import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const additionalJobs = [
  {
    title: 'سائق توصيل متنوع يبحث عن عمل في البريمي',
    description: 'سائق خبرة 4 سنوات في توصيل الطلبات والبضائع. أمتلك بيك أب تويوتا نظيف. أبحث عن عمل ثابت أو مؤقت في البريمي والمناطق القريبة. متاح للعمل فوراً.',
    jobType: 'OFFERING',
    employmentType: 'FULL_TIME',
    salary: 280,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['LIGHT'],
    experienceYears: 4,
    languages: ['العربية', 'الإنجليزية'],
    nationality: 'عماني',
    vehicleTypes: ['بيك أب'],
    hasOwnVehicle: true,
    governorate: 'البريمي',
    city: 'البريمي',
    contactPhone: '+968 9123 1111',
    whatsapp: '+968 9123 1111',
  },
  {
    title: 'مطلوب سائق سحب وسطحة في صحم',
    description: 'ورشة صيانة سيارات تبحث عن سائق سحب وسطحة. يجب أن يكون لديه خبرة في سحب السيارات المعطلة. الدوام كامل مع وجود بدل طعام. الراتب يبدأ من 350 ر.ع.',
    jobType: 'HIRING',
    employmentType: 'FULL_TIME',
    salary: 350,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['HEAVY', 'LIGHT'],
    experienceYears: 2,
    minAge: 25,
    maxAge: 50,
    languages: ['العربية'],
    vehicleTypes: ['شاحنة خفيفة', 'سطحة'],
    hasOwnVehicle: false,
    governorate: 'شمال الباطنة',
    city: 'صحم',
    contactPhone: '+968 9234 2222',
    whatsapp: '+968 9234 2222',
  },
  {
    title: 'سائق خاص بنجلاديشي متاح للنقل',
    description: 'سائق بنجلاديشي خبرة 7 سنوات كسائق خاص في عمان. أجيد العربية والإنجليزية والبنغالية. أمتلك رخصة خفيفة وثقيلة. أبحث عن عائلة جديدة للعمل معها. ملتزم وأمين.',
    jobType: 'OFFERING',
    employmentType: 'FULL_TIME',
    salary: 220,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['LIGHT', 'HEAVY'],
    experienceYears: 7,
    languages: ['العربية', 'الإنجليزية', 'البنغالية'],
    nationality: 'بنجلاديشي',
    vehicleTypes: ['سيدان', 'SUV', 'بيك أب'],
    hasOwnVehicle: false,
    governorate: 'مسقط',
    city: 'الخوير',
    contactPhone: '+968 9345 3333',
    whatsapp: '+968 9345 3333',
  },
  {
    title: 'مطلوب سائق حافلة موظفين لمصنع في الرستاق',
    description: 'مصنع في الرستاق يبحث عن سائق حافلة لنقل الموظفين. الدوام صباحي فقط (6:00 - 9:00 صباحاً و 4:00 - 6:00 مساءً). يشترط رخصة حافلات سارية المفعول.',
    jobType: 'HIRING',
    employmentType: 'PART_TIME',
    salary: 250,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['BUS'],
    experienceYears: 3,
    minAge: 28,
    maxAge: 55,
    languages: ['العربية'],
    vehicleTypes: ['باص', 'فان'],
    hasOwnVehicle: false,
    governorate: 'جنوب الباطنة',
    city: 'الرستاق',
    contactPhone: '+968 9456 4444',
    contactEmail: 'hr@factory-rustaq.com',
  },
  {
    title: 'سائق VIP ليموزين خبرة فندقية 10 سنوات',
    description: 'سائق محترف خبرة 10 سنوات في الفنادق الفاخرة. خبرة في استقبال الضيوف من المطار والتنقل بين الفنادق والمعالم. أجيد 3 لغات. أبحث عن عمل في فندق أو شركة سياحة.',
    jobType: 'OFFERING',
    employmentType: 'FULL_TIME',
    salary: 450,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['LIGHT'],
    experienceYears: 10,
    languages: ['العربية', 'الإنجليزية', 'الفرنسية'],
    nationality: 'أردني',
    vehicleTypes: ['ليموزين', 'سيدان', 'SUV'],
    hasOwnVehicle: false,
    governorate: 'مسقط',
    city: 'القرم',
    contactPhone: '+968 9567 5555',
    whatsapp: '+968 9567 5555',
    contactEmail: 'vip.driver2024@email.com',
  },
  {
    title: 'مطلوب سائق نقل ثقيل لمحجر في إبراء',
    description: 'شركة مقاولات تبحث عن سائق نقل ثقيل لنقل المواد من المحجر. الدوام 12 ساعة يومياً. يشترط خبرة في الطرق الوعرة. تأمين صحي + سكن مجاني.',
    jobType: 'HIRING',
    employmentType: 'FULL_TIME',
    salary: 550,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['HEAVY', 'TRANSPORT'],
    experienceYears: 5,
    minAge: 25,
    maxAge: 50,
    languages: ['العربية'],
    vehicleTypes: ['شاحنة ثقيلة', 'قلاب'],
    hasOwnVehicle: false,
    governorate: 'شمال الشرقية',
    city: 'إبراء',
    contactPhone: '+968 9678 6666',
    whatsapp: '+968 9678 6666',
  },
  {
    title: 'سائق توصيل أغراض منزلية - دوام جزئي',
    description: 'سائق متاح للعمل الجزئي في نقل الأغراض المنزلية والأثاث. أمتلك فان متوسط الحجم. أسعار منافسة. متاح في المساء وعطلة نهاية الأسبوع.',
    jobType: 'OFFERING',
    employmentType: 'PART_TIME',
    salary: 20,
    salaryPeriod: 'DAILY',
    licenseTypes: ['LIGHT'],
    experienceYears: 3,
    languages: ['العربية'],
    vehicleTypes: ['فان'],
    hasOwnVehicle: true,
    governorate: 'مسقط',
    city: 'السيب',
    contactPhone: '+968 9789 7777',
    whatsapp: '+968 9789 7777',
  },
  {
    title: 'مطلوب سائق خاص لسيدة أعمال في السلطة',
    description: 'سيدة أعمال تبحث عن سائق خاص ثقة. الدوام يومي من 8 صباحاً حتى 6 مساءً. يشترط خبرة في خدمة VIP، نظافة، ولباقة. راتب مجزي + بدلات.',
    jobType: 'HIRING',
    employmentType: 'FULL_TIME',
    salary: 400,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['LIGHT'],
    experienceYears: 5,
    minAge: 30,
    maxAge: 45,
    languages: ['العربية', 'الإنجليزية'],
    nationality: null,
    vehicleTypes: ['SUV', 'ليموزين'],
    hasOwnVehicle: false,
    governorate: 'مسقط',
    city: 'السلطة',
    contactPhone: '+968 9890 8888',
    contactEmail: 'assistant@business.om',
  },
  {
    title: 'سائق حافلة رحلات سياحية خبرة 8 سنوات',
    description: 'سائق متخصص في الرحلات السياحية الطويلة. خبرة في قيادة الحافلات الكبيرة (50 راكب). أجيد التعامل مع السياح وشرح المعالم. أبحث عن شركة سياحية.',
    jobType: 'OFFERING',
    employmentType: 'FULL_TIME',
    salary: 380,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['BUS', 'HEAVY'],
    experienceYears: 8,
    languages: ['العربية', 'الإنجليزية', 'الإيطالية'],
    nationality: 'مصري',
    vehicleTypes: ['باص', 'حافلة كبيرة'],
    hasOwnVehicle: false,
    governorate: 'مسقط',
    city: 'مطرح',
    contactPhone: '+968 9012 9999',
    whatsapp: '+968 9012 9999',
    contactEmail: 'tour.bus.driver@email.com',
  },
  {
    title: 'مطلوب سائق معدات ثقيلة لموقع إنشائي في الدقم',
    description: 'شركة إنشاءات كبرى تبحث عن سائق معدات ثقيلة (حفارات، رافعات، بلدوزر). مشروع في المنطقة الاقتصادية الخاصة بالدقم. عقد لمدة 6 أشهر قابل للتجديد.',
    jobType: 'HIRING',
    employmentType: 'CONTRACT',
    salary: 700,
    salaryPeriod: 'MONTHLY',
    licenseTypes: ['HEAVY'],
    experienceYears: 4,
    minAge: 25,
    maxAge: 50,
    languages: ['العربية', 'الإنجليزية'],
    vehicleTypes: ['معدات ثقيلة'],
    hasOwnVehicle: false,
    governorate: 'الوسطى',
    city: 'الدقم',
    contactPhone: '+968 9234 0000',
    contactEmail: 'jobs@construction-duqm.com',
  },
];

function slugify(text: string, idx: number): string {
  return (
    text
      .replace(/[^\u0621-\u064Aa-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 60) +
    '-job-' +
    (idx + 100)
  );
}

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error('No users found. Create a user first.');
    process.exit(1);
  }
  console.log(`Using user: ${user.username} (${user.id})`);

  let created = 0;
  for (let i = 0; i < additionalJobs.length; i++) {
    const j = additionalJobs[i];
    const slug = slugify(j.title, i);

    const existing = await prisma.driverJob.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Skipping "${j.title}" (exists)`);
      continue;
    }

    await prisma.driverJob.create({
      data: {
        title: j.title,
        slug,
        description: j.description,
        jobType: j.jobType as any,
        employmentType: j.employmentType as any,
        salary: j.salary ?? undefined,
        salaryPeriod: j.salaryPeriod as any ?? undefined,
        licenseTypes: j.licenseTypes as any,
        experienceYears: j.experienceYears ?? undefined,
        minAge: j.minAge ?? undefined,
        maxAge: j.maxAge ?? undefined,
        languages: j.languages ?? [],
        nationality: j.nationality ?? undefined,
        vehicleTypes: j.vehicleTypes ?? [],
        hasOwnVehicle: j.hasOwnVehicle ?? false,
        governorate: j.governorate,
        city: j.city ?? undefined,
        contactPhone: j.contactPhone ?? undefined,
        contactEmail: (j as any).contactEmail ?? undefined,
        whatsapp: j.whatsapp ?? undefined,
        status: 'ACTIVE',
        userId: user.id,
      },
    });
    created++;
    console.log(`${i + 1}/10  ${j.title}`);
  }

  console.log(`\nDone! Created ${created} additional job postings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
