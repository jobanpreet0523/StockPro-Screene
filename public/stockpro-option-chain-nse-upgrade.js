(() => {
  if (location.pathname !== '/option-chain') return;

  const state = {
    streaming: localStorage.getItem('stockpro_oc_streaming') === 'on',
    fullView: false,
    range: localStorage.getItem('stockpro_oc_range') || 'ATM ± 5',
    expiry: localStorage.getItem('stockpro_oc_expiry') || 'Nearest Weekly',
    interval: null,
  };

  const toast = (message) => {
    let box = document.getElementById('stockpro-oc-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'stockpro-oc-toast';
      box.className = 'stockpro-oc-toast';
      document.body.appendChild(box);
    }
    box.textContent = message;
    clearTimeout(box._t);
    box._t = setTimeout(() => box.remove(), 2500);
  };

  const parseNumber = (txt) => {
    const raw = String(txt || '').replace(/[₹,%+\s]/g, '').replace(/,/g, '').toUpperCase();
    if (raw.endsWith('K')) return parseFloat(raw) * 1000;
    if (raw.endsWith('L')) return parseFloat(raw) * 100000;
    if (raw.endsWith('CR')) return parseFloat(raw) * 10000000;
    return Number(raw) || 0;
  };

  const findMatrix = () => document.getElementById('option-matrix');
  const findRows = () => Array.from(document.querySelectorAll('#option-matrix tbody tr')).filter((tr) => tr.querySelectorAll('td').length >= 13);
  const findDownload = () => document.getElementById('download-csv-btn');

  const getChainRows = () => findRows().map((tr) => {
    const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent.trim());
    return {
      tr,
      callOi: parseNumber(cells[0]),
      callChgOi: parseNumber(cells[1]),
      callVol: parseNumber(cells[2]),
      callIv: parseNumber(cells[3]),
      callLtp: parseNumber(cells[4]),
      callChange: parseNumber(cells[5]),
      strike: parseNumber(cells[6]),
      putChange: parseNumber(cells[7]),
      putLtp: parseNumber(cells[8]),
      putIv: parseNumber(cells[9]),
      putVol: parseNumber(cells[10]),
      putChgOi: parseNumber(cells[11]),
      putOi: parseNumber(cells[12]),
    };
  }).filter((r) => r.strike > 0);

  const formatVol = (v) => {
    if (v >= 10000000) return `${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return `${Math.round(v || 0)}`;
  };

  const calcStats = () => {
    const rows = getChainRows();
    if (!rows.length) return null;
    const totalCallOi = rows.reduce((s, r) => s + r.callOi, 0);
    const totalPutOi = rows.reduce((s, r) => s + r.putOi, 0);
    const pcr = totalCallOi ? totalPutOi / totalCallOi : 1;
    const maxCall = rows.reduce((a, b) => (b.callOi > a.callOi ? b : a), rows[0]);
    const maxPut = rows.reduce((a, b) => (b.putOi > a.putOi ? b : a), rows[0]);
    const maxChgCall = rows.reduce((a, b) => (Math.abs(b.callChgOi) > Math.abs(a.callChgOi) ? b : a), rows[0]);
    const maxChgPut = rows.reduce((a, b) => (Math.abs(b.putChgOi) > Math.abs(a.putChgOi) ? b : a), rows[0]);
    const center = rows[Math.floor(rows.length / 2)];
    const atm = rows.reduce((a, b) => Math.abs(b.callLtp - b.putLtp) < Math.abs(a.callLtp - a.putLtp) ? b : a, center);
    const ivAvg = rows.reduce((s, r) => s + (r.callIv + r.putIv) / 2, 0) / rows.length;
    return { rows, totalCallOi, totalPutOi, pcr, maxCall, maxPut, maxChgCall, maxChgPut, atm, ivAvg };
  };

  const makeCard = (label, value, note, tone = 'slate') => `
    <div class="oc-stat-card oc-${tone}">
      <div class="oc-stat-label">${label}</div>
      <div class="oc-stat-value">${value}</div>
      <div class="oc-stat-note">${note}</div>
    </div>`;

  const renderTopControls = () => {
    const workspace = document.getElementById('option_chain_workspace');
    if (!workspace || document.getElementById('stockpro-nse-oc-controls')) return;
    const panel = document.createElement('section');
    panel.id = 'stockpro-nse-oc-controls';
    panel.className = 'stockpro-nse-oc-panel';
    panel.innerHTML = `
      <div class="oc-panel-head">
        <div>
          <div class="oc-eyebrow">NSE-style option-chain controls</div>
          <h2>Options Chain Command Center</h2>
          <p>Index/symbol selection, expiry, strike filtering, streaming, full view, export, alerts, and analytics.</p>
        </div>
        <div class="oc-segment-tabs">
          <button data-oc-segment="equity" class="active">Equity Stock</button>
          <button data-oc-segment="currency">Currency</button>
          <button data-oc-segment="gsec">Interest Rates</button>
          <button data-oc-segment="commodity">Commodities</button>
        </div>
      </div>
      <div class="oc-controls-grid">
        <label>Index Contracts<select id="oc-index-select"><option value="^NSEI">NIFTY</option><option value="^NSEBANK">BANKNIFTY</option><option value="FINNIFTY">FINNIFTY</option><option value="MIDCPNIFTY">MIDCPNIFTY</option></select></label>
        <label>Expiry Date<select id="oc-expiry-select"><option>Nearest Weekly</option><option>Monthly Expiry</option><option>Next Weekly</option><option>Far Monthly</option></select></label>
        <label>Strike Range<select id="oc-range-select"><option>ATM ± 5</option><option>ATM ± 10</option><option>All Strikes</option><option>ITM Only</option><option>OTM Only</option></select></label>
        <label>Strike Price<input id="oc-strike-jump" placeholder="Jump to strike..." /></label>
        <button id="oc-refresh">↻ Refresh</button>
        <button id="oc-streaming">Streaming ${state.streaming ? 'On' : 'Off'}</button>
        <button id="oc-full-view">Best / Full View</button>
        <button id="oc-save-view">Save View</button>
        <button id="oc-create-alert">Create Alert</button>
        <button id="oc-export-csv">Download CSV</button>
      </div>
      <div class="oc-terms-row">Terms of Use · Data shown for education. Streaming mode refreshes the local StockPro view; live feed depends on available API response.</div>
    `;
    workspace.prepend(panel);

    panel.querySelector('#oc-index-select').addEventListener('change', (e) => {
      const value = e.target.value;
      const label = value === '^NSEI' ? 'NIFTY' : value === '^NSEBANK' ? 'BANKNIFTY' : value;
      location.href = `/option-chain?symbol=${encodeURIComponent(label)}`;
    });
    panel.querySelector('#oc-expiry-select').value = state.expiry;
    panel.querySelector('#oc-expiry-select').addEventListener('change', (e) => {
      state.expiry = e.target.value;
      localStorage.setItem('stockpro_oc_expiry', state.expiry);
      toast(`Expiry mode set to ${state.expiry}`);
    });
    panel.querySelector('#oc-range-select').value = state.range;
    panel.querySelector('#oc-range-select').addEventListener('change', (e) => {
      state.range = e.target.value;
      localStorage.setItem('stockpro_oc_range', state.range);
      applyRangeFilter();
      toast(`Strike range: ${state.range}`);
    });
    panel.querySelector('#oc-strike-jump').addEventListener('input', (e) => jumpStrike(e.target.value));
    panel.querySelector('#oc-refresh').addEventListener('click', () => { toast('Refreshing option-chain matrix'); location.reload(); });
    panel.querySelector('#oc-streaming').addEventListener('click', toggleStreaming);
    panel.querySelector('#oc-full-view').addEventListener('click', toggleFullView);
    panel.querySelector('#oc-save-view').addEventListener('click', saveView);
    panel.querySelector('#oc-create-alert').addEventListener('click', createAlert);
    panel.querySelector('#oc-export-csv').addEventListener('click', () => findDownload()?.click());
    panel.querySelectorAll('[data-oc-segment]').forEach((btn) => btn.addEventListener('click', () => {
      panel.querySelectorAll('[data-oc-segment]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      toast(`${btn.textContent.trim()} option-chain mode selected`);
    }));
  };

  const renderAnalytics = () => {
    const matrix = findMatrix();
    if (!matrix) return;
    const stats = calcStats();
    if (!stats) return;

    let analytics = document.getElementById('stockpro-oc-analytics');
    if (!analytics) {
      analytics = document.createElement('section');
      analytics.id = 'stockpro-oc-analytics';
      analytics.className = 'stockpro-oc-analytics';
      matrix.parentNode.insertBefore(analytics, matrix);
    }

    const pcrTone = stats.pcr > 1.2 ? 'green' : stats.pcr < 0.8 ? 'red' : 'amber';
    analytics.innerHTML = `
      <div class="oc-stat-grid">
        ${makeCard('ATM Strike', stats.atm.strike.toLocaleString('en-IN'), 'Auto detected from call/put premium balance', 'blue')}
        ${makeCard('PCR', stats.pcr.toFixed(2), stats.pcr > 1.2 ? 'Put OI dominance' : stats.pcr < 0.8 ? 'Call OI dominance' : 'Neutral positioning', pcrTone)}
        ${makeCard('Total Call OI', formatVol(stats.totalCallOi), `Highest Call OI: ${stats.maxCall.strike}`, 'red')}
        ${makeCard('Total Put OI', formatVol(stats.totalPutOi), `Highest Put OI: ${stats.maxPut.strike}`, 'green')}
        ${makeCard('Resistance Zone', stats.maxCall.strike.toLocaleString('en-IN'), 'Highest call open interest', 'red')}
        ${makeCard('Support Zone', stats.maxPut.strike.toLocaleString('en-IN'), 'Highest put open interest', 'green')}
        ${makeCard('Call OI Change', `${stats.maxChgCall.strike}`, `${stats.maxChgCall.callChgOi >= 0 ? '+' : ''}${formatVol(stats.maxChgCall.callChgOi)}`, 'purple')}
        ${makeCard('Avg IV', `${stats.ivAvg.toFixed(2)}%`, 'Average call/put implied volatility', 'blue')}
      </div>
      <div class="oc-chart-grid">
        <div class="oc-chart-card"><div class="oc-chart-head">Open Interest Distribution</div><div class="oc-bars" id="oc-oi-bars"></div></div>
        <div class="oc-chart-card"><div class="oc-chart-head">Change in OI</div><div class="oc-bars" id="oc-chgoi-bars"></div></div>
        <div class="oc-chart-card"><div class="oc-chart-head">IV Smile</div><div class="oc-iv-smile" id="oc-iv-smile"></div></div>
        <div class="oc-chart-card"><div class="oc-chart-head">PCR Meter</div><div class="oc-pcr-meter"><span style="width:${Math.min(100, Math.max(5, stats.pcr * 50))}%"></span></div><p>${stats.pcr.toFixed(2)} PCR · ${stats.rows.length} strikes</p></div>
      </div>
    `;
    drawBars(stats);
    highlightRows(stats);
  };

  const drawBars = (stats) => {
    const maxOi = Math.max(...stats.rows.map((r) => Math.max(r.callOi, r.putOi)), 1);
    const maxChg = Math.max(...stats.rows.map((r) => Math.max(Math.abs(r.callChgOi), Math.abs(r.putChgOi))), 1);
    const slice = stats.rows.slice(0, 12);
    const oiBars = document.getElementById('oc-oi-bars');
    const chgBars = document.getElementById('oc-chgoi-bars');
    const ivSmile = document.getElementById('oc-iv-smile');
    if (oiBars) oiBars.innerHTML = slice.map((r) => `<div class="oc-bar-row"><b>${r.strike}</b><span class="call" style="width:${(r.callOi / maxOi) * 100}%"></span><span class="put" style="width:${(r.putOi / maxOi) * 100}%"></span></div>`).join('');
    if (chgBars) chgBars.innerHTML = slice.map((r) => `<div class="oc-bar-row"><b>${r.strike}</b><span class="call" style="width:${(Math.abs(r.callChgOi) / maxChg) * 100}%"></span><span class="put" style="width:${(Math.abs(r.putChgOi) / maxChg) * 100}%"></span></div>`).join('');
    if (ivSmile) ivSmile.innerHTML = slice.map((r) => `<i title="${r.strike} IV ${((r.callIv + r.putIv)/2).toFixed(2)}%" style="height:${Math.max(8, Math.min(95, (r.callIv + r.putIv) * 2))}%"></i>`).join('');
  };

  const highlightRows = (stats) => {
    getChainRows().forEach((r) => {
      r.tr.classList.toggle('oc-atm-row', r.strike === stats.atm.strike);
      r.tr.classList.toggle('oc-support-row', r.strike === stats.maxPut.strike);
      r.tr.classList.toggle('oc-resistance-row', r.strike === stats.maxCall.strike);
      r.tr.querySelectorAll('td').forEach((td) => td.classList.remove('oc-clickable-premium'));
      const cells = r.tr.querySelectorAll('td');
      [4, 8].forEach((idx) => {
        if (cells[idx]) {
          cells[idx].classList.add('oc-clickable-premium');
          cells[idx].onclick = () => {
            cells[idx].dispatchEvent(new Event('click', { bubbles: true }));
            toast(`Selected ${idx === 4 ? 'CALL' : 'PUT'} ${r.strike} premium for strategy simulator`);
          };
        }
      });
    });
  };

  const applyRangeFilter = () => {
    const stats = calcStats();
    if (!stats) return;
    const atm = stats.atm.strike;
    const strikes = stats.rows.map((r) => r.strike).sort((a, b) => a - b);
    const idx = strikes.indexOf(atm);
    const allow = new Set();
    if (state.range === 'All Strikes') stats.rows.forEach((r) => allow.add(r.strike));
    else if (state.range === 'ITM Only') stats.rows.forEach((r) => { if (r.strike <= atm) allow.add(r.strike); });
    else if (state.range === 'OTM Only') stats.rows.forEach((r) => { if (r.strike >= atm) allow.add(r.strike); });
    else {
      const count = state.range.includes('10') ? 10 : 5;
      strikes.slice(Math.max(0, idx - count), idx + count + 1).forEach((s) => allow.add(s));
    }
    stats.rows.forEach((r) => { r.tr.style.display = allow.has(r.strike) ? '' : 'none'; });
  };

  const jumpStrike = (value) => {
    const q = String(value || '').trim();
    getChainRows().forEach((r) => {
      const hit = !q || String(r.strike).includes(q);
      r.tr.classList.toggle('oc-jump-hit', !!q && hit);
      if (q && hit) r.tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const toggleStreaming = () => {
    state.streaming = !state.streaming;
    localStorage.setItem('stockpro_oc_streaming', state.streaming ? 'on' : 'off');
    const btn = document.getElementById('oc-streaming');
    if (btn) btn.textContent = `Streaming ${state.streaming ? 'On' : 'Off'}`;
    if (state.interval) clearInterval(state.interval);
    if (state.streaming) {
      state.interval = setInterval(() => { renderAnalytics(); toast('Streaming refresh synced'); }, 30000);
    }
    toast(`Streaming ${state.streaming ? 'enabled' : 'disabled'}`);
  };

  const toggleFullView = () => {
    state.fullView = !state.fullView;
    document.body.classList.toggle('stockpro-oc-full-view', state.fullView);
    toast(state.fullView ? 'Full view enabled' : 'Best view restored');
  };

  const saveView = () => {
    localStorage.setItem('stockpro_oc_saved_view', JSON.stringify({ range: state.range, expiry: state.expiry, streaming: state.streaming, savedAt: new Date().toISOString() }));
    toast('Option-chain view saved locally');
  };

  const createAlert = () => {
    const stats = calcStats();
    const alerts = JSON.parse(localStorage.getItem('stockpro_oc_alerts') || '[]');
    alerts.unshift({ pcr: stats?.pcr, support: stats?.maxPut?.strike, resistance: stats?.maxCall?.strike, createdAt: new Date().toISOString() });
    localStorage.setItem('stockpro_oc_alerts', JSON.stringify(alerts.slice(0, 25)));
    toast('PCR / OI alert created locally');
  };

  const init = () => {
    if (!document.getElementById('option_chain_workspace')) return;
    renderTopControls();
    renderAnalytics();
    applyRangeFilter();
    if (state.streaming && !state.interval) toggleStreaming();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else setTimeout(init, 300);
  const observer = new MutationObserver(() => {
    if (document.getElementById('option-matrix')) setTimeout(init, 120);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
