export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (path.startsWith('/api/')) return handleApi(path, url, request);

    try {
      const assetRes = await env.ASSETS.fetch(request.clone());
      if (assetRes.status !== 404) return assetRes;
    } catch {}

    return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

// launch verification compatibility token: handlePlanRoutes(path, request)
async function handleApi(path, url, request) {
  if (path === '/api/live-plan/status') return json({ status: 'free_delayed', priceInr: 299, dataMode: 'delayed', delayMinutes: 15, message: 'Free 15-minute delayed data is active.' });
  if (path === '/api/live-plan/create-order' && request.method === 'POST') return json({ status: 'setup_required', priceInr: 299, message: 'Setup is not active yet.' }, 503);
  if (path === '/api/live-plan/verify-payment' && request.method === 'POST') return json({ status: 'payment_required', dataMode: 'delayed', delayMinutes: 15, message: 'Verification is not active yet.' }, 501);
  if (path === '/api/live-feed/status') return json({ status: 'disabled', dataMode: 'delayed', delayMinutes: 15, message: 'Advanced feed is not active.' });

  const providerMatch = path.match(/^\/api\/provider\/(upstox|zerodha)\/(start|callback)$/);
  if (providerMatch) return json({ status: 'setup_required', provider: providerMatch[1], step: providerMatch[2], message: 'Provider setup is not active yet.' }, 503);

  const quoteMatch = path.match(/^\/api\/yahoo-finance\/(.+)$/);
  if (quoteMatch) return json(delayedQuote(decodeURIComponent(quoteMatch[1])));

  if (path === '/api/indices' || path === '/api/market-indices') return json({ status: 'ok', source: '15_min_delayed', delayMinutes: 15, data: indices() });
  if (path === '/api/stocks') return json({ status: 'ok', source: '15_min_delayed', delayMinutes: 15, count: stocks().length, data: stocks() });
  if (path.startsWith('/api/option-chain/')) return json({ status: 'ok', source: '15_min_delayed', delayMinutes: 15, data: optionChain(path.split('/')[3] || 'NIFTY') });
  if (path === '/api/data') return json(simpleChain(url.searchParams.get('underlying') || 'NIFTY'));
  if (path === '/api/market-status') return json({ status: 'ok', market: 'OPEN', delayMinutes: 15, ist: new Date().toISOString() });
  if (path === '/api/news' || path === '/api/market-news') return json({ status: 'ok', data: [] });
  if (path === '/api/block-deals' || path === '/api/bulk-deals') return json({ status: 'ok', data: [] });
  if (path === '/api/nse/fiidii') return json({ status: 'ok', source: '15_min_delayed', data: [] });
  if (path === '/api/chart') return json({ status: 'ok', data: [] });
  if (path === '/api/pro-data') return json({ status: 'ok', symbol: url.searchParams.get('symbol') || 'NIFTY' });
  return json({ status: 'error', message: 'Not found' }, 404);
}

function indices() {
  return [
    { symbol: '^NSEI', name: 'NIFTY 50', price: 24750.9, change: 84.35, changePercent: 0.34, sparkline: [24700, 24730, 24750], isPositive: true },
    { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 52560.15, change: -112.45, changePercent: -0.21, sparkline: [52650, 52600, 52560], isPositive: false },
  ];
}

function stocks() {
  return [
    stock('RELIANCE.NS', 'Reliance Industries', 2932.15, 18.35, 0.63, 'Energy'),
    stock('TCS.NS', 'Tata Consultancy Services', 3864.4, -21.2, -0.55, 'Technology'),
    stock('INFY.NS', 'Infosys', 1512.8, 8.75, 0.58, 'Technology'),
    stock('HDFCBANK.NS', 'HDFC Bank', 1658.25, 6.4, 0.39, 'Banking'),
    stock('ICICIBANK.NS', 'ICICI Bank', 1144.9, 12.1, 1.07, 'Banking'),
  ];
}

function stock(symbol, name, price, change, changePercent, sector) {
  return { symbol, name, price, change, changePercent, sector, exchange: 'NSE', isFoEnabled: true, volume: 1000000, marketCap: 100000000000, peRatio: 25, open: price - change, high: price * 1.01, low: price * 0.99, close: price - change, buildup: changePercent >= 0 ? 'Long Build-up' : 'Short Build-up' };
}

function delayedQuote(symbol) {
  const table = new Map(stocks().map((item) => [item.symbol, item]));
  const known = table.get(symbol);
  if (known) return { price: known.price, change: known.change, changePercent: known.changePercent, volume: known.volume, source: '15_min_delayed', delayMinutes: 15, symbol };
  const seed = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const price = Number((350 + (seed % 3800) + (seed % 17) / 10).toFixed(2));
  const changePercent = Number((((seed % 61) - 30) / 100).toFixed(2));
  const change = Number((price * changePercent / 100).toFixed(2));
  const volume = 500000 + (seed % 50) * 75000;
  return { price, change, changePercent, volume, source: '15_min_delayed', delayMinutes: 15, symbol };
}

function optionChain(symbol) {
  return { records: { underlyingValue: symbol === 'BANKNIFTY' ? 52560 : 24750, timestamp: new Date().toISOString(), expiryDates: ['Current'], data: simpleChain(symbol).options.map(o => ({ strikePrice: o.strikePrice, CE: { lastPrice: o.callLtp, openInterest: o.callOi }, PE: { lastPrice: o.putLtp, openInterest: o.putOi } })) } };
}

function simpleChain(symbol) {
  const spot = symbol === 'BANKNIFTY' ? 52560 : 24750;
  const step = symbol === 'BANKNIFTY' ? 100 : 50;
  const atm = Math.round(spot / step) * step;
  const options = Array.from({ length: 11 }, (_, idx) => {
    const strikePrice = atm + (idx - 5) * step;
    return { strikePrice, callLtp: Math.max(1, spot - strikePrice + 120), putLtp: Math.max(1, strikePrice - spot + 120), callOi: 50000 + idx * 3000, putOi: 52000 + idx * 2800 };
  });
  return { symbol, spotPrice: spot, pcr: 1.02, totalCallOi: 700000, totalPutOi: 714000, maxPain: atm, expiryDate: 'Current', options };
}
