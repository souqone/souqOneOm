/**
 * INVESTIGATION SCRIPT — D1, E1, UX5
 * Collects: URL, HTTP status, response body, console errors, screenshots, form state
 */
import { test } from '@playwright/test'
import { loginAs, SEED_JOBS, jobUrl } from './helpers'
import path from 'path'
import fs from 'fs'

const OUT = path.join(process.cwd(), 'evidence', 'investigation')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

function log(label: string, data: unknown) {
  const file = path.join(OUT, `${label}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  console.log(`\n📋 ${label}:`, JSON.stringify(data, null, 2))
}

// ─── D1: employer closes active job → job shows CLOSED badge ─────────────────
test('INVESTIGATE D1 — Close job badge', async ({ page }) => {
  const consoleErrors: string[] = []
  const apiCalls: { url: string; method: string; status: number; body: string }[] = []

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/') || url.includes('railway')) {
      const body = await response.text().catch(() => '(binary)')
      apiCalls.push({ url, method: response.request().method(), status: response.status(), body: body.slice(0, 300) })
    }
  })

  await loginAs(page, 'employer')
  await page.goto(jobUrl(SEED_JOBS.active))
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'd1-before.png'), fullPage: true })

  const jobPageUrl = page.url()
  const bodyBefore = (await page.locator('body').textContent() ?? '').slice(0, 500)

  // Check what buttons exist on the page
  const allButtons = await page.locator('button').allTextContents()
  const closeBtn = page.locator('button:has-text("إغلاق الوظيفة"), button:has-text("إغلاق")')
  const closeBtnCount = await closeBtn.count()
  const isAlreadyClosed = await page.locator('text=مغلق').count() > 0
  const jobStatusText = await page.locator('[class*="badge"], [class*="status"], [class*="chip"]').allTextContents()

  log('D1-before-state', {
    jobPageUrl,
    isAlreadyClosed,
    closeBtnCount,
    jobStatusText,
    allButtons: allButtons.filter(t => t.trim()),
    bodyExcerpt: bodyBefore.slice(0, 300),
    consoleErrors: consoleErrors.slice(0, 5),
  })

  if (closeBtnCount === 0) {
    log('D1-result', {
      verdict: isAlreadyClosed
        ? '⚠️ TEST ISSUE — Job already CLOSED from previous run (state pollution)'
        : '⚠️ MISSING UI — Close button does not exist on job detail page',
      isAlreadyClosed,
      closeBtnCount,
      jobPageUrl,
      availableButtons: allButtons.filter(t => t.trim()),
      apiCalls: apiCalls.slice(0, 10),
      consoleErrors,
    })
    return
  }

  // Click close
  await closeBtn.first().click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT, 'd1-after-click.png'), fullPage: true })

  const confirmBtn = page.locator('button:has-text("تأكيد"), button:has-text("Confirm"), button:has-text("نعم")')
  const confirmCount = await confirmBtn.count()
  if (confirmCount > 0) {
    await confirmBtn.first().click()
    await page.waitForLoadState('networkidle')
  }

  await page.screenshot({ path: path.join(OUT, 'd1-after-confirm.png'), fullPage: true })
  const bodyAfter = (await page.locator('body').textContent() ?? '').slice(0, 500)
  const isClosedAfter = await page.locator('text=مغلق').count() > 0
  const statusAfter = await page.locator('[class*="badge"], [class*="status"], [class*="chip"]').allTextContents()

  log('D1-result', {
    verdict: isClosedAfter
      ? '✅ CLOSED badge appeared — App works, test may have had login/timing issue'
      : '🔴 APP BUG — Closed badge did NOT appear after closing the job',
    closeBtnFound: true,
    confirmDialogFound: confirmCount > 0,
    isClosedAfter,
    statusAfter,
    finalUrl: page.url(),
    bodyAfterExcerpt: bodyAfter.slice(0, 300),
    apiCalls: apiCalls.slice(0, 15),
    consoleErrors,
  })
})

// ─── E1: driver onboarding wizard (4 steps) ──────────────────────────────────
test('INVESTIGATE E1 — Driver onboarding wizard', async ({ page }) => {
  const consoleErrors: string[] = []
  const apiCalls: { url: string; method: string; status: number; body: string }[] = []

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/') || url.includes('railway')) {
      const body = await response.text().catch(() => '(binary)')
      apiCalls.push({ url, method: response.request().method(), status: response.status(), body: body.slice(0, 300) })
    }
  })

  await loginAs(page, 'noProfile')
  await page.goto('/ar/jobs/onboarding')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'e1-start.png'), fullPage: true })

  const startUrl = page.url()
  const bodyStart = (await page.locator('body').textContent() ?? '').slice(0, 500)

  // What's on the onboarding page?
  const driverBtn = page.locator('button:has-text("أنا سائق"), button:has-text("سائق")')
  const driverBtnCount = await driverBtn.count()
  const allButtons = await page.locator('button').allTextContents()

  log('E1-start-state', {
    startUrl,
    driverBtnCount,
    allButtons: allButtons.filter(t => t.trim()),
    bodyExcerpt: bodyStart.slice(0, 300),
    consoleErrors: consoleErrors.slice(0, 5),
  })

  if (driverBtnCount === 0) {
    log('E1-result', {
      verdict: '⚠️ noProfile user may already have a profile — state pollution from previous run, OR onboarding page has different UI',
      startUrl,
      bodyExcerpt: bodyStart.slice(0, 300),
      apiCalls: apiCalls.slice(0, 10),
      consoleErrors,
    })
    return
  }

  // Step through onboarding
  await driverBtn.first().click()
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'e1-step1.png'), fullPage: true })

  // Check step 1 state
  const step1Buttons = await page.locator('button').allTextContents()
  const nextBtnStep1 = page.locator('button:has-text("التالي")')
  const nextStep1Count = await nextBtnStep1.count()
  const nextStep1Disabled = nextStep1Count > 0 ? await nextBtnStep1.first().isDisabled() : null

  // Try to select a license
  const licenseOptions = page.locator('button.rounded-xl, button[class*="border-2"]')
  const licenseCount = await licenseOptions.count()
  if (licenseCount > 0) await licenseOptions.first().click()

  await page.screenshot({ path: path.join(OUT, 'e1-step1-after-select.png'), fullPage: true })

  // Attempt step 2
  if (nextStep1Count > 0 && !nextStep1Disabled) {
    await nextBtnStep1.first().click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, 'e1-step2.png'), fullPage: true })
  } else {
    log('E1-result', {
      verdict: nextStep1Disabled
        ? '🔴 APP/TEST BUG — Next button disabled on step 1 (license not selectable or validation fails)'
        : '🔴 APP/TEST BUG — Next button not found on step 1',
      step1Buttons: step1Buttons.filter(t => t.trim()),
      licenseCount,
      nextStep1Count,
      nextStep1Disabled,
      consoleErrors,
      apiCalls: apiCalls.slice(0, 10),
    })
    return
  }

  // Step 2 → 3
  const nextBtnStep2 = page.locator('button:has-text("التالي")')
  if (await nextBtnStep2.count() > 0) {
    await nextBtnStep2.first().click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, 'e1-step3.png'), fullPage: true })
  }

  // Step 3 → 4
  const nextBtnStep3 = page.locator('button:has-text("التالي")')
  if (await nextBtnStep3.count() > 0) {
    await nextBtnStep3.first().click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, 'e1-step4.png'), fullPage: true })
  }

  // Step 4: governorate
  const govSelect = page.locator('select[name="governorate"]')
  const govSelectCount = await govSelect.count()

  // Inspect ALL inputs on step 4
  const step4Inputs = await page.locator('input, select, textarea').all()
  const inputStates = await Promise.all(step4Inputs.map(async (el) => ({
    name: await el.getAttribute('name'),
    type: await el.getAttribute('type'),
    tagName: await el.evaluate((e) => e.tagName),
    value: await el.inputValue().catch(() => ''),
  })))

  const submitBtn = page.locator('button:has-text("إنشاء البروفايل"), button[type="submit"]')
  const submitCount = await submitBtn.count()
  const submitDisabled = submitCount > 0 ? await submitBtn.last().isDisabled() : null

  log('E1-step4-state', {
    govSelectCount,
    govSelectFound: govSelectCount > 0,
    inputStates,
    submitCount,
    submitDisabled,
    consoleErrors: consoleErrors.slice(0, 10),
  })

  if (govSelectCount > 0) await govSelect.selectOption({ index: 1 })

  if (submitCount > 0 && !submitDisabled) {
    await submitBtn.last().click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, 'e1-submit-result.png'), fullPage: true })
  }

  const finalUrl = page.url()
  const isSuccess = finalUrl.includes('/dashboard') || (await page.locator('text=تم إنشاء بروفايل').count() > 0)

  log('E1-result', {
    verdict: isSuccess
      ? '✅ Onboarding completed successfully'
      : govSelectCount === 0
      ? '⚠️ TEST BUG — select[name="governorate"] not found (custom component, same as F4)'
      : submitDisabled
      ? '🔴 APP/TEST BUG — Submit button disabled on step 4'
      : '🔴 APP BUG — Submit clicked but no redirect to dashboard',
    finalUrl,
    isSuccess,
    govSelectCount,
    submitDisabled,
    apiCalls: apiCalls.slice(0, 15),
    consoleErrors,
  })
})

// ─── UX5: mobile dashboard login ─────────────────────────────────────────────
test('INVESTIGATE UX5 — Mobile dashboard login (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })

  const consoleErrors: string[] = []
  const apiCalls: { url: string; method: string; status: number; body: string }[] = []

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/') || url.includes('railway')) {
      const body = await response.text().catch(() => '(binary)')
      apiCalls.push({ url, method: response.request().method(), status: response.status(), body: body.slice(0, 300) })
    }
  })

  // Go to /login as the test does
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(OUT, 'ux5-login-page.png'), fullPage: true })

  const loginUrl = page.url()
  const bodyText = (await page.locator('body').textContent() ?? '').slice(0, 500)
  const hasAuthSheet = await page.locator('.auth-sheet').count() > 0
  const hasOldForm = await page.locator('input[placeholder="البريد الإلكتروني"]').count() > 0
  const allInputs = await page.locator('input').all()
  const inputDetails = await Promise.all(allInputs.map(async el => ({
    type: await el.getAttribute('type'),
    placeholder: await el.getAttribute('placeholder'),
    name: await el.getAttribute('name'),
  })))

  // Check overlays blocking interaction on mobile
  const fixedOverlays = await page.locator('.fixed').all()
  const overlayDetails: string[] = []
  for (const el of fixedOverlays.slice(0, 5)) {
    overlayDetails.push(await el.getAttribute('class') ?? '')
  }

  log('UX5-login-state', {
    loginUrl,
    hasAuthSheet,
    hasOldForm,
    inputDetails,
    overlayDetails,
    bodyExcerpt: bodyText.slice(0, 300),
    consoleErrors: consoleErrors.slice(0, 5),
  })

  // Try the approach the test uses (old placeholder-based)
  const emailInputOld = page.locator('input[placeholder="البريد الإلكتروني"]')
  const emailOldCount = await emailInputOld.count()

  // Try the new approach (auth-sheet)
  if (!hasAuthSheet && !emailOldCount) {
    log('UX5-result', {
      verdict: '🔴 TEST BUG — /login redirects or shows nothing on mobile viewport (no form, no modal)',
      loginUrl,
      hasAuthSheet,
      hasOldForm: emailOldCount > 0,
      consoleErrors,
      apiCalls: apiCalls.slice(0, 5),
    })
    return
  }

  // Try to login using whichever approach is available
  let loginSucceeded = false
  try {
    if (hasAuthSheet) {
      const modal = page.locator('.auth-sheet')
      await modal.locator('input[type="email"]').fill('employer@souqone.om')
      await modal.locator('input[type="password"]').fill('Test1234')
      await modal.locator('button[type="submit"]').click({ force: true })
      await page.locator('.auth-sheet').waitFor({ state: 'detached', timeout: 20000 })
      loginSucceeded = true
    } else if (emailOldCount > 0) {
      await emailInputOld.fill('employer@souqone.om')
      await page.locator('input[placeholder="••••••••"]').fill('Test1234')
      await page.locator('button[type="submit"]').click({ force: true })
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
      loginSucceeded = true
    }
  } catch (e) {
    log('UX5-login-error', { error: String(e) })
  }

  await page.screenshot({ path: path.join(OUT, 'ux5-after-login.png'), fullPage: true })

  if (loginSucceeded) {
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT, 'ux5-dashboard-mobile.png'), fullPage: true })
  }

  const finalUrl = page.url()
  const hasServerError = await page.locator('text=Internal Server Error').count() > 0

  log('UX5-result', {
    verdict: !loginSucceeded
      ? '🔴 TEST BUG — Login failed on 375px viewport — old placeholder selectors + /login route don\'t match modal approach'
      : hasServerError
      ? '🔴 APP BUG — Internal Server Error on mobile dashboard'
      : '✅ Dashboard accessible on mobile — test has wrong login approach for mobile',
    loginSucceeded,
    hasAuthSheet,
    hasOldFormInputs: emailOldCount > 0,
    finalUrl,
    hasServerError,
    apiCalls: apiCalls.filter(r => r.url.includes('jobs') || r.url.includes('auth')).slice(0, 10),
    consoleErrors,
  })
})
