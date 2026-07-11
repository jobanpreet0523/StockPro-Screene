export const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerification =
  | { status: 'verified'; success: true; message: string }
  | { status: 'setup_required' | 'invalid' | 'error'; success: false; message: string };

export function getTurnstileClientReadiness() {
  return String(import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim()
    ? { status: 'configured' as const, message: 'Turnstile site key is configured.' }
    : { status: 'setup_required' as const, message: 'Turnstile site key is not configured.' };
}

export async function verifyTurnstileToken(
  token: unknown,
  secret: unknown,
  remoteIp?: string | null,
): Promise<TurnstileVerification> {
  const cleanToken = typeof token === 'string' ? token.trim().slice(0, 4096) : '';
  const cleanSecret = typeof secret === 'string' ? secret.trim() : '';
  if (!cleanSecret) return { status: 'setup_required', success: false, message: 'Turnstile server verification is not configured.' };
  if (!cleanToken) return { status: 'invalid', success: false, message: 'Complete the anti-spam verification before submitting.' };

  const body = new URLSearchParams({ secret: cleanSecret, response: cleanToken });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const payload = await response.json() as { success?: boolean };
    if (!response.ok || payload.success !== true) {
      return { status: 'invalid', success: false, message: 'Anti-spam verification failed. Please retry.' };
    }
    return { status: 'verified', success: true, message: 'Anti-spam verification passed.' };
  } catch {
    return { status: 'error', success: false, message: 'Anti-spam verification is temporarily unavailable.' };
  }
}
