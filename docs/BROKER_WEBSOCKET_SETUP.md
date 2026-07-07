# Broker WebSocket setup

Stage 23 adds the broker WebSocket foundation only. It does not open a direct broker WebSocket from frontend code, does not expose broker tokens, and does not generate fake ticks.

## API

`GET /api/broker/stream/status`

Default response when stream infrastructure is not configured:

```json
{
  "status": "setup_required",
  "source": "broker_stream",
  "provider": "none",
  "isLive": false,
  "isStreaming": false,
  "reconnectBackoffMs": 0,
  "message": "Stream setup required. REST polling remains the fallback."
}
```

## Frontend behavior

`src/hooks/useBrokerLiveStream.ts` checks stream status and reports:

- "Live stream unavailable, using polling"
- "Connect broker for live stream"
- "Stream setup required"

It does not synthesize ticks. It uses bounded exponential backoff only for status-check failures and cleans up timers on unmount.

## Future production requirements

- Broker stream gateway must run server-side.
- Per-user broker authorization must be verified before stream subscription.
- Raw broker tokens must remain encrypted at rest and must never be returned to the browser.
- REST polling remains the fallback when stream setup is missing or unavailable.
