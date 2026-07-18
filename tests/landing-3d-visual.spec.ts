import { expect, test, type Page } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

const sceneIds = [
  'research-universe', 'verified-source', 'product-constellation', 'crt-laboratory',
  'pro-workspace', 'broker-vault', 'screener-funnel', 'personal-vault', 'trust-core', 'getting-started',
];

async function useDesktopHardware(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  });
}

test.describe('landing 3D visual contract', () => {
  test.beforeEach(async ({ page }) => mockSetupRequiredApis(page));

  test('maps all ten story sections to ordered, labelled static scenes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('body').dispatchEvent('pointerdown');

    const sections = page.locator('[data-landing-scene]');
    await expect(sections).toHaveCount(10);
    expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-scene-number')))).toEqual(
      ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
    );
    expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-landing-scene')))).toEqual(sceneIds);
    await expect(page.locator('[data-landing-static-scene]')).toHaveCount(10);
  });

  test('desktop enhancement becomes render-ready without changing the accessible hero', async ({ page }) => {
    await useDesktopHardware(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const root = page.locator('[data-landing-3d-state]');
    await expect(page.getByRole('heading', { level: 1, name: /StockPro research/ })).toBeVisible();
    await expect(root).toHaveAttribute('data-render-ready', 'true', { timeout: 15_000 });
    await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(1);
    await expect(root).toHaveAttribute('aria-hidden', 'true');
  });
});
