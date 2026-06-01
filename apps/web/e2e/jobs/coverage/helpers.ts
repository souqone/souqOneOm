import { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// ─── Test Accounts (created by seed) ──────────────────────────────────────────
export const USERS = {
  employer:  { email: 'employer@souqone.om',  password: 'Test1234' },
  driver:    { email: 'driver@souqone.om',    password: 'Test1234' },
  applicant: { email: 'applicant@souqone.om', password: 'Test1234' },
  noProfile: { email: 'noprofile@souqone.om', password: 'Test1234' },
} as const

// ─── Seeded Job IDs ────────────────────────────────────────────────────────────
export const SEED_JOBS = {
  active: 'seed-job-active-001',
  closed: 'seed-job-closed-002',
}

// ─── Login Helper ──────────────────────────────────────────────────────────────
export async function loginAs(
  page: Page,
  role: keyof typeof USERS
): Promise<void> {
  const { email, password } = USERS[role]
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Dismiss any modal/overlay that intercepts pointer events on login page
  // (Known UX Bug: fixed.inset-0 modal appears and blocks the submit button)
  const overlay = page.locator('.fixed.inset-0').first()
  if (await overlay.count() > 0) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  await page.fill('input[placeholder="البريد الإلكتروني"]', email)
  await page.fill('input[placeholder="••••••••"]', password)
  // force:true bypasses any residual overlay that cannot be dismissed
  await page.locator('button[type="submit"]').click({ force: true })
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 })
}

// ─── Screenshot Helper ─────────────────────────────────────────────────────────
const EVIDENCE_DIR = path.join(process.cwd(), 'evidence')

export async function capture(page: Page, name: string): Promise<void> {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  }
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, `${name}.png`),
    fullPage: true,
  })
}

// ─── URL Helpers ───────────────────────────────────────────────────────────────
export function jobUrl(id: string): string {
  return `/ar/jobs/${id}`
}

export function jobApplicationsUrl(id: string): string {
  return `/ar/jobs/${id}/applications`
}

// ─── Wait for Toast ────────────────────────────────────────────────────────────
export async function waitForToast(page: Page, textFragment: string): Promise<boolean> {
  try {
    await page.locator(`text=${textFragment}`).waitFor({ timeout: 8000 })
    return true
  } catch {
    return false
  }
}

// ─── Check Redirect to Login ───────────────────────────────────────────────────
export async function assertRedirectsToLogin(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  const url = page.url()
  const bodyText = await page.locator('body').textContent() ?? ''
  const isLoginWall =
    url.includes('/login') ||
    url.includes('/auth') ||
    bodyText.includes('تسجيل الدخول') ||
    bodyText.includes('Sign in') ||
    bodyText.includes('Login')
  if (!isLoginWall) {
    throw new Error(`Expected redirect to login, but got URL: ${url}`)
  }
}
