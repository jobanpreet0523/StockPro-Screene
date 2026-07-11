export const CRT_TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '12M'] as const;
export type CrtTimeframe = typeof CRT_TIMEFRAMES[number];
export type CrtMode = 'Forming' | 'Confirmed' | 'Completed';
export type CrtDirection = 'Bullish' | 'Bearish';

export interface CrtCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CrtScanFilters {
  exchange: 'NSE';
  segment: 'EQ';
  timeframe: CrtTimeframe;
  direction: CrtDirection | 'Both';
  mode: CrtMode;
  minPrice: number;
  maxPrice: number;
  minAverageVolume: number;
  minMarketCap?: number;
  sector?: string;
  minScore: number;
  minimumRiskReward: number;
  volumeConfirmation: boolean;
  trendFilter: boolean;
  emaPeriod: 20 | 50 | 100 | 200;
  excludeLowLiquidity: boolean;
  excludeInsufficientHistory: boolean;
  showWeakSetups: boolean;
}

export interface CrtInstrumentSnapshot {
  symbol: string;
  companyName: string;
  exchange: 'NSE';
  candles: CrtCandle[];
  marketCap?: number;
  sector?: string;
}

export interface CrtResult {
  symbol: string;
  companyName: string;
  exchange: 'NSE';
  timeframe: CrtTimeframe;
  direction: CrtDirection;
  label: 'Bullish CRT Candidate' | 'Bearish CRT Candidate';
  mode: CrtMode;
  crtCandleDate: string;
  capturedPrice: number;
  previousHigh: number;
  previousLow: number;
  sweepPrice: number;
  triggerLevel: number;
  invalidationLevel: number;
  target1: number;
  target2: number;
  riskReward: number;
  volumeStatus: 'Above average' | 'Below average' | 'Unavailable';
  trendStatus: 'Aligned' | 'Not aligned' | 'Unavailable';
  score: number;
  dataCapturedAt: string;
  scanRunId: string;
}

function bucketKey(time: string, timeframe: CrtTimeframe) {
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  if (timeframe === '1D') return time.slice(0, 10);
  if (timeframe === '1W') {
    const copy = new Date(Date.UTC(year, month, date.getUTCDate()));
    const day = copy.getUTCDay() || 7;
    copy.setUTCDate(copy.getUTCDate() - day + 1);
    return copy.toISOString().slice(0, 10);
  }
  if (timeframe === '1M') return `${year}-${String(month + 1).padStart(2, '0')}`;
  const size = timeframe === '3M' ? 3 : timeframe === '6M' ? 6 : 12;
  return `${year}-${Math.floor(month / size) * size + 1}`;
}

export function aggregateCandles(input: CrtCandle[], timeframe: CrtTimeframe) {
  const ordered = [...input].sort((a, b) => a.time.localeCompare(b.time));
  const groups = new Map<string, CrtCandle[]>();
  for (const candle of ordered) {
    const key = bucketKey(candle.time, timeframe);
    groups.set(key, [...(groups.get(key) || []), candle]);
  }
  return [...groups.values()].map((candles) => ({
    time: candles[0].time,
    open: candles[0].open,
    high: Math.max(...candles.map((c) => c.high)),
    low: Math.min(...candles.map((c) => c.low)),
    close: candles[candles.length - 1].close,
    volume: candles.reduce((total, c) => total + c.volume, 0),
  }));
}

function ema(values: number[], period: number) {
  if (!values.length) return null;
  const multiplier = 2 / (period + 1);
  return values.reduce((value, next) => next * multiplier + value * (1 - multiplier), values[0]);
}

export function evaluateCrtSnapshot(snapshot: CrtInstrumentSnapshot, filters: CrtScanFilters, scanRunId: string, capturedAt: string): CrtResult | null {
  const candles = aggregateCandles(snapshot.candles, filters.timeframe);
  if (candles.length < 3) return null;
  const averageVolume = candles.slice(-21, -1).reduce((sum, c) => sum + c.volume, 0) / Math.max(1, Math.min(20, candles.length - 1));
  const trend = ema(candles.map((c) => c.close), filters.emaPeriod);

  for (let index = candles.length - 2; index >= 1; index -= 1) {
    const previous = candles[index - 1];
    const current = candles[index];
    const following = candles.slice(index + 1);
    const bullish = current.low < previous.low && current.close > previous.low && current.close < previous.high;
    const bearish = current.high > previous.high && current.close < previous.high && current.close > previous.low;
    for (const direction of ['Bullish', 'Bearish'] as const) {
      if (filters.direction !== 'Both' && filters.direction !== direction) continue;
      const forming = direction === 'Bullish' ? bullish : bearish;
      if (!forming) continue;
      const triggerLevel = direction === 'Bullish' ? current.high : current.low;
      const invalidationLevel = direction === 'Bullish' ? current.low : current.high;
      const risk = Math.abs(triggerLevel - invalidationLevel);
      if (risk <= 0) continue;
      const confirmedIndex = following.findIndex((c) => direction === 'Bullish' ? c.high > triggerLevel : c.low < triggerLevel);
      const confirmed = confirmedIndex >= 0;
      const target1 = direction === 'Bullish' ? triggerLevel + risk * 2 : triggerLevel - risk * 2;
      const target2 = direction === 'Bullish' ? triggerLevel + risk * 3 : triggerLevel - risk * 3;
      const afterConfirmation = confirmed ? following.slice(confirmedIndex + 1) : [];
      const completed = afterConfirmation.some((c) => direction === 'Bullish'
        ? c.high >= target1 || c.low <= invalidationLevel
        : c.low <= target1 || c.high >= invalidationLevel);
      const mode: CrtMode = completed ? 'Completed' : confirmed ? 'Confirmed' : 'Forming';
      if (mode !== filters.mode) continue;

      const volumeAbove = current.volume > averageVolume;
      const trendAligned = trend == null ? false : direction === 'Bullish' ? current.close >= trend : current.close <= trend;
      const bodyStrength = Math.min(1, Math.abs(current.close - current.open) / Math.max(risk, Number.EPSILON));
      let score = 35;
      score += 20;
      if (volumeAbove) score += 15;
      if (trendAligned) score += 10;
      score += 10;
      score += Math.round(bodyStrength * 10);
      score = Math.min(100, score);

      if (current.close < filters.minPrice || current.close > filters.maxPrice) continue;
      if (filters.excludeLowLiquidity && averageVolume < filters.minAverageVolume) continue;
      if (filters.volumeConfirmation && !volumeAbove) continue;
      if (filters.trendFilter && !trendAligned) continue;
      if (snapshot.marketCap != null && filters.minMarketCap != null && snapshot.marketCap < filters.minMarketCap) continue;
      if (filters.sector && snapshot.sector !== filters.sector) continue;
      if (score < filters.minScore || (!filters.showWeakSetups && score < 40) || filters.minimumRiskReward > 2) continue;

      return {
        symbol: snapshot.symbol,
        companyName: snapshot.companyName,
        exchange: 'NSE',
        timeframe: filters.timeframe,
        direction,
        label: direction === 'Bullish' ? 'Bullish CRT Candidate' : 'Bearish CRT Candidate',
        mode,
        crtCandleDate: current.time,
        capturedPrice: candles[candles.length - 1].close,
        previousHigh: previous.high,
        previousLow: previous.low,
        sweepPrice: direction === 'Bullish' ? current.low : current.high,
        triggerLevel,
        invalidationLevel,
        target1,
        target2,
        riskReward: 2,
        volumeStatus: averageVolume ? volumeAbove ? 'Above average' : 'Below average' : 'Unavailable',
        trendStatus: trend == null ? 'Unavailable' : trendAligned ? 'Aligned' : 'Not aligned',
        score,
        dataCapturedAt: capturedAt,
        scanRunId,
      };
    }
  }
  return null;
}

export function defaultCrtFilters(): CrtScanFilters {
  return {
    exchange: 'NSE', segment: 'EQ', timeframe: '1D', direction: 'Both', mode: 'Forming',
    minPrice: 1, maxPrice: 100000, minAverageVolume: 100000, minScore: 60,
    minimumRiskReward: 2, volumeConfirmation: false, trendFilter: false, emaPeriod: 50,
    excludeLowLiquidity: true, excludeInsufficientHistory: true, showWeakSetups: false,
  };
}
