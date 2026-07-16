import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const DEFAULTS = Object.freeze({
  maxBodyBytes: 64 * 1024,
  maxSkewMs: 5 * 60 * 1000,
  replayTtlMs: 15 * 60 * 1000,
  idempotencyTtlMs: 24 * 60 * 60 * 1000,
  rateLimit: 30,
  rateWindowMs: 60 * 1000,
});
const FORBIDDEN_FIELD = /(authorization|cookie|token|secret|password|pin|otp|totp|session|broker|holding|portfolio|order|payment|card|body|request)/i;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g;

export class IngressSecurityError extends Error {
  constructor(code, statusCode = 400) {
    super(code);
    this.name = "IngressSecurityError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function reject(code, statusCode) {
  throw new IngressSecurityError(code, statusCode);
}
function rawBuffer(rawBody, allowString = false) {
  if (allowString && typeof rawBody === "string") return Buffer.from(rawBody, "utf8");
  if (Buffer.isBuffer(rawBody)) return Buffer.from(rawBody);
  if (rawBody instanceof Uint8Array) return Buffer.from(rawBody.buffer, rawBody.byteOffset, rawBody.byteLength);
  reject("invalid_raw_body");
}
function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object") reject("invalid_headers");
  const normalized = Object.create(null);
  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase();
    if (normalized[key] !== undefined) reject("duplicate_header");
    if (Array.isArray(value)) {
      if (value.length !== 1) reject("duplicate_header");
      normalized[key] = String(value[0]);
    } else if (value !== undefined && value !== null) {
      normalized[key] = String(value);
    }
  }
  return normalized;
}
function requiredHeader(headers, name) {
  const value = headers[name];
  if (!value || value !== value.trim()) reject("invalid_" + name.replaceAll("-", "_"));
  return value;
}
function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function sanitizedString(value, rule, field) {
  if (typeof value !== "string") reject("invalid_payload_field_" + field);
  const normalized = value.normalize("NFKC").replace(CONTROL_CHARACTERS, "").trim();
  const maximum = rule.maxLength ?? 256;
  if (normalized.length < (rule.minLength ?? 0) || normalized.length > maximum) reject("invalid_payload_field_" + field);
  if (rule.pattern && !(new RegExp(rule.pattern, "u")).test(normalized)) reject("invalid_payload_field_" + field);
  if (rule.enum && !rule.enum.includes(normalized)) reject("invalid_payload_field_" + field);
  return normalized;
}
function projectPayload(input, schema) {
  if (!plainObject(input)) reject("invalid_json_object");
  if (!schema || !plainObject(schema.fields)) reject("invalid_workflow_schema", 500);
  const entries = Object.entries(schema.fields);
  if (entries.length > 20) reject("invalid_workflow_schema", 500);
  const output = Object.create(null);
  for (const [field, rule] of entries) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(field) || FORBIDDEN_FIELD.test(field) || !plainObject(rule)) reject("invalid_workflow_schema", 500);
    const value = input[field];
    if (value === undefined) {
      if (rule.required) reject("missing_payload_field_" + field);
      continue;
    }
    if (rule.type === "string") output[field] = sanitizedString(value, rule, field);
    else if (rule.type === "boolean") {
      if (typeof value !== "boolean") reject("invalid_payload_field_" + field);
      output[field] = value;
    } else if (rule.type === "integer" || rule.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value) || (rule.type === "integer" && !Number.isInteger(value))) reject("invalid_payload_field_" + field);
      if ((rule.minimum !== undefined && value < rule.minimum) || (rule.maximum !== undefined && value > rule.maximum)) reject("invalid_payload_field_" + field);
      output[field] = value;
    } else reject("invalid_workflow_schema", 500);
  }
  return output;
}

export function canonicalSignatureInput({ timestamp, eventId, idempotencyKey, workflow, rawBody }) {
  const digest = createHash("sha256").update(rawBuffer(rawBody)).digest("hex");
  return ["v1", timestamp, eventId, idempotencyKey, workflow, digest].join("\n");
}

export function signIngressRequest({ secret, timestamp, eventId, idempotencyKey, workflow, rawBody }) {
  const key = rawBuffer(secret, true);
  if (key.length < 32) reject("invalid_signing_key", 500);
  return createHmac("sha256", key).update(canonicalSignatureInput({ timestamp, eventId, idempotencyKey, workflow, rawBody }), "utf8").digest("hex");
}

function safeSignatureEqual(actual, expected) {
  if (!/^[a-f0-9]{64}$/.test(actual) || !/^[a-f0-9]{64}$/.test(expected)) return false;
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function secretFor(keys, keyId) {
  const secret = keys instanceof Map ? keys.get(keyId) : (keys && Object.hasOwn(keys, keyId) ? keys[keyId] : undefined);
  if (secret === undefined) reject("unknown_key", 401);
  const value = rawBuffer(secret, true);
  if (value.length < 32) reject("invalid_signing_key", 500);
  return value;
}
async function storeCall(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof IngressSecurityError) throw error;
    reject("security_store_unavailable", 503);
  }
}
function requireStores(stores) {
  if (!stores?.replay || typeof stores.replay.claim !== "function") reject("invalid_replay_store", 500);
  if (!stores?.idempotency || typeof stores.idempotency.claim !== "function" || typeof stores.idempotency.complete !== "function") reject("invalid_idempotency_store", 500);
  if (!stores?.rateLimit || typeof stores.rateLimit.consume !== "function") reject("invalid_rate_limit_store", 500);
}
function sanitizeResult(result) {
  if (!plainObject(result)) reject("invalid_idempotent_result", 500);
  const output = Object.create(null);
  if (!Number.isInteger(result.statusCode) || result.statusCode < 100 || result.statusCode > 599) reject("invalid_idempotent_result", 500);
  output.statusCode = result.statusCode;
  if (typeof result.resultCode !== "string" || !/^[a-z0-9_]{2,64}$/.test(result.resultCode)) reject("invalid_idempotent_result", 500);
  output.resultCode = result.resultCode;
  if (result.reference !== undefined) {
    if (typeof result.reference !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(result.reference)) reject("invalid_idempotent_result", 500);
    output.reference = result.reference;
  }
  return output;
}

export async function completeIdempotentResult({ idempotencyStore, context, result }) {
  if (!idempotencyStore || typeof idempotencyStore.complete !== "function" || !plainObject(context)) reject("invalid_idempotency_context", 500);
  const sanitized = sanitizeResult(result);
  await storeCall(() => idempotencyStore.complete({
    key: context.key,
    bodyHash: context.bodyHash,
    result: sanitized,
  }));
  return sanitized;
}

export async function verifyIngressRequest({
  headers,
  rawBody,
  nowMs,
  keys,
  workflows,
  stores,
  options = {},
}) {
  requireStores(stores);
  if (!Number.isFinite(nowMs)) reject("invalid_clock", 500);
  const config = { ...DEFAULTS, ...options };
  for (const name of ["maxBodyBytes", "maxSkewMs", "replayTtlMs", "idempotencyTtlMs", "rateLimit", "rateWindowMs"]) {
    if (!Number.isSafeInteger(config[name]) || config[name] <= 0) reject("invalid_security_configuration", 500);
  }
  const normalizedHeaders = normalizeHeaders(headers);
  const contentType = requiredHeader(normalizedHeaders, "content-type").toLowerCase();
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/.test(contentType)) reject("unsupported_content_type", 415);
  const workflow = requiredHeader(normalizedHeaders, "x-stockpro-workflow");
  const eventId = requiredHeader(normalizedHeaders, "x-stockpro-event-id");
  const idempotencyKey = requiredHeader(normalizedHeaders, "x-stockpro-idempotency-key");
  const timestamp = requiredHeader(normalizedHeaders, "x-stockpro-timestamp");
  const keyId = requiredHeader(normalizedHeaders, "x-stockpro-key-id");
  const signature = requiredHeader(normalizedHeaders, "x-stockpro-signature");
  if (!/^[a-z0-9-]{3,48}$/.test(workflow)) reject("invalid_workflow");
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(eventId)) reject("invalid_event_id");
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) reject("invalid_idempotency_key");
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(keyId)) reject("invalid_key_id");
  if (!/^[0-9]{10}$/.test(timestamp)) reject("invalid_timestamp");
  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isSafeInteger(timestampMs) || Math.abs(nowMs - timestampMs) > config.maxSkewMs) reject("stale_timestamp", 401);
  const rule = workflows && Object.hasOwn(workflows, workflow) ? workflows[workflow] : undefined;
  if (!rule) reject("unknown_workflow", 404);
  const bytes = rawBuffer(rawBody);
  if (bytes.length === 0 || bytes.length > config.maxBodyBytes) reject("invalid_body_size", 413);
  const expected = signIngressRequest({ secret: secretFor(keys, keyId), timestamp, eventId, idempotencyKey, workflow, rawBody: bytes });
  if (!safeSignatureEqual(signature, expected)) reject("invalid_signature", 401);
  const scope = keyId + ":" + workflow;
  const rate = await storeCall(() => stores.rateLimit.consume({
    key: scope,
    limit: config.rateLimit,
    windowMs: config.rateWindowMs,
    nowMs,
  }));
  if (!rate || typeof rate.allowed !== "boolean") reject("invalid_rate_limit_store_result", 500);
  if (!rate.allowed) reject("rate_limited", 429);
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    reject("invalid_json");
  }
  const payload = projectPayload(parsed, rule);
  const bodyHash = createHash("sha256").update(bytes).digest("hex");
  const replayClaimed = await storeCall(() => stores.replay.claim({
    key: scope + ":" + eventId,
    nowMs,
    expiresAtMs: nowMs + config.replayTtlMs,
  }));
  if (typeof replayClaimed !== "boolean") reject("invalid_replay_store_result", 500);
  if (!replayClaimed) reject("replay_detected", 409);
  const idempotencyContext = {
    key: scope + ":" + idempotencyKey,
    bodyHash,
  };
  const idempotency = await storeCall(() => stores.idempotency.claim({
    ...idempotencyContext,
    nowMs,
    expiresAtMs: nowMs + config.idempotencyTtlMs,
  }));
  if (!idempotency || !["claimed", "duplicate", "collision"].includes(idempotency.status)) reject("invalid_idempotency_store_result", 500);
  if (idempotency.status === "collision") reject("idempotency_collision", 409);
  if (idempotency.status === "duplicate") {
    if (!idempotency.result) reject("idempotency_in_progress", 409);
    return {
      kind: "duplicate",
      duplicate: true,
      result: sanitizeResult(idempotency.result),
    };
  }
  const traceId = createHash("sha256").update(scope + ":" + eventId, "utf8").digest("base64url");
  return {
    kind: "accepted",
    duplicate: false,
    envelope: {
      version: "1",
      workflow,
      eventId,
      idempotencyKey,
      occurredAt: new Date(timestampMs).toISOString(),
      receivedAt: new Date(nowMs).toISOString(),
      testMode: options.testMode === true,
      traceId,
      payload,
    },
    idempotencyContext,
  };
}
