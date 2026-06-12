# Test Plan — PR #11 "fix: all demo data replaced with real live API data"

Target: live deployed Worker https://stockpro-screener.jobanpreet0523.workers.dev
(after Cloudflare redeploys the merged #11 commit; verified by grepping the new JS
bundle for the `corsproxy.io` marker). Local preview http://localhost:4173 is the fallback.

Constraint: the Yahoo/NSE feeds are fetched client-side via public proxies
(allorigins/corsproxy/rss2json) which are frequently rate-limited/blocked from this
VM's network. Tests that depend on those responses are marked "live-data dependent"
and will be reported inconclusive if the feeds don't return, with a Network-tab check
that the correct endpoints are at least requested.

## Test 1 (PRIMARY, deterministic) — TradingView symbol fix (PR #12)
Reach: Screener route → select stock RELIANCE → read the chart header symbol chip
(`StockChart.tsx:87` renders `mappedSymbol` from `getTVSymbol`).
- Steps: open `/screener`, click the RELIANCE row, look at the symbol chip above the chart.
- PASS: chip reads exactly `NSE:RELIANCE` AND the candlestick chart renders (no error box).
- FAIL (regressed): chip reads `BSE:500325` and/or widget shows "... doesn't exist".
- Control: AAPL → chip `NASDAQ:AAPL`, chart renders (US branch still intact).

## Test 2 — Routes render, no black screens (regression)
Visit each route and confirm primary content renders (heading + a content panel), not a blank/black screen:
`/screener`, `/signals`, `/option-chain`, `/heatmap`, `/fii-dii`, `/news`, `/pricing`.
- PASS: each shows its page heading and a populated panel/table/skeleton (no black/empty viewport, no error boundary fallback text).
- FAIL: any route shows a black screen or the SectionErrorBoundary fallback.

## Test 3 — Market-status badge (P6, deterministic, client-side)
On the dashboard header, read the market-status badge.
- PASS: badge text is one of `🟢 MARKET LIVE` / `🟡 PRE-OPEN` / `🟠 POST-CLOSE` / `🔴 MARKET CLOSED`
  and matches IST wall-clock (current UTC 08:5x → IST ~14:2x weekday → expect `🟢 MARKET LIVE`).
- FAIL: badge missing, or shows literal "DEMO"/"SIMULATED" text.

## Test 4 (live-data dependent) — new feeds wired (P1/P2/P4/P8)
If the proxy feeds return in-browser, verify the user-visible deltas; otherwise open
DevTools Network and assert the requests are issued to the new endpoints.
- P1: stocks request URL contains all 30 symbols incl. `TATASTEEL.NS`,`COALINDIA.NS`; screener shows >20 rows.
- P2: indices request URL contains `GC=F,CL=F`; ticker/cards show GOLD and CRUDE OIL.
- P4: a request to `api.rss2json.com` with the ET feed; News page lists items.
- P8: a request to `nseindia.com/api/fiidiiTradeReact` via allorigins; FII/DII page shows FII & DII net values.
- PASS: endpoints requested with the new params (deterministic) AND, if responses arrive, the corresponding UI is populated.
- INCONCLUSIVE: requests issued correctly but proxy returns error/empty (network blocked) — report as such, not as pass.
