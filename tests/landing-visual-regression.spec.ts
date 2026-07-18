import { expect, test } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

test.describe('landing visual regression invariants', () => {
  test.beforeEach(async ({ page }) => {
    await mockSetupRequiredApis(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('body').dispatchEvent('pointerdown');
  });

  test('hero copy, visual and primary action share the first viewport', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    const fallback = page.locator('[data-landing-static-scene="research-universe"]');
    const primaryAction = page.getByRole('link', { name: 'Open Screener' }).first();
    await expect(heading).toBeVisible();
    await expect(fallback).toBeVisible();
    await expect(primaryAction).toBeVisible();
    for (const locator of [heading, fallback, primaryAction]) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  });

  test('all story panels preserve minimum readable visual geometry', async ({ page }) => {
    const fallbacks = page.locator('[data-landing-static-scene]');
    await expect(fallbacks).toHaveCount(10);
    const boxes = await fallbacks.evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    expect(boxes.every(({ width, height }) => width >= 240 && height >= 180)).toBe(true);
  });
});

test.describe('landing visual baselines', () => {
  test('WebGL viewport pixels differ from the disabled fallback', async ({ browser }) => {
    const webglContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const fallbackContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    try {
      const webglPage = await webglContext.newPage();
      await mockSetupRequiredApis(webglPage);
      await webglPage.addInitScript(() => {
        Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 16 });
        Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 16 });
      });
      await webglPage.goto('/', { waitUntil: 'domcontentloaded' });
      const webglRoot = webglPage.locator('[data-landing-3d-state]');
      await expect(webglRoot).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
      await webglPage.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect(webglRoot).toHaveAttribute('data-landing-3d-state', 'paused');
      const webglPixels = await webglRoot.screenshot({ animations: 'disabled' });

      const fallbackPage = await fallbackContext.newPage();
      await mockSetupRequiredApis(fallbackPage);
      await fallbackPage.addInitScript(() => {
        Object.defineProperty(window, 'WebGLRenderingContext', { configurable: true, value: undefined });
        Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: undefined });
      });
      await fallbackPage.goto('/', { waitUntil: 'domcontentloaded' });
      const fallbackRoot = fallbackPage.locator('[data-landing-3d-state]');
      await expect(fallbackRoot).toHaveAttribute('data-landing-3d-context', 'unavailable');
      const fallbackPixels = await fallbackRoot.screenshot({ animations: 'disabled' });

      expect(webglPixels.equals(fallbackPixels)).toBe(false);
      expect(webglPixels).toMatchSnapshot('landing-webgl-viewport.png', { maxDiffPixelRatio: 0.03 });
      expect(fallbackPixels).toMatchSnapshot('landing-webgl-disabled-viewport.png', { maxDiffPixelRatio: 0.03 });
    } finally {
      await webglContext.close();
      await fallbackContext.close();
    }
  });

  const cases = [
    { name: 'desktop', width: 1280, height: 720, mode: 'webgl' },
    { name: 'tablet', width: 768, height: 1024, mode: 'fallback' },
    { name: 'mobile', width: 390, height: 844, mode: 'fallback' },
    { name: 'reduced-motion', width: 1280, height: 720, mode: 'reduced-motion' },
    { name: 'webgl-disabled', width: 1280, height: 720, mode: 'webgl-disabled' },
  ] as const;

  for (const visualCase of cases) {
    test(`${visualCase.name} complete homepage baseline`, async ({ page }) => {
      await mockSetupRequiredApis(page);
      await page.setViewportSize({ width: visualCase.width, height: visualCase.height });
      if (visualCase.mode === 'webgl') {
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
          Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
        });
      }
      if (visualCase.mode === 'reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
      if (visualCase.mode === 'webgl-disabled') {
        await page.addInitScript(() => {
          Object.defineProperty(window, 'WebGLRenderingContext', { configurable: true, value: undefined });
          Object.defineProperty(window, 'WebGL2RenderingContext', { configurable: true, value: undefined });
        });
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('body').dispatchEvent('pointerdown');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('[data-landing-static-scene]')).toHaveCount(10, { timeout: 15_000 });
      if (visualCase.mode === 'webgl') {
        const root = page.locator('[data-landing-3d-state]');
        await expect(root).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await expect(root).toHaveAttribute('data-landing-3d-state', 'paused');
      }
      await expect(page).toHaveScreenshot(`landing-${visualCase.name}.png`, {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: 0.03,
      });
    });
  }
});
