# Testing Strategy

This guide covers how to implement testing for Aura app.

## Current Testing Status

- ✅ Manual testing (works in browser)
- ✅ Build validation (npm run build succeeds)
- ❌ No automated tests
- ❌ No CI/CD test integration
- ❌ No accessibility audit

## Testing Pyramid

```
         ┌─────────┐
         │ E2E (5%)|  Complex user flows in real browser
         ├─────────┤
         │  Int(20%)│  Component integration tests
         ├─────────┤
         │ Unit(75%)│  Individual functions/hooks
         └─────────┘
```

## Unit Testing (Jest + React Testing Library)

### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom babel-jest
```

### Jest Config (jest.config.js)

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
```

### Example Tests

```javascript
// src/utils/auraGenerator.test.js
import { buildFallbackAura, hashString } from '../App';

describe('Aura Generation', () => {
  test('hashString produces consistent hash', () => {
    const hash1 = hashString('happy');
    const hash2 = hashString('happy');
    expect(hash1).toBe(hash2);
  });

  test('buildFallbackAura generates valid structure', () => {
    const aura = buildFallbackAura('feeling excited');
    expect(aura).toHaveProperty('auraName');
    expect(aura).toHaveProperty('auraType');
    expect(aura).toHaveProperty('element');
    expect(aura.colors).toHaveLength(3);
    aura.colors.forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test('sad mood triggers Healer aura type', () => {
    const aura = buildFallbackAura('feeling sad');
    expect(aura.auraType).toBe('Healer');
  });
});
```

```javascript
// src/localStorage.test.js
import { loadReadings, saveReadings, loadUser, saveUser } from '../App';

describe('LocalStorage Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saveReadings and loadReadings round-trip', () => {
    const readings = [
      { id: 1, input: 'happy', aura: {} },
      { id: 2, input: 'sad', aura: {} },
    ];
    saveReadings(readings);
    expect(loadReadings()).toEqual(readings);
  });

  test('loadReadings returns empty array when empty', () => {
    expect(loadReadings()).toEqual([]);
  });

  test('saveUser and loadUser work correctly', () => {
    const user = { id: 1, name: 'Rishi' };
    saveUser(user);
    expect(loadUser()).toEqual(user);
  });
});
```

## Integration Testing (React Testing Library)

```javascript
// src/App.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('App Integration', () => {
  test('renders home view on load', () => {
    render(<App />);
    expect(screen.getByText('AURA')).toBeInTheDocument();
    expect(screen.getByText('Read My Aura')).toBeInTheDocument();
  });

  test('navigation buttons visible', () => {
    render(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText(/History/)).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('can switch to Profile view', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  test('can sign in with username', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Profile'));
    const input = screen.getByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: 'Rishi' } });
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByText(/Logged in as/)).toBeInTheDocument();
    });
  });

  test('can generate aura reading', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/How are you feeling/);
    fireEvent.change(textarea, { target: { value: 'feeling great' } });
    fireEvent.click(screen.getByText('Read My Aura'));
    await waitFor(() => {
      expect(screen.getByText('Read again')).toBeInTheDocument();
    });
  });
});
```

## End-to-End Testing (Playwright/Cypress)

### Playwright Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Example E2E Test (Playwright)

```javascript
// e2e/aura.spec.js
import { test, expect } from '@playwright/test';

test.describe('Aura App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/aura-app/');
  });

  test('complete user flow', async ({ page }) => {
    // 1. Generate reading
    await page.fill('textarea', 'feeling anxious');
    await page.click('button:has-text("Read My Aura")');
    await expect(page).toContainText(/Current|Restless|Bloom/);

    // 2. Go to history
    await page.click('button:has-text("History")');
    await expect(page).toContainText('Past Readings');

    // 3. Replay reading
    await page.click('div:has-text("anxious")');
    await expect(page).toContainText('Read again');

    // 4. Sign in
    await page.click('button:has-text("Profile")');
    await page.fill('input#username-input', 'TestUser');
    await page.click('button:has-text("Sign In")');
    await expect(page).toContainText('TestUser');

    // 5. Reload and verify persistence
    await page.reload();
    await expect(page).toContainText('History (1)');
  });

  test('theme switching', async ({ page }) => {
    const isDarkMode = await page.locator('button:has-text("dark")').evaluate(el => 
      el.getAttribute('aria-pressed') === 'true'
    );
    
    await page.click('button:has-text("light")');
    const bgColor = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toContain('rgb(6, 9, 17)');
  });
});
```

### Run Tests

```bash
# Unit + Integration
npm test

# E2E (headed mode - see browser)
npx playwright test --headed

# E2E (specific test)
npx playwright test aura.spec.js --headed

# Generate report
npx playwright show-report
```

## Coverage Targets

| Type | Target | Current |
|------|--------|---------|
| Statements | >80% | 0% |
| Branches | >70% | 0% |
| Functions | >80% | 0% |
| Lines | >80% | 0% |

## CI/CD Integration

```yaml
# Update .github/workflows/build-deploy.yml
- name: Run Tests
  run: npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Performance Testing

```bash
npm install --save-dev lighthouse
npx lighthouse https://rishidesai15.github.io/aura-app/ --view
```

**Targets:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

## Monitoring in Production

```bash
npm install @sentry/react
```

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

## Manual QA Checklist

- [ ] All buttons clickable
- [ ] Forms submit correctly
- [ ] No console errors
- [ ] Mobile layout responsive
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Fast load time
- [ ] Offline mode functional

## Test Commands

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# E2E tests
npm run test:e2e

# E2E headed
npm run test:e2e:headed

# Performance
npm run test:lighthouse
```

## Next Steps

1. Install Jest + Testing Library
2. Write tests for utility functions (hashString, buildFallbackAura)
3. Add integration tests for main flow
4. Setup E2E with Playwright
5. Add to GitHub Actions
6. Achieve 80%+ coverage

---

*Tests give confidence. Start with critical paths, expand gradually.*
