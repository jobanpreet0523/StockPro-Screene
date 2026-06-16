/**
 * StockPro Live Data Engine v3.0
 * Patches all hardcoded values in LandingPage with live data from Worker API.
 */
(function () {
  "use strict";

  const API = window.location.origin;
  const REFRESH_MS = 5000;

  function fmtNum(n) { return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtOI(n) {
    if (!n || isNaN(n)) return "0";
    if (n >= 10000000) return (n / 10000000).toFixed(2) + "Cr";
    if (n >= 100000) return (n / 100000).toFixed(1) + "L";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return Math.round(n).toString();
  }

  let state = {
    nifty:     { spot: 0, chg: 0, chgPct: 0 },
    banknifty: { spot: 0, chg: 0, chgPct: 0 },
    finnifty:  { spot: 0, chg: 0, chgPct: 0 },
    vix:       0,
    pcr:       0,
    maxPain:   0,
    iv:        0,
    callOI:    0,
    putOI:     0,
    chain:     [],
    backendOk: false,
  };

  function extractChainOptions(apiData) {
    // Support both flat format (yahoo_fallback) and NSE nested format
    if (apiData?.options) return apiData.options;
    if (apiData?.records?.data) {
      return apiData.records.data.map(d => ({
        strikePrice: d.strikePrice,
        callLtp: d.CE?.lastPrice || 0, callChange: d.CE?.change || 0,
        callVol: d.CE?.totalTradedVolume || 0, callOi: d.CE?.openInterest || 0,
        callOiChg: d.CE?.changeinOpenInterest || 0, callIv: d.CE?.impliedVolatility || 0,
        putLtp: d.PE?.lastPrice || 0, putChange: d.PE?.change || 0,
        putVol: d.PE?.totalTradedVolume || 0, putOi: d.PE?.openInterest || 0,
        putOiChg: d.PE?.changeinOpenInterest || 0, putIv: d.PE?.impliedVolatility || 0,
      }));
    }
    return [];
  }

  async function fetchLiveData() {
    try {
      const r = await fetch(`${API}/api/indices`, { signal: AbortSignal.timeout(10000) });
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
    } catch {
      state.backendOk = false;
      showStatus("⚡ RECONNECTING", false);
    }

    // Fetch option chain
    try {
      const oRes = await fetch(`${API}/api/option-chain/NIFTY`, { signal: AbortSignal.timeout(12000) });
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.status === 'ok') {
          const chainData = oData.data || {};
          // chainData could be flat (yahoo_fallback) or nested (NSE: data.records)
          const options = extractChainOptions(chainData);
          const spot = chainData.spotPrice || chainData.records?.underlyingValue || state.nifty.spot;
          let totalCallOI = chainData.totalCallOi || chainData.records?.data?.reduce((s,d) => s + (d.CE?.openInterest||0), 0) || 0;
          let totalPutOI = chainData.totalPutOi || chainData.records?.data?.reduce((s,d) => s + (d.PE?.openInterest||0), 0) || 0;
          const pcr = chainData.pcr || (totalCallOI > 0 ? totalPutOI / totalCallOI : 1.0);

          // Calculate max pain
          let maxPain = chainData.maxPain || Math.round(spot / 50) * 50;
          if (options.length > 0 && !chainData.maxPain) {
            let minPain = Infinity;
            for (const t of options) {
              let pain = 0;
              for (const o of options) {
                if (t.strikePrice > o.strikePrice) pain += (t.strikePrice - o.strikePrice) * o.callOi;
                if (t.strikePrice < o.strikePrice) pain += (o.strikePrice - t.strikePrice) * o.putOi;
              }
              if (pain < minPain) { minPain = pain; maxPain = t.strikePrice; }
            }
          }

          state.pcr = pcr;
          state.maxPain = maxPain;
          state.callOI = totalCallOI;
          state.putOI = totalPutOI;
          state.iv = options[Math.floor(options.length / 2)]?.callIv || 14.2;
          state.chain = options.map(o => ({
            strike: o.strikePrice,
            ce: { ltp: o.callLtp, chg: o.callChange, iv: o.callIv, oi: o.callOi, oiChg: o.callOiChg, vol: o.callVol },
            pe: { ltp: o.putLtp, chg: o.putChange, iv: o.putIv, oi: o.putOi, oiChg: o.putOiChg, vol: o.putVol },
          }));
        }
      }
    } catch {}

    patchAll();
  }

  function showStatus(label, isLive) {
    document.querySelectorAll("[data-live-status]").forEach(el => { el.textContent = label; el.style.color = isLive ? "#00ff80" : "#fac516"; });
  }

  function patchValueByText(oldText, newText, color) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.includes(oldText)) nodes.push(walker.currentNode);
    }
    nodes.forEach(node => {
      if (!node.parentElement) return;
      if (["SCRIPT", "STYLE", "HEAD"].includes(node.parentElement.tagName)) return;
      node.textContent = node.textContent.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
      if (color) node.parentElement.style.color = color;
    });
  }

  function patchAll() {
    const n = state.nifty, bn = state.banknifty;
    if (!n.spot) return; // Wait for first data load

    const nColor = n.chgPct >= 0 ? "#10b981" : "#ef4444";
    const bnColor = bn.chgPct >= 0 ? "#10b981" : "#ef4444";

    // Patch NIFTY prices (all known hardcoded patterns)
    patchValueByText("24,892.50", fmtNum(n.spot), nColor);
    patchValueByText("23,622.90", fmtNum(n.spot), nColor);
    // Patch BANKNIFTY
    patchValueByText("52,341.20", fmtNum(bn.spot), bnColor);
    patchValueByText("56,814.80", fmtNum(bn.spot), bnColor);
    patchValueByText("49,812.60", fmtNum(bn.spot), bnColor);
    // Patch FINNIFTY
    if (state.finnifty.spot > 0) {
      patchValueByText("21,450.00", fmtNum(state.finnifty.spot), state.finnifty.chgPct >= 0 ? "#10b981" : "#ef4444");
    }

    // PCR
    if (state.pcr > 0) {
      const pcrColor = state.pcr > 1.2 ? "#10b981" : state.pcr < 0.8 ? "#ef4444" : "#eab308";
      patchValueByText("1.34", state.pcr.toFixed(2), pcrColor);
      patchValueByText("1.38", state.pcr.toFixed(2), pcrColor);
    }

    // IV
    if (state.iv > 0) {
      patchValueByText("12.8%", state.iv.toFixed(1) + "%");
      patchValueByText("14.2%", state.iv.toFixed(1) + "%");
    }

    // Update badge
    const text = document.getElementById("sp-live-text");
    const time = document.getElementById("sp-live-time");
    if (text) {
      text.textContent = state.backendOk ? "● LIVE NSE" : "⚡ RECONNECTING";
      text.style.color = state.backendOk ? "#00ff80" : "#fac516";
    }
    if (time) time.textContent = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Option chain table
    patchOptionChain();
  }

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
          safeSet(cells[0], fmtOI(d.ce.oi), "#10b981");
          safeSet(cells[n - 1], fmtOI(d.pe.oi), "#ef4444");
          const strikeIdx = Math.floor(n / 2);
          safeSet(cells[strikeIdx], d.strike.toLocaleString("en-IN") + (isATM ? " ATM" : ""), isATM ? "#eab308" : "#1e293b");
        }
      });
    });
  }

  function safeSet(el, val, color) { if (!el) return; el.textContent = val; if (color) el.style.color = color; }

  function showLiveBanner() {
    if (document.getElementById("sp-live-badge")) return;
    const badge = document.createElement("div");
    badge.id = "sp-live-badge";
    badge.style.cssText = "position:fixed;bottom:20px;left:20px;z-index:9999;background:rgba(0,0,0,.85);border:1px solid rgba(0,255,128,.3);border-radius:8px;padding:7px 13px;font-size:11px;font-weight:600;color:#00ff80;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:6px;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.4);";
    badge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#00ff80;animation:livePulse 1.5s infinite;display:inline-block"></span><span id="sp-live-text">CONNECTING…</span><span id="sp-live-time" style="color:#8b949e;margin-left:4px">—</span>';
    const style = document.createElement("style");
    style.textContent = "@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.6)}}";
    document.head.appendChild(style);
    document.body.appendChild(badge);
  }

  async function run() {
    showLiveBanner();
    await fetchLiveData();
    setInterval(fetchLiveData, REFRESH_MS);
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", run); }
  else { run(); }
})();
