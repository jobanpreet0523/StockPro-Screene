import LightweightStockChart, { type StockCandle } from './LightweightStockChart';

export default function CrtCandlePreviewChart({ candles, symbol }: { candles: StockCandle[]; symbol?: string }) {
  return (
    <LightweightStockChart
      data={candles}
      height={260}
      ariaLabel={symbol ? `CRT candle preview for ${symbol}` : 'CRT candle preview'}
    />
  );
}
