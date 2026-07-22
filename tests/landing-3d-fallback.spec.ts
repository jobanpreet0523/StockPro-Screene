import { expect, test } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

test.describe('landing static fallback', () => {
  test.beforeEach(async ({ page }) => mockSetupRequiredApis(page));

  test('remains usable when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'WebGLRenderingContext', { configurable: true, value: undefined });
      Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: undefined });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const root = page.locator('[data-landing-3d-state]');
    await expect(root).toHaveAttribute('data-landing-3d-state', 'fallback');
    await expect(root).toHaveAttribute('data-landing-3d-context', 'unavailable');
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Open Screener' }).first()).toBeVisible();
  });

  test('switches to an error fallback after WebGL context loss', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const root = page.locator('[data-landing-3d-state]');
    const canvas = page.getByTestId('landing-hero-canvas');
    await expect(root).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
    await canvas.dispatchEvent('webglcontextlost');
    await expect(root).toHaveAttribute('data-landing-3d-context', 'lost');
    await expect(root).toHaveAttribute('data-landing-3d-state', 'error');
    await expect(root).toHaveAttribute('data-render-ready', 'false');
  });

  test('keeps the hero and routes usable when the below-fold chunk fails', async ({ page }) => {
    await page.route('**/assets/LandingPrimarySections-*.js', (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Screener' }).first()).toBeVisible();
    await expect(page.locator('[data-landing-sections-error]')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Reload sections' })).toBeVisible();
  });

  for (const condition of [
    { name: 'save-data', setup: () => Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } }) },
    { name: 'low-memory', setup: () => {
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
    } },
    { name: 'low-core', setup: () => {
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 2 });
    } },
  ]) {
    test(`${condition.name} devices keep the complete HTML fallback`, async ({ page }) => {
      await page.addInitScript(condition.setup);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const root = page.locator('[data-landing-3d-state]');
      await expect(root).toHaveAttribute('data-landing-3d-quality', condition.name);
      await expect(root).toHaveAttribute('data-landing-3d-state', 'fallback');
      await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Open Screener' }).first()).toBeVisible();
    });
  }
});
