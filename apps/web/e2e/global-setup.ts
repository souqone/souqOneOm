import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { chromium } from '@playwright/test';

const USERS = {
  employer:  { email: 'employer@souqone.om',  password: 'Test1234' },
  driver:    { email: 'driver@souqone.om',    password: 'Test1234' },
  applicant: { email: 'applicant@souqone.om', password: 'Test1234' },
  noProfile: { email: 'noprofile@souqone.om', password: 'Test1234' },
} as const;

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

  // ─── Pre-authenticate all users (saves session for reuse in tests) ─────────────
  // Railway is warm right now — do all logins here to avoid mid-run cold starts.
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  const AUTH_DIR = path.join(__dirname, '.auth');
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  console.log('🔐 Pre-authenticating test users...');
  const browser = await chromium.launch();
  for (const [role, creds] of Object.entries(USERS)) {
    try {
      const ctx = await browser.newContext({ baseURL: BASE_URL, locale: 'ar' });
      const page = await ctx.newPage();
      await page.goto('/ar/login');
      await page.waitForSelector('.auth-sheet', { timeout: 20000 });
      const modal = page.locator('.auth-sheet');
      await modal.locator('input[type="email"]').fill(creds.email);
      await modal.locator('input[type="password"]').fill(creds.password);
      await modal.locator('button[type="submit"]').click({ force: true });
      await page.locator('.auth-sheet').waitFor({ state: 'detached', timeout: 60000 });
      await ctx.storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
      await ctx.close();
      console.log(`   ✅ ${role} (${creds.email})`);
    } catch (err) {
      console.warn(`   ⚠️  ${role} auth failed — tests will fall back to UI login`);
    }
  }
  await browser.close();
  console.log('✅ Auth states saved\n');
}

export default globalSetup;
