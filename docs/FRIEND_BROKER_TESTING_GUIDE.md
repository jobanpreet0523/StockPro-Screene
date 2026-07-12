# Friend broker testing guide

1. Create an account at `/signup` and confirm the Supabase email.
2. Log in and verify `/account` shows your own email.
3. Open `/connect-broker`.
4. Connect your own broker credentials. Never share passwords or OTPs.
5. Run the profile test.
6. Enter an official provider instrument/security ID and run the quote test.
7. Run a small historical-candle date-range test.
8. Run an option-chain test only for an instrument and expiry supported by your broker.
9. Confirm another StockPro account cannot see your connection or test state.
10. Open `/crt-scanner` and run a manual scan only if an authorized scanner provider is configured.
11. Create a watchlist, add a symbol, rename it, remove the symbol, and delete the list.
12. Create an alert, edit it, pause/resume it, and delete it.
13. Confirm no alert says sent unless a configured evaluator and Resend actually delivered it.
14. Report issues through `/contact` or the closed-beta feedback flow.
15. Disconnect the broker after testing.

Expected safety behavior:

- Missing setup is informational, not a repeated 503.
- Expired tokens show `reconnect_required`.
- Market values are absent rather than generated when no source is available.
- Friends must use their own broker token.
- StockPro never exposes tokens or places trades.

StockPro provides educational analytics only. It is not SEBI-registered investment advice. Broker live data is shown only from the user's own connected broker account. StockPro does not place trades.
