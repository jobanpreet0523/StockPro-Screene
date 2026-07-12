export type ApiState =
  | 'ok'
  | 'configured'
  | 'connected'
  | 'test_ready'
  | 'setup_required'
  | 'unauthenticated'
  | 'provider_required'
  | 'not_connected'
  | 'unavailable'
  | 'disabled'
  | 'error';

export interface ApiStatusPayload {
  status?: string;
  configured?: boolean;
  message?: string;
  severity?: 'info' | 'warning' | 'error';
  [key: string]: unknown;
}

export interface ApiResult<T extends ApiStatusPayload = ApiStatusPayload> {
  state: ApiState;
  payload: T;
  statusCode: number;
  ok: boolean;
  expected: boolean;
}

const expectedStates = new Set<ApiState>([
  'ok', 'configured', 'connected', 'test_ready', 'setup_required',
  'unauthenticated', 'provider_required', 'not_connected', 'unavailable', 'disabled',
]);

export function normalizeApiState(status: unknown, responseOk = true): ApiState {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'provider_unavailable') return 'unavailable';
  if (value === 'not_configured') return 'setup_required';
  if (expectedStates.has(value as ApiState)) return value as ApiState;
  return responseOk ? 'ok' : 'error';
}

export async function readApi<T extends ApiStatusPayload = ApiStatusPayload>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  request: typeof fetch = fetch,
): Promise<ApiResult<T>> {
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    const response = await request(input, { ...init, headers });
    const payload = await response.json().catch(() => ({
      status: 'error',
      message: 'The service returned an unreadable response.',
      severity: 'error',
    })) as T;
    const state = normalizeApiState(payload?.status, response.ok);
    return {
      state,
      payload,
      statusCode: response.status,
      ok: response.ok && state !== 'error',
      expected: expectedStates.has(state),
    };
  } catch {
    const payload = {
      status: 'unavailable',
      configured: false,
      message: 'The service could not be reached. No state was assumed.',
      severity: 'warning',
    } as T;
    return { state: 'unavailable', payload, statusCode: 0, ok: false, expected: true };
  }
}

export const noRetryForExpectedState = (failureCount: number, error: unknown) => {
  if (error && typeof error === 'object' && 'expected' in error) return !(error as { expected?: boolean }).expected && failureCount < 2;
  return failureCount < 1;
};
