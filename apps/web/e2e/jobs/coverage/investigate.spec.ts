/**
 * INVESTIGATION SCRIPT — D1, E1, UX5
 * Collects: URL, HTTP status, response body, console errors, screenshots, form state
 */
import { test, expect } from '@playwright/test'
import { loginAs, SEED_JOBS, jobApplicationsUrl } from './helpers'
import path from 'path'
import fs from 'fs'

const OUT = path.join(process.cwd(), 'evidence', 'investigation')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

function log(label: string, data: unknown) {
  const file = path.join(OUT, `${label}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  console.log(`\n📋 ${label}:`, JSON.stringify(data, null, 2))
}

// ─── P1: Guest → /ar/jobs/{id}/applications ───────────────────────────────────
test('INVESTIGATE P1 — Guest access to job applications page', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

  const networkRequests: { url: string; status: number; body: string }[] = []
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/') || url.includes('/jobs/')) {
      try {
        const body = await response.text().catch(() => '(binary)')
        networkRequests.push({ url, status: response.status(), body: body.slice(0, 500) })
      } catch { /* ignore */ }
    }
  })

  const targetUrl = jobApplicationsUrl(SEED_JOBS.active)
  await page.goto(targetUrl)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'p1-guest-applications.png'), fullPage: true })

  const finalUrl = page.url()
  const bodyText = (await page.locator('body').textContent() ?? '').slice(0, 1000)
  const pageTitle = await page.title()

  const isBlocked =
    finalUrl.includes('/login') ||
    finalUrl.includes('/auth') ||
    bodyText.includes('تسجيل الدخول') ||
    bodyText.includes('ليس لديك صلاحية')

  log('P1-result', {
    targetUrl,
    finalUrl,
    pageTitle,
    isBlocked,
    verdict: isBlocked ? '✅ PROTECTED' : '🔴 SECURITY BUG — unauthorized access',
    bodyExcerpt: bodyText.slice(0, 300),
    consoleErrors,
    apiCalls: networkRequests,
  })

  expect(isBlocked, `P1 FAIL: Guest can access ${finalUrl}`).toBe(true)
})

// ─── P2: Non-owner → /ar/jobs/{id}/applications ───────────────────────────────
test('INVESTIGATE P2 — Non-owner access to job applications list', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

  const apiCalls: { url: string; status: number; body: string }[] = []
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/') || url.includes('railway')) {
      try {
        const body = await response.text().catch(() => '(binary)')
        apiCalls.push({ url, status: response.status(), body: body.slice(0, 500) })
      } catch { /* ignore */ }
    }
  })

  await loginAs(page, 'applicant')
  const targetUrl = jobApplicationsUrl(SEED_JOBS.active)
  await page.goto(targetUrl)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'p2-nonowner-applications.png'), fullPage: true })

  const finalUrl = page.url()
  const bodyText = (await page.locator('body').textContent() ?? '').slice(0, 1000)
  const pageTitle = await page.title()

  const isRestricted =
    !finalUrl.includes('/applications') ||
    bodyText.includes('ليس لديك صلاحية') ||
    bodyText.includes('غير مصرح') ||
    bodyText.includes('لا توجد')

  log('P2-result', {
    loggedInAs: 'applicant',
    targetUrl,
    finalUrl,
    pageTitle,
    isRestricted,
    verdict: isRestricted ? '✅ PROTECTED' : '🔴 SECURITY BUG — non-owner sees applications',
    bodyExcerpt: bodyText.slice(0, 300),
    consoleErrors,
    apiCalls: apiCalls.slice(0, 10),
  })

  expect(isRestricted, `P2 FAIL: Non-owner can access applications at ${finalUrl}`).toBe(true)
})

// ─── F4: Submit button disabled investigation ─────────────────────────────────
test('INVESTIGATE F4 — Why submit button is disabled', async ({ page }) => {
  const consoleErrors: string[] = []
  const consoleAll: string[] = []
  page.on('console', msg => {
    consoleAll.push(`[${msg.type()}] ${msg.text()}`)
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await loginAs(page, 'employer')
  await page.goto('/ar/jobs/new')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'f4-step0.png'), fullPage: true })

  // Select HIRING type
  const hiringBtn = page.locator('button:has-text("أبحث عن سائق")')
  if (await hiringBtn.count() > 0) {
    await hiringBtn.click()
    await page.screenshot({ path: path.join(OUT, 'f4-after-type-select.png'), fullPage: true })
  }

  // Next
  const nextBtn0 = page.locator('button:has-text("التالي")')
  if (await nextBtn0.count() > 0) await nextBtn0.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT, 'f4-step1.png'), fullPage: true })

  // Fill step 1
  const titleInput = page.locator('input[name="title"]')
  if (await titleInput.count() > 0) {
    await titleInput.fill('سائق ثقيل - اختبار E2E')
    await page.locator('textarea[name="description"]').fill('مطلوب سائق شاحنة ثقيلة بخبرة لا تقل عن 3 سنوات.')
  }

  // Inspect ALL inputs and their values before clicking next
  const allInputs = await page.locator('input, textarea, select').all()
  const inputStates: { name: string; type: string; value: string; required: boolean }[] = []
  for (const input of allInputs) {
    inputStates.push({
      name: await input.getAttribute('name') ?? '',
      type: await input.getAttribute('type') ?? '',
      value: await input.inputValue().catch(() => ''),
      required: await input.getAttribute('required') !== null,
    })
  }

  const nextBtn1 = page.locator('button:has-text("التالي")')
  if (await nextBtn1.count() > 0) await nextBtn1.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT, 'f4-step2.png'), fullPage: true })

  // Fill step 2
  const fullTimeBtn = page.locator('button:has-text("دوام كامل")')
  if (await fullTimeBtn.count() > 0) await fullTimeBtn.click()

  const nextBtn2 = page.locator('button:has-text("التالي")')
  if (await nextBtn2.count() > 0) await nextBtn2.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT, 'f4-step3-before-submit.png'), fullPage: true })

  // Inspect submit button state
  const submitBtn = page.locator('button:has-text("نشر الإعلان")')
  const submitExists = await submitBtn.count() > 0
  let submitDisabled = false
  let submitAriaDisabled = ''
  let submitClass = ''
  if (submitExists) {
    submitDisabled = await submitBtn.isDisabled()
    submitAriaDisabled = await submitBtn.getAttribute('aria-disabled') ?? 'none'
    submitClass = await submitBtn.getAttribute('class') ?? ''
  }

  // Check validation errors visible on page
  const validationErrors = await page.locator('[role="alert"], .error, .text-red, [class*="error"]').allTextContents()

  log('F4-result', {
    submitExists,
    submitDisabled,
    submitAriaDisabled,
    submitClass,
    validationErrors,
    inputStates,
    consoleErrors,
    consoleAll: consoleAll.slice(0, 20),
    finalUrl: page.url(),
  })
})
