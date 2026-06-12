# Test Report — PR #12 "TradingView charts use NSE ticker symbols (not numeric BSE codes)"

Re-tested the merged #12 build on the live Worker https://stockpro-screener.jobanpreet0523.workers.dev
(confirmed the freshly deployed bundle `main-CNkLTwJM.js` no longer contains numeric codes
`BSE:500325`/`BSE:500570`, and serves `NSE:`/`NASDAQ:` prefixes).

## Escalation / caveat (read first)
The symbol fix works — but there's a TradingView limitation worth knowing:
- RELIANCE now maps to **`NSE:RELIANCE`** and the symbol **resolves** on TradingView.
  The old hard error **"BSE:500325 doesn't exist"** is gone.
- However, the free TradingView embed shows a notice **"This symbol is only available on
  TradingView."** for NSE equities. This is TradingView's data-licensing restriction for
  NSE in the free widget — NOT a bug in the app's symbol mapping. The inline candlestick
  chart for Indian stocks still won't draw in the embed even though the symbol is valid.
- US tickers are unaffected: AAPL → `NASDAQ:AAPL` renders the full candlestick chart.

If you want Indian charts to actually draw inline, that's a separate change (e.g. a
TradingView authenticated/licensed widget, or a different chart data source) — happy to
scope it if you want.

## Results
- RELIANCE → `NSE:RELIANCE`, symbol resolves, no "doesn't exist" error: **PASSED**.
- US control (AAPL → `NASDAQ:AAPL`) chart renders: **PASSED**.
- Inline candlestick chart for NSE equities draws in the free embed: **NOT ACHIEVED**
  (TradingView NSE licensing — out of scope of this symbol fix).

## Evidence

| 🔴 Before (PR #11 — broken) | 🟢 After (PR #12 — fixed) |
|---|---|
| ![RELIANCE BSE error](https://app.devin.ai/attachments/2916bb58-f4dc-41f3-b532-9650fb57e84d/screenshot_6d3bb4b27d6c4bd8a3977beeb7be1448.png) | ![NSE:RELIANCE resolves](https://app.devin.ai/attachments/055f5db1-ff23-42ea-ad7e-4e678a944a2b/screenshot_zoom_c3d93e962c8041e4a7762c7891692ffa.png) |
| `BSE:500325` → "doesn't exist" | `NSE:RELIANCE` → resolves; "only available on TradingView" notice |

### US control — AAPL chart still renders fully
![AAPL NASDAQ chart](https://app.devin.ai/attachments/b78898b9-333a-4be7-a31e-e08289ae48f3/screenshot_c76f63277545418cbb631d43fb683db9.png)
