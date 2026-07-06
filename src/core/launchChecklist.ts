export type LaunchChecklistKey =
  | 'support_email_verified'
  | 'refund_policy_published'
  | 'account_access_rules_connected'
  | 'feature_locks_active'
  | 'billing_provider_keys_configured'
  | 'analytics_events_verified'
  | 'live_news_verified'
  | 'daily_brief_verified';

export interface LaunchChecklistItem {
  key: LaunchChecklistKey;
  label: string;
  ready: boolean;
  required: true;
}

export const launchChecklist: LaunchChecklistItem[] = [
  { key: 'support_email_verified', label: 'Support email verified', ready: false, required: true },
  { key: 'refund_policy_published', label: 'Refund policy published', ready: false, required: true },
  { key: 'account_access_rules_connected', label: 'Account access rules connected', ready: false, required: true },
  { key: 'feature_locks_active', label: 'Feature locks active', ready: true, required: true },
  { key: 'billing_provider_keys_configured', label: 'Billing provider keys configured', ready: false, required: true },
  { key: 'analytics_events_verified', label: 'Analytics events verified', ready: false, required: true },
  { key: 'live_news_verified', label: 'Live news verified', ready: false, required: true },
  { key: 'daily_brief_verified', label: 'Daily Brief verified', ready: false, required: true },
];

export function paidAccessEnabled() {
  return false;
}

export function canEnableCheckout(items: LaunchChecklistItem[] = launchChecklist) {
  return paidAccessEnabled() && items.filter((item) => item.required).every((item) => item.ready);
}
