# TESTING.md — Testing Strategy
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Testing Philosophy

Findora follows the **Testing Trophy** approach:
- **Static analysis** (TypeScript + ESLint) — catches type errors and code quality issues automatically
- **Unit tests** — utility functions, validation schemas, pure business logic
- **Integration tests** — API routes, auth flows, database interactions
- **E2E tests** — critical user flows (login, report creation, messaging)

We prioritize **integration tests** over unit tests since most bugs in a full-stack app occur at integration boundaries.

---

## 2. Testing Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration tests |
| React Testing Library | Component tests |
| MSW (Mock Service Worker) | API mocking for component tests |
| Playwright | End-to-end tests |
| TypeScript | Static type checking |
| ESLint | Static code analysis |

---

## 3. Unit Tests

### What to Unit Test

- Zod validation schemas
- Utility functions (`lib/utils.ts`)
- File validation logic
- Date/formatting helpers
- Magic byte validation

### Setup

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### Example Unit Tests

```typescript
// src/lib/__tests__/validations.test.ts
import { describe, it, expect } from 'vitest'
import { createItemSchema } from '@/lib/validations'

describe('createItemSchema', () => {
  it('validates a valid lost item', () => {
    const result = createItemSchema.safeParse({
      type: 'lost',
      title: 'Black AirPods Pro',
      description: 'Lost during the tech fest near the main stage.',
      category: 'electronics',
      location: 'Main Auditorium',
      date_occurred: '2026-05-10',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a future date', () => {
    const result = createItemSchema.safeParse({
      type: 'lost',
      title: 'Test item title here',
      description: 'Test description that is long enough.',
      category: 'electronics',
      location: 'Test location',
      date_occurred: '2099-01-01',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('future')
  })

  it('rejects short titles', () => {
    const result = createItemSchema.safeParse({
      type: 'lost',
      title: 'Hi',   // too short
      description: 'Valid description here.',
      category: 'electronics',
      location: 'Test location',
      date_occurred: '2026-05-10',
    })
    expect(result.success).toBe(false)
  })
})
```

```typescript
// src/lib/__tests__/file-validation.test.ts
import { describe, it, expect } from 'vitest'
import { isValidImageMagicBytes, validateImageFile } from '@/lib/file-validation'

describe('isValidImageMagicBytes', () => {
  it('identifies JPEG magic bytes', () => {
    const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])
    expect(isValidImageMagicBytes(jpegBytes)).toBe(true)
  })

  it('rejects non-image bytes', () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])  // %PDF
    expect(isValidImageMagicBytes(pdfBytes)).toBe(false)
  })
})
```

---

## 4. Component Tests

### What to Test

- Rendering with different props/states
- User interactions (click, type, submit)
- Conditional rendering (loading, error, empty)
- Accessibility (ARIA attributes, focus management)

### Example Component Tests

```typescript
// src/components/features/items/__tests__/item-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ItemCard } from '@/components/features/items/item-card'
import { mockItem } from '@/tests/mocks/items'

describe('ItemCard', () => {
  it('renders item title and category', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText(mockItem.title)).toBeInTheDocument()
    expect(screen.getByText(/electronics/i)).toBeInTheDocument()
  })

  it('shows lost status badge for lost items', () => {
    render(<ItemCard item={{ ...mockItem, type: 'lost', status: 'lost' }} />)
    expect(screen.getByText(/lost/i)).toBeInTheDocument()
  })

  it('shows placeholder when no images', () => {
    render(<ItemCard item={{ ...mockItem, images: [] }} />)
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
  })
})
```

```typescript
// src/components/features/items/__tests__/report-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportForm } from '@/components/features/items/report-form'

describe('ReportForm', () => {
  it('shows validation error for short title', async () => {
    const user = userEvent.setup()
    render(<ReportForm />)

    await user.type(screen.getByLabelText(/title/i), 'Hi')
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(/at least 5 characters/i)).toBeInTheDocument()
  })
})
```

---

## 5. API Route Tests

### What to Test

- Authentication enforcement (returns 401 without session)
- Authorization (returns 403 for wrong user)
- Input validation (returns 422 for invalid input)
- Successful responses (correct shape + status code)
- Edge cases (item not found, conversation locked)

### Example API Tests

```typescript
// src/app/api/items/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/items/route'
import { createMockRequest } from '@/tests/helpers'
import { mockSupabaseClient } from '@/tests/mocks/supabase'

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('GET /api/items', () => {
  it('requires authentication', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = createMockRequest({ method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated items for authenticated user', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@ds.study.iitm.ac.in' } }
    })
    mockSupabaseClient.from.mockReturnThis()
    // ... mock chain

    const req = createMockRequest({ method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
  })
})

describe('POST /api/items', () => {
  it('validates required fields', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@ds.study.iitm.ac.in' } }
    })

    const req = createMockRequest({
      method: 'POST',
      body: { type: 'lost', title: 'Hi' },  // invalid: too short
    })

    const res = await POST(req)
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})
```

---

## 6. End-to-End Tests (Playwright)

### Setup

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Critical E2E Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL('/login')
  })

  test('shows domain restriction notice on login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/@ds\.study\.iitm\.ac\.in/)).toBeVisible()
  })

  // Note: Full OAuth login requires a test account fixture
  // Use Supabase magic link or test credentials in E2E env
})
```

```typescript
// e2e/items.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Item Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('creates a lost item report', async ({ page }) => {
    await page.goto('/report')

    await page.fill('[name="title"]', 'Black AirPods Pro')
    await page.selectOption('[name="category"]', 'electronics')
    await page.fill('[name="description"]', 'Lost during the tech fest near the main stage.')
    await page.fill('[name="location"]', 'Main Auditorium')
    await page.fill('[name="date_occurred"]', '2026-05-10')

    await page.click('button:has-text("Submit Report")')

    await expect(page.getByText('Report submitted successfully')).toBeVisible()
    await expect(page).toHaveURL(/\/items\//)
  })

  test('shows item in feed after creation', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByText('Black AirPods Pro')).toBeVisible()
  })

  test('can search for items', async ({ page }) => {
    await page.goto('/search')
    await page.fill('[placeholder*="Search"]', 'AirPods')
    await expect(page.getByText('Black AirPods Pro')).toBeVisible()
  })
})
```

```typescript
// e2e/messaging.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsUser1, loginAsUser2 } from './helpers/auth'

test.describe('Messaging', () => {
  test('owner can initiate conversation with finder', async ({ browser }) => {
    const ownerContext = await browser.newContext()
    const finderContext = await browser.newContext()

    const ownerPage = await ownerContext.newPage()
    const finderPage = await finderContext.newPage()

    await loginAsUser1(ownerPage)
    await loginAsUser2(finderPage)

    // Finder creates a found item report
    await finderPage.goto('/report')
    // ... fill form

    // Owner views found item and connects
    await ownerPage.goto('/search')
    // ... find item, click "Connect with Finder"

    await expect(ownerPage.getByText('Conversation started')).toBeVisible()

    // Finder sees conversation
    await finderPage.goto('/messages')
    await expect(finderPage.getByText('New conversation')).toBeVisible()
  })
})
```

---

## 7. Test Data & Fixtures

```typescript
// src/tests/mocks/items.ts
import { Item, ItemWithUser } from '@/types/items'

export const mockItem: ItemWithUser = {
  id: 'item-123',
  user_id: 'user-123',
  type: 'lost',
  status: 'lost',
  title: 'Black AirPods Pro',
  description: 'Lost during the tech fest.',
  category: 'electronics',
  location: 'Main Auditorium',
  date_occurred: '2026-05-10',
  created_at: '2026-05-10T14:00:00Z',
  updated_at: '2026-05-10T14:00:00Z',
  is_flagged: false,
  flag_count: 0,
  view_count: 0,
  user: {
    id: 'user-123',
    full_name: 'Arjun Kumar',
    avatar_url: null,
  },
  images: [],
}
```

---

## 8. Running Tests

```bash
# Unit + component tests
npm test

# Watch mode during development
npm run test:watch

# With coverage report
npm run test:coverage

# E2E tests (requires dev server running)
npm run e2e

# E2E in headed mode (see browser)
npm run e2e:headed

# E2E for specific test
npx playwright test e2e/auth.spec.ts
```

---

## 9. Coverage Targets

| Category | Target |
|----------|--------|
| Utility functions | 90%+ |
| Validation schemas | 90%+ |
| API routes | 80%+ |
| Components | 70%+ |
| E2E (critical paths) | 100% |

---

## 10. Pre-commit Hooks

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

```bash
npm install -D husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
echo "npm run typecheck" >> .husky/pre-commit
```

This ensures no type errors or lint violations make it into the repository.
