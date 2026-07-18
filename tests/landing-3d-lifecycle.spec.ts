import { expect, test, type Page } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

async function prepareDesktop(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('body').dispatchEvent('pointerdown');
  await expect(page.locator('[data-landing-scene]')).toHaveCount(10, { timeout: 15_000 });
  await expect(page.locator('[data-landing-3d-state]')).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
}

test.describe('landing renderer lifecycle', () => {
  test.beforeEach(async ({ page }) => mockSetupRequiredApis(page));

  test('owns one renderer lease and one canvas across scene changes', async ({ page }) => {
    await prepareDesktop(page);
    const root = page.locator('[data-landing-3d-state]');
    await expect(root).toHaveAttribute('data-landing-3d-lease', 'held');
    await page.evaluate(() => {
      document.querySelector('[data-landing-scene="crt-laboratory"]')?.scrollIntoView({ block: 'center' });
      window.dispatchEvent(new Event('scroll'));
    });
    await expect(root).toHaveAttribute('data-landing-scene-active', 'crt-laboratory');
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(1);
    await expect(root).toHaveAttribute('data-landing-3d-lease', 'held');
  });

  test('pauses while hidden and resumes when visible', async ({ page }) => {
    await prepareDesktop(page);
    const root = page.locator('[data-landing-3d-state]');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(root).toHaveAttribute('data-landing-3d-state', 'paused');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(root).toHaveAttribute('data-landing-3d-state', 'running');
  });

  test('pauses outside the story viewport', async ({ page }) => {
    await prepareDesktop(page);
    const root = page.locator('[data-landing-3d-state]');
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.dataset.landingTestSpacer = 'true';
      spacer.style.height = '120vh';
      document.body.appendChild(spacer);
      window.scrollTo(0, document.documentElement.scrollHeight);
      window.dispatchEvent(new Event('scroll'));
    });
    await expect(root).toHaveAttribute('data-landing-3d-visible', 'false');
    await expect(root).toHaveAttribute('data-landing-3d-state', 'paused');
  });

  test('disposes the canvas when navigation unmounts the homepage', async ({ page }) => {
    await prepareDesktop(page);
    const canvas = page.getByTestId('landing-hero-canvas');
    await expect(canvas).toHaveCount(1);
    await canvas.evaluate((node) => {
      (window as Window & { __stockProContextDisposed?: boolean }).__stockProContextDisposed = false;
      node.addEventListener('webglcontextlost', () => {
        (window as Window & { __stockProContextDisposed?: boolean }).__stockProContextDisposed = true;
      }, { once: true });
    });
    await page.getByRole('link', { name: 'Open Screener' }).first().click();
    await expect(page).toHaveURL(/\/screener$/);
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
    await expect(page.locator('[data-landing-3d-state]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (
      window as Window & { __stockProContextDisposed?: boolean }
    ).__stockProContextDisposed)).toBe(true);
  });
});
