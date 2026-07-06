export const FREE_TRIAL_DAYS = 7;
export const PRO_MONTHLY_PRICE_INR = 299;

export type TrialStatus =
  | 'not_started'
  | 'trialing'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'setup_required';

export function getTrialEndDate(startDate: Date | string | number) {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) throw new Error('A valid trial start date is required.');
  return new Date(start.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function formatTrialDisclosure() {
  return `₹0 today. Auto-renews at ₹${PRO_MONTHLY_PRICE_INR}/month after ${FREE_TRIAL_DAYS} days unless cancelled.`;
}
