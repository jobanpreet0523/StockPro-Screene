import type { Page } from '@playwright/test';

export async function mockSetupRequiredApis(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let payload: Record<string, unknown> = {
      status: 'setup_required',
      configured: false,
      severity: 'info',
      message: 'Service setup is required for this test environment.',
    };

    if (path === '/api/operations/readiness') {
      payload = {
        status: 'ok',
        services: {
          turnstile: 'setup_required',
          email: 'setup_required',
          search: 'setup_required',
          supabase: 'setup_required',
          marketProvider: 'setup_required',
          brokerVault: 'setup_required',
          billingTest: 'setup_required',
          paymentLive: 'disabled',
          seoAudit: 'configured',
          testSuite: 'configured',
          crtProvider: 'setup_required',
          crtStorage: 'setup_required',
          savedResearch: 'setup_required',
          betaAdmin: 'setup_required',
        },
        message: 'Readiness checked.',
      };
    }

    if (path === '/api/database/readiness') {
      payload = {
        status: 'setup_required',
        configured: false,
        severity: 'info',
        tables: {
          watchlists: 'setup_required',
          alerts: 'setup_required',
          broker_connections: 'setup_required',
        },
        message: 'Database setup is required.',
      };
    }

    if (path.startsWith('/api/live/')) {
      payload = {
        status: 'setup_required',
        source: 'none',
        timestamp: null,
        delayMinutes: 0,
        isLive: false,
        isStale: true,
        providerStatus: 'setup_required',
        data: null,
        message: 'Authorized provider setup is required.',
      };
    }

    if (path === '/api/market/provider-status') {
      payload = {
        status: 'setup_required',
        configured: false,
        severity: 'info',
        provider: 'none',
        message: 'Authorized provider setup is required.',
      };
    }

    if (path === '/api/crt-scanner/runs' || path === '/api/watchlists' || path === '/api/saved-work') {
      payload = {
        ...payload,
        data: path === '/api/saved-work' ? { alerts: [], screens: [] } : [],
      };
    }

    if (path === '/api/auth/session') {
      payload = {
        status: 'setup_required',
        configured: false,
        severity: 'info',
        session: null,
        user: null,
        message: 'Supabase Auth setup is required.',
      };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}
