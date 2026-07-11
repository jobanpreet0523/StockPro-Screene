# Email Notifications Setup

Configure `RESEND_API_KEY`, a verified `RESEND_FROM_EMAIL`, and `SUPPORT_EMAIL` as Cloudflare Worker secrets or bindings. Never prefix them with `VITE_`.

Supported notification types are `waitlist_confirmation`, `contact_received`, `trial_reminder`, `broker_connect_reminder`, `beta_feedback_received`, and `alert_notification`.

The notification helper returns `setup_required` when delivery is not configured and reports provider errors honestly. Public notification requests require Turnstile and rate limiting. No delivery path returns a fake sent result.
