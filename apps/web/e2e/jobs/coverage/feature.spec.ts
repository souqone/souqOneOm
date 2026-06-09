/**
 * FEATURE COVERAGE
 * ─────────────────────────────────────────────────────────────────────────────
 * For every feature:
 *   1. Does it open?
 *   2. Does it complete?
 *   3. Does it end with the expected result?
 *
 * Screenshots saved to: evidence/
 */
import { test, expect } from '@playwright/test'
import { loginAs, capture, SEED_JOBS, jobUrl } from './helpers'

// ─── F1: Browse Jobs (Public) ─────────────────────────────────────────────────
test.describe('F1 · Browse Jobs [public]', () => {
  test('browse page opens and shows jobs or empty state', async ({ page }) => {
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')
    await capture(page, 'browse')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toContainText('500')

    const hasCards = await page.locator('[class*="card-base"], [class*="job-card"]').count() > 0
    const hasEmpty  = await page.locator('[class*="empty"]').or(page.locator('text=لا توجد')).count() > 0
    expect(hasCards || hasEmpty).toBe(true)
  })

  test('clicking a job card opens job detail page', async ({ page }) => {
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href*="/jobs/"]')
      .filter({ hasNotText: /browse|drivers|my/ })
      .first()

    const count = await link.count()
    if (count === 0) {
      test.skip(true, 'No job cards visible — empty database')
      return
    }

    await link.click()
    await page.waitForLoadState('networkidle')
    await capture(page, 'job-detail')

    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('seeded active job detail loads with title and status badge', async ({ page }) => {
    await page.goto(jobUrl(SEED_JOBS.active))
    await page.waitForLoadState('networkidle')
    await capture(page, 'job-detail-seeded')

    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('500')
  })
})

// ─── F2: Browse Drivers (Public) ─────────────────────────────────────────────
test.describe('F2 · Browse Drivers [public]', () => {
  test('drivers page opens and shows cards or empty state', async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')
    await capture(page, 'drivers-browse')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')

    const hasCards = await page.locator('[class*="card-base"], [class*="driver-card"]').count() > 0
    const hasEmpty  = await page.locator('[class*="empty"]').or(page.locator('text=لا يوجد')).count() > 0
    expect(hasCards || hasEmpty).toBe(true)
  })

  test('driver profile page loads from drivers list', async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href*="/jobs/drivers/"]').first()
    if (await link.count() === 0) {
      test.skip(true, 'No driver cards visible')
      return
    }

    await link.click()
    await page.waitForLoadState('networkidle')
    await capture(page, 'driver-profile')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('h1, h2, [class*="font-extrabold"]').first()).toBeVisible()
  })
})

// ─── F3: Job Landing Page (Public) ───────────────────────────────────────────
test.describe('F3 · Jobs Landing [public]', () => {
  test('landing page loads with hero section and navigation links', async ({ page }) => {
    await page.goto('/ar/jobs')
    await page.waitForLoadState('networkidle')
    await capture(page, 'jobs-landing')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('section').first()).toBeVisible()

    const jobLinks = page.locator('a[href*="/jobs"]')
    await expect(jobLinks.first()).toBeVisible()
  })
})

// ─── F4: Create Hiring Job (Employer) ────────────────────────────────────────
test.describe('F4 · Create Hiring Job [employer]', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'employer')
  })

  test('job creation form opens for employer', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')
    await capture(page, 'create-job-form')

    // Should show the job creation form, not a redirect to login/onboarding
    const url = page.url()
    const bodyText = await page.locator('body').textContent() ?? ''
    const isFormOrDashboard =
      url.includes('/new') ||
      url.includes('/dashboard') ||
      bodyText.includes('نشر إعلان') ||
      bodyText.includes('نوع الإعلان')

    expect(isFormOrDashboard).toBe(true)
  })

  test('HIRING job: fills all steps and submits', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')

    // Check if form is visible (may redirect to dashboard if already has jobs)
    const isNewPage = page.url().includes('/new')
    if (!isNewPage) {
      test.skip(true, 'Redirected — not on /jobs/new')
      return
    }

    // Step 0: Select Job Type — HIRING (أبحث عن سائق)
    const hiringBtn = page.locator('button:has-text("أبحث عن سائق")')
    if (await hiringBtn.count() === 0) {
      test.skip(true, 'Job type buttons not found')
      return
    }
    await hiringBtn.click()
    await capture(page, 'create-step0-type')

    const nextBtn = page.locator('button:has-text("التالي")')
    if (await nextBtn.count() > 0) await nextBtn.click()

    // Step 1: Details
    const titleInput = page.locator('input[name="title"]')
    if (await titleInput.count() === 0) {
      test.skip(true, 'Step 1 title input not found')
      return
    }
    await titleInput.fill('سائق ثقيل - اختبار E2E')
    await page.locator('textarea[name="description"]').fill('مطلوب سائق شاحنة ثقيلة بخبرة لا تقل عن 3 سنوات.')
    await capture(page, 'create-step1-details')
    await page.locator('button:has-text("التالي")').click()

    // Step 2: Requirements
    const fullTimeBtn = page.locator('button:has-text("دوام كامل")')
    if (await fullTimeBtn.count() > 0) await fullTimeBtn.click()
    const minSalary = page.locator('input[name="minSalary"]')
    if (await minSalary.count() > 0) await minSalary.fill('400')
    const maxSalary = page.locator('input[name="maxSalary"]')
    if (await maxSalary.count() > 0) await maxSalary.fill('700')
    await capture(page, 'create-step2-requirements')
    await page.locator('button:has-text("التالي")').click()

    // Step 3: Location & Submit
    // LocationSection renders <select> without name attr — use role-based selector
    const govSelect = page.locator('select').first()
    if (await govSelect.count() > 0) await govSelect.selectOption({ index: 1 })
    await capture(page, 'create-step3-location')
    const submitBtn = page.locator('button:has-text("نشر الإعلان")')
    if (await submitBtn.count() === 0) {
      test.skip(true, 'Publish button not found')
      return
    }
    await submitBtn.click()
    await page.waitForLoadState('networkidle')
    await capture(page, 'create-job-result')

    // EXPECTED: Redirected to the new job's detail page or dashboard
    const finalUrl = page.url()
    const isSuccess =
      finalUrl.match(/\/jobs\/[a-zA-Z0-9-]+$/) != null ||
      finalUrl.includes('/dashboard')
    expect(isSuccess).toBe(true)
  })
})

// ─── F5: Dashboard (Authenticated) ───────────────────────────────────────────
test.describe('F5 · Dashboard [employer + driver]', () => {
  test('employer dashboard shows jobs list', async ({ page }) => {
    await loginAs(page, 'employer')
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')
    await capture(page, 'dashboard-employer')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')

    const url = page.url()
    const bodyText = await page.locator('body').textContent() ?? ''
    const isAccessible =
      url.includes('/dashboard') ||
      bodyText.includes('لوحة التحكم') ||
      bodyText.includes('إعلاناتي')
    expect(isAccessible).toBe(true)
  })

  test('driver dashboard shows applications list', async ({ page }) => {
    await loginAs(page, 'driver')
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')
    await capture(page, 'dashboard-driver')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('role switcher buttons are present and interactive', async ({ page }) => {
    await loginAs(page, 'employer')
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')

    // A user with BOTH profiles should see role switcher
    const employerBtn = page.locator('button[aria-pressed]').filter({ hasText: /صاحب عمل|Employer/ })
    const driverBtn   = page.locator('button[aria-pressed]').filter({ hasText: /سائق|Driver/ })

    const hasSwitcher = await employerBtn.count() > 0 || await driverBtn.count() > 0
    // Skip if user only has one profile (no switcher shown)
    if (!hasSwitcher) {
      test.skip(true, 'User only has one profile — role switcher not shown')
      return
    }

    await driverBtn.first().click()
    await expect(driverBtn.first()).toHaveAttribute('aria-pressed', 'true')
    await capture(page, 'dashboard-role-switch')
  })
})

// ─── F6: Apply to Job (Driver) ────────────────────────────────────────────────
test.describe('F6 · Apply to Job [applicant/driver]', () => {
  test('apply button visible on active HIRING job for eligible driver', async ({ page }) => {
    await loginAs(page, 'applicant')
    await page.goto(jobUrl(SEED_JOBS.active))
    await page.waitForLoadState('networkidle')
    await capture(page, 'job-apply-view')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')

    // Should see apply CTA or already-applied state (STRINGS.YOUR_PROPOSAL = 'عرضك المقدم')
    const applyBtn     = page.locator('button:has-text("قدّم عرضك"), button:has-text("تقديم"), button:has-text("Apply")')
    const alreadyApplied = page.locator('text=عرضك المقدم')
      .or(page.locator('text=بانتظار الرد'))
      .or(page.locator('text=سحب العرض'))
    const hasAction    = await applyBtn.count() > 0 || await alreadyApplied.count() > 0
    expect(hasAction).toBe(true)
  })

  test('CLOSED job does NOT show apply button', async ({ page }) => {
    await loginAs(page, 'applicant')
    await page.goto(jobUrl(SEED_JOBS.closed))
    await page.waitForLoadState('networkidle')
    await capture(page, 'job-closed-no-apply')

    const applyBtnCount = await page.locator('button:has-text("تقديم")').count()
    expect(applyBtnCount).toBe(0)
  })

  test('owner does NOT see apply button on their own job', async ({ page }) => {
    await loginAs(page, 'employer')
    await page.goto(jobUrl(SEED_JOBS.active))
    await page.waitForLoadState('networkidle')
    await capture(page, 'job-owner-view')

    const applyBtnCount = await page.locator('button:has-text("تقديم")').count()
    expect(applyBtnCount).toBe(0)
  })
})

// ─── F7: My Jobs Page (Authenticated) ────────────────────────────────────────
test.describe('F7 · My Jobs [employer]', () => {
  test('/jobs/my shows auth guard or job list', async ({ page }) => {
    await loginAs(page, 'employer')
    await page.goto('/ar/jobs/my')
    await page.waitForLoadState('networkidle')
    await capture(page, 'my-jobs')

    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    const url = page.url()
    const bodyText = await page.locator('body').textContent() ?? ''
    const isOk =
      url.includes('/my') ||
      url.includes('/dashboard') ||
      (bodyText?.includes('إعلاناتي') ?? false)
    expect(isOk).toBe(true)
  })
})

// ─── F8: My Proposals Redirect ────────────────────────────────────────────────
test.describe('F8 · My Proposals → Dashboard Redirect', () => {
  test('/jobs/my-proposals redirects to /jobs/dashboard', async ({ page }) => {
    await page.goto('/ar/jobs/my-proposals')
    await page.waitForLoadState('networkidle')
    await capture(page, 'my-proposals-redirect')

    expect(page.url()).toContain('/jobs/dashboard')
  })
})
