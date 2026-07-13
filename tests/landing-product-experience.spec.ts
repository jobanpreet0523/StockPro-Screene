import { expect, test } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

test.describe('complete StockPro landing experience', () => {
  test.beforeEach(async ({ page }) => {
    await mockSetupRequiredApis(page);
  });

  test('cold-loads at least ten substantial sections with truthful setup states', async ({ page }) => {
    const errors: string[] = [];
    const readiness503s: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', (response) => { if (response.status() === 503 && response.url().includes('/api/')) readiness503s.push(response.url()); });

    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.locator('[data-landing-section]').count()).toBeGreaterThanOrEqual(10);
    await expect(page.getByText('Provider setup required').first()).toBeVisible();
    await expect(page.getByText('Payment live disabled')).toBeVisible();
    await expect(page.getByText('No shared StockPro broker token')).toBeVisible();
    expect(await page.locator('text=/Connected for this user/i').count()).toBe(0);
    expect(await page.locator('[data-live-status="verified"]').count()).toBe(0);
    expect(await page.locator('text=/sample stock|sample price|fake result/i').count()).toBe(0);
    expect(readiness503s).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('primary CTAs route to the real product destinations', async ({ page }) => {
    const cases = [
      ['Open Screener', '/screener'],
      ['Run CRT Scanner', '/crt-scanner'],
      ['Explore Pro', '/pro'],
      ['Connect Broker', '/connect-broker'],
    ] as const;
    for (const [label, route] of cases) {
      await page.goto('/');
      await page.getByRole('link', { name: label, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}(?:[?#]|$)`));
    }
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('link', { name: 'View Pricing', exact: true }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('link', { name: 'Create Account', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test('every internal landing link resolves successfully', async ({ page, request }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.locator('[data-landing-section]').count()).toBeGreaterThanOrEqual(10);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => (link as HTMLAnchorElement).pathname))]);
    expect(hrefs.length).toBeGreaterThanOrEqual(20);
    for (const href of hrefs) {
      const response = await request.get(href, { maxRedirects: 0 });
      expect(response.status(), href).toBe(200);
    }
  });

  test('mobile drawer groups product navigation without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByLabel('Mobile navigation')).toBeVisible();
    await expect(page.getByLabel('Mobile primary navigation').getByRole('link', { name: 'Option Chain' })).toBeVisible();
    await page.getByLabel('Mobile primary navigation').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await page.goto('/');
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.body.scrollWidth }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1);
  });

  test('search renders unavailable and configured states without invented suggestions', async ({ page }) => {
    await page.goto('/');
    const unavailable = page.getByLabel('Search StockPro').first();
    await expect(unavailable).toBeDisabled();
    await expect(unavailable).toHaveAttribute('placeholder', 'Search setup required');

    await page.addInitScript(() => {
      (window as typeof window & { __STOCKPRO_SEARCH_TEST_CLIENT__?: unknown }).__STOCKPRO_SEARCH_TEST_CLIENT__ = {
        search: async () => ({ results: [{ hits: [{ objectID: 'INFY', kind: 'stock', title: 'Infosys', subtitle: 'NSE equity', url: '/screener?symbol=INFY', symbol: 'INFY', source: 'test-index' }] }] }),
      };
    });
    await page.route('**/api/search/config', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'configured', indices: ['stocks'], message: 'Search configured.' }) }));
    await page.reload();
    const configured = page.getByLabel('Search StockPro').first();
    await expect(configured).toBeEnabled();
    await configured.fill('Inf');
    await expect(page.getByRole('link', { name: /Infosys/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /Infosys/ }).first().click();
    await expect(page).toHaveURL(/\/screener\?symbol=INFY$/);
  });
});

