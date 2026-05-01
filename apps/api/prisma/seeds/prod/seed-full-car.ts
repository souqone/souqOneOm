import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

async function main() {
  console.log('🚗 Adding a fully detailed test car listing...');

  const user = await prisma.user.findUnique({
    where: { email: 'mahmmouudmuhamed2097@gmail.com' },
  });
  if (!user) {
    console.error('❌ User not found! Register first.');
    process.exit(1);
  }
  console.log(`✅ Found user: ${user.displayName || user.username} (${user.id})`);

  const listing = await prisma.listing.create({
    data: {
      title: 'تويوتا لاند كروزر VXR 2024 فل كامل - حالة الوكالة',
      slug: slug('toyota-land-cruiser-vxr-2024'),
      description: `تويوتا لاند كروزر VXR 2024 فل كامل — حالة الوكالة بدون أي خدوش.

السيارة ماشية 12,000 كم فقط، صيانة وكالة منتظمة مع سجل صيانة كامل.

المواصفات:
• محرك V6 تيربو 3.5 لتر — 409 حصان
• ناقل حركة أوتوماتيك 10 سرعات
• نظام دفع رباعي دائم مع نظام تعليق هوائي تكيفي
• شاشة لمس 12.3 بوصة مع Apple CarPlay و Android Auto
• نظام صوت JBL محيطي 14 سماعة
• مقاعد جلد طبيعي مدفأة ومبردة (3 صفوف)
• فتحة سقف بانورامية كهربائية
• كاميرات 360 درجة مع مستشعرات أمامية وخلفية
• نظام مثبت سرعة تكيفي مع مساعد البقاء في المسار
• إضاءة LED أمامية وخلفية مع إضاءة نهارية

السيارة نظيفة جداً من الداخل والخارج، لم تتعرض لأي حوادث.
البيع لعدم الحاجة — السعر قابل للتفاوض البسيط.

للمعاينة والاستفسار، تواصل عبر الموقع أو واتساب.`,

      make: 'Toyota',
      model: 'Land Cruiser',
      year: 2024,
      mileage: 12000,
      fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      bodyType: 'SUV',
      exteriorColor: 'أبيض لؤلؤي',
      interior: 'بيج',
      engineSize: '3.5L V6 Turbo',
      horsepower: 409,
      doors: 5,
      seats: 7,
      driveType: 'FOUR_WHEEL',
      condition: 'LIKE_NEW',
      features: [
        'فتحة سقف بانورامية',
        'مقاعد جلد مبردة ومدفأة',
        'كاميرا 360 درجة',
        'نظام ملاحة GPS',
        'شاشة لمس 12.3 بوصة',
        'Apple CarPlay',
        'Android Auto',
        'نظام صوت JBL',
        'مثبت سرعة تكيفي',
        'حساسات أمامية وخلفية',
        'إضاءة LED',
        'مرايا كهربائية قابلة للطي',
        'ريموت ستارت',
        'مفتاح ذكي',
        'نظام تعليق هوائي',
        'شاشات خلفية للركاب',
        'باب خلفي كهربائي',
        'تحكم مناخي 4 مناطق',
      ],

      listingType: 'SALE',
      price: 28500,
      currency: 'OMR',
      isPriceNegotiable: true,

      governorate: 'مسقط',
      city: 'بوشر',
      latitude: 23.5880,
      longitude: 58.3829,

      status: 'ACTIVE',
      viewCount: 347,
      sellerId: user.id,
    },
  });

  console.log(`✅ Listing created: ${listing.id}`);

  // Add sample images (using placeholder URLs — replace with real ones if you have them)
  const imageUrls = [
    'https://images.unsplash.com/photo-1625231334168-25bd7d2ba03a?w=1200',
    'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=1200',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200',
    'https://images.unsplash.com/photo-1606611013016-969c19ba27a5?w=1200',
    'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1200',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200',
  ];

  for (let i = 0; i < imageUrls.length; i++) {
    await prisma.listingImage.create({
      data: {
        url: imageUrls[i],
        alt: `تويوتا لاند كروزر VXR 2024 — صورة ${i + 1}`,
        order: i,
        isPrimary: i === 0,
        listingId: listing.id,
      },
    });
  }
  console.log(`✅ ${imageUrls.length} images added`);

  console.log(`\n🎉 Done! Full car listing created.`);
  console.log(`   Open: http://localhost:3000/ar/cars/${listing.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
