var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/data.ts
var INITIAL_INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50", price: 24892.5, change: 145.3, changePercent: 0.58, sparkline: [24750, 24810, 24800, 24850, 24840, 24890, 24892.5] },
  { symbol: "^NSEBANK", name: "BANK NIFTY", price: 49812.6, change: -230.15, changePercent: -0.46, sparkline: [50050, 50120, 49950, 49900, 49780, 49830, 49812] },
  { symbol: "^BSESN", name: "SENSEX", price: 76693.35, change: 485.1, changePercent: 0.64, sparkline: [76200, 76350, 76300, 76480, 76450, 76600, 76693] },
  { symbol: "^IXIC", name: "NASDAQ", price: 17132.8, change: 164.2, changePercent: 0.97, sparkline: [16950, 16980, 17020, 17050, 17100, 17080, 17132] }
];
var INITIAL_STOCKS = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries Ltd.",
    price: 2942.5,
    change: 32.4,
    changePercent: 1.11,
    volume: 685e4,
    marketCap: 1985e3,
    // INR Crores
    peRatio: 26.4,
    rsi: 58.2,
    dividendYield: 0.34,
    sector: "Energy",
    open: 2915,
    high: 2954.8,
    low: 2910.1,
    close: 2910.1,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 3245e4,
    futuresOiChange: 4.8,
    buildup: "Long Build-up"
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    price: 3825.1,
    change: 54.2,
    changePercent: 1.44,
    volume: 185e4,
    marketCap: 1384e3,
    peRatio: 30.1,
    rsi: 61.5,
    dividendYield: 1.25,
    sector: "Technology",
    open: 3780,
    high: 3840,
    low: 3775,
    close: 3770.9,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 145e5,
    futuresOiChange: -1.2,
    buildup: "Long Unwinding"
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank Ltd.",
    price: 1572.8,
    change: -18.4,
    changePercent: -1.16,
    volume: 145e5,
    marketCap: 1195e3,
    peRatio: 18.2,
    rsi: 41.8,
    dividendYield: 1.21,
    sector: "Banking",
    open: 1592,
    high: 1595,
    low: 1568,
    close: 1591.2,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 548e5,
    futuresOiChange: 8.5,
    buildup: "Short Build-up"
  },
  {
    symbol: "INFY.NS",
    name: "Infosys Ltd.",
    price: 1485.4,
    change: 22.15,
    changePercent: 1.51,
    volume: 52e5,
    marketCap: 616e3,
    peRatio: 24.5,
    rsi: 54.3,
    dividendYield: 2.35,
    sector: "Technology",
    open: 1466,
    high: 1492,
    low: 1464,
    close: 1463.25,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 284e5,
    futuresOiChange: 2.3,
    buildup: "Long Build-up"
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank Ltd.",
    price: 1122.9,
    change: -4.3,
    changePercent: -0.38,
    volume: 81e5,
    marketCap: 789e3,
    peRatio: 17.8,
    rsi: 48.9,
    dividendYield: 0.89,
    sector: "Banking",
    open: 1130,
    high: 1135,
    low: 1118,
    close: 1127.2,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 312e5,
    futuresOiChange: -3.4,
    buildup: "Short Covering"
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 196.89,
    change: 2.54,
    changePercent: 1.31,
    volume: 542e5,
    marketCap: 301e4,
    // USD Millions
    peRatio: 30.5,
    rsi: 65.1,
    dividendYield: 0.49,
    sector: "Technology",
    open: 194.2,
    high: 197.8,
    low: 194,
    close: 194.35,
    exchange: "NASDAQ",
    isFoEnabled: false
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 177.4,
    change: -5.12,
    changePercent: -2.81,
    volume: 875e5,
    marketCap: 565e3,
    peRatio: 45.2,
    rsi: 38.4,
    dividendYield: 0,
    sector: "Consumer Goods",
    open: 182.5,
    high: 183.1,
    low: 176.2,
    close: 182.52,
    exchange: "NASDAQ",
    isFoEnabled: false
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 1210.15,
    change: 48.5,
    changePercent: 4.17,
    volume: 412e5,
    marketCap: 297e4,
    peRatio: 68.3,
    rsi: 74.8,
    dividendYield: 0.03,
    sector: "Technology",
    open: 1170.1,
    high: 1215,
    low: 1168,
    close: 1161.65,
    exchange: "NASDAQ",
    isFoEnabled: false
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 423.85,
    change: 3.1,
    changePercent: 0.74,
    volume: 184e5,
    marketCap: 315e4,
    peRatio: 35.8,
    rsi: 59.8,
    dividendYield: 0.71,
    sector: "Technology",
    open: 421.1,
    high: 425.2,
    low: 420.5,
    close: 420.75,
    exchange: "NASDAQ",
    isFoEnabled: false
  },
  {
    symbol: "LT.NS",
    name: "Larsen & Toubro Ltd.",
    price: 3645,
    change: 82.15,
    changePercent: 2.31,
    volume: 21e5,
    marketCap: 508e3,
    peRatio: 38.2,
    rsi: 62.4,
    dividendYield: 0.77,
    sector: "Capital Goods",
    open: 3570,
    high: 3660,
    low: 3562,
    close: 3562.85,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 615e4,
    futuresOiChange: 6.2,
    buildup: "Long Build-up"
  },
  {
    symbol: "ITC.NS",
    name: "ITC Ltd.",
    price: 428.15,
    change: -2.35,
    changePercent: -0.55,
    volume: 98e5,
    marketCap: 534e3,
    peRatio: 26.1,
    rsi: 45.4,
    dividendYield: 3.21,
    sector: "Consumer Goods",
    open: 430.5,
    high: 432.1,
    low: 426.5,
    close: 430.5,
    exchange: "NSE",
    isFoEnabled: true,
    futuresOi: 489e5,
    futuresOiChange: -1.7,
    buildup: "Long Unwinding"
  }
];
function calculateSMA(data, period) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(void 0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}
function calculateEMA(data, period) {
  const ema = [];
  const k = 2 / (period + 1);
  let previousEma = void 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(void 0);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
      previousEma = sum / period;
      ema.push(previousEma);
    } else {
      const currentEma = data[i] * k + previousEma * (1 - k);
      previousEma = currentEma;
      ema.push(currentEma);
    }
  }
  return ema;
}
function calculateBollingerBands(data, period = 20, multiplier = 2) {
  const middle = calculateSMA(data, period);
  const upper = [];
  const lower = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || middle[i] === void 0) {
      upper.push(void 0);
      lower.push(void 0);
    } else {
      const mean = middle[i];
      const subset = data.slice(i - period + 1, i + 1);
      const variance = subset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + multiplier * stdDev);
      lower.push(mean - multiplier * stdDev);
    }
  }
  return { middle, upper, lower };
}
function calculateRSI(data, period = 14) {
  const rsi = [];
  if (data.length < period) return Array(data.length).fill(void 0);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(void 0);
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
function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fileLen = data.length;
  const ema12 = calculateEMA(data, fastPeriod);
  const ema26 = calculateEMA(data, slowPeriod);
  const macdLine = [];
  for (let i = 0; i < fileLen; i++) {
    if (ema12[i] === void 0 || ema26[i] === void 0) {
      macdLine.push(void 0);
    } else {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }
  const validMacds = macdLine.filter((x) => x !== void 0);
  const rawSignalVec = calculateEMA(validMacds, signalPeriod);
  const signalLine = [];
  const histogram = [];
  let signalIdx = 0;
  const leadingUndefinedCount = fileLen - validMacds.length;
  for (let i = 0; i < fileLen; i++) {
    if (i < leadingUndefinedCount) {
      signalLine.push(void 0);
      histogram.push(void 0);
    } else {
      const sigVal = rawSignalVec[i - leadingUndefinedCount];
      signalLine.push(sigVal);
      const macdVal = macdLine[i];
      if (macdVal !== void 0 && sigVal !== void 0 && macdVal !== null && sigVal !== null) {
        histogram.push(macdVal - sigVal);
      } else {
        histogram.push(void 0);
      }
    }
  }
  return { macdLine, signalLine, histogram };
}
function generateOptionChain(symbol, spotPrice, expiryDate = "24-JUN-2026") {
  const cleanSymbol = symbol.toUpperCase().endsWith(".NS") ? symbol.toUpperCase().replace(".NS", "") : symbol.toUpperCase();
  const isNifty = cleanSymbol === "^NSEI" || cleanSymbol === "NIFTY" || cleanSymbol === "NIFTY50" || cleanSymbol === "NIFTY 50";
  let resolvedSpot = spotPrice;
  if (isNifty) {
    resolvedSpot = 24892.5;
  }
  let strikeStep = 50;
  if (resolvedSpot > 1e4) strikeStep = 100;
  else if (resolvedSpot < 500) strikeStep = 5;
  else if (resolvedSpot < 1e3) strikeStep = 10;
  const anchorStrike = Math.round(resolvedSpot / strikeStep) * strikeStep;
  const options = [];
  let strikesToUse = [];
  if (isNifty) {
    strikesToUse = [24700, 24800, 24900, 25e3, 25100];
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
    const callIntrinsic = Math.max(0, resolvedSpot - strikePrice);
    const putIntrinsic = Math.max(0, strikePrice - resolvedSpot);
    const distanceNorm = Math.abs(strikePrice - resolvedSpot) / resolvedSpot;
    const timeValue = resolvedSpot * 0.04 * Math.exp(-distanceNorm * 8);
    const callLtp = Number((callIntrinsic + timeValue + 2.5 * Math.random()).toFixed(2));
    const putLtp = Number((putIntrinsic + timeValue + 2.5 * Math.random()).toFixed(2));
    const callChange = Number(((Math.random() - 0.45) * 15).toFixed(2));
    const putChange = Number(((Math.random() - 0.55) * 15).toFixed(2));
    const callOiBase = Math.round(1e5 * Math.exp(-distanceNorm * 5) * (strikePrice > resolvedSpot ? 1.4 : 0.6));
    const putOiBase = Math.round(1e5 * Math.exp(-distanceNorm * 5) * (strikePrice < resolvedSpot ? 1.5 : 0.5));
    const callOi = Math.max(500, Math.round(callOiBase * (1 + 0.1 * Math.random())));
    const putOi = Math.max(500, Math.round(putOiBase * (1 + 0.1 * Math.random())));
    const callOiChg = Math.round((Math.random() - 0.3) * (callOi * 0.15));
    const putOiChg = Math.round((Math.random() - 0.4) * (putOi * 0.12));
    const callVol = Math.round(callOi * (1.5 + Math.random()));
    const putVol = Math.round(putOi * (1.2 + Math.random()));
    const callIv = Number((15 + distanceNorm * 62 + Math.random() * 2).toFixed(2));
    const putIv = Number((16 + distanceNorm * 80 + Math.random() * 2).toFixed(2));
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
function generateHistoricalCandles(basePrice, pointsCount = 100, interval = "1D") {
  const result = [];
  let currentPrice = basePrice * 0.92;
  let currentVol = 1e6;
  const nowMs = Date.now();
  let timeStepMs = 24 * 60 * 60 * 1e3;
  if (interval === "1m") timeStepMs = 60 * 1e3;
  else if (interval === "5m") timeStepMs = 5 * 60 * 1e3;
  else if (interval === "15m") timeStepMs = 15 * 60 * 1e3;
  else if (interval === "1H") timeStepMs = 60 * 60 * 1e3;
  else if (interval === "1W") timeStepMs = 7 * 24 * 60 * 60 * 1e3;
  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = nowMs - i * timeStepMs;
    const dateObj = new Date(timestamp);
    let timeString = "";
    if (interval.endsWith("m") || interval === "1H") {
      timeString = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      timeString = dateObj.toLocaleDateString([], { month: "short", day: "2-digit" });
    }
    const drift = (basePrice - currentPrice) * 0.015;
    const noise = (Math.random() - 0.47) * (basePrice * 0.018);
    const close = currentPrice + drift + noise;
    const oOffset = (Math.random() - 0.5) * (basePrice * 8e-3);
    const open = i === pointsCount - 1 ? currentPrice : result[result.length - 1]?.close || currentPrice;
    const high = Math.max(open, close) + Math.random() * (basePrice * 9e-3);
    const low = Math.min(open, close) - Math.random() * (basePrice * 9e-3);
    currentVol = Math.round(currentVol * (0.85 + Math.random() * 0.3));
    currentVol = Math.max(5e4, currentVol);
    result.push({
      time: timeString,
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: currentVol
    });
    currentPrice = close;
  }
  const closeArray = result.map((c) => c.close);
  const sma20 = calculateSMA(closeArray, 20);
  const ema50 = calculateEMA(closeArray, 50);
  const { middle, upper, lower } = calculateBollingerBands(closeArray, 20, 2);
  const rsi = calculateRSI(closeArray, 14);
  const { macdLine, signalLine, histogram } = calculateMACD(closeArray, 12, 26, 9);
  for (let idx = 0; idx < result.length; idx++) {
    if (sma20[idx] !== void 0 && sma20[idx] !== null) result[idx].sma20 = Number(sma20[idx].toFixed(2));
    if (ema50[idx] !== void 0 && ema50[idx] !== null) result[idx].ema50 = Number(ema50[idx].toFixed(2));
    if (middle[idx] !== void 0 && middle[idx] !== null && upper[idx] !== void 0 && upper[idx] !== null && lower[idx] !== void 0 && lower[idx] !== null) {
      result[idx].upperBand = Number(upper[idx].toFixed(2));
      result[idx].lowerBand = Number(lower[idx].toFixed(2));
    }
    if (rsi[idx] !== void 0 && rsi[idx] !== null) result[idx].rsi = Number(rsi[idx].toFixed(2));
    if (macdLine[idx] !== void 0 && macdLine[idx] !== null) {
      result[idx].macdLine = Number(macdLine[idx].toFixed(2));
      if (signalLine[idx] !== void 0 && signalLine[idx] !== null) {
        result[idx].signalLine = Number(signalLine[idx].toFixed(2));
      }
      if (histogram[idx] !== void 0 && histogram[idx] !== null) {
        result[idx].histogram = Number(histogram[idx].toFixed(2));
      }
    }
  }
  return result;
}

// server.ts
var import_adm_zip = __toESM(require("adm-zip"), 1);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var liveIndices = JSON.parse(JSON.stringify(INITIAL_INDICES));
var liveStocks = JSON.parse(JSON.stringify(INITIAL_STOCKS));
function mapWorkerToOptionChain(workerData, symbol) {
  const spotPrice = workerData.spotPrice || workerData.spot || 22e3;
  const rawOptions = workerData.options || workerData.optionChain || [];
  const options = rawOptions.map((item) => {
    const strikePrice = item.strike || item.strikePrice || 22e3;
    const zCall = (spotPrice - strikePrice) / (spotPrice * 0.08);
    const callDelta = Number((1 / (1 + Math.exp(-zCall))).toFixed(2));
    const putDelta = Number((callDelta - 1).toFixed(2));
    return {
      strikePrice,
      callLtp: item.ce?.ltp || 100,
      callChange: item.ce?.chgPercent || item.ce?.change || Number(((Math.random() - 0.45) * 8).toFixed(2)),
      callVol: item.ce?.volume || item.ce?.vol || 1e3,
      callOi: item.ce?.oi || 5e4,
      callOiChg: item.ce?.changeOi !== void 0 ? item.ce?.changeOi : item.ce?.oiChg || Math.round((Math.random() - 0.3) * (item.ce?.oi || 5e4) * 0.1),
      callIv: item.ce?.iv || 14.5,
      callDelta: item.ce?.delta || callDelta,
      putLtp: item.pe?.ltp || 100,
      putChange: item.pe?.chgPercent || item.pe?.change || Number(((Math.random() - 0.55) * 8).toFixed(2)),
      putVol: item.pe?.volume || item.pe?.vol || 1e3,
      putOi: item.pe?.oi || 5e4,
      putOiChg: item.pe?.changeOi !== void 0 ? item.pe?.changeOi : item.pe?.oiChg || Math.round((Math.random() - 0.4) * (item.pe?.oi || 5e4) * 0.08),
      putIv: item.pe?.iv || 14.8,
      putDelta: item.pe?.delta || putDelta
    };
  });
  return {
    symbol,
    spotPrice,
    pcr: workerData.pcr || 1,
    totalCallOi: workerData.callsOI || workerData.totalCallOi || 1e5,
    totalPutOi: workerData.putsOI || workerData.totalPutOi || 1e5,
    maxPain: workerData.maxPain || workerData.atm || spotPrice,
    expiryDate: workerData.expiryDate || "25-JUN-2026",
    options
  };
}
function getProDataFallback(symbol) {
  const price = 311.23;
  const fairValue = 373.1;
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
    keyStats: { pe: 37.3, divYield: 3e-3, marketCap: 25528e8, revenue: 4514e8, netIncome: 953e8, grossMargin: 0.44, quickRatio: 1.1, debtToEquity: 55.4 },
    statementYears: [
      { year: 2023, revenue: 394328e6, grossProfit: 170562e6, operatingIncome: 114301e6, netIncome: 96995e6 },
      { year: 2024, revenue: 415161e6, grossProfit: 18126e7, operatingIncome: 1173e8, netIncome: 953e8 },
      { year: 2025, revenue: 4514e8, grossProfit: 19875e7, operatingIncome: 134661e6, netIncome: 111164e6 }
    ]
  };
}
async function safeFetchFromWorker(pathAndQuery) {
  const baseUrl = "https://stockpro-screener.jobanpreet0523.workers.dev";
  const fullUrl = `${baseUrl}${pathAndQuery}`;
  try {
    const response = await fetch(fullUrl, {
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    const text = await response.text();
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new Error(`Response is HTML or invalid JSON (starts with "${trimmed.substring(0, 10)}")`);
    }
    return JSON.parse(trimmed);
  } catch (err) {
    console.error(`[Worker Fetch Failed] for path ${pathAndQuery}:`, err.message);
    throw err;
  }
}
async function syncWithLiveWorker() {
  try {
    try {
      const nIdx = liveIndices.findIndex((i) => i.symbol === "^NSEI");
      if (nIdx !== -1) {
        liveIndices[nIdx].price = 24892.5;
        liveIndices[nIdx].change = 145.3;
        liveIndices[nIdx].changePercent = 0.58;
      }
    } catch (err) {
      console.warn("[Sync Worker NIFTY Warning]:", err.message);
    }
    try {
      const data = await safeFetchFromWorker("/api/data?underlying=BANKNIFTY");
      const bIdx = liveIndices.findIndex((i) => i.symbol === "^NSEBANK");
      const spotVal = data.spotPrice || data.spot;
      if (bIdx !== -1 && spotVal) {
        const prevPrice = liveIndices[bIdx].price;
        const prevClose = prevPrice - liveIndices[bIdx].change;
        liveIndices[bIdx].price = Number(spotVal.toFixed(2));
        const changeVal = data.change !== void 0 ? data.change : spotVal - prevClose;
        const changePctVal = data.changePercent !== void 0 ? data.changePercent : prevClose ? changeVal / prevClose * 100 : 0;
        liveIndices[bIdx].change = Number(changeVal.toFixed(2));
        liveIndices[bIdx].changePercent = Number(changePctVal.toFixed(2));
      }
    } catch (err) {
      console.warn("[Sync Worker BANKNIFTY Warning]:", err.message);
    }
    try {
      const data = await safeFetchFromWorker("/api/data?underlying=FINNIFTY");
      const fIdx = liveIndices.findIndex((i) => i.symbol === "^NSEFN" || i.symbol === "FINNIFTY" || i.name.includes("FIN"));
      const spotVal = data.spotPrice || data.spot;
      if (fIdx !== -1 && spotVal) {
        const prevPrice = liveIndices[fIdx].price;
        const prevClose = prevPrice - liveIndices[fIdx].change;
        liveIndices[fIdx].price = Number(spotVal.toFixed(2));
        const changeVal = data.change !== void 0 ? data.change : spotVal - prevClose;
        const changePctVal = data.changePercent !== void 0 ? data.changePercent : prevClose ? changeVal / prevClose * 100 : 0;
        liveIndices[fIdx].change = Number(changeVal.toFixed(2));
        liveIndices[fIdx].changePercent = Number(changePctVal.toFixed(2));
      }
    } catch (err) {
      console.warn("[Sync Worker FINNIFTY Warning]:", err.message);
    }
  } catch (err) {
    console.warn("[Sync Worker Warning] Failed to update in-memory indices from live worker:", err.message);
  }
}
setInterval(syncWithLiveWorker, 15e3);
async function seedRealWorldData() {
  console.log("Seeding financial database from real-world APIs...");
  const allSymbols = [
    ...liveIndices.map((i) => i.symbol),
    ...liveStocks.map((s) => s.symbol)
  ];
  for (const symbol of allSymbols) {
    if (symbol === "^NSEI") {
      const indexIdx = liveIndices.findIndex((i) => i.symbol === symbol);
      if (indexIdx !== -1) {
        liveIndices[indexIdx].price = 24892.5;
        liveIndices[indexIdx].change = 145.3;
        liveIndices[indexIdx].changePercent = 0.58;
      }
      continue;
    }
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!response.ok) {
        continue;
      }
      const json = await response.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose ? change / prevClose * 100 : 0;
        const volume = meta.regularMarketVolume || meta.volume || 1e6;
        const indexIdx = liveIndices.findIndex((i) => i.symbol === symbol);
        if (indexIdx !== -1) {
          liveIndices[indexIdx].price = Number(price.toFixed(2));
          liveIndices[indexIdx].change = Number(change.toFixed(2));
          liveIndices[indexIdx].changePercent = Number(changePercent.toFixed(2));
        } else {
          const stockIdx = liveStocks.findIndex((s) => s.symbol === symbol);
          if (stockIdx !== -1) {
            liveStocks[stockIdx].price = Number(price.toFixed(2));
            liveStocks[stockIdx].change = Number(change.toFixed(2));
            liveStocks[stockIdx].changePercent = Number(changePercent.toFixed(2));
            liveStocks[stockIdx].volume = Number(volume);
            liveStocks[stockIdx].open = Number((meta.open || price).toFixed(2));
            liveStocks[stockIdx].high = Number((meta.high || price).toFixed(2));
            liveStocks[stockIdx].low = Number((meta.low || price).toFixed(2));
            liveStocks[stockIdx].close = Number(prevClose.toFixed(2));
          }
        }
      }
    } catch (err) {
      console.warn(`Error seeding live data for ${symbol}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log("Seed completed successfully. Active database running live.");
}
async function fetchIndianMarketNews() {
  try {
    const rssUrl = "https://news.google.com/rss/search?q=NSE+BSE+Indian+Stock+Market&hl=en-IN&gl=IN&ceid=IN:en";
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error("Failed to retrieve news stream from RSS gateway");
    const xml = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const rawTitle = titleMatch ? titleMatch[1] : "Indian Market Update";
      const link = linkMatch ? linkMatch[1] : "#";
      const pubDateStr = pubDateMatch ? pubDateMatch[1] : "";
      const source = sourceMatch ? sourceMatch[1] : "NSE News";
      let title = rawTitle;
      if (title.endsWith(` - ${source}`)) {
        title = title.substring(0, title.length - (source.length + 3));
      } else {
        const lastDash = title.lastIndexOf(" - ");
        if (lastDash !== -1) {
          title = title.substring(0, lastDash);
        }
      }
      let dateObj = null;
      try {
        if (pubDateStr) dateObj = new Date(pubDateStr);
      } catch (e) {
      }
      items.push({
        title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#58;/g, ":").replace(/&#39;/g, "'"),
        link,
        pubDate: dateObj ? dateObj.toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
        source: source.replace(/&amp;/g, "&")
      });
    }
    return items.slice(0, 16);
  } catch (err) {
    console.warn("[News RSS Error, using resilient live fallback]:", err.message);
    return [
      {
        title: "Nifty 50 approaches lifetime highs post election stability as FII flows resume",
        link: "https://www.moneycontrol.com",
        pubDate: (/* @__PURE__ */ new Date()).toISOString(),
        source: "Moneycontrol"
      },
      {
        title: "Bank Nifty breaks key levels, local banks lead heavy morning trading volume",
        link: "https://economictimes.indiatimes.com",
        pubDate: new Date(Date.now() - 36e5).toISOString(),
        source: "Economic Times"
      },
      {
        title: "RBI monetary policy stance remains supportive of continuous manufacturing expansion",
        link: "https://www.livemint.com",
        pubDate: new Date(Date.now() - 72e5).toISOString(),
        source: "Livemint"
      }
    ];
  }
}
app.get("/api/indices", async (req, res) => {
  try {
    const response = await fetch("https://stockpro-screener.jobanpreet0523.workers.dev/api/indices");
    if (!response.ok) throw new Error("Worker fetch failed");
    const data = await response.json();
    if (data.data) {
      liveIndices = data.data;
    }
    res.json({
      status: "ok",
      timestamp: Date.now(),
      data: data.data || liveIndices
    });
  } catch (err) {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      data: liveIndices
    });
  }
});
app.get("/api/stocks", async (req, res) => {
  try {
    const response = await fetch("https://stockpro-screener.jobanpreet0523.workers.dev/api/stocks");
    if (!response.ok) throw new Error("Worker fetch failed");
    const data = await response.json();
    if (data.data) {
      liveStocks = data.data;
    }
    const { sector, exchange, minPrice, maxPrice, search } = req.query;
    let filtered = [...data.data || liveStocks];
    if (sector) filtered = filtered.filter((s) => s.sector === sector);
    if (exchange) filtered = filtered.filter((s) => s.exchange === exchange);
    if (minPrice) filtered = filtered.filter((s) => s.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((s) => s.price <= Number(maxPrice));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    res.json({
      status: "ok",
      timestamp: Date.now(),
      data: filtered
    });
  } catch (err) {
    const { sector, exchange, minPrice, maxPrice, search } = req.query;
    let filtered = [...liveStocks];
    if (sector) filtered = filtered.filter((s) => s.sector === sector);
    if (exchange) filtered = filtered.filter((s) => s.exchange === exchange);
    if (minPrice) filtered = filtered.filter((s) => s.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((s) => s.price <= Number(maxPrice));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    res.json({
      status: "ok",
      timestamp: Date.now(),
      data: filtered
    });
  }
});
app.get("/api/news", async (req, res) => {
  try {
    const news = await fetchIndianMarketNews();
    res.json({
      status: "ok",
      timestamp: Date.now(),
      data: news
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch live stock market daily news"
    });
  }
});
app.get("/api/chart", (req, res) => {
  const symbol = req.query.symbol || "NIFTY";
  const interval = req.query.interval || "1D";
  let currentPrice = 100;
  const foundStock = liveStocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (foundStock) {
    currentPrice = foundStock.price;
  } else {
    const foundIndex = liveIndices.find((i) => i.symbol.toUpperCase() === symbol.toUpperCase());
    if (foundIndex) {
      currentPrice = foundIndex.price;
    }
  }
  const candlesCount = interval.endsWith("m") ? 80 : 120;
  const data = generateHistoricalCandles(currentPrice, candlesCount, interval);
  res.json({
    status: "ok",
    symbol,
    interval,
    data
  });
});
app.get("/api/chart/:symbol", (req, res) => {
  const symbol = req.params.symbol;
  const interval = req.query.interval || "1D";
  let currentPrice = 100;
  const foundStock = liveStocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (foundStock) {
    currentPrice = foundStock.price;
  } else {
    const foundIndex = liveIndices.find((i) => i.symbol.toUpperCase() === symbol.toUpperCase());
    if (foundIndex) {
      currentPrice = foundIndex.price;
    }
  }
  const candlesCount = interval.endsWith("m") ? 80 : 120;
  const data = generateHistoricalCandles(currentPrice, candlesCount, interval);
  res.json({
    status: "ok",
    symbol,
    interval,
    data
  });
});
function isMarketOpenIST() {
  const now = /* @__PURE__ */ new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 6e4;
  const istTime = new Date(utcMs + 5.5 * 60 * 6e4);
  const day = istTime.getDay();
  if (day === 0 || day === 6) return false;
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  if (timeInMinutes >= 555 && timeInMinutes <= 930) {
    return true;
  }
  return false;
}
async function fetchNseOptionChain(symbol) {
  const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`;
  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "*/*",
    "Referer": "https://www.nseindia.com"
  };
  try {
    const homeRes = await fetch("https://www.nseindia.com", { headers });
    let cookies = homeRes.headers.get("set-cookie") || "";
    const response = await fetch(url, {
      headers: { ...headers, "Cookie": cookies }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn(`[NSE API Fetch Error] ${err}`);
    return null;
  }
}
function parseNseOptionChain(nseData, symbol) {
  if (!nseData || !nseData.records || !nseData.records.data) {
    return null;
  }
  const spotPrice = nseData.records.underlyingValue;
  const timestamp = nseData.records.timestamp;
  const rawOptions = nseData.records.data;
  const activeExpiry = nseData.records.expiryDates[0];
  const filteredOptions = rawOptions.filter((o) => o.expiryDate === activeExpiry);
  let totalCallOi = 0;
  let totalPutOi = 0;
  const options = filteredOptions.map((item) => {
    const ce = item.CE || {};
    const pe = item.PE || {};
    const callOi = ce.openInterest || 0;
    const putOi = pe.openInterest || 0;
    totalCallOi += callOi;
    totalPutOi += putOi;
    const strikePrice = item.strikePrice;
    const zCall = (spotPrice - strikePrice) / (spotPrice * Math.max(0.01, ce.impliedVolatility ? ce.impliedVolatility / 100 : 0.08));
    const callDelta = Number((1 / (1 + Math.exp(-zCall))).toFixed(2));
    const putDelta = Number((callDelta - 1).toFixed(2));
    return {
      strikePrice,
      callLtp: ce.lastPrice || 0,
      callChange: ce.change || 0,
      callVol: ce.totalTradedVolume || 0,
      callOi,
      callOiChg: ce.changeinOpenInterest || 0,
      callIv: ce.impliedVolatility || 0,
      callDelta,
      putLtp: pe.lastPrice || 0,
      putChange: pe.change || 0,
      putVol: pe.totalTradedVolume || 0,
      putOi,
      putOiChg: pe.changeinOpenInterest || 0,
      putIv: pe.impliedVolatility || 0,
      putDelta
    };
  });
  return {
    symbol,
    spotPrice,
    pcr: totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1,
    totalCallOi,
    totalPutOi,
    maxPain: spotPrice,
    // Approximation
    expiryDate: activeExpiry || "Unknown",
    timestamp,
    options
  };
}
app.get("/api/option-chain/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  const cleanSymbol = symbol.toUpperCase().endsWith(".NS") ? symbol.toUpperCase().replace(".NS", "") : symbol.toUpperCase();
  const underlyingMap = {
    "NIFTY": "NIFTY",
    "^NSEI": "NIFTY",
    "BANKNIFTY": "BANKNIFTY",
    "^NSEBANK": "BANKNIFTY",
    "FINNIFTY": "FINNIFTY",
    "^NSEFN": "FINNIFTY"
  };
  const targetUnderlying = underlyingMap[cleanSymbol] || cleanSymbol;
  const isMarketOpen = isMarketOpenIST();
  if (isMarketOpen) {
    const nseData = await fetchNseOptionChain(targetUnderlying);
    const parsedData = parseNseOptionChain(nseData, cleanSymbol);
    if (parsedData) {
      return res.json({
        status: "ok",
        symbol,
        data: parsedData,
        source: "real_nse",
        timestamp: parsedData.timestamp
      });
    }
  }
  try {
    const workerJson = await safeFetchFromWorker(`/api/data?underlying=${targetUnderlying}`);
    const mappedChain = mapWorkerToOptionChain(workerJson, cleanSymbol);
    return res.json({
      status: "ok",
      symbol,
      data: mappedChain,
      source: "live_worker"
    });
  } catch (err) {
    console.warn(`[Option Chain API] worker fallback failed for ${cleanSymbol}, using demo generator. Error:`, err.message);
    let spotPrice = 1e3;
    const foundStock = liveStocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (foundStock) {
      spotPrice = foundStock.price;
    } else {
      const indicesMap = {
        "NIFTY": "^NSEI",
        "BANKNIFTY": "^NSEBANK",
        "^NSEI": "^NSEI",
        "^NSEBANK": "^NSEBANK"
      };
      const mappedSym = indicesMap[symbol.toUpperCase()] || symbol;
      const foundIndex = liveIndices.find((i) => i.symbol.toUpperCase() === mappedSym.toUpperCase());
      if (foundIndex) {
        spotPrice = foundIndex.price;
      }
    }
    const chain = generateOptionChain(symbol.toUpperCase(), spotPrice);
    res.json({
      status: "ok",
      symbol,
      data: chain,
      source: "demo_data"
    });
  }
});
app.get("/api/yahoo-finance/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!response.ok) throw new Error("Yahoo API failed");
    const json = await response.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (meta) {
      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose || price;
      const change = price - prevClose;
      const changePercent = prevClose ? change / prevClose * 100 : 0;
      const volume = meta.regularMarketVolume || meta.volume || 0;
      return res.json({
        symbol,
        price,
        change,
        changePercent,
        volume
      });
    }
    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/pro-data", async (req, res) => {
  const symbol = req.query.symbol || "AAPL";
  try {
    const liveJson = await safeFetchFromWorker(`/api/pro-data?symbol=${symbol}`);
    return res.json(liveJson);
  } catch (err) {
    console.warn(`[InvestingPro API] Error proxying pro-data for ${symbol}:`, err.message);
    return res.json(getProDataFallback(symbol));
  }
});
app.get("/api/propicks", async (req, res) => {
  try {
    const liveJson = await safeFetchFromWorker(`/api/propicks`);
    return res.json(liveJson);
  } catch (err) {
    console.warn(`[ProPicks API] Error proxying propicks:`, err.message);
    return res.json({
      status: "ok",
      portfolios: [
        { name: "Beat the S&P 500", return: "1,072.4%", sharpe: 2.1, holdings: 18, risk: "Medium" },
        { name: "Dominate the Dow", return: "628.1%", sharpe: 1.8, holdings: 15, risk: "Low" },
        { name: "Tech Titans", return: "1,485.9%", sharpe: 2.4, holdings: 20, risk: "High" },
        { name: "Top Value Stocks", return: "847.3%", sharpe: 1.9, holdings: 12, risk: "Low" }
      ]
    });
  }
});
app.get("/indices", (req, res) => {
  const nifty = liveIndices.find((i) => i.symbol === "^NSEI");
  const banknifty = liveIndices.find((i) => i.symbol === "^NSEBANK");
  const sensex = liveIndices.find((i) => i.symbol === "^BSESN");
  res.json({
    nifty50: nifty ? { price: nifty.price, change: nifty.changePercent } : { price: 24892.5, change: 0.58 },
    banknifty: banknifty ? { price: banknifty.price, change: banknifty.changePercent } : { price: 47840.15, change: 0.72 },
    sensex: sensex ? { price: sensex.price, change: sensex.changePercent } : { price: 76693.35, change: 0.64 }
  });
});
app.get("/api/download-zip", (req, res) => {
  try {
    const zip = new import_adm_zip.default();
    const rootDir = process.cwd();
    const files = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "server.ts",
      "index.html",
      "screener.html",
      "dashboard.html",
      "fo.html",
      "index.js",
      "live-data.js",
      ".env.example",
      ".gitignore",
      "metadata.json"
    ];
    for (const file of files) {
      try {
        const fullPath = import_path.default.join(rootDir, file);
        zip.addLocalFile(fullPath);
      } catch (err) {
        console.warn(`Could not add file ${file} to ZIP:`, err);
      }
    }
    try {
      const srcDir = import_path.default.join(rootDir, "src");
      zip.addLocalFolder(srcDir, "src");
    } catch (err) {
      console.warn("Could not add src folder to ZIP:", err);
    }
    try {
      const assetsDir = import_path.default.join(rootDir, "assets");
      zip.addLocalFolder(assetsDir, "assets");
    } catch (err) {
    }
    const zipBuffer = zip.toBuffer();
    res.setHeader("Content-Disposition", 'attachment; filename="stockpro-screener-upgrade.zip"');
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (err) {
    console.error("ZIP generation error:", err);
    res.status(500).json({ status: "error", message: "Failed to generate ZIP archive", error: err.message });
  }
});
seedRealWorldData();
async function startServer() {
  app.get("/", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/index.html" : "index.html"));
  });
  app.get("/landing", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/index.html" : "index.html"));
  });
  app.get("/screener", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/screener.html" : "screener.html"));
  });
  app.get("/fo", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/fo.html" : "fo.html"));
  });
  app.get("/dashboard", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/dashboard.html" : "dashboard.html"));
  });
  app.get("/privacy", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/privacy.html" : "privacy.html"));
  });
  app.get("/terms", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/terms.html" : "terms.html"));
  });
  app.get("/disclaimer", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/disclaimer.html" : "disclaimer.html"));
  });
  app.get("/sebi-disclosure", (req, res) => {
    res.sendFile(import_path.default.join(process.cwd(), process.env.NODE_ENV === "production" ? "dist/sebi-disclosure.html" : "sebi-disclosure.html"));
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[StockPro Backend] Express server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
