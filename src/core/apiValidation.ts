import type { z } from 'zod';

export type ValidationSuccess<T> = { ok: true; data: T };
export type ValidationFailure = {
  ok: false;
  status: 'invalid_input' | 'invalid_response';
  message: string;
  fieldErrors: Record<string, string>;
};

function flattenIssues(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : 'request';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function validateInput<T>(schema: z.ZodType<T>, value: unknown): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    status: 'invalid_input',
    message: 'The request contains invalid or unsupported fields.',
    fieldErrors: flattenIssues(result.error),
  };
}

export function validateProviderData<T>(schema: z.ZodType<T>, value: unknown): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    status: 'invalid_response',
    message: 'The provider returned malformed data. No substitute data is shown.',
    fieldErrors: flattenIssues(result.error),
  };
}

export async function readValidatedJson<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<ValidationSuccess<T> | ValidationFailure> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      status: 'invalid_response',
      message: 'The service returned unreadable JSON.',
      fieldErrors: {},
    };
  }
  return validateProviderData(schema, payload);
}
