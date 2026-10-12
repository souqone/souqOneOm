import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const user = await p.user.findFirst({ where: { email: 'mahmomouudmuhamed2097@gmail.com' } });
  const data: Record<string, unknown> = { isVerified: true };
  if (user && !user.emailVerifiedAt) {
    data.emailVerifiedAt = new Date();
  }
  const u = await p.user.update({
    where: { email: 'mahmomouudmuhamed2097@gmail.com' },
    data,
  });
  console.log('Done:', u.email, u.isVerified);
})()
  .catch(console.error)
  .finally(() => p.$disconnect());
