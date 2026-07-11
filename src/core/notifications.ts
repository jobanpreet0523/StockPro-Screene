import { sendEmail, type EmailEnv, type EmailResult } from './email';
import type { EmailNotificationRequest } from './schemas';

const subjects: Record<EmailNotificationRequest['type'], string> = {
  waitlist_confirmation: 'StockPro waitlist confirmation',
  contact_received: 'StockPro contact request received',
  trial_reminder: 'StockPro trial reminder',
  broker_connect_reminder: 'StockPro broker connection reminder',
  beta_feedback_received: 'StockPro beta feedback received',
  alert_notification: 'StockPro alert notification',
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

export async function sendNotification(
  env: EmailEnv,
  request: EmailNotificationRequest,
): Promise<EmailResult> {
  const subject = request.subject || subjects[request.type];
  const detail = request.context?.message?.slice(0, 500) || 'Your StockPro notification is ready.';
  const text = `${subject}\n\n${detail}\n\nStockPro provides educational analytics and does not place trades or provide buy/sell recommendations.`;
  const html = `<h1>${escapeHtml(subject)}</h1><p>${escapeHtml(detail)}</p><p>StockPro provides educational analytics and does not place trades or provide buy/sell recommendations.</p>`;
  return sendEmail(env, { to: request.to, subject, text, html });
}
