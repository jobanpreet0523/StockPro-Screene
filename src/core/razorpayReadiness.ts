export type RazorpayReadinessStatus = 'setup_required' | 'test_ready';

export interface RazorpayReadiness {
  status: RazorpayReadinessStatus;
  provider: 'razorpay';
  mode: 'test' | 'missing' | 'blocked_live_key';
  live_disabled: true;
  paymentEnabled: false;
  testModeReady: boolean;
  missing: string[];
  message: string;
}

const value = (input: unknown) => (typeof input === 'string' ? input.trim() : '');

export function getRazorpayReadiness(env: Record<string, unknown> = {}): RazorpayReadiness {
  const required = {
    RAZORPAY_KEY_ID: value(env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: value(env.RAZORPAY_KEY_SECRET),
    RAZORPAY_PRO_PLAN_ID: value(env.RAZORPAY_PRO_PLAN_ID),
    RAZORPAY_WEBHOOK_SECRET: value(env.RAZORPAY_WEBHOOK_SECRET),
  };
  const missing = Object.entries(required).filter(([, val]) => !val).map(([key]) => key);
  const keyId = required.RAZORPAY_KEY_ID;

  if (missing.length) {
    return {
      status: 'setup_required',
      provider: 'razorpay',
      mode: 'missing',
      live_disabled: true,
      paymentEnabled: false,
      testModeReady: false,
      missing,
      message: `Razorpay test-mode setup requires ${missing.join(', ')}. Live payment remains disabled.`,
    };
  }

  if (!keyId.startsWith('rzp_test_')) {
    return {
      status: 'setup_required',
      provider: 'razorpay',
      mode: 'blocked_live_key',
      live_disabled: true,
      paymentEnabled: false,
      testModeReady: false,
      missing: [],
      message: 'Only Razorpay test-mode keys are accepted in this stage. Live payment remains disabled.',
    };
  }

  return {
    status: 'test_ready',
    provider: 'razorpay',
    mode: 'test',
    live_disabled: true,
    paymentEnabled: false,
    testModeReady: true,
    missing: [],
    message: 'Razorpay test-mode configuration is present. Live payment mode is still disabled.',
  };
}
