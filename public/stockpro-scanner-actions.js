(() => {
  const isScanner = location.pathname === '/scanner';
  if (!isScanner) return;

  const toast = (message) => {
    let box = document.getElementById('stockpro-scanner-action-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'stockpro-scanner-action-toast';
      box.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:99999;background:#020617;color:#6ee7b7;border:1px solid rgba(16,185,129,.35);padding:12px 16px;border-radius:16px;font:800 12px system-ui;box-shadow:0 22px 60px rgba(0,0,0,.3)';
      document.body.appendChild(box);
    }
    box.textContent = message;
    clearTimeout(box._t);
    box._t = setTimeout(() => box.remove(), 2400);
  };

  const getStockTable = () => {
    const area = document.getElementById('scanner_feature_parity_layer');
    if (!area) return null;
    const tables = Array.from(area.querySelectorAll('table'));
    return tables[tables.length - 1] || null;
  };

  const tableToRows = () => {
    const table = getStockTable();
    if (!table) return [];
    return Array.from(table.querySelectorAll('tr')).map((tr) =>
      Array.from(tr.querySelectorAll('th,td')).map((cell) => cell.textContent.trim())
    ).filter((row) => row.length);
  };

  const download = (filename, mime, content) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const rowsToCsv = (rows) => rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const openPanel = (title, body) => {
    let panel = document.getElementById('stockpro-scanner-side-panel');
    if (panel) panel.remove();
    panel = document.createElement('aside');
    panel.id = 'stockpro-scanner-side-panel';
    panel.style.cssText = 'position:fixed;top:90px;right:20px;z-index:99998;width:min(420px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow:auto;background:white;color:#0f172a;border:1px solid #e2e8f0;border-radius:24px;padding:18px;box-shadow:0 28px 90px rgba(15,23,42,.18);font-family:system-ui';
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px"><h3 style="font-size:18px;font-weight:950;margin:0">${title}</h3><button id="stockpro-close-side-panel" style="border:0;background:#f1f5f9;border-radius:10px;padding:8px 10px;font-weight:900;cursor:pointer">×</button></div><div style="font-size:13px;line-height:1.7;color:#475569;font-weight:650">${body}</div>`;
    document.body.appendChild(panel);
    panel.querySelector('#stockpro-close-side-panel')?.addEventListener('click', () => panel.remove());
  };

  const handleAction = async (label) => {
    const rows = tableToRows();
    if (/^copy$/i.test(label)) {
      await navigator.clipboard?.writeText(rows.map((row) => row.join('\t')).join('\n'));
      toast('Stock table copied');
      return true;
    }
    if (/^csv$/i.test(label)) {
      download('stockpro-scanner-results.csv', 'text/csv;charset=utf-8;', rowsToCsv(rows));
      toast('CSV downloaded');
      return true;
    }
    if (/^excel$/i.test(label)) {
      download('stockpro-scanner-results.xls', 'application/vnd.ms-excel', rowsToCsv(rows));
      toast('Excel file downloaded');
      return true;
    }
    if (/settings/i.test(label)) {
      openPanel('Scanner Settings', '<p><b>Visible controls:</b> table density, columns, result limit, saved layout, and scanner defaults.</p><p>This panel is local-first and can be connected to user preferences later.</p>');
      toast('Settings opened');
      return true;
    }
    if (/customize columns/i.test(label)) {
      openPanel('Customize Columns', '<p>Select columns to show in the stock result table:</p><ul><li>Stock Name</li><li>Symbol</li><li>Close</li><li>% Change</li><li>Volume</li><li>Pattern</li><li>Strength</li></ul>');
      toast('Column customizer opened');
      return true;
    }
    if (/more/i.test(label)) {
      openPanel('More Actions', '<ul><li>Compact view</li><li>Copy scanner link</li><li>Reset layout</li><li>Restore default columns</li><li>Export scan configuration</li></ul>');
      toast('More actions opened');
      return true;
    }
    if (/backtest/i.test(label)) {
      openPanel('Backtest Results', '<p><b>Preview mode:</b> Current scanner results are summarized locally. Full historical backtesting can be connected to candle-history APIs later.</p><p>Use this panel to show win rate, average move, max drawdown, and trade count.</p>');
      toast('Backtest preview opened');
      return true;
    }
    return false;
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const root = document.getElementById('scanner_feature_parity_layer');
    if (!root || !root.contains(button)) return;
    const label = button.textContent.trim();
    handleAction(label).then((handled) => {
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }, true);
})();
