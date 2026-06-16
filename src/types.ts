export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number; // in Millions/Billions
  peRatio: number;
  rsi: number;
  dividendYield: number;
  sector: string;
  high: number;
  low: number;
  open: number;
  close: number;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  isFoEnabled: boolean;
  futuresOi?: number;
  futuresOiChange?: number;
  buildup?: 'Long Build-up' | 'Short Build-up' | 'Long Unwinding' | 'Short Covering';
}

export interface OptionData {
  strikePrice: number;
  callLtp: number;
  callChange: number;
  callVol: number;
  callOi: number;
  callOiChg: number;
  callIv: number;
  callDelta: number;
  putLtp: number;
  putChange: number;
  putVol: number;
  putOi: number;
  putOiChg: number;
  putIv: number;
  putDelta: number;
}

export interface OptionChain {
  symbol: string;
  spotPrice: number;
  pcr: number;
  totalCallOi: number;
  totalPutOi: number;
  maxPain: number;
  expiryDate: string;
  options: OptionData[];
}

export interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  ema50?: number;
  upperBand?: number;
  lowerBand?: number;
  rsi?: number;
  macdLine?: number;
  signalLine?: number;
  histogram?: number;
}

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface Position {
  id: string;
  symbol: string;
  type: 'CE' | 'PE' | 'FUT' | 'EQ';
  strike?: number;
  optionType?: 'CALL' | 'PUT';
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
}

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

