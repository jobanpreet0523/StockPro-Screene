import { expect, test, type Page } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

async function desktopHardware(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  });
}

test.describe('landing 3D progressive enhancement', () => {
  test.beforeEach(async ({ page }) => {
    await mockSetupRequiredApis(page);
  });

  test('hero HTML and static fallback render before the lazy scene', async ({ page }) => {
    await desktopHardware(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /StockPro research/ })).toBeVisible();
    await expect(page.getByTestId('landing-3d-fallback')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Screener' }).first()).toBeVisible();
  });

  test('WebGL unavailable keeps the static fallback without a canvas', async ({ page }) => {
    await desktopHardware(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'WebGLRenderingContext', { configurable: true, value: undefined });
      Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: undefined });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-landing-3d-state="fallback"]')).toBeVisible();
    await expect(page.getByTestId('landing-3d-fallback')).toBeVisible();
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
  });

  test('reduced motion and mobile use the fallback only', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-landing-3d-quality="reduced-motion"]')).toBeVisible();
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-landing-3d-quality="mobile"]')).toBeVisible();
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
  });

  test('desktop initializes one canvas and pauses on hidden visibility', async ({ page }) => {
    await desktopHardware(page);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hero = page.locator('[data-landing-3d-state]');
    await expect(hero).toHaveAttribute('data-landing-3d-state', /running|paused/, { timeout: 15_000 });
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(1);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(hero).toHaveAttribute('data-landing-3d-state', 'paused');
    expect(errors).toEqual([]);
  });

  test('server delivers the hero shell before the application module', async ({ request }) => {
    const response = await request.get('/');
    const html = await response.text();
    expect(response.status()).toBe(200);
    expect(html).toContain('id="stockpro-static-shell"');
    expect(html).not.toContain('unpkg.com/lucide');
    expect(html.indexOf('stockpro-static-shell')).toBeLessThan(html.indexOf('type="module"'));
  });

  test('all responsive fallback formats are served', async ({ request }) => {
    for (const extension of ['avif', 'webp', 'png']) {
      const response = await request.get(`/assets/landing3d/stockpro-financial-research.${extension}`);
      expect(response.status(), extension).toBe(200);
      expect((await response.body()).byteLength, extension).toBeGreaterThan(1_000);
    }
  });
});
