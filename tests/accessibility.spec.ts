import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockSetupRequiredApis } from './helpers/mockSetupApis';

const routes = ['/', '/pro', '/crt-scanner', '/connect-broker', '/account', '/pricing', '/contact', '/status'];

test.describe('StockPro accessibility smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockSetupRequiredApis(page);
  });
  for (const route of routes) {
    test(route + ' has no serious or critical axe violations', async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter((violation) =>
        violation.impact === 'serious' || violation.impact === 'critical'
      );
      expect(seriousOrCritical).toEqual([]);
    });
  }
});
