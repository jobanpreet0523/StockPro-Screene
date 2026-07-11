import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalTrimmed = (max: number) => z.string().trim().max(max).optional();

export const setupStateSchema = z.enum(['configured', 'setup_required', 'disabled']);

export const waitlistLeadSchema = z.object({
  name: trimmed(120),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  useCase: optionalTrimmed(2000),
  interest: optionalTrimmed(120),
  sourcePage: optionalTrimmed(500),
  referrer: optionalTrimmed(500),
  turnstileToken: optionalTrimmed(4096),
}).strict();

export const contactFormSchema = waitlistLeadSchema.extend({
  message: optionalTrimmed(2000),
}).strict();

export const authSessionSchema = z.object({
  status: z.enum(['authenticated', 'unauthenticated', 'setup_required']),
  user: z.object({
    id: trimmed(120),
    email: z.email().max(254).nullable(),
    displayName: trimmed(120),
    role: z.literal('user'),
  }).nullable(),
  expiresAt: z.iso.datetime().nullable().optional(),
  provider: z.enum(['supabase', 'none']).optional(),
  message: trimmed(500),
}).strict();

export const brokerStatusSchema = z.object({
  status: z.enum(['ok', 'setup_required', 'not_connected', 'error']),
  provider: trimmed(40).optional(),
  isConnected: z.boolean(),
  dataAccess: z.enum(['none', 'delayed', 'live']),
  message: trimmed(500),
}).passthrough();

export const marketDataEnvelopeSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  status: z.enum(['ok', 'empty', 'setup_required', 'provider_unavailable', 'error']),
  source: trimmed(120),
  providerStatus: z.string().max(80).optional(),
  timestamp: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
  delayMinutes: z.number().nonnegative().optional(),
  isLive: z.boolean().optional(),
  message: trimmed(500),
  data: dataSchema.nullable(),
}).passthrough();

export const crtScanRunSchema = z.object({
  id: trimmed(120),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'setup_required']),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable().optional(),
  provider: trimmed(120),
  resultCount: z.number().int().nonnegative(),
  message: trimmed(500),
}).strict();

export const crtScanResultSchema = z.object({
  id: trimmed(120),
  runId: trimmed(120),
  symbol: trimmed(40),
  timeframe: trimmed(20),
  observedAt: z.iso.datetime(),
  score: z.number().min(0).max(100).optional(),
  rationale: z.array(trimmed(240)).max(12),
}).strict();

export const billingReadinessSchema = z.object({
  status: z.enum(['test_ready', 'setup_required', 'disabled', 'error']),
  provider: z.literal('razorpay').optional(),
  paymentEnabled: z.literal(false),
  live_disabled: z.literal(true),
  message: trimmed(500),
}).passthrough();

export const betaFeedbackSchema = z.object({
  message: trimmed(1500),
  sourcePage: optionalTrimmed(500),
  turnstileToken: optionalTrimmed(4096),
}).strict();

export const proDashboardStateSchema = z.object({
  status: z.enum(['ready', 'setup_required', 'unauthenticated', 'error']),
  marketProvider: setupStateSchema,
  brokerVault: setupStateSchema,
  billing: setupStateSchema,
  savedScreens: z.number().int().nonnegative(),
  activeAlerts: z.number().int().nonnegative(),
  message: trimmed(500),
}).strict();

export const notificationTypeSchema = z.enum([
  'waitlist_confirmation',
  'contact_received',
  'trial_reminder',
  'broker_connect_reminder',
  'beta_feedback_received',
  'alert_notification',
]);

export const emailNotificationRequestSchema = z.object({
  type: notificationTypeSchema,
  to: z.email().max(254).transform((value) => value.toLowerCase()),
  subject: optionalTrimmed(160),
  turnstileToken: optionalTrimmed(4096),
  context: z.record(z.string(), z.string().max(500)).optional(),
}).strict();

export const searchResultItemSchema = z.object({
  objectID: trimmed(160),
  kind: z.enum(['stock', 'sector', 'blog', 'screen', 'company', 'crt_doc']),
  title: trimmed(200),
  subtitle: optionalTrimmed(240),
  url: trimmed(500).refine((value) => value.startsWith('/'), 'Search URLs must be same-origin paths.'),
  symbol: optionalTrimmed(40),
  source: trimmed(120),
}).strict();

export type WaitlistLeadInput = z.infer<typeof waitlistLeadSchema>;
export type BetaFeedbackInput = z.infer<typeof betaFeedbackSchema>;
export type EmailNotificationRequest = z.infer<typeof emailNotificationRequestSchema>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
