import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';

function loadEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};
  // Strip BOM if present and parse key=value lines
  const content = fs.readFileSync(envPath, 'utf-8').replace(/^\uFEFF/, '');
  const result: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.+?)["']?\s*$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

async function globalSetup() {
  // Auto-load from apps/api/.env if DATABASE_URL not set as env var
  if (!process.env.DATABASE_URL) {
    const envPath = path.resolve(__dirname, '../../../apps/api/.env');
    const vars = loadEnvFile(envPath);
    if (vars.DATABASE_URL) {
      process.env.DATABASE_URL = vars.DATABASE_URL;
      console.log('📁 Loaded DATABASE_URL from apps/api/.env');
    }
  }

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
      env: { ...process.env },
    });
    console.log('✅ Seed complete\n');
  } catch {
    console.warn('⚠️ Seed failed (data may already exist), continuing...\n');
  }

  // Warm up Railway API to avoid cold-start timeouts on first authenticated test
  const apiUrl = 'https://caroneapi-production-255b.up.railway.app/health';
  console.log('🔥 Warming up Railway API...');
  await new Promise<void>((resolve) => {
    const req = https.get(apiUrl, (res) => {
      res.resume();
      console.log(`   Railway API status: ${res.statusCode}`);
      resolve();
    });
    req.on('error', () => {
      console.warn('   Railway warmup ping failed (will retry during tests)');
      resolve();
    });
    req.setTimeout(60000, () => { req.destroy(); resolve(); });
  });
  console.log('✅ Railway API ready\n');
}

export default globalSetup;
