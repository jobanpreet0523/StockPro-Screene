/**
 * StockPro Live Data Engine v2.0
 * ─────────────────────────────────────────────────────────────
 * Connects to Cloudflare Worker API endpoints for real live data.
 * Auto-updates: NIFTY / BANKNIFTY / FINNIFTY spot prices,
 * VIX, PCR, Max Pain, Total OI, IV, and full Option Chain.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  "use strict";

  const API = window.location.origin;
  const REFRESH_MS = 5000;

  /* ── HELPERS ────────────────────────────────────────── */
  function fmtNum(n) { return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtOI(n) {
    if (n >= 10000000) return (n / 10000000).toFixed(2) + "Cr";
    if (n >= 100000) return (n / 100000).toFixed(1) + "L";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n;
  }

  /* ── STATE ───────────────────────────────────────────── */
  let state = {
    nifty:     { spot: 24892.50, chg: 0, chgPct: 0 },
    banknifty: { spot: 52341.20, chg: 0, chgPct: 0 },
    finnifty:  { spot: 21450.00, chg: 0, chgPct: 0 },
    vix:       12.34,
    pcr:       1.0,
    maxPain:   24900,
    iv:        14.2,
    callOI:    0,
    putOI:     0,
    chain:     [],
    backendOk: false,
  };

  /* ── FETCH LIVE DATA FROM WORKER API ────────────────── */
  async function fetchLiveData() {
    try {
      // Fetch indices
      const r = await fetch(`${API}/api/indices`, { signal: AbortSignal.timeout(8000) });
      const d = await r.json();
      if (d.data) {
        const nifty = d.data.find(i => i.symbol === '^NSEI');
        const banknifty = d.data.find(i => i.symbol === '^NSEBANK');
        const finnifty = d.data.find(i => i.symbol === '^NSEFN' || i.name?.includes('FIN'));
        const vix = d.data.find(i => i.symbol === '^VIX' || i.name?.includes('VIX'));

        if (nifty) { state.nifty.spot = nifty.price; state.nifty.chg = nifty.change; state.nifty.chgPct = nifty.changePercent; }
        if (banknifty) { state.banknifty.spot = banknifty.price; state.banknifty.chg = banknifty.change; state.banknifty.chgPct = banknifty.changePercent; }
        if (finnifty) { state.finnifty.spot = finnifty.price; state.finnifty.chg = finnifty.change; state.finnifty.chgPct = finnifty.changePercent; }
        if (vix) { state.vix = vix.price; }

        state.backendOk = true;
        showStatus("● LIVE", true);
      }
    } catch (e) {
      state.backendOk = false;
      showStatus("⚡ RECONNECTING", false);
    }

    // Fetch option chain
    if (state.backendOk) {
      try {
        const oRes = await fetch(`${API}/api/option-chain/NIFTY`, { signal: AbortSignal.timeout(12000) });
        if (oRes.ok) {
          const oData = await oRes.json();
          if (oData.status === 'ok' && oData.data) {
            const chain = oData.data;
            state.pcr = chain.pcr || 1.0;
            state.maxPain = chain.maxPain || 24900;
            state.callOI = chain.totalCallOi || 0;
            state.putOI = chain.totalPutOi || 0;
            state.iv = chain.options?.[Math.floor(chain.options.length / 2)]?.callIv || 14.2;

            state.chain = (chain.options || []).map(option => ({
              strike: option.strikePrice,
              atm: Math.round(state.nifty.spot / 50) * 50,
              ce: {
                ltp: option.callLtp,
                chg: option.callChange,
                iv: option.callIv,
                oi: option.callOi,
                oiChg: option.callOiChg,
                vol: option.callVol,
              },
              pe: {
                ltp: option.putLtp,
                chg: option.putChange,
                iv: option.putIv,
                oi: option.putOi,
                oiChg: option.putOiChg,
                vol: option.putVol,
              }
            }));

            patchAll();
            return;
          }
        }
      } catch (err) {
        console.warn("Option chain API fetch failed:", err);
      }
    }

    patchAll();
  }

  /* ── STATUS INDICATOR ────────────────────────────────── */
  function showStatus(label, isLive) {
    document.querySelectorAll("[data-live-status]").forEach(el => { el.textContent = label; el.style.color = isLive ? "#00ff80" : "#fac516"; });
    document.querySelectorAll(".market-badge, .live-badge, .status-badge").forEach(el => {
      if (el.textContent.includes("LIVE") || el.textContent.includes("SIMULATED") || el.textContent.includes("RECONNECTING")) {
        el.textContent = isLive ? "● MARKET LIVE" : "⚡ RECONNECTING";
      }
    });
  }

  /* ── PATCH HELPERS ───────────────────────────────────── */
  function setText(sel, val, color) {
    document.querySelectorAll(sel).forEach(el => { el.textContent = val; if (color) el.style.color = color; });
  }

  /* ── SMART TEXT PATCHER ──────────────────────────────── */
  function patchValueByText(oldText, newText, color) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.includes(oldText)) nodes.push(walker.currentNode);
    }
    nodes.forEach(node => {
      if (!node.parentElement) return;
      const el = node.parentElement;
      if (["SCRIPT", "STYLE", "HEAD"].includes(el.tagName)) return;
      node.textContent = node.textContent.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
      if (color) el.style.color = color;
    });
  }

  /* ── PRICE TEXT PATCHER ──────────────────────────────── */
  function patchPriceText(name, spot, chgPct, oldPatterns) {
    const upDown = chgPct >= 0 ? "+" : "";
    const color = chgPct >= 0 ? "#10b981" : "#ef4444";
    oldPatterns.forEach(pattern => {
      patchValueByText(pattern, spot.toLocaleString("en-IN", { minimumFractionDigits: 2 }), color);
    });
  }

  /* ── PATCH ALL LIVE SECTIONS ─────────────────────────── */
  function patchAll() {
    const n = state.nifty, bn = state.banknifty, fn = state.finnifty;
    const up = v => v >= 0;

    // 1. NIFTY spot
    const niftyStr = fmtNum(n.spot);
    const niftyChg = (up(n.chgPct) ? "+" : "") + n.chgPct.toFixed(2) + "%";
    const nColor = up(n.chgPct) ? "#10b981" : "#ef4444";

    document.querySelectorAll("[data-asset='NIFTY'], .nifty-price, #nifty-spot").forEach(el => {
      el.textContent = niftyStr; el.style.color = nColor;
    });

    // Patch old hardcoded values with real ones
    patchValueByText("24,892.50", fmtNum(n.spot), nColor);
    patchValueByText("24892.50", fmtNum(n.spot), nColor);
    patchValueByText("52,341.20", fmtNum(bn.spot), up(bn.chgPct) ? "#10b981" : "#ef4444");
    patchValueByText("52341.20", fmtNum(bn.spot), up(bn.chgPct) ? "#10b981" : "#ef4444");
    patchValueByText("20,940.80", fmtNum(fn.spot), up(fn.chgPct) ? "#10b981" : "#ef4444");
    patchValueByText("20940.80", fmtNum(fn.spot), up(fn.chgPct) ? "#10b981" : "#ef4444");

    // 2. VIX
    patchValueByText("12.34", state.vix.toFixed(2));
    patchValueByText("12.42", state.vix.toFixed(2));

    // 3. PCR
    const pcrColor = state.pcr > 1.2 ? "#10b981" : state.pcr < 0.8 ? "#ef4444" : "#eab308";
    patchValueByText("1.34", state.pcr.toFixed(2), pcrColor);
    patchValueByText("1.38", state.pcr.toFixed(2), pcrColor);

    // 4. Max Pain
    const mpStr = state.maxPain.toLocaleString("en-IN");
    patchValueByText("24,900", mpStr);
    patchValueByText("25,000", mpStr);

    // 5. Total OI
    if (state.callOI > 0) {
      patchValueByText("12.4M", fmtOI(state.callOI));
      patchValueByText("16.6M", fmtOI(state.putOI));
    }

    // 6. IV
    patchValueByText("12.8%", state.iv.toFixed(1) + "%");

    // 7. Option Chain Table
    patchOptionChain();

    // 8. Update change percentages
    patchValueByText("+0.85%", (up(n.chgPct) ? "+" : "") + n.chgPct.toFixed(2) + "%", nColor);
    patchValueByText("+0.94%", (up(n.chgPct) ? "+" : "") + n.chgPct.toFixed(2) + "%", nColor);
    patchValueByText("-0.12%", (up(bn.chgPct) ? "+" : "") + bn.chgPct.toFixed(2) + "%", up(bn.chgPct) ? "#10b981" : "#ef4444");
    patchValueByText("+0.58%", (up(n.chgPct) ? "+" : "") + n.chgPct.toFixed(2) + "%", nColor);

    // 9. Timestamps
    const now = new Date();
    const t = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    document.querySelectorAll("[data-timestamp], .last-updated, .update-time").forEach(el => { el.textContent = t; });
  }

  /* ── OPTION CHAIN TABLE PATCHER ──────────────────────── */
  function patchOptionChain() {
    if (!state.chain.length) return;
    const tables = document.querySelectorAll("table");
    tables.forEach(table => {
      const headers = table.querySelectorAll("th");
      let isChain = false;
      headers.forEach(h => {
        if (h.textContent.includes("STRIKE") || h.textContent.includes("Strike") || h.textContent.includes("LTP") || h.textContent.includes("OI")) isChain = true;
      });
      if (!isChain) return;

      const tbody = table.querySelector("tbody");
      if (!tbody) return;
      const rows = tbody.querySelectorAll("tr");

      // Get the strikes near ATM
      const atm = Math.round(state.nifty.spot / 50) * 50;
      const chainSlice = state.chain.filter(c => c.strike >= atm - 500 && c.strike <= atm + 500);
      const startIdx = Math.max(0, Math.floor((chainSlice.length - rows.length) / 2));
      const visibleChain = chainSlice.slice(startIdx, startIdx + rows.length);

      rows.forEach((tr, i) => {
        const d = visibleChain[i];
        if (!d) return;
        const cells = tr.querySelectorAll("td");
        if (cells.length < 7) return;

        const n = cells.length;
        const isATM = d.strike === atm;
        if (isATM) tr.style.background = "rgba(250, 197, 22, 0.08)";

        if (n >= 13) {
          // Full layout
          safeSet(cells[0], fmtOI(d.ce.oi), "#10b981");
          safeSet(cells[n - 1], fmtOI(d.pe.oi), "#ef4444");
          const strikeIdx = Math.floor(n / 2);
          safeSet(cells[strikeIdx], d.strike.toLocaleString("en-IN") + (isATM ? " ATM" : ""), isATM ? "#eab308" : "#1e293b");
        }
      });
    });
  }

  function safeSet(el, val, color) { if (!el) return; el.textContent = val; if (color) el.style.color = color; }

  /* ── SHOW LIVE BANNER ────────────────────────────────── */
  function showLiveBanner() {
    if (document.getElementById("sp-live-badge")) return;
    const badge = document.createElement("div");
    badge.id = "sp-live-badge";
    badge.style.cssText = `position:fixed;bottom:20px;left:20px;z-index:9999;background:rgba(0,0,0,.85);border:1px solid rgba(0,255,128,.3);border-radius:8px;padding:7px 13px;font-size:11px;font-weight:600;color:#00ff80;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:6px;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.4);`;
    badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#00ff80;animation:livePulse 1.5s infinite;display:inline-block"></span><span id="sp-live-text">CONNECTING…</span><span id="sp-live-time" style="color:#8b949e;margin-left:4px">—</span>`;
    const style = document.createElement("style");
    style.textContent = "@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.6)}}";
    document.head.appendChild(style);
    document.body.appendChild(badge);
  }

  function updateBadge() {
    const text = document.getElementById("sp-live-text");
    const time = document.getElementById("sp-live-time");
    if (text) text.textContent = state.backendOk ? "● LIVE NSE" : "⚡ RECONNECTING";
    if (text) text.style.color = state.backendOk ? "#00ff80" : "#fac516";
    if (time) time.textContent = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  /* ── MAIN LOOP ───────────────────────────────────────── */
  async function run() {
    showLiveBanner();
    await fetchLiveData();
    updateBadge();
    setInterval(async () => { await fetchLiveData(); updateBadge(); }, REFRESH_MS);
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); }
  else { run(); }
})();
