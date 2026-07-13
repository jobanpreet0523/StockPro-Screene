import { expect, test } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

const directRoutes = ['/', '/pro', '/crt-scanner', '/connect-broker', '/account', '/pricing', '/contact', '/status'];

test.describe('Stages 46-60 production readiness', () => {
  for (const route of directRoutes) {
    test(`direct cold load ${route} stays on route without console errors or readiness 503s`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const readiness503s: string[] = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('response', (response) => {
        if (response.status() === 503 && /\/api\/(broker|trial|billing|pro|watchlists)/.test(new URL(response.url()).pathname)) readiness503s.push(response.url());
      });
      await mockSetupRequiredApis(page);
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/?$' : route.replace('/', '\\/')}($|\\?)`));
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/Something went wrong|Application error/i);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(readiness503s).toEqual([]);
    });
  }

  test('CRT scanner is manual and renders a clean provider-required empty state', async ({ page }) => {
    let runRequests = 0;
    await mockSetupRequiredApis(page);
    page.on('request', (request) => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/crt-scanner/run') runRequests += 1; });
    await page.goto('/crt-scanner');
    await expect(page.getByRole('heading', { name: 'CRT Scanner' })).toBeVisible();
    await expect(page.getByText('setup required', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Run CRT Scan' })).toBeDisabled();
    await expect(page.locator('body')).toContainText('No saved scan runs are available.');
    expect(runRequests).toBe(0);
  });

  test('Pro tabs switch while setup states remain informational', async ({ page }) => {
    await mockSetupRequiredApis(page);
    await page.goto('/pro');
    await page.getByRole('button', { name: 'AI Research' }).click();
    await expect(page.getByRole('heading', { name: 'AI Research' })).toBeVisible();
    await expect(page.locator('body')).toContainText(/provider setup required/i);
    await page.getByRole('button', { name: 'Watchlist' }).click();
    await expect(page.locator('body')).toContainText(/watchlist setup required/i);
  });

  test('landing routes to real CRT and Pro flows', async ({ page }) => {
    await mockSetupRequiredApis(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Run CRT Scanner', exact: true }).first().click();
    await expect(page).toHaveURL(/\/crt-scanner$/);
    await page.goto('/');
    await page.getByRole('link', { name: 'Explore Pro', exact: true }).click();
    await expect(page).toHaveURL(/\/pro$/);
  });

  test('broker page requires the current user own token and exposes no order action', async ({ page }) => {
    await mockSetupRequiredApis(page);
    await page.goto('/connect-broker');
    await expect(page.locator('body')).toContainText(/own broker token|own broker|per-user/i);
    await expect(page.locator('body')).toContainText(/friends and testers must connect their own/i);
    await expect(page.locator('body')).not.toContainText(/place order|buy now|sell now/i);
  });

  test('billing stays test-only with explicit consent', async ({ page }) => {
    await mockSetupRequiredApis(page);
    await page.goto('/start-trial');
    await expect(page.locator('body')).toContainText(/live payment|payment live mode disabled|live checkout/i);
    await expect(page.getByRole('button', { name: 'Start trial' })).toBeDisabled();
  });
});
