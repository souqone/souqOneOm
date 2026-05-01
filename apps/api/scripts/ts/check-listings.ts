import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.equipmentListing.findMany({
    take: 5,
    include: {
      images: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(JSON.stringify(listings, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
