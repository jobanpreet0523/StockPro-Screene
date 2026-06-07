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

// API: Option Chain Information
app.get('/api/option-chain/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  
  // Get active spot price
  let spotPrice = 1000;
  let matches = false;

  const foundStock = liveStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (foundStock) {
    spotPrice = foundStock.price;
    matches = true;
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
      matches = true;
    }
  }

  const chain = generateOptionChain(symbol.toUpperCase(), spotPrice);
  res.json({
    status: 'ok',
    symbol,
    data: chain
  });
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
