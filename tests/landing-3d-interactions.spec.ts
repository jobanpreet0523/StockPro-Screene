import { expect, test, type Page } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

async function useDesktopHardware(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  });
}

test.describe('landing story interactions', () => {
  test.beforeEach(async ({ page }) => mockSetupRequiredApis(page));

  test('scrolling updates the declarative active scene without duplicating the canvas', async ({ page }) => {
    await useDesktopHardware(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('body').dispatchEvent('pointerdown');
    await expect(page.locator('[data-landing-scene]')).toHaveCount(10, { timeout: 15_000 });
    const root = page.locator('[data-landing-3d-state]');
    await expect(root).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });

    for (const id of ['verified-source', 'crt-laboratory', 'pro-workspace']) {
      await page.evaluate((sceneId) => {
        document.querySelector(`[data-landing-scene="${sceneId}"]`)?.scrollIntoView({ block: 'center' });
        window.dispatchEvent(new Event('scroll'));
      }, id);
      await expect(root).toHaveAttribute('data-landing-scene-active', id);
    }
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(1);
  });

  test('keyboard focus selects its scene and primary links remain operable', async ({ page }) => {
    await useDesktopHardware(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('body').dispatchEvent('pointerdown');
    await expect(page.locator('[data-landing-scene]')).toHaveCount(10, { timeout: 15_000 });
    const section = page.locator('[data-landing-scene="screener-funnel"]');
    const link = section.getByRole('link', { name: 'Open Screener' });
    await link.focus();
    await expect(page.locator('[data-landing-3d-state]')).toHaveAttribute('data-landing-scene-active', 'screener-funnel');
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute('href', '/screener');
  });

  test('updates the active provider scene when verified data arrives asynchronously', async ({ page }) => {
    await useDesktopHardware(page);
    await page.route('**/api/live/indices', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          source: 'upstox',
          timestamp: new Date().toISOString(),
          delayMinutes: 15,
          isLive: false,
          isStale: false,
          providerStatus: 'delayed',
          message: 'Verified delayed provider test response.',
          data: [
            { name: 'NIFTY 50', price: 1, changePercent: 0 },
            { name: 'BANK NIFTY', price: 1, changePercent: 0 },
            { name: 'FIN NIFTY', price: 1, changePercent: 0 },
            { name: 'INDIA VIX', price: 1, changePercent: 0 },
          ],
        }),
      });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('body').dispatchEvent('pointerdown');
    await expect(page.locator('[data-landing-scene]')).toHaveCount(10, { timeout: 15_000 });
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    const section = page.locator('[data-landing-scene="verified-source"]');
    await expect(section).toBeAttached();
    await section.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    const root = page.locator('[data-landing-3d-state]');
    await expect(root).toHaveAttribute('data-landing-scene-active', 'verified-source');
    await expect(root).toHaveAttribute('data-landing-provider-verified', 'true', { timeout: 10_000 });
  });
});
