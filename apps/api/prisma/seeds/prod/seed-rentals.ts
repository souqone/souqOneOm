import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rentals = [
  {
    title: 'تويوتا كامري 2024 للإيجار اليومي',
    make: 'Toyota', model: 'Camry', year: 2024,
    mileage: 8000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'أبيض لؤلؤي', engineSize: '2.5L', horsepower: 203, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 15, weeklyPrice: 90, monthlyPrice: 350,
    minRentalDays: 1, depositAmount: 50, kmLimitPerDay: 250,
    withDriver: false, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'مسقط', city: 'بوشر',
    condition: 'LIKE_NEW',
    description: 'تويوتا كامري 2024 فل كامل، نظيفة جداً، تأمين شامل، توصيل مجاني داخل مسقط.',
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
  },
  {
    title: 'نيسان باترول 2023 دفع رباعي للإيجار',
    make: 'Nissan', model: 'Patrol', year: 2023,
    mileage: 15000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أسود', engineSize: '5.6L', horsepower: 400, doors: 4, seats: 8, driveType: '4WD',
    dailyPrice: 35, weeklyPrice: 210, monthlyPrice: 750,
    minRentalDays: 2, depositAmount: 150, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'MODERATE', governorate: 'مسقط', city: 'السيب',
    condition: 'USED',
    description: 'نيسان باترول V8 فخامة وقوة، مناسبة للرحلات والصحراء، مع سائق عند الطلب.',
    imageUrl: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
  },
  {
    title: 'هيونداي توسان 2024 للإيجار الشهري',
    make: 'Hyundai', model: 'Tucson', year: 2024,
    mileage: 5000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'رمادي', engineSize: '2.0L', horsepower: 187, doors: 4, seats: 5, driveType: 'AWD',
    dailyPrice: 18, weeklyPrice: 110, monthlyPrice: 400,
    minRentalDays: 1, depositAmount: 75, kmLimitPerDay: 250,
    withDriver: false, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'مسقط', city: 'مطرح',
    condition: 'LIKE_NEW',
    description: 'هيونداي توسان 2024 موديل جديد، مناسبة للعائلات، تأمين شامل وتوصيل.',
    imageUrl: 'https://images.unsplash.com/photo-1633695632502-42531da08562?w=800&q=80',
  },
  {
    title: 'تويوتا لاندكروزر 2022 للإيجار',
    make: 'Toyota', model: 'Land Cruiser', year: 2022,
    mileage: 30000, fuelType: 'DIESEL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أبيض', engineSize: '3.3L', horsepower: 305, doors: 4, seats: 7, driveType: '4WD',
    dailyPrice: 40, weeklyPrice: 250, monthlyPrice: 900,
    minRentalDays: 3, depositAmount: 200, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'STRICT', governorate: 'مسقط', city: 'العامرات',
    condition: 'USED',
    description: 'لاندكروزر ديزل للرحلات الطويلة والصحراء، مجهزة بالكامل.',
    imageUrl: 'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80',
  },
  {
    title: 'كيا K5 2024 سيدان أنيقة للإيجار',
    make: 'Kia', model: 'K5', year: 2024,
    mileage: 3000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'أحمر', engineSize: '2.5L', horsepower: 191, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 14, weeklyPrice: 85, monthlyPrice: 320,
    minRentalDays: 1, depositAmount: 50, kmLimitPerDay: 300,
    withDriver: false, deliveryAvailable: false, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'مسقط', city: 'بوشر',
    condition: 'NEW',
    description: 'كيا K5 موديل 2024 بتصميم رياضي أنيق، مثالية للتنقل اليومي.',
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  },
  {
    title: 'مرسيدس C200 2023 فاخرة للإيجار',
    make: 'Mercedes-Benz', model: 'C200', year: 2023,
    mileage: 12000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'فضي', engineSize: '1.5L Turbo', horsepower: 204, doors: 4, seats: 5, driveType: 'RWD',
    dailyPrice: 30, weeklyPrice: 180, monthlyPrice: 650,
    minRentalDays: 2, depositAmount: 150, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'MODERATE', governorate: 'مسقط', city: 'القرم',
    condition: 'LIKE_NEW',
    description: 'مرسيدس C-Class فاخرة للمناسبات والأعمال، خدمة سائق متاحة.',
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  },
  {
    title: 'BMW X5 2023 للإيجار اليومي والأسبوعي',
    make: 'BMW', model: 'X5', year: 2023,
    mileage: 18000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أزرق داكن', engineSize: '3.0L', horsepower: 335, doors: 4, seats: 5, driveType: 'AWD',
    dailyPrice: 35, weeklyPrice: 220, monthlyPrice: 800,
    minRentalDays: 1, depositAmount: 200, kmLimitPerDay: 200,
    withDriver: false, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'ظفار', city: 'صلالة',
    condition: 'USED',
    description: 'BMW X5 فاخرة وقوية، مناسبة لموسم صلالة والسياحة.',
    imageUrl: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80',
  },
  {
    title: 'هوندا سيفيك 2024 اقتصادية للإيجار',
    make: 'Honda', model: 'Civic', year: 2024,
    mileage: 2000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'أبيض', engineSize: '1.5L Turbo', horsepower: 180, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 12, weeklyPrice: 75, monthlyPrice: 280,
    minRentalDays: 1, depositAmount: 40, kmLimitPerDay: 300,
    withDriver: false, deliveryAvailable: false, insuranceIncluded: false,
    cancellationPolicy: 'FREE', governorate: 'مسقط', city: 'السيب',
    condition: 'NEW',
    description: 'هوندا سيفيك اقتصادية في استهلاك الوقود، مثالية للإيجار اليومي.',
    imageUrl: 'https://images.unsplash.com/photo-1679420437432-0beee52e06fa?w=800&q=80',
  },
  {
    title: 'رينج روفر سبورت 2023 للإيجار',
    make: 'Land Rover', model: 'Range Rover Sport', year: 2023,
    mileage: 20000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أسود', engineSize: '3.0L V6', horsepower: 395, doors: 4, seats: 5, driveType: 'AWD',
    dailyPrice: 50, weeklyPrice: 300, monthlyPrice: 1100,
    minRentalDays: 2, depositAmount: 300, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'STRICT', governorate: 'مسقط', city: 'بوشر',
    condition: 'USED',
    description: 'رينج روفر سبورت فخامة بريطانية، للمناسبات الخاصة والأعمال.',
    imageUrl: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
  },
  {
    title: 'ميتسوبيشي باجيرو 2022 للرحلات',
    make: 'Mitsubishi', model: 'Pajero', year: 2022,
    mileage: 35000, fuelType: 'DIESEL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'بيج', engineSize: '3.2L', horsepower: 190, doors: 4, seats: 7, driveType: '4WD',
    dailyPrice: 22, weeklyPrice: 140, monthlyPrice: 500,
    minRentalDays: 2, depositAmount: 100, kmLimitPerDay: 250,
    withDriver: true, deliveryAvailable: false, insuranceIncluded: true,
    cancellationPolicy: 'MODERATE', governorate: 'الداخلية', city: 'نزوى',
    condition: 'USED',
    description: 'باجيرو ديزل مجهزة للصحراء والجبال، مثالية لرحلات الوادي والتخييم.',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  },
  {
    title: 'تويوتا يارس 2024 صغيرة واقتصادية',
    make: 'Toyota', model: 'Yaris', year: 2024,
    mileage: 1000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'HATCHBACK',
    exteriorColor: 'أزرق', engineSize: '1.5L', horsepower: 120, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 8, weeklyPrice: 50, monthlyPrice: 180,
    minRentalDays: 1, depositAmount: 30, kmLimitPerDay: 300,
    withDriver: false, deliveryAvailable: false, insuranceIncluded: false,
    cancellationPolicy: 'FREE', governorate: 'مسقط', city: 'السيب',
    condition: 'NEW',
    description: 'يارس صغيرة واقتصادية، الأرخص للإيجار اليومي في مسقط.',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80',
  },
  {
    title: 'لكزس ES350 2023 فاخرة للإيجار',
    make: 'Lexus', model: 'ES350', year: 2023,
    mileage: 10000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'ذهبي شامبين', engineSize: '3.5L V6', horsepower: 302, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 28, weeklyPrice: 170, monthlyPrice: 620,
    minRentalDays: 1, depositAmount: 120, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'مسقط', city: 'القرم',
    condition: 'LIKE_NEW',
    description: 'لكزس ES فخامة يابانية بأعلى مستوى من الراحة.',
    imageUrl: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=80',
  },
  {
    title: 'فورد إكسبلورر 2023 عائلية للإيجار',
    make: 'Ford', model: 'Explorer', year: 2023,
    mileage: 22000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أبيض', engineSize: '3.0L V6', horsepower: 300, doors: 4, seats: 7, driveType: 'AWD',
    dailyPrice: 25, weeklyPrice: 155, monthlyPrice: 580,
    minRentalDays: 1, depositAmount: 100, kmLimitPerDay: 250,
    withDriver: false, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'الباطنة شمال', city: 'صحار',
    condition: 'USED',
    description: 'فورد إكسبلورر عائلية 7 مقاعد، مثالية للعائلات والرحلات.',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  },
  {
    title: 'شيفروليه تاهو 2022 للإيجار مع سائق',
    make: 'Chevrolet', model: 'Tahoe', year: 2022,
    mileage: 40000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أسود', engineSize: '5.3L V8', horsepower: 355, doors: 4, seats: 8, driveType: '4WD',
    dailyPrice: 38, weeklyPrice: 230, monthlyPrice: 850,
    minRentalDays: 2, depositAmount: 200, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'MODERATE', governorate: 'مسقط', city: 'بوشر',
    condition: 'USED',
    description: 'تاهو فخمة وواسعة، خدمة سائق 24 ساعة متاحة.',
    imageUrl: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
  },
  {
    title: 'MG ZS 2024 كروس أوفر للإيجار',
    make: 'MG', model: 'ZS', year: 2024,
    mileage: 4000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أحمر', engineSize: '1.5L', horsepower: 114, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 10, weeklyPrice: 65, monthlyPrice: 240,
    minRentalDays: 1, depositAmount: 40, kmLimitPerDay: 300,
    withDriver: false, deliveryAvailable: false, insuranceIncluded: false,
    cancellationPolicy: 'FREE', governorate: 'مسقط', city: 'الخوض',
    condition: 'NEW',
    description: 'MG ZS كروس أوفر اقتصادية وعصرية، سعر منافس.',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  },
  {
    title: 'أودي A6 2023 بيزنس للإيجار',
    make: 'Audi', model: 'A6', year: 2023,
    mileage: 16000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'رمادي داكن', engineSize: '2.0L TFSI', horsepower: 261, doors: 4, seats: 5, driveType: 'AWD',
    dailyPrice: 32, weeklyPrice: 195, monthlyPrice: 720,
    minRentalDays: 2, depositAmount: 150, kmLimitPerDay: 200,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'MODERATE', governorate: 'مسقط', city: 'القرم',
    condition: 'USED',
    description: 'أودي A6 أنيقة لرجال الأعمال والمناسبات الرسمية.',
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
  },
  {
    title: 'تويوتا هايلكس 2023 بيك أب للإيجار',
    make: 'Toyota', model: 'Hilux', year: 2023,
    mileage: 25000, fuelType: 'DIESEL', transmission: 'AUTOMATIC', bodyType: 'TRUCK',
    exteriorColor: 'أبيض', engineSize: '2.8L', horsepower: 204, doors: 4, seats: 5, driveType: '4WD',
    dailyPrice: 20, weeklyPrice: 125, monthlyPrice: 450,
    minRentalDays: 1, depositAmount: 80, kmLimitPerDay: 300,
    withDriver: false, deliveryAvailable: false, insuranceIncluded: true,
    cancellationPolicy: 'FLEXIBLE', governorate: 'الشرقية شمال', city: 'صور',
    condition: 'USED',
    description: 'هايلكس ديزل قوية للعمل والرحلات، دفع رباعي.',
    imageUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80',
  },
  {
    title: 'جيب رانجلر 2023 مغامرات للإيجار',
    make: 'Jeep', model: 'Wrangler', year: 2023,
    mileage: 14000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أخضر', engineSize: '3.6L V6', horsepower: 285, doors: 4, seats: 5, driveType: '4WD',
    dailyPrice: 30, weeklyPrice: 185, monthlyPrice: 680,
    minRentalDays: 2, depositAmount: 150, kmLimitPerDay: 200,
    withDriver: false, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'MODERATE', governorate: 'الداخلية', city: 'الحمراء',
    condition: 'USED',
    description: 'رانجلر للمغامرات والأماكن الوعرة، تجربة قيادة لا تُنسى.',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  },
  {
    title: 'نيسان صني 2024 اقتصادية للإيجار',
    make: 'Nissan', model: 'Sunny', year: 2024,
    mileage: 1500, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SEDAN',
    exteriorColor: 'فضي', engineSize: '1.6L', horsepower: 118, doors: 4, seats: 5, driveType: 'FWD',
    dailyPrice: 7, weeklyPrice: 45, monthlyPrice: 160,
    minRentalDays: 1, depositAmount: 25, kmLimitPerDay: 350,
    withDriver: false, deliveryAvailable: false, insuranceIncluded: false,
    cancellationPolicy: 'FREE', governorate: 'مسقط', city: 'السيب',
    condition: 'NEW',
    description: 'الأرخص! نيسان صني جديدة للإيجار بأقل سعر يومي في عمان.',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80',
  },
  {
    title: 'بورش كايين 2022 فاخرة جداً للإيجار',
    make: 'Porsche', model: 'Cayenne', year: 2022,
    mileage: 28000, fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'SUV',
    exteriorColor: 'أبيض', engineSize: '3.0L V6 Turbo', horsepower: 340, doors: 4, seats: 5, driveType: 'AWD',
    dailyPrice: 55, weeklyPrice: 340, monthlyPrice: 1200,
    minRentalDays: 3, depositAmount: 500, kmLimitPerDay: 150,
    withDriver: true, deliveryAvailable: true, insuranceIncluded: true,
    cancellationPolicy: 'STRICT', governorate: 'مسقط', city: 'الموج',
    condition: 'USED',
    description: 'بورش كايين فخامة ألمانية للنخبة، خدمة VIP متاحة.',
    imageUrl: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80',
  },
];

function slugify(text: string, idx: number): string {
  return text
    .replace(/[^\u0621-\u064Aa-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) + '-rental-' + idx;
}

async function main() {
  // Find first user to use as seller
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error('❌ No users found. Create a user first.');
    process.exit(1);
  }
  console.log(`Using seller: ${user.username} (${user.id})`);

  let created = 0;
  for (let i = 0; i < rentals.length; i++) {
    const r = rentals[i];
    const slug = slugify(r.title, i);

    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏭ Skipping "${r.title}" (slug exists)`);
      continue;
    }

    await prisma.listing.create({
      data: {
        title: r.title,
        slug,
        description: r.description,
        make: r.make,
        model: r.model,
        year: r.year,
        mileage: r.mileage,
        fuelType: r.fuelType as any,
        transmission: r.transmission as any,
        bodyType: r.bodyType,
        exteriorColor: r.exteriorColor,
        engineSize: r.engineSize,
        horsepower: r.horsepower,
        doors: r.doors,
        seats: r.seats,
        driveType: r.driveType,
        listingType: 'RENTAL',
        price: 0,
        currency: 'OMR',
        isPriceNegotiable: false,
        dailyPrice: r.dailyPrice,
        weeklyPrice: r.weeklyPrice,
        monthlyPrice: r.monthlyPrice,
        minRentalDays: r.minRentalDays,
        depositAmount: r.depositAmount,
        kmLimitPerDay: r.kmLimitPerDay,
        withDriver: r.withDriver,
        deliveryAvailable: r.deliveryAvailable,
        insuranceIncluded: r.insuranceIncluded,
        cancellationPolicy: r.cancellationPolicy as any,
        condition: r.condition as any,
        status: 'ACTIVE',
        governorate: r.governorate,
        city: r.city,
        sellerId: user.id,
        images: {
          create: {
            url: r.imageUrl,
            isPrimary: true,
            order: 0,
          },
        },
      },
    });
    created++;
    console.log(`✅ ${i + 1}/20  ${r.title}`);
  }

  console.log(`\n🎉 Done! Created ${created} rental listings.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
