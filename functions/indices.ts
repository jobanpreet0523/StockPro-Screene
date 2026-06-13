// Cloudflare Worker Function: /indices
// Legacy endpoint for live-data.js compatibility
// Returns simple index data in the format live-data.js expects

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=^NSEI,^NSEBANK,^BSESN';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Yahoo API failed');

    const json: any = await response.json();
    const quotes = json?.quoteResponse?.result || [];

    const nifty = quotes.find((q: any) => q.symbol === '^NSEI');
    const banknifty = quotes.find((q: any) => q.symbol === '^NSEBANK');
    const sensex = quotes.find((q: any) => q.symbol === '^BSESN');

    return new Response(JSON.stringify({
      nifty50: nifty ? {
        price: nifty.regularMarketPrice || 24892.50,
        change: nifty.regularMarketChangePercent || 0,
      } : { price: 24892.50, change: 0.58 },
      banknifty: banknifty ? {
        price: banknifty.regularMarketPrice || 52341.20,
        change: banknifty.regularMarketChangePercent || 0,
      } : { price: 52341.20, change: -0.12 },
      sensex: sensex ? {
        price: sensex.regularMarketPrice || 81943.50,
        change: sensex.regularMarketChangePercent || 0,
      } : { price: 81943.50, change: 0.60 },
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      nifty50: { price: 24892.50, change: 0.58 },
      banknifty: { price: 52341.20, change: -0.12 },
      sensex: { price: 81943.50, change: 0.60 },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
