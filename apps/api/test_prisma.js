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
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "Test",
          username: "testuser" + Date.now(),
          email: "test" + Date.now() + "@example.com",
          phone: "+96812345678" + Date.now(),
          password: "password123",
          role: "USER"
        }
      });
    }

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
        wilayaId: 1
      }
    });
    console.log("Success:", item.id);
    
    await prisma.carService.delete({ where: { id: item.id } });
  } catch (err) {
    console.error("Prisma error:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
