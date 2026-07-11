export type WaitlistSubmitState = 'idle' | 'submitting' | 'success' | 'error' | 'setup_required';
export type WaitlistApiStatus = 'ok' | 'stored' | 'already_joined' | 'setup_required' | 'unauthorized' | 'error';

export interface WaitlistPayload {
  name: string;
  email: string;
  useCase?: string;
  interest?: string;
  sourcePage?: string;
  referrer?: string;
  turnstileToken?: string;
}

export interface WaitlistApiResponse {
  status: WaitlistApiStatus;
  message: string;
}

export interface WaitlistLead {
  id: string;
  name: string;
  email: string;
  interest: string | null;
  use_case: string | null;
  source_page: string | null;
  referrer: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminWaitlistResponse extends WaitlistApiResponse {
  data?: WaitlistLead[];
  count?: number;
}
