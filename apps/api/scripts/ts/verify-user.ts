import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.update({
  where: { email: 'mahmomouudmuhamed2097@gmail.com' },
  data: { isVerified: true },
}).then(u => console.log('Done:', u.email, u.isVerified))
  .catch(console.error)
  .finally(() => p.$disconnect());
