import { expect, test } from '@playwright/test';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

test('prefers-reduced-motion keeps the complete static story and skips WebGL', async ({ page }) => {
  await mockSetupRequiredApis(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('body').dispatchEvent('pointerdown');

  const root = page.locator('[data-landing-3d-state]');
  await expect(root).toHaveAttribute('data-landing-3d-quality', 'reduced-motion');
  await expect(root).toHaveAttribute('data-landing-3d-state', 'fallback');
  await expect(root).toHaveAttribute('data-landing-3d-lease', 'none');
  await expect(page.getByTestId('landing-hero-canvas')).toHaveCount(0);
  await expect(page.locator('[data-landing-static-scene]')).toHaveCount(10);
});
