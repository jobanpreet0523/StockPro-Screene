export interface EmailEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SUPPORT_EMAIL?: string;
}

export type EmailResult =
  | { status: 'sent'; id: string; message: string }
  | { status: 'setup_required' | 'error'; message: string };

export function emailReadiness(env: EmailEnv) {
  const configured = Boolean(
    String(env.RESEND_API_KEY || '').trim()
    && String(env.RESEND_FROM_EMAIL || '').trim()
    && String(env.SUPPORT_EMAIL || '').trim()
  );
  return configured ? 'configured' as const : 'setup_required' as const;
}

export async function sendEmail(
  env: EmailEnv,
  input: { to: string; subject: string; text: string; html?: string },
): Promise<EmailResult> {
  if (emailReadiness(env) !== 'configured') {
    return { status: 'setup_required', message: 'Email delivery requires server-side Resend configuration.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${String(env.RESEND_API_KEY).trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: String(env.RESEND_FROM_EMAIL).trim(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });
    const payload = await response.json().catch(() => null) as { id?: string } | null;
    if (!response.ok || !payload?.id) return { status: 'error', message: 'Email provider rejected the request.' };
    return { status: 'sent', id: payload.id, message: 'Email provider accepted the message.' };
  } catch {
    return { status: 'error', message: 'Email provider is temporarily unavailable.' };
  }
}
