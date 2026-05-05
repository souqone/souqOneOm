import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const requests = [
  {
    serviceType: 'FURNITURE',
    fromGovernorate: 'مسقط',
    fromCity: 'بوشر',
    fromAddress: 'حي السلام، بوشر، مسقط',
    toGovernorate: 'ظفار',
    toCity: 'صلالة',
    toAddress: 'حي الصيادة، صلالة',
    cargoDescription: 'نقل أثاث منزل كامل (غرفة نوم، صالة، مطبخ) من مسقط إلى صلالة. الكميات متوسطة وتشمل قطع كبيرة.',
    weightTons: 3.5,
    requiresHelper: true,
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isFlexible: false,
    budgetMin: 120,
    budgetMax: 180,
    notes: 'يرجى توفير سيارة نقل مغلقة للحفاظ على الأثاث من الغبار والشمس.',
  },
  {
    serviceType: 'GOODS',
    fromGovernorate: 'مسقط',
    fromCity: 'الرسيل',
    fromAddress: 'المنطقة الصناعية، الرسيل',
    toGovernorate: 'شمال الباطنة',
    toCity: 'صحار',
    toAddress: 'المنطقة الصناعية، صحار',
    cargoDescription: 'شحن بضائع تجارية (مواد غذائية معلبة، كراتين 200 صندوق) من المستودع إلى محل الجملة.',
    weightTons: 8,
    requiresHelper: false,
    scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    isFlexible: true,
    budgetMin: 80,
    budgetMax: 130,
    notes: 'الشحنة تحتاج لشاحنة مبردة أو مغلقة للحفاظ على جودة البضائع.',
  },
  {
    serviceType: 'CONSTRUCTION',
    fromGovernorate: 'شمال الباطنة',
    fromCity: 'صحار',
    fromAddress: 'مخزن مواد البناء، صحار',
    toGovernorate: 'مسقط',
    toCity: 'السيب',
    toAddress: 'موقع البناء، السيب',
    cargoDescription: 'نقل مواد بناء: رمل وحصى وبلوك إسمنتي وقضبان حديد. الكميات كبيرة تحتاج لأكثر من رحلة.',
    weightTons: 15,
    requiresHelper: false,
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    isFlexible: true,
    budgetMin: 150,
    budgetMax: 250,
    notes: 'نحتاج لقلاب أو سطحة كبيرة. ممكن تقسيم الشحنة على رحلتين.',
  },
  {
    serviceType: 'HEAVY',
    fromGovernorate: 'مسقط',
    fromCity: 'مسقط',
    fromAddress: 'الميناء التجاري، مسقط',
    toGovernorate: 'البريمي',
    toCity: 'البريمي',
    toAddress: 'المنطقة الصناعية، البريمي',
    cargoDescription: 'شحن ثقيل: آلة صناعية ضخمة (مولد كهربائي 50 كيلوواط) مستوردة من الميناء إلى المصنع.',
    weightTons: 12,
    requiresHelper: true,
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isFlexible: false,
    budgetMin: 200,
    budgetMax: 320,
    notes: 'تحتاج رافعة عند التحميل والتنزيل. المعدة حساسة يجب التعامل معها بحرص.',
  },
  {
    serviceType: 'FURNITURE',
    fromGovernorate: 'مسقط',
    fromCity: 'القرم',
    fromAddress: 'شقة 3، مبنى الأمل، القرم',
    toGovernorate: 'مسقط',
    toCity: 'العامرات',
    toAddress: 'فيلا 12، حي النور، العامرات',
    cargoDescription: 'نقل أثاث شقة داخل مسقط: غرفة نوم رئيسية، غرفة أطفال، مطبخ كامل، وأجهزة كهربائية.',
    weightTons: 2,
    requiresHelper: true,
    scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    isFlexible: true,
    budgetMin: 40,
    budgetMax: 70,
    notes: 'يوجد مصعد في المبنى. الرجاء الحضور صباحاً قبل الساعة 9.',
  },
  {
    serviceType: 'BACKLOAD',
    fromGovernorate: 'ظفار',
    fromCity: 'صلالة',
    fromAddress: 'منطقة العمارات، صلالة',
    toGovernorate: 'مسقط',
    toCity: 'بوشر',
    toAddress: 'المنطقة الصناعية، بوشر',
    cargoDescription: 'باك لود (مشاركة شحنة): 15 صندوق بضاعة متنوعة وزنها الإجمالي نحو 500 كجم فقط.',
    weightTons: 0.5,
    requiresHelper: false,
    scheduledAt: null,
    isFlexible: true,
    budgetMin: 30,
    budgetMax: 60,
    notes: 'مرن في المواعيد. يفضل ناقل يسافر مسقط-صلالة بشكل منتظم للاستفادة من الرجوع.',
  },
  {
    serviceType: 'EQUIPMENT',
    fromGovernorate: 'جنوب الباطنة',
    fromCity: 'الرستاق',
    fromAddress: 'مزرعة الوادي، الرستاق',
    toGovernorate: 'مسقط',
    toCity: 'السيب',
    toAddress: 'معرض المعدات، السيب',
    cargoDescription: 'نقل معدات زراعية: جرار زراعي صغير + ملحقاته (محراث وبذارة). للبيع في مسقط.',
    weightTons: 4,
    requiresHelper: false,
    scheduledAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    isFlexible: true,
    budgetMin: 70,
    budgetMax: 110,
    notes: 'المعدات تحتاج سطحة مفتوحة واسعة. الجرار حجمه متوسط.',
  },
  {
    serviceType: 'GOODS',
    fromGovernorate: 'مسقط',
    fromCity: 'بوشر',
    fromAddress: 'مستودع الأمانة، بوشر',
    toGovernorate: 'الظاهرة',
    toCity: 'عبري',
    toAddress: 'سوق عبري المركزي',
    cargoDescription: 'شحن بضائع متنوعة: ملابس وإلكترونيات وإكسسوارات (150 كرتونة) من المستودع إلى المحلات التجارية في عبري.',
    weightTons: 3,
    requiresHelper: false,
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isFlexible: true,
    budgetMin: 90,
    budgetMax: 140,
    notes: 'البضائع جافة لا تحتاج تبريد. يفضل شاحنة مغلقة.',
  },
  {
    serviceType: 'CONSTRUCTION',
    fromGovernorate: 'الداخلية',
    fromCity: 'نزوى',
    fromAddress: 'مصنع الطوب، نزوى',
    toGovernorate: 'مسقط',
    toCity: 'القرم',
    toAddress: 'فيلا قيد الإنشاء، القرم',
    cargoDescription: 'نقل طوب إسمنتي (5000 طابوق) ورمل وإسمنت لموقع بناء فيلا. كمية كبيرة تحتاج شاحنة قلاب كبيرة.',
    weightTons: 18,
    requiresHelper: false,
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    isFlexible: false,
    budgetMin: 180,
    budgetMax: 260,
    notes: 'يجب الوصول صباحاً بين 7-9 لأن الموقع يغلق بعد الظهر.',
  },
  {
    serviceType: 'FURNITURE',
    fromGovernorate: 'شمال الباطنة',
    fromCity: 'صحار',
    fromAddress: 'منطقة الحمبار، صحار',
    toGovernorate: 'مسقط',
    toCity: 'مطرح',
    toAddress: 'شارع الميناء، مطرح',
    cargoDescription: 'نقل أثاث متجر (رفوف معدنية، طاولات عرض، كاونتر) من صحار إلى محل جديد في مطرح.',
    weightTons: 2.5,
    requiresHelper: true,
    scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    isFlexible: false,
    budgetMin: 100,
    budgetMax: 160,
    notes: 'الأثاث تجاري معدني ثقيل. نحتاج عمالة للتحميل والتفريغ.',
  },
];

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error('❌ لا يوجد مستخدمين. أضف مستخدماً أولاً.');
    process.exit(1);
  }
  console.log(`👤 المستخدم: ${user.username} (${user.id})`);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  let created = 0;
  for (let i = 0; i < requests.length; i++) {
    const r = requests[i];
    await prisma.transportRequest.create({
      data: {
        userId: user.id,
        serviceType: r.serviceType as any,
        status: 'OPEN',
        fromGovernorate: r.fromGovernorate,
        fromCity: r.fromCity ?? undefined,
        fromAddress: r.fromAddress,
        toGovernorate: r.toGovernorate,
        toCity: r.toCity ?? undefined,
        toAddress: r.toAddress,
        cargoDescription: r.cargoDescription,
        weightTons: r.weightTons ?? undefined,
        requiresHelper: r.requiresHelper,
        notes: r.notes ?? undefined,
        scheduledAt: r.scheduledAt ?? undefined,
        isFlexible: r.isFlexible,
        budgetMin: r.budgetMin ?? undefined,
        budgetMax: r.budgetMax ?? undefined,
        currency: 'OMR',
        expiresAt,
      },
    });
    created++;
    console.log(`✅ ${i + 1}/10  ${r.serviceType} | ${r.fromGovernorate} ← → ${r.toGovernorate}`);
  }

  console.log(`\n🎉 تم إضافة ${created} إعلان نقل تجريبي بنجاح!`);
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
