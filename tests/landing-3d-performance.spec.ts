import { expect, test, type Page } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

async function useDesktopHardware(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  });
}

test.describe('landing 3D performance boundaries', () => {
  test.beforeEach(async ({ page }) => mockSetupRequiredApis(page));

  test('does not request the lazy renderer chunk before the scheduled enhancement window', async ({ page }) => {
    await useDesktopHardware(page);
    const rendererRequests: string[] = [];
    page.on('request', (request) => {
      if (/HeroFinancialScene|three/i.test(request.url())) rendererRequests.push(request.url());
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);
    expect(rendererRequests).toEqual([]);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('keeps one canvas and a capped device pixel ratio after initialization', async ({ page }) => {
    await useDesktopHardware(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const root = page.locator('[data-landing-3d-state]');
    await expect(root).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
    const canvas = page.getByTestId('landing-hero-canvas');
    await expect(canvas).toHaveCount(1);
    const ratio = await canvas.evaluate((node) => node.width / Math.max(1, node.clientWidth));
    expect(ratio).toBeLessThanOrEqual(1.5);
    await expect(root).toHaveAttribute('data-landing-3d-target-fps', '30');
    const sceneSetupDuration = Number(await root.getAttribute('data-landing-3d-scene-setup-ms'));
    expect(sceneSetupDuration).toBeLessThan(50);
    await expect(root).toHaveAttribute('data-landing-3d-visual-count', '1');
  });

  test('targets 60 FPS and keeps a visible scene-focus response below the synthetic 200 ms target', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 16 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 16 });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('body').dispatchEvent('pointerdown');
    await expect(page.locator('[data-landing-scene]')).toHaveCount(10, { timeout: 15_000 });
    const root = page.locator('[data-landing-3d-state]');
    await expect(root).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
    await expect(root).toHaveAttribute('data-landing-3d-target-fps', '60');
    const response = await page.evaluate(async () => {
      window.dispatchEvent(new Event('scroll'));
      const link = document.querySelector<HTMLElement>('[data-landing-scene="screener-funnel"] a[href="/screener"]');
      const sceneRoot = document.querySelector<HTMLElement>('[data-landing-3d-state]');
      if (!link || !sceneRoot) throw new Error('Visible screener scene action was not rendered.');
      link.scrollIntoView({ block: 'center' });
      window.dispatchEvent(new Event('scroll'));
      const startedAt = performance.now();
      link.focus();
      await new Promise<void>((resolve, reject) => {
        if (sceneRoot.dataset.landingSceneActive === 'screener-funnel') {
          resolve();
          return;
        }
        const timeout = window.setTimeout(() => {
          observer.disconnect();
          reject(new Error('Scene focus state did not update within 200 ms.'));
        }, 200);
        const observer = new MutationObserver(() => {
          if (sceneRoot.dataset.landingSceneActive !== 'screener-funnel') return;
          window.clearTimeout(timeout);
          observer.disconnect();
          resolve();
        });
        observer.observe(sceneRoot, { attributes: true, attributeFilter: ['data-landing-scene-active'] });
      });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return {
        latency: performance.now() - startedAt,
        focused: document.activeElement === link,
        scene: sceneRoot.dataset.landingSceneActive,
      };
    });
    expect(response.focused).toBe(true);
    expect(response.scene).toBe('screener-funnel');
    expect(response.latency).toBeLessThan(200);
  });
});
