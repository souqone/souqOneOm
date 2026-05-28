import { execSync } from 'child_process';
import path from 'path';

async function globalSetup() {
  const isRemote = !!process.env.BASE_URL;

  if (isRemote) {
    console.log('\n🌱 Seeding remote Vercel database...');
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set — skipping seed for remote testing\n');
      return;
    }
    console.log(`   Target: ${process.env.BASE_URL}`);
  } else {
    console.log('\n🌱 Running seed before E2E tests (local)...');
  }

  try {
    execSync('npx tsx prisma/seed.ts', {
      cwd: path.resolve(__dirname, '../../../apps/api'),
      stdio: 'inherit',
      env: { ...process.env }, // DATABASE_URL passthrough for remote
    });
    console.log('✅ Seed complete\n');
  } catch {
    console.warn('⚠️ Seed failed (data may already exist), continuing...\n');
  }
}

export default globalSetup;
