import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/contact',
  '/screener',
  '/option-chain',
  '/pricing',
  '/start-trial',
  '/connect-broker',
  '/account',
  '/status',
  '/news',
  '/blog',
];

const ignoredConsoleError = (message: string) =>
  /google|gtag|doubleclick|tradingview|favicon|ResizeObserver/i.test(message);

test.describe('StockPro browser smoke', () => {
  for (const route of publicRoutes) {
    test(route + ' loads without app crash', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !ignoredConsoleError(message.text())) {
          consoleErrors.push(message.text());
        }
      });

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/Something went wrong/i);
      await expect(page.locator('body')).not.toContainText(/Application error/i);
      expect(consoleErrors, 'console errors on ' + route).toEqual([]);
    });
  }

  test('/contact exposes waitlist/contact UI', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('body')).toContainText(/contact|waitlist|support|email/i);
  });

  test('/start-trial discloses auto-renewal terms', async ({ page }) => {
    await page.goto('/start-trial');
    await expect(page.locator('body')).toContainText(/auto-renews|renews|trial/i);
  });

  test('/connect-broker explains per-user broker data', async ({ page }) => {
    await page.goto('/connect-broker');
    await expect(page.locator('body')).toContainText(/own broker|per-user|broker/i);
  });

  test('/status keeps live payment disabled visibly', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('body')).toContainText(/payment|disabled|setup/i);
  });
});
