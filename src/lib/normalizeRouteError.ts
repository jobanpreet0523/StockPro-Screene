const MAX_MESSAGE_LENGTH = 500;

export function normalizeRouteError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value.slice(0, MAX_MESSAGE_LENGTH));

  const error = new Error('A route failed with a non-Error rejection value.');
  error.name = 'NonErrorRouteFailure';
  return error;
}

