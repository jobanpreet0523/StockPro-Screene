import { Stock, IndexData, OptionData, OptionChain, ChartDataPoint } from './types';

export const INITIAL_INDICES: IndexData[] = [
  { symbol: '^NSEI', name: 'NIFTY 50', price: 0, change: 0, changePercent: 0, sparkline: [] },
  { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 0, change: 0, changePercent: 0, sparkline: [] },
  { symbol: '^BSESN', name: 'SENSEX', price: 0, change: 0, changePercent: 0, sparkline: [] },
  { symbol: '^CNXIT', name: 'NIFTY IT', price: 0, change: 0, changePercent: 0, sparkline: [] },
];

export const INITIAL_STOCKS: Stock[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    price: 2942.50,
    change: 32.40,
    changePercent: 1.11,
    volume: 6850000,
    marketCap: 1985000, // INR Crores
    peRatio: 26.4,
    rsi: 58.2,
    dividendYield: 0.34,
    sector: 'Energy',
    open: 2915.00,
    high: 2954.80,
    low: 2910.10,
    close: 2910.10,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 32450000,
    futuresOiChange: 4.8,
    buildup: 'Long Build-up'
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    price: 3825.10,
    change: 54.20,
    changePercent: 1.44,
    volume: 1850000,
    marketCap: 1384000,
    peRatio: 30.1,
    rsi: 61.5,
    dividendYield: 1.25,
    sector: 'Technology',
    open: 3780.00,
    high: 3840.00,
    low: 3775.00,
    close: 3770.90,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 14500000,
    futuresOiChange: -1.2,
    buildup: 'Long Unwinding'
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd.',
    price: 1572.80,
    change: -18.40,
    changePercent: -1.16,
    volume: 14500000,
    marketCap: 1195000,
    peRatio: 18.2,
    rsi: 41.8,
    dividendYield: 1.21,
    sector: 'Banking',
    open: 1592.00,
    high: 1595.00,
    low: 1568.00,
    close: 1591.20,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 54800000,
    futuresOiChange: 8.5,
    buildup: 'Short Build-up'
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd.',
    price: 1485.40,
    change: 22.15,
    changePercent: 1.51,
    volume: 5200000,
    marketCap: 616000,
    peRatio: 24.5,
    rsi: 54.3,
    dividendYield: 2.35,
    sector: 'Technology',
    open: 1466.00,
    high: 1492.00,
    low: 1464.00,
    close: 1463.25,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 28400000,
    futuresOiChange: 2.3,
    buildup: 'Long Build-up'
  },
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Ltd.',
    price: 1122.90,
    change: -4.30,
    changePercent: -0.38,
    volume: 8100000,
    marketCap: 789000,
    peRatio: 17.8,
    rsi: 48.9,
    dividendYield: 0.89,
    sector: 'Banking',
    open: 1130.00,
    high: 1135.00,
    low: 1118.00,
    close: 1127.20,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 31200000,
    futuresOiChange: -3.4,
    buildup: 'Short Covering'
  },
  {
    symbol: 'LT.NS',
    name: 'Larsen & Toubro Ltd.',
    price: 3645.00,
    change: 82.15,
    changePercent: 2.31,
    volume: 2100000,
    marketCap: 508000,
    peRatio: 38.2,
    rsi: 62.4,
    dividendYield: 0.77,
    sector: 'Capital Goods',
    open: 3570.00,
    high: 3660.00,
    low: 3562.00,
    close: 3562.85,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 6150000,
    futuresOiChange: 6.2,
    buildup: 'Long Build-up'
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Ltd.',
    price: 428.15,
    change: -2.35,
    changePercent: -0.55,
    volume: 9800000,
    marketCap: 534000,
    peRatio: 26.1,
    rsi: 45.4,
    dividendYield: 3.21,
    sector: 'Consumer Goods',
    open: 430.50,
    high: 432.10,
    low: 426.50,
    close: 430.50,
    exchange: 'NSE',
    isFoEnabled: true,
    futuresOi: 48900000,
    futuresOiChange: -1.7,
    buildup: 'Long Unwinding'
  }
];

// Technical indicators mathematical calculations
export function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const sma: (number | undefined)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(undefined);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const ema: (number | undefined)[] = [];
  const k = 2 / (period + 1);
  let previousEma: number | undefined = undefined;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(undefined);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
      previousEma = sum / period;
      ema.push(previousEma);
    } else {
      const currentEma = data[i] * k + (previousEma as number) * (1 - k);
      previousEma = currentEma;
      ema.push(currentEma);
    }
  }
  return ema;
}

export function calculateBollingerBands(data: number[], period = 20, multiplier = 2) {
  const middle: (number | undefined)[] = calculateSMA(data, period);
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || middle[i] === undefined) {
      upper.push(undefined);
      lower.push(undefined);
    } else {
      const mean = middle[i] as number;
      const subset = data.slice(i - period + 1, i + 1);
      const variance = subset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + multiplier * stdDev);
      lower.push(mean - multiplier * stdDev);
    }
  }

  return { middle, upper, lower };
}

export function calculateRSI(data: number[], period = 14): (number | undefined)[] {
  const rsi: (number | undefined)[] = [];
  if (data.length < period) return Array(data.length).fill(undefined);

  let gains = 0;
  let losses = 0;

  // First RSI value
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(undefined);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    } else {
      const diff = data[i] - data[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

export function calculateMACD(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fileLen = data.length;
  const ema12 = calculateEMA(data, fastPeriod);
  const ema26 = calculateEMA(data, slowPeriod);
  const macdLine: (number | undefined)[] = [];

  for (let i = 0; i < fileLen; i++) {
    if (ema12[i] === undefined || ema26[i] === undefined) {
      macdLine.push(undefined);
    } else {
      macdLine.push((ema12[i] as number) - (ema26[i] as number));
    }
  }

  // Filter out undefined and calculate signal (EMA 9) of MACD Line
  const validMacds = macdLine.filter((x): x is number => x !== undefined);
  const rawSignalVec = calculateEMA(validMacds, signalPeriod);
  const signalLine: (number | undefined)[] = [];
  const histogram: (number | undefined)[] = [];

  let signalIdx = 0;
  const leadingUndefinedCount = fileLen - validMacds.length;

  for (let i = 0; i < fileLen; i++) {
    if (i < leadingUndefinedCount) {
      signalLine.push(undefined);
      histogram.push(undefined);
    } else {
      const sigVal = rawSignalVec[i - leadingUndefinedCount];
      signalLine.push(sigVal);
      const macdVal = macdLine[i];
      if (macdVal !== undefined && sigVal !== undefined && macdVal !== null && sigVal !== null) {
        histogram.push(macdVal - sigVal);
      } else {
        histogram.push(undefined);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

// Option Chain Data Generator
export function generateOptionChain(symbol: string, spotPrice: number, expiryDate = '24-JUN-2026'): OptionChain {
  const cleanSymbol = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase().replace('.NS', '') : symbol.toUpperCase();
  const isNifty = cleanSymbol === '^NSEI' || cleanSymbol === 'NIFTY' || cleanSymbol === 'NIFTY50' || cleanSymbol === 'NIFTY 50';

  let resolvedSpot = spotPrice;

  // Option strike step depends on price scale
  let strikeStep = 50;
  if (resolvedSpot > 10000) strikeStep = 100;
  else if (resolvedSpot < 500) strikeStep = 5;
  else if (resolvedSpot < 1000) strikeStep = 10;

  // Align spot to near strike
  const anchorStrike = Math.round(resolvedSpot / strikeStep) * strikeStep;
  const options: OptionData[] = [];

  let strikesToUse: number[] = [];
  if (isNifty) {
    strikesToUse = [24700, 24800, 24900, 25000, 25100];
  } else {
    const totalStrikes = 10;
    for (let i = -totalStrikes; i <= totalStrikes; i++) {
      const strikePrice = anchorStrike + i * strikeStep;
      if (strikePrice > 0) {
        strikesToUse.push(strikePrice);
      }
    }
  }

  let totalCallOi = 0;
  let totalPutOi = 0;

  for (const strikePrice of strikesToUse) {
    // Call Intrinsic Values drops as strike increases
    const callIntrinsic = Math.max(0, resolvedSpot - strikePrice);
    const putIntrinsic = Math.max(0, strikePrice - resolvedSpot);

    // Time value peak at-the-money
    const distanceNorm = Math.abs(strikePrice - resolvedSpot) / resolvedSpot;
    const timeValue = resolvedSpot * 0.04 * Math.exp(-distanceNorm * 8);

    const callLtp = Number((callIntrinsic + timeValue + 2.5 * Math.random()).toFixed(2));
    const putLtp = Number((putIntrinsic + timeValue + 2.5 * Math.random()).toFixed(2));

    // Call / Put Change %
    const callChange = Number(((Math.random() - 0.45) * 15).toFixed(2));
    const putChange = Number(((Math.random() - 0.55) * 15).toFixed(2));

    // Volume & Open Interest profiles (Highest OI near-the-money)
    // Calls usually have higher OI on resistivity levels (higher strikes)
    // Puts usually have higher OI on support levels (lower strikes)
    const callOiBase = Math.round(100000 * Math.exp(-distanceNorm * 5) * (strikePrice > resolvedSpot ? 1.4 : 0.6));
    const putOiBase = Math.round(100000 * Math.exp(-distanceNorm * 5) * (strikePrice < resolvedSpot ? 1.5 : 0.5));

    const callOi = Math.max(500, Math.round(callOiBase * (1 + 0.1 * Math.random())));
    const putOi = Math.max(500, Math.round(putOiBase * (1 + 0.1 * Math.random())));

    const callOiChg = Math.round((Math.random() - 0.3) * (callOi * 0.15));
    const putOiChg = Math.round((Math.random() - 0.4) * (putOi * 0.12));

    const callVol = Math.round(callOi * (1.5 + Math.random()));
    const putVol = Math.round(putOi * (1.2 + Math.random()));

    // Implied Volatilities (higher on out-of-the-money for puts - "volatility skew")
    const callIv = Number((15 + distanceNorm * 62 + Math.random() * 2).toFixed(2));
    const putIv = Number((16 + distanceNorm * 80 + Math.random() * 2).toFixed(2));

    // Options Greeks: Delta
    const zCall = (resolvedSpot - strikePrice) / (resolvedSpot * 0.08);
    const callDelta = Number((1 / (1 + Math.exp(-zCall))).toFixed(2));
    const putDelta = Number((callDelta - 1).toFixed(2));

    options.push({
      strikePrice,
      callLtp,
      callChange,
      callVol,
      callOi,
      callOiChg,
      callIv,
      callDelta,
      putLtp,
      putChange,
      putVol,
      putOi,
      putOiChg,
      putIv,
      putDelta
    });

    totalCallOi += callOi;
    totalPutOi += putOi;
  }

  const pcr = Number((totalPutOi / totalCallOi).toFixed(2));

  // Max Pain Calculator
  // The strike price where option buyers suffer maximum aggregated loss (and option sellers make maximum profit)
  let minLoss = Infinity;
  let maxPain = isNifty ? 24900 : anchorStrike;

  for (const testStrike of options) {
    let totalLoss = 0;
    for (const option of options) {
      if (testStrike.strikePrice > option.strikePrice) {
        totalLoss += (testStrike.strikePrice - option.strikePrice) * option.callOi;
      }
      if (testStrike.strikePrice < option.strikePrice) {
        totalLoss += (option.strikePrice - testStrike.strikePrice) * option.putOi;
      }
    }

    if (totalLoss < minLoss) {
      minLoss = totalLoss;
      if (!isNifty) {
        maxPain = testStrike.strikePrice;
      }
    }
  }

  return {
    symbol,
    spotPrice: resolvedSpot,
    pcr,
    totalCallOi,
    totalPutOi,
    maxPain,
    expiryDate,
    options
  };
}

// High-fidelity historical candle generator
export function generateHistoricalCandles(basePrice: number, pointsCount = 100, interval = '1D'): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  let currentPrice = basePrice * 0.92; // start slightly lower for nice chart progression
  let currentVol = 1000000;
  const nowMs = Date.now();
  let timeStepMs = 24 * 60 * 60 * 1000; // default 1 day

  if (interval === '1m') timeStepMs = 60 * 1000;
  else if (interval === '5m') timeStepMs = 5 * 60 * 1000;
  else if (interval === '15m') timeStepMs = 15 * 60 * 1000;
  else if (interval === '1H') timeStepMs = 60 * 60 * 1000;
  else if (interval === '1W') timeStepMs = 7 * 24 * 60 * 60 * 1000;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = nowMs - i * timeStepMs;
    const dateObj = new Date(timestamp);

    let timeString = '';
    if (interval.endsWith('m') || interval === '1H') {
      timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      timeString = dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' });
    }

    // Candle drift with moderate random walk and trend
    const drift = (basePrice - currentPrice) * 0.015; // gravitate back to final spot
    const noise = (Math.random() - 0.47) * (basePrice * 0.018);
    const close = currentPrice + drift + noise;

    const oOffset = (Math.random() - 0.5) * (basePrice * 0.008);
    const open = i === pointsCount - 1 ? currentPrice : result[result.length - 1]?.close || currentPrice;

    const high = Math.max(open, close) + Math.random() * (basePrice * 0.009);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.009);

    currentVol = Math.round(currentVol * (0.85 + Math.random() * 0.3));
    currentVol = Math.max(50000, currentVol);

    result.push({
      time: timeString,
      timestamp,
      open: Number((open ?? 0).toFixed(2)),
      high: Number((high ?? 0).toFixed(2)),
      low: Number((low ?? 0).toFixed(2)),
      close: Number((close ?? 0).toFixed(2)),
      volume: currentVol
    });

    currentPrice = close;
  }

  // Inject technical indicator overlays
  const closeArray = result.map(c => c.close);
  const sma20 = calculateSMA(closeArray, 20);
  const ema50 = calculateEMA(closeArray, 50);
  const { middle, upper, lower } = calculateBollingerBands(closeArray, 20, 2);
  const rsi = calculateRSI(closeArray, 14);
  const { macdLine, signalLine, histogram } = calculateMACD(closeArray, 12, 26, 9);

  for (let idx = 0; idx < result.length; idx++) {
    if (sma20[idx] !== undefined && sma20[idx] !== null) result[idx].sma20 = Number((sma20[idx] as number).toFixed(2));
    if (ema50[idx] !== undefined && ema50[idx] !== null) result[idx].ema50 = Number((ema50[idx] as number).toFixed(2));
    if (middle[idx] !== undefined && middle[idx] !== null && upper[idx] !== undefined && upper[idx] !== null && lower[idx] !== undefined && lower[idx] !== null) {
      result[idx].upperBand = Number((upper[idx] as number).toFixed(2));
      result[idx].lowerBand = Number((lower[idx] as number).toFixed(2));
    }
    if (rsi[idx] !== undefined && rsi[idx] !== null) result[idx].rsi = Number((rsi[idx] as number).toFixed(2));
    if (macdLine[idx] !== undefined && macdLine[idx] !== null) {
      result[idx].macdLine = Number((macdLine[idx] as number).toFixed(2));
      if (signalLine[idx] !== undefined && signalLine[idx] !== null) {
        result[idx].signalLine = Number((signalLine[idx] as number).toFixed(2));
      }
      if (histogram[idx] !== undefined && histogram[idx] !== null) {
        result[idx].histogram = Number((histogram[idx] as number).toFixed(2));
      }
    }
  }

  return result;
}
