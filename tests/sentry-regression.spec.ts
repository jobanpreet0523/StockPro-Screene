import { expect, test } from '@playwright/test';
import { normalizeRouteError } from '../src/lib/normalizeRouteError';

test('non-Error route failures are normalized without serializing private objects', () => {
  const normalized = normalizeRouteError({ accessToken: 'must-not-appear', nested: { authorization: 'private' } });
  expect(normalized).toBeInstanceOf(Error);
  expect(normalized.name).toBe('NonErrorRouteFailure');
  expect(normalized.message).not.toContain('must-not-appear');
  expect(normalized.message).not.toContain('private');
});

test('real Error instances retain their original stack and message', () => {
  const original = new TypeError('Focused regression');
  expect(normalizeRouteError(original)).toBe(original);
});
