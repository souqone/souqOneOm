const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../../.env.production' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  try {
    let user = await prisma.user.findFirst();

    const item = await prisma.carService.create({
      data: {
        title: "Test Service 123",
        slug: "test-service-123-" + Date.now(),
        description: "Testing",
        serviceType: "MAINTENANCE",
        providerType: "INDIVIDUAL",
        providerName: "Test Provider",
        userId: user.id,
        governorateId: 1,
        wilayaId: 1,
        governorate: null, // explicitly pass null
        city: null
      }
    });
    console.log("Success with null:", item.id);
    
    await prisma.carService.delete({ where: { id: item.id } });
  } catch (err) {
    console.error("Prisma error:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
