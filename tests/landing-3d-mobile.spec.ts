import { expect, test } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

for (const viewport of [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
]) {
  test(`mobile ${viewport.name} preserves the lightweight responsive story`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport,
      isMobile: true,
      hasTouch: true,
      userAgent: 'StockPro Playwright mobile quality verification',
    });
    const page = await context.newPage();
    try {
      await mockSetupRequiredApis(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('body').dispatchEvent('pointerdown');

      const root = page.locator('[data-landing-3d-state]');
      await expect(root).toHaveAttribute('data-landing-3d-quality', 'mobile');
      await expect(root).toHaveAttribute('data-landing-3d-state', 'fallback');
      await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
      await expect(page.locator('[data-landing-static-scene]')).toHaveCount(10);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    } finally {
      await context.close();
    }
  });
}
