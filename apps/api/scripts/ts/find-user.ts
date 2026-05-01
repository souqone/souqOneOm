import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'mahmmouudmuhamed2097@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log(`USER_ID:${user.id}`);
  } else {
    console.log('USER_NOT_FOUND');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
