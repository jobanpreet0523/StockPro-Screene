import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/pro', '/crt-scanner', '/connect-broker', '/account', '/pricing', '/contact', '/status'];

test.describe('StockPro accessibility smoke', () => {
  for (const route of routes) {
    test(route + ' has no serious or critical axe violations', async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter((violation) =>
        violation.impact === 'serious' || violation.impact === 'critical'
      );
      expect(seriousOrCritical).toEqual([]);
    });
  }
});
