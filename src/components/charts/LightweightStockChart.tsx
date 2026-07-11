import { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, type CandlestickData, type Time } from 'lightweight-charts';
import ChartEmptyState from './ChartEmptyState';

export interface StockCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LightweightStockChartProps {
  data: StockCandle[];
  height?: number;
  ariaLabel?: string;
}

export default function LightweightStockChart({ data, height = 320, ariaLabel = 'OHLCV price chart' }: LightweightStockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const chart = createChart(containerRef.current, {
      height,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.16)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.16)' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      borderVisible: false,
    });
    series.setData(data as CandlestickData<Time>[]);
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [data, height]);

  if (data.length === 0) return <ChartEmptyState />;
  return <div ref={containerRef} style={{ height }} role="img" aria-label={ariaLabel} />;
}
