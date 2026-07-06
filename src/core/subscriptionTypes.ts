import type { TrialStatus } from './trialPlan';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface SubscriptionRecord {
  userId: string;
  plan: SubscriptionPlan;
  status: TrialStatus;
  trialStart: string | null;
  trialEnd: string | null;
  nextChargeAt: string | null;
  autoRenewConsent: boolean;
  providerSubscriptionId: string | null;
}

export interface TrialApiResponse {
  status: TrialStatus | 'error';
  plan: SubscriptionPlan;
  disclosure: string;
  paymentEnabled: boolean;
  message: string;
  subscription?: SubscriptionRecord;
}
