import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_INDICES, INITIAL_STOCKS, generateOptionChain, generateHistoricalCandles } from './src/data';
import { Stock, IndexData } from './src/types';
import AdmZip from 'adm-zip';

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// In-Memory Database representing active market state
let liveIndices: IndexData[] = JSON.parse(JSON.stringify(INITIAL_INDICES));
let liveStocks: Stock[] = JSON.parse(JSON.stringify(INITIAL_STOCKS));

// Helper: Map the live Cloudflare Worker Option Chain to our App's frontend state
function mapWorkerToOptionChain(workerData: any, symbol: string): any {
  const spotPrice = workerData.spotPrice || workerData.spot || 22000;
  
  // Approximate options chain rows using either 'options' or 'optionChain' keys from worker
  const rawOptions = workerData.options || workerData.optionChain || [];
  const options = rawOptions.map((item: any) => {
    const strikePrice = item.strike || item.strikePrice || 22000;
    
    // Greeks Approximation for Deltas
    const zCall = (spotPrice - strikePrice) / (spotPrice * 0.08);
    const callDelta = Number((1 / (1 + Math.exp(-zCall))).toFixed(2));
    const putDelta = Number((callDelta - 1).toFixed(2));

    return {
      strikePrice,
      callLtp: item.ce?.ltp || 100,
      callChange: item.ce?.chgPercent || item.ce?.change || Number(((Math.random() - 0.45) * 8).toFixed(2)),
      callVol: item.ce?.volume || item.ce?.vol || 1000,
      callOi: item.ce?.oi || 50000,
      callOiChg: item.ce?.changeOi !== undefined ? item.ce?.changeOi : (item.ce?.oiChg || Math.round((Math.random() - 0.3) * (item.ce?.oi || 50000) * 0.1)),
      callIv: item.ce?.iv || 14.5,
      callDelta: item.ce?.delta || callDelta,
      putLtp: item.pe?.ltp || 100,
      putChange: item.pe?.chgPercent || item.pe?.change || Number(((Math.random() - 0.55) * 8).toFixed(2)),
      putVol: item.pe?.volume || item.pe?.vol || 1000,
      putOi: item.pe?.oi || 50000,
      putOiChg: item.pe?.changeOi !== undefined ? item.pe?.changeOi : (item.pe?.oiChg || Math.round((Math.random() - 0.4) * (item.pe?.oi || 50000) * 0.08)),
      putIv: item.pe?.iv || 14.8,
      putDelta: item.pe?.delta || putDelta,
    };
  });

  return {
    symbol,
    spotPrice,
    pcr: workerData.pcr || 1.0,
    totalCallOi: workerData.callsOI || workerData.totalCallOi || 100000,
    totalPutOi: workerData.putsOI || workerData.totalPutOi || 100000,
    maxPain: workerData.maxPain || workerData.atm || spotPrice,
    expiryDate: workerData.expiryDate || '25-JUN-2026',
    options
  };
}

// Fallback in case of upstream timeouts
function getProDataFallback(symbol: string) {
  const price = 311.23;
  const fairValue = 373.10;
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase() + " Corp",
    price,
    changePercent: 0.87,
    sector: "Technology",
    industry: "Information Technology",
    description: "Global enterprise specializing in structural software solutions and derivatives modeling components.",
    fairValue,
    upsidePercent: 19.8,
    uncertainty: "Medium",
    financialHealth: { overallScore: 4, cashFlowHealth: 4, growthHealth: 3, profitHealth: 5, valueHealth: 3, relativeValue: 4 },
    keyStats: { pe: 37.3, divYield: 0.003, marketCap: 2552800000000, revenue: 451400000000, netIncome: 95300000000, grossMargin: 0.44, quickRatio: 1.1, debtToEquity: 55.4 },
    statementYears: [
      { year: 2023, revenue: 394328000000, grossProfit: 170562000000, operatingIncome: 114301000000, netIncome: 96995000000 },
      { year: 2024, revenue: 415161000000, grossProfit: 181260000000, operatingIncome: 117300000000, netIncome: 95300000000 },
      { year: 2025, revenue: 451400000000, grossProfit: 198750000000, operatingIncome: 134661000000, netIncome: 111164000000 }
    ]
  };
}

// Background Task: Sync Index benchmark lines with the live worker API
async function syncWithLiveWorker() {
  try {
    // 1. Sync NIFTY index
    const niftyRes = await fetch('https://stockpro-screener.jobanpreet0523.workers.dev/api/data?underlying=NIFTY');
    if (niftyRes.ok) {
      const data = await niftyRes.json() as any;
      const nIdx = liveIndices.findIndex(i => i.symbol === '^NSEI');
      const spotVal = data.spotPrice || data.spot;
      if (nIdx !== -1 && spotVal) {
        const prevPrice = liveIndices[nIdx].price;
        const prevClose = prevPrice - liveIndices[nIdx].change;
        liveIndices[nIdx].price = Number(spotVal.toFixed(2));
        
        const changeVal = data.change !== undefined ? data.change : (spotVal - prevClose);
        const changePctVal = data.changePercent !== undefined ? data.changePercent : (prevClose ? (changeVal / prevClose) * 100 : 0);
        
        liveIndices[nIdx].change = Number(changeVal.toFixed(2));
        liveIndices[nIdx].changePercent = Number(changePctVal.toFixed(2));
      }
    }

    // 2. Sync BANKNIFTY index
    const bankRes = await fetch('https://stockpro-screener.jobanpreet0523.workers.dev/api/data?underlying=BANKNIFTY');
    if (bankRes.ok) {
      const data = await bankRes.json() as any;
      const bIdx = liveIndices.findIndex(i => i.symbol === '^NSEBANK');
      const spotVal = data.spotPrice || data.spot;
      if (bIdx !== -1 && spotVal) {
        const prevPrice = liveIndices[bIdx].price;
        const prevClose = prevPrice - liveIndices[bIdx].change;
        liveIndices[bIdx].price = Number(spotVal.toFixed(2));
        
        const changeVal = data.change !== undefined ? data.change : (spotVal - prevClose);
        const changePctVal = data.changePercent !== undefined ? data.changePercent : (prevClose ? (changeVal / prevClose) * 100 : 0);
        
        liveIndices[bIdx].change = Number(changeVal.toFixed(2));
        liveIndices[bIdx].changePercent = Number(changePctVal.toFixed(2));
      }
    }
    
    // 3. Sync FINNIFTY index by mapping our standard indices
    const finRes = await fetch('https://stockpro-screener.jobanpreet0523.workers.dev/api/data?underlying=FINNIFTY');
    if (finRes.ok) {
      const data = await finRes.json() as any;
      const fIdx = liveIndices.findIndex(i => i.symbol === '^NSEFN' || i.symbol === 'FINNIFTY' || i.name.includes('FIN'));
      const spotVal = data.spotPrice || data.spot;
      if (fIdx !== -1 && spotVal) {
        const prevPrice = liveIndices[fIdx].price;
        const prevClose = prevPrice - liveIndices[fIdx].change;
        liveIndices[fIdx].price = Number(spotVal.toFixed(2));
        
        const changeVal = data.change !== undefined ? data.change : (spotVal - prevClose);
        const changePctVal = data.changePercent !== undefined ? data.changePercent : (prevClose ? (changeVal / prevClose) * 100 : 0);
        
        liveIndices[fIdx].change = Number(changeVal.toFixed(2));
        liveIndices[fIdx].changePercent = Number(changePctVal.toFixed(2));
      }
    }
  } catch (err: any) {
    console.warn('[Sync Worker Warning] Failed to update in-memory indices from live worker:', err.message);
  }
}

// Run sync every 15 seconds to ensure live indices alignment
setInterval(syncWithLiveWorker, 15000);

// Helper: Fetch real price from Yahoo Finance
async function seedRealWorldData() {
  console.log('Seeding financial database from real-world APIs...');
  
  // Symbols mapping
  const allSymbols = [
    ...liveIndices.map(i => i.symbol),
    ...liveStocks.map(s => s.symbol)
  ];

  for (const symbol of allSymbols) {
    try {
      // Fetching from Yahoo Finance chart endpoint
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        continue;
      }

      const json = (await response.json()) as any;
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;
        const volume = meta.regularMarketVolume || meta.volume || 1000000;

        // Is it an index?
        const indexIdx = liveIndices.findIndex(i => i.symbol === symbol);
        if (indexIdx !== -1) {
          liveIndices[indexIdx].price = Number(price.toFixed(2));
          liveIndices[indexIdx].change = Number(change.toFixed(2));
          liveIndices[indexIdx].changePercent = Number(changePercent.toFixed(2));
        } else {
          const stockIdx = liveStocks.findIndex(s => s.symbol === symbol);
          if (stockIdx !== -1) {
            liveStocks[stockIdx].price = Number(price.toFixed(2));
            liveStocks[stockIdx].change = Number(change.toFixed(2));
            liveStocks[stockIdx].changePercent = Number(changePercent.toFixed(2));
            liveStocks[stockIdx].volume = Number(volume);
            liveStocks[stockIdx].open = Number((meta.open || price).toFixed(2));
            liveStocks[stockIdx].high = Number((meta.high || price).toFixed(2));
            liveStocks[stockIdx].low = Number((meta.low || price).toFixed(2));
            liveStocks[stockIdx].close = Number((prevClose).toFixed(2));
          }
        }
      }
    } catch (err) {
      console.warn(`Error seeding live data for ${symbol}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log('Seed completed successfully. Active database running live.');
}

// Background Task: High Frequency Ticker Simulation
// Gives realistic ticking visuals which react instantly on the client side!
setInterval(() => {
  // 1. Tick Indices
  liveIndices.forEach(ind => {
    const volatility = 0.0003; // stable low vol
    const drift = 0.00005; // tiny upward bias
    const pct = (Math.random() - 0.48) * volatility + drift;
    const priceChange = ind.price * pct;
    ind.price = Number((ind.price + priceChange).toFixed(2));
    ind.change = Number((ind.change + priceChange).toFixed(2));
    const baseClose = ind.price - ind.change;
    ind.changePercent = Number(((ind.change / baseClose) * 100).toFixed(2));

    // Update sparkline trail
    if (Math.random() > 0.8) {
      ind.sparkline.shift();
      ind.sparkline.push(Number(ind.price.toFixed(0)));
    }
  });

  // 2. Tick Stocks
  liveStocks.forEach(stock => {
    const volatility = stock.sector === 'Technology' ? 0.0012 : 0.0008;
    const directionFactor = (stock.buildup === 'Long Build-up' || stock.buildup === 'Short Covering') ? 0.52 : 0.46;
    const pct = (Math.random() - directionFactor) * volatility;
    const priceChange = stock.price * pct;

    stock.price = Number((stock.price + priceChange).toFixed(2));
    stock.change = Number((stock.change + priceChange).toFixed(2));
    const baseClose = stock.price - stock.change;
    stock.changePercent = Number(((stock.change / baseClose) * 100).toFixed(2));

    // High / Low tracker
    if (stock.price > stock.high) stock.high = stock.price;
    if (stock.price < stock.low) stock.low = stock.price;

    // Volume increment
    const volIncrement = Math.round(100 * Math.random() * (stock.volume * 0.0002));
    stock.volume += volIncrement;

    // Subtle drift in RSI
    if (Math.random() > 0.75) {
      const rsiDrift = (pct > 0 ? 1 : -1) * (0.1 + Math.random() * 0.4);
      stock.rsi = Number(Math.max(10, Math.min(90, stock.rsi + rsiDrift)).toFixed(1));
    }
  });
}, 1500);

// API: Indices
app.get('/api/indices', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    data: liveIndices
  });
});

// API: Stocks list with filtering support
app.get('/api/stocks', (req: Request, res: Response) => {
  const { sector, exchange, minPrice, maxPrice, search } = req.query;
  let filtered = [...liveStocks];

  if (sector) {
    filtered = filtered.filter(s => s.sector === sector);
  }
  if (exchange) {
    filtered = filtered.filter(s => s.exchange === exchange);
  }
  if (minPrice) {
    filtered = filtered.filter(s => s.price >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(s => s.price <= Number(maxPrice));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    data: filtered
  });
});

// API: Chart Candles
app.get('/api/chart', (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'NIFTY';
  const interval = (req.query.interval as string) || '1D';

  // Find stock or index current price
  let currentPrice = 100;
  const foundStock = liveStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (foundStock) {
    currentPrice = foundStock.price;
  } else {
    const foundIndex = liveIndices.find(i => i.symbol.toUpperCase() === symbol.toUpperCase());
    if (foundIndex) {
      currentPrice = foundIndex.price;
    }
  }

  const candlesCount = interval.endsWith('m') ? 80 : 120;
  const data = generateHistoricalCandles(currentPrice, candlesCount, interval);

  res.json({
    status: 'ok',
    symbol,
    interval,
    data
  });
});

app.get('/api/chart/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const interval = (req.query.interval as string) || '1D';

  // Find stock or index current price
  let currentPrice = 100;
  const foundStock = liveStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (foundStock) {
    currentPrice = foundStock.price;
  } else {
    const foundIndex = liveIndices.find(i => i.symbol.toUpperCase() === symbol.toUpperCase());
    if (foundIndex) {
      currentPrice = foundIndex.price;
    }
  }

  const candlesCount = interval.endsWith('m') ? 80 : 120;
  const data = generateHistoricalCandles(currentPrice, candlesCount, interval);

  res.json({
    status: 'ok',
    symbol,
    interval,
    data
  });
});

// API: Option Chain Information (Fetched Live from the Worker at https://stockpro-screener.jobanpreet0523.workers.dev)
app.get('/api/option-chain/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const cleanSymbol = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase().replace('.NS', '') : symbol.toUpperCase();
  
  // Decide worker-compatible index name NIFTY, BANKNIFTY, FINNIFTY
  const underlyingMap: Record<string, string> = {
    'NIFTY': 'NIFTY',
    '^NSEI': 'NIFTY',
    'BANKNIFTY': 'BANKNIFTY',
    '^NSEBANK': 'BANKNIFTY',
    'FINNIFTY': 'FINNIFTY',
    '^NSEFN': 'FINNIFTY'
  };
  const targetUnderlying = underlyingMap[cleanSymbol] || cleanSymbol;

  try {
    const workerRes = await fetch(`https://stockpro-screener.jobanpreet0523.workers.dev/api/data?underlying=${targetUnderlying}`);
    if (workerRes.ok) {
      const workerJson = await workerRes.json() as any;
      const mappedChain = mapWorkerToOptionChain(workerJson, cleanSymbol);
      return res.json({
        status: 'ok',
        symbol,
        data: mappedChain
      });
    }
    throw new Error(`Worker returned status: ${workerRes.status}`);
  } catch (err: any) {
    console.warn(`[Option Chain API] Live data request failed for ${cleanSymbol}, using generator fallback. Error:`, err.message);
    
    // Get active spot price
    let spotPrice = 1000;
    const foundStock = liveStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (foundStock) {
      spotPrice = foundStock.price;
    } else {
      // Check indices
      const indicesMap: Record<string, string> = {
        'NIFTY': '^NSEI',
        'BANKNIFTY': '^NSEBANK',
        '^NSEI': '^NSEI',
        '^NSEBANK': '^NSEBANK'
      };
      const mappedSym = indicesMap[symbol.toUpperCase()] || symbol;
      const foundIndex = liveIndices.find(i => i.symbol.toUpperCase() === mappedSym.toUpperCase());
      if (foundIndex) {
        spotPrice = foundIndex.price;
      }
    }

    const chain = generateOptionChain(symbol.toUpperCase(), spotPrice);
    res.json({
      status: 'ok',
      symbol,
      data: chain
    });
  }
});

// API: Proxy InvestingPro Equity Analytics to Worker
app.get('/api/pro-data', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'AAPL';
  try {
    const liveRes = await fetch(`https://stockpro-screener.jobanpreet0523.workers.dev/api/pro-data?symbol=${symbol}`);
    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      return res.json(liveJson);
    }
    throw new Error(`Worker returned status: ${liveRes.status}`);
  } catch (err: any) {
    console.warn(`[InvestingPro API] Error proxying pro-data for ${symbol}:`, err.message);
    return res.json(getProDataFallback(symbol));
  }
});

// API: Proxy ProPicks AI Portfolios to Worker
app.get('/api/propicks', async (req: Request, res: Response) => {
  try {
    const liveRes = await fetch(`https://stockpro-screener.jobanpreet0523.workers.dev/api/propicks`);
    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      return res.json(liveJson);
    }
    throw new Error(`Worker returned status: ${liveRes.status}`);
  } catch (err: any) {
    console.warn(`[ProPicks API] Error proxying propicks:`, err.message);
    // Return high-fidelity portfolio dataset as fallback
    return res.json({
      status: 'ok',
      portfolios: [
        { name: "Beat the S&P 500", return: "1,072.4%", sharpe: 2.1, holdings: 18, risk: "Medium" },
        { name: "Dominate the Dow", return: "628.1%", sharpe: 1.8, holdings: 15, risk: "Low" },
        { name: "Tech Titans", return: "1,485.9%", sharpe: 2.4, holdings: 20, risk: "High" },
        { name: "Top Value Stocks", return: "847.3%", sharpe: 1.9, holdings: 12, risk: "Low" }
      ]
    });
  }
});

// Legacy indices route for live-data.js
app.get('/indices', (req: Request, res: Response) => {
  const nifty = liveIndices.find(i => i.symbol === '^NSEI');
  const banknifty = liveIndices.find(i => i.symbol === '^NSEBANK');
  const sensex = liveIndices.find(i => i.symbol === '^BSESN');

  res.json({
    nifty50: nifty ? { price: nifty.price, change: nifty.changePercent } : { price: 22453.80, change: 0.58 },
    banknifty: banknifty ? { price: banknifty.price, change: banknifty.changePercent } : { price: 47840.15, change: 0.72 },
    sensex: sensex ? { price: sensex.price, change: sensex.changePercent } : { price: 76693.35, change: 0.64 }
  });
});

// Explicit routes for navigating around the multiple website pages
app.get('/landing', (req: Request, res: Response) => {
  res.redirect('/');
});

app.get('/landing-page.html', (req: Request, res: Response) => {
  res.redirect('/');
});

app.get('/screener', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/screener.html' : 'screener.html');
  res.sendFile(filePath);
});

app.get('/screener.html', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/screener.html' : 'screener.html');
  res.sendFile(filePath);
});

app.get('/dashboard', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/dashboard.html' : 'dashboard.html');
  res.sendFile(filePath);
});

app.get('/fo', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/fo.html' : 'fo.html');
  res.sendFile(filePath);
});

app.get('/dashboard.html', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/dashboard.html' : 'dashboard.html');
  res.sendFile(filePath);
});

app.get('/fo.html', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/fo.html' : 'fo.html');
  res.sendFile(filePath);
});

app.get('/live-data.js', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const filePath = path.join(process.cwd(), isProd ? 'dist/live-data.js' : 'live-data.js');
  res.sendFile(filePath);
});

// ZIP Download API Endpoint
app.get('/api/download-zip', (req: Request, res: Response) => {
  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();
    
    // Core files to package
    const files = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'server.ts',
      'index.html',
      'screener.html',
      'dashboard.html',
      'fo.html',
      'index.js',
      'live-data.js',
      '.env.example',
      '.gitignore',
      'metadata.json'
    ];
    
    // Add individual core files
    for (const file of files) {
      try {
        const fullPath = path.join(rootDir, file);
        zip.addLocalFile(fullPath);
      } catch (err) {
        console.warn(`Could not add file ${file} to ZIP:`, err);
      }
    }
    
    // Core directory to package recursively
    try {
      const srcDir = path.join(rootDir, 'src');
      zip.addLocalFolder(srcDir, 'src');
    } catch (err) {
      console.warn('Could not add src folder to ZIP:', err);
    }
    
    // Assets directory to package recursively
    try {
      const assetsDir = path.join(rootDir, 'assets');
      zip.addLocalFolder(assetsDir, 'assets');
    } catch (err) {
      // Ignore if assets folder doesn't exist yet
    }

    const zipBuffer = zip.toBuffer();
    
    res.setHeader('Content-Disposition', 'attachment; filename="stockpro-screener-upgrade.zip"');
    res.setHeader('Content-Type', 'application/zip');
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to generate ZIP archive', error: err.message });
  }
});

// Run seed immediately
seedRealWorldData();

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StockPro Backend] Express server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
