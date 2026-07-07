export type TokenVaultStatus = 'ok' | 'setup_required' | 'error';

export interface BrokerTokenRecord {
  provider: 'dhan' | 'upstox' | 'angel' | 'zerodha';
  userId: string;
  encryptedToken: string;
  iv: string;
  algorithm: 'AES-GCM';
  createdAt: string;
}

export interface TokenVaultResult {
  status: TokenVaultStatus;
  record?: BrokerTokenRecord;
  token?: string;
  message: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function hasCrypto() {
  return typeof globalThis.crypto !== 'undefined' && Boolean(globalThis.crypto.subtle);
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(secret: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function setupRequired(message = 'Broker token vault requires BROKER_ENCRYPTION_SECRET before tokens can be stored.') {
  return { status: 'setup_required' as const, message };
}

export function getTokenVaultStatus(secret?: string | null) {
  if (!hasCrypto()) return setupRequired('Worker crypto is unavailable, so broker tokens cannot be encrypted safely.');
  if (!secret || secret.trim().length < 32) return setupRequired();
  return { status: 'ok' as const, message: 'Broker token vault encryption is configured.' };
}

export async function encryptBrokerToken(params: {
  token: string;
  provider: BrokerTokenRecord['provider'];
  userId: string;
  secret?: string | null;
}): Promise<TokenVaultResult> {
  const vaultStatus = getTokenVaultStatus(params.secret);
  if (vaultStatus.status !== 'ok') return vaultStatus;
  const rawToken = params.token.trim();
  if (!rawToken) return { status: 'error', message: 'A broker token is required.' };

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(params.secret!.trim());
  const additionalData = encoder.encode(`${params.userId}:${params.provider}`);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, encoder.encode(rawToken));

  return {
    status: 'ok',
    message: 'Broker token encrypted for per-user storage.',
    record: {
      provider: params.provider,
      userId: params.userId,
      encryptedToken: toBase64(new Uint8Array(encrypted)),
      iv: toBase64(iv),
      algorithm: 'AES-GCM',
      createdAt: new Date().toISOString(),
    },
  };
}

export async function decryptBrokerToken(params: {
  record: BrokerTokenRecord;
  secret?: string | null;
}): Promise<TokenVaultResult> {
  const vaultStatus = getTokenVaultStatus(params.secret);
  if (vaultStatus.status !== 'ok') return vaultStatus;

  try {
    const key = await deriveKey(params.secret!.trim());
    const additionalData = encoder.encode(`${params.record.userId}:${params.record.provider}`);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(params.record.iv), additionalData },
      key,
      fromBase64(params.record.encryptedToken),
    );
    return { status: 'ok', token: decoder.decode(decrypted), message: 'Broker token decrypted inside trusted server code.' };
  } catch {
    return { status: 'error', message: 'Broker token could not be decrypted.' };
  }
}
