export type WaitlistSubmitState = 'idle' | 'submitting' | 'success' | 'error' | 'setup_required';

export interface WaitlistPayload {
  name: string;
  email: string;
  useCase?: string;
  interest?: string;
  sourcePage?: string;
  referrer?: string;
  createdAt: string;
}

export interface WaitlistApiResponse {
  status: 'stored' | 'setup_required' | 'error';
  message: string;
}
