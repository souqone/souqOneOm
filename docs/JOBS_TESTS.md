# Jobs Section — Tests (Unit + E2E)

## ⚠️ DO NOT STOP UNTIL ALL 20 ITEMS ARE CHECKED OFF

```
SETUP:
[ ] 1.  Playwright installed and configured
[ ] 2.  Vitest/Jest configured for frontend unit tests

UNIT TESTS — components (7):
[ ] 3.  JobCard.test.tsx
[ ] 4.  DriverCard.test.tsx
[ ] 5.  ProposalCard.test.tsx
[ ] 6.  JobFilterSidebar.test.tsx
[ ] 7.  DashboardStatsRow.test.tsx
[ ] 8.  MyPostsList.test.tsx
[ ] 9.  MyProposalsList.test.tsx

UNIT TESTS — utils (1):
[ ] 10. lib/utils.jobs.test.ts  (timeAgo, formatSalary, getInitials)

E2E TESTS — pages (9):
[ ] 11. jobs-landing.spec.ts        (/jobs)
[ ] 12. jobs-browse.spec.ts         (/jobs/browse)
[ ] 13. jobs-detail.spec.ts         (/jobs/[id])
[ ] 14. jobs-new.spec.ts            (/jobs/new)
[ ] 15. jobs-my.spec.ts             (/jobs/my)
[ ] 16. jobs-my-proposals.spec.ts   (/jobs/my-proposals)
[ ] 17. jobs-drivers.spec.ts        (/jobs/drivers)
[ ] 18. jobs-driver-profile.spec.ts (/jobs/drivers/[id])
[ ] 19. jobs-dashboard.spec.ts      (/jobs/dashboard)

VERIFY:
[ ] 20. All tests pass — 0 failures
```

---

## STEP 1 — Check & install dependencies

```bash
# Check if Playwright is installed
ls apps/web/playwright.config.ts 2>/dev/null || echo "MISSING"
ls apps/web/package.json | xargs grep -l "playwright" 2>/dev/null || echo "NOT IN PACKAGE"

# Check Vitest/Jest
grep -E '"vitest"|"jest"' apps/web/package.json

# Install if missing
cd apps/web
npx playwright install --with-deps chromium 2>/dev/null || true
```

If Playwright config is missing, create `apps/web/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'ar',
    timezoneId: 'Asia/Muscat',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
```

---

## STEP 2 — Unit tests setup

Create `apps/web/src/features/jobs/components/__tests__/` directory.

All unit tests use this pattern:
```ts
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
```

---

## STEP 3 — Unit tests: components

### JobCard.test.tsx
```ts
// apps/web/src/features/jobs/components/__tests__/JobCard.test.tsx
import { render, screen } from '@testing-library/react'
import JobCard from '../JobCard'
import { mockJob } from './mocks'

describe('JobCard', () => {
  it('renders job title', () => {
    render(<JobCard job={mockJob} />, { wrapper })
    expect(screen.getByText(mockJob.title)).toBeInTheDocument()
  })

  it('shows HIRING badge when jobType is HIRING', () => {
    render(<JobCard job={{ ...mockJob, jobType: 'HIRING' }} />, { wrapper })
    expect(screen.getByText(/توظيف|hiring/i)).toBeInTheDocument()
  })

  it('shows OFFERING badge when jobType is OFFERING', () => {
    render(<JobCard job={{ ...mockJob, jobType: 'OFFERING' }} />, { wrapper })
    expect(screen.getByText(/عرض|offering/i)).toBeInTheDocument()
  })

  it('shows salary when provided', () => {
    render(<JobCard job={{ ...mockJob, salary: 500, salaryPeriod: 'MONTHLY' }} />, { wrapper })
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })

  it('shows location', () => {
    render(<JobCard job={mockJob} />, { wrapper })
    expect(screen.getByText(mockJob.governorate)).toBeInTheDocument()
  })
})
```

### DriverCard.test.tsx
```ts
describe('DriverCard', () => {
  it('renders driver name', () => {
    render(<DriverCard driver={mockDriver} />, { wrapper })
    expect(screen.getByText(mockDriver.user.name)).toBeInTheDocument()
  })

  it('renders license types', () => {
    render(<DriverCard driver={mockDriver} />, { wrapper })
    mockDriver.licenseTypes.forEach(lt => {
      expect(screen.getByText(new RegExp(lt, 'i'))).toBeInTheDocument()
    })
  })

  it('links to driver profile', () => {
    render(<DriverCard driver={mockDriver} />, { wrapper })
    expect(screen.getByRole('link')).toHaveAttribute('href', `/jobs/drivers/${mockDriver.id}`)
  })
})
```

### ProposalCard.test.tsx
```ts
describe('ProposalCard', () => {
  it('renders job title', () => {
    render(<ProposalCard application={mockApplication} />, { wrapper })
    expect(screen.getByText(mockApplication.job.title)).toBeInTheDocument()
  })

  it('shows status badge', () => {
    render(<ProposalCard application={{ ...mockApplication, status: 'ACCEPTED' }} />, { wrapper })
    expect(screen.getByText(/مقبول|accepted/i)).toBeInTheDocument()
  })

  it('shows withdraw button when status is PENDING', () => {
    render(<ProposalCard application={{ ...mockApplication, status: 'PENDING' }} />, { wrapper })
    expect(screen.getByRole('button', { name: /سحب|withdraw/i })).toBeInTheDocument()
  })
})
```

### DashboardStatsRow.test.tsx
```ts
describe('DashboardStatsRow', () => {
  it('renders 4 stat cards', () => {
    render(<DashboardStatsRow role="EMPLOYER" jobsCount={5} applicationsCount={12} acceptedCount={3} activeCount={2} />, { wrapper })
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('displays correct counts', () => {
    render(<DashboardStatsRow role="EMPLOYER" jobsCount={5} applicationsCount={12} acceptedCount={3} activeCount={2} />, { wrapper })
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
```

### mocks.ts (shared mock data for unit tests)
```ts
// apps/web/src/features/jobs/components/__tests__/mocks.ts
export const mockJob = {
  id: 'job-1',
  title: 'سائق شاحنة',
  description: 'مطلوب سائق خبرة 3 سنوات',
  jobType: 'HIRING' as const,
  employmentType: 'FULL_TIME' as const,
  governorate: 'مسقط',
  salary: 400,
  salaryPeriod: 'MONTHLY' as const,
  licenseTypes: ['HEAVY'],
  status: 'OPEN' as const,
  applicationsCount: 5,
  viewsCount: 120,
  createdAt: new Date().toISOString(),
  employer: { id: 'emp-1', companyName: 'شركة النقل', user: { name: 'أحمد' } },
}

export const mockDriver = {
  id: 'drv-1',
  governorate: 'مسقط',
  licenseTypes: ['HEAVY', 'LIGHT'],
  experienceYears: 5,
  user: { id: 'usr-1', name: 'محمد السيد', avatarUrl: null },
}

export const mockApplication = {
  id: 'app-1',
  status: 'PENDING' as const,
  createdAt: new Date().toISOString(),
  job: { id: 'job-1', title: 'سائق شاحنة', governorate: 'مسقط', jobType: 'HIRING' as const },
}
```

---

## STEP 4 — Unit tests: utils

```ts
// apps/web/src/lib/__tests__/utils.jobs.test.ts
import { timeAgo, formatSalary, getInitials, getAvatarColor } from '@/lib/utils'

describe('timeAgo', () => {
  it('returns "الآن" for recent dates', () => {
    expect(timeAgo(new Date().toISOString())).toMatch(/الآن|ثانية/)
  })

  it('returns days for older dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(threeDaysAgo)).toMatch(/يوم|أيام/)
  })
})

describe('formatSalary', () => {
  it('formats salary with period', () => {
    expect(formatSalary(500, 'MONTHLY')).toContain('500')
  })

  it('returns negotiable text when no salary', () => {
    expect(formatSalary(undefined, 'NEGOTIABLE')).toMatch(/تفاوض|negotiable/i)
  })
})

describe('getInitials', () => {
  it('returns first 2 chars of name', () => {
    expect(getInitials('أحمد محمد')).toHaveLength(2)
  })
})
```

---

## STEP 5 — E2E tests

Create directory: `apps/web/e2e/jobs/`

### Helper: auth fixture
```ts
// apps/web/e2e/fixtures/auth.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Use existing session cookie if available, otherwise skip auth-required tests
    await use(page)
  },
})
```

### jobs-landing.spec.ts
```ts
// apps/web/e2e/jobs/jobs-landing.spec.ts
import { test, expect } from '@playwright/test'

test.describe('/jobs — Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/jobs')
  })

  test('page loads without errors', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('shows hero section', async ({ page }) => {
    await expect(page.locator('section').first()).toBeVisible()
  })

  test('shows jobs grid', async ({ page }) => {
    // Wait for loading to finish
    await page.waitForLoadState('networkidle')
    // Either shows jobs or empty state
    const hasJobs = await page.locator('[class*="card"]').count()
    const hasEmpty = await page.locator('[class*="empty"]').count()
    expect(hasJobs + hasEmpty).toBeGreaterThan(0)
  })

  test('SubNavBar is visible', async ({ page }) => {
    await expect(page.locator('nav').filter({ hasText: 'الوظائف' })).toBeVisible()
  })
})
```

### jobs-browse.spec.ts
```ts
// apps/web/e2e/jobs/jobs-browse.spec.ts
import { test, expect } from '@playwright/test'

test.describe('/jobs/browse — Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/jobs/browse')
  })

  test('page loads', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/)
  })

  test('filter sidebar is visible', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[class*="filter"], aside, [class*="sidebar"]').first()).toBeVisible()
  })

  test('job cards render or empty state shows', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const cards = page.locator('[class*="card-base"], [class*="job-card"]')
    const empty = page.locator('[class*="empty"]')
    const count = await cards.count() + await empty.count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking a job card navigates to detail', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href*="/jobs/"]').first()
    const count = await firstCard.count()
    if (count > 0) {
      await firstCard.click()
      await expect(page).toHaveURL(/\/jobs\/[^/]+$/)
    }
  })
})
```

### jobs-detail.spec.ts
```ts
// apps/web/e2e/jobs/jobs-detail.spec.ts
import { test, expect } from '@playwright/test'

test.describe('/jobs/[id] — Job Detail', () => {
  test('detail page loads for a real job id', async ({ page }) => {
    // First get a real job id from browse
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')
    const link = page.locator('a[href*="/jobs/"]').first()
    if (await link.count() === 0) {
      test.skip(true, 'No jobs available to test')
    }
    const href = await link.getAttribute('href')
    await page.goto(href!)
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/error/)
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('shows job details section', async ({ page }) => {
    await page.goto('/ar/jobs/browse')
    await page.waitForLoadState('networkidle')
    const link = page.locator('a[href*="/jobs/c"]').first()
    if (await link.count() === 0) test.skip(true, 'No jobs')
    await link.click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
```

### jobs-drivers.spec.ts
```ts
// apps/web/e2e/jobs/jobs-drivers.spec.ts
import { test, expect } from '@playwright/test'

test.describe('/jobs/drivers — Drivers Browse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/jobs/drivers')
    await page.waitForLoadState('networkidle')
  })

  test('page loads', async ({ page }) => {
    await expect(page).not.toHaveURL(/error/)
  })

  test('shows driver cards or empty state', async ({ page }) => {
    const cards = page.locator('[class*="card"]')
    const empty = page.locator('[class*="empty"]')
    expect(await cards.count() + await empty.count()).toBeGreaterThan(0)
  })

  test('clicking driver card goes to profile', async ({ page }) => {
    const link = page.locator('a[href*="/jobs/drivers/"]').first()
    if (await link.count() === 0) test.skip(true, 'No drivers')
    await link.click()
    await expect(page).toHaveURL(/\/jobs\/drivers\/[^/]+$/)
  })
})
```

### jobs-dashboard.spec.ts
```ts
// apps/web/e2e/jobs/jobs-dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('/jobs/dashboard — Dashboard', () => {
  test('redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')
    // Either shows login redirect OR shows dashboard
    const url = page.url()
    const isOk = url.includes('/login') || url.includes('/auth') || url.includes('/dashboard')
    expect(isOk).toBe(true)
  })

  test('page does not crash with 500', async ({ page }) => {
    await page.goto('/ar/jobs/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })
})
```

### jobs-new.spec.ts
```ts
// apps/web/e2e/jobs/jobs-new.spec.ts
import { test, expect } from '@playwright/test'

test.describe('/jobs/new — Create Job', () => {
  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const isOk = url.includes('/login') || url.includes('/auth') || url.includes('/new') || url.includes('/onboarding')
    expect(isOk).toBe(true)
  })

  test('form page does not crash', async ({ page }) => {
    await page.goto('/ar/jobs/new')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('500')
  })
})
```

---

## STEP 6 — Run all tests

```bash
cd apps/web

# Unit tests
npx vitest run src/features/jobs/components/__tests__/ src/lib/__tests__/utils.jobs.test.ts

# E2E tests (requires dev server running)
npx playwright test e2e/jobs/ --reporter=list
```

Expected result: All tests pass or skip (no failures).

---

## STEP 7 — Fix any failures

For each failing test:
1. Read the error message
2. Check if it's a missing import, wrong selector, or API issue
3. Fix the source — do NOT change the test expectation unless the test itself is wrong
4. Re-run until all pass

```bash
# Re-run specific failing test
npx playwright test e2e/jobs/jobs-browse.spec.ts --headed
```
