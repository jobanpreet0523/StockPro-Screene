import React, { useState, useEffect, useRef } from 'react';
import { Activity, CandlestickChart, LineChart, ToggleLeft, TrendingUp, Settings, HelpCircle, FileBarChart2 } from 'lucide-react';
import { ChartDataPoint } from '../types';

interface StockChartProps {
  symbol: string;
  name: string;
}

export default function StockChart({ symbol, name }: StockChartProps) {
  const [interval, setInterval] = useState<string>('1D');
  const [candles, setCandles] = useState<ChartDataPoint[]>([]);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [loading, setLoading] = useState<boolean>(true);
  const [overlays, setOverlays] = useState<Record<string, boolean>>({
    sma20: true,
    ema50: false,
    bollinger: false
  });
  const [subChart, setSubChart] = useState<'none' | 'rsi' | 'macd'>('rsi');
  
  // Crosshair interactive coordinates state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number, y: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Fetch candle data from backend
  useEffect(() => {
    async function fetchChart() {
      setLoading(true);
      try {
        const res = await fetch(`/api/chart/${symbol}?interval=${interval}`);
        const json = await res.json();
        if (json.status === 'ok') {
          setCandles(json.data);
        }
      } catch (err) {
        console.error('Error fetching candles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChart();

    // Auto-update feed for short intervals (1m / 5m)
    let updateTimer: NodeJS.Timeout | null = null;
    if (interval.endsWith('m')) {
      updateTimer = globalThis.setInterval(fetchChart, 6000);
    }
    return () => {
      if (updateTimer) clearInterval(updateTimer);
    };
  }, [symbol, interval]);

  // Dimension helpers for SVG rendering
  const width = 800;
  const mainHeight = 300;
  const subHeight = 100;
  const paddingRight = 65;
  const paddingLeft = 15;
  const paddingTop = 25;
  const paddingBottom = 20;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = mainHeight - paddingTop - paddingBottom;

  // Extract price scale
  const prices = candles.map(c => c.close);
  const highPrices = candles.map(c => {
    let max = c.high;
    if (overlays.bollinger && c.upperBand) max = Math.max(max, c.upperBand);
    return max;
  });
  const lowPrices = candles.map(c => {
    let min = c.low;
    if (overlays.bollinger && c.lowerBand) min = Math.min(min, c.lowerBand);
    return min;
  });

  const maxPrice = Math.max(...highPrices, 1) * 1.008;
  const minPrice = Math.min(...lowPrices, 0) * 0.992;
  const priceRange = maxPrice - minPrice || 1;

  // Render prices helper
  const getY = (price: number) => {
    return mainHeight - paddingBottom - ((price - minPrice) / priceRange) * plotHeight;
  };

  const getX = (index: number) => {
    if (candles.length <= 1) return paddingLeft;
    return paddingLeft + (index / (candles.length - 1)) * plotWidth;
  };

  // Convert volume bars to scale
  const maxVolume = Math.max(...candles.map(c => c.volume), 1);

  // SVG Paths Generators
  const getLinePath = () => {
    if (candles.length === 0) return '';
    return candles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.close)}`).join(' ');
  };

  const getIndicatorPath = (field: 'sma20' | 'ema50' | 'upperBand' | 'lowerBand') => {
    const points: string[] = [];
    candles.forEach((c, i) => {
      const val = c[field];
      if (val !== undefined) {
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`);
      }
    });
    return points.join(' ');
  };

  // Draw RSI path
  const getRSIPath = () => {
    const points: string[] = [];
    candles.forEach((c, i) => {
      if (c.rsi !== undefined) {
        const y = subHeight - 15 - (c.rsi / 100) * (subHeight - 30);
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(i)} ${y}`);
      }
    });
    return points.join(' ');
  };

  // Draw MACD paths
  const getMACDPath = (field: 'macdLine' | 'signalLine') => {
    const points: string[] = [];
    const values = candles.map(c => c[field]).filter((x): x is number => x !== undefined);
    if (values.length === 0) return '';
    const maxVal = Math.max(...values.map(v => Math.abs(v)));
    const range = maxVal * 2 || 1;

    candles.forEach((c, i) => {
      const val = c[field];
      if (val !== undefined) {
        const y = subHeight / 2 - (val / range) * (subHeight - 20);
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(i)} ${y}`);
      }
    });
    return points.join(' ');
  };

  // Grid lines helper
  const horizontalGridPrices = [
    minPrice + priceRange * 0.2,
    minPrice + priceRange * 0.4,
    minPrice + priceRange * 0.6,
    minPrice + priceRange * 0.8
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (candles.length === 0 || !chartContainerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    // Map x position to index
    const relativeX = xPos / rect.width;
    const index = Math.max(0, Math.min(candles.length - 1, Math.round(relativeX * (candles.length - 1))));
    setHoverIndex(index);
    setHoverCoords({ x: (index / (candles.length - 1)) * rect.width, y: yPos });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoverCoords(null);
  };

  const activeCandle = hoverIndex !== null ? candles[hoverIndex] : candles[candles.length - 1];

  const formatLargePrice = (val: number) => {
    return val >= 1000 ? val.toLocaleString(undefined, { maximumFractionDigits: 1 }) : val.toFixed(2);
  };

  return (
    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl mb-6 flex flex-col" ref={chartContainerRef} id="chart_section">
      {/* Chart Headers and controls */}
      <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-850">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono tracking-tight text-white">{symbol}</span>
            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{name}</span>
          </div>
          
          {/* Live metadata overlay */}
          {activeCandle && (
            <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-[10px] text-slate-400">
              <span>O: <span className="text-white font-bold">{activeCandle.open}</span></span>
              <span>H: <span className="text-emerald-400 font-bold">{activeCandle.high}</span></span>
              <span>L: <span className="text-rose-400 font-bold">{activeCandle.low}</span></span>
              <span>C: <span className="text-white font-bold">{activeCandle.close}</span></span>
              <span>Vol: <span className="text-slate-200 font-bold">{(activeCandle.volume / 1000).toFixed(0)}K</span></span>
              {activeCandle.rsi && <span>RSI: <span className="text-purple-400 font-bold">{activeCandle.rsi}</span></span>}
            </div>
          )}
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Interval Pick */}
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px]" id="chart_intervals">
            {['1m', '5m', '15m', '1H', '1D', '1W'].map(it => (
              <button
                key={it}
                onClick={() => setInterval(it)}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                  interval === it
                    ? 'bg-emerald-950 text-emerald-400 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {it}
              </button>
            ))}
          </div>

          {/* Chart Type Trigger */}
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setChartType('candle')}
              title="Candlestick Chart"
              className={`p-1.5 rounded cursor-pointer transition ${chartType === 'candle' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
            >
              <CandlestickChart size={14} />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`p-1.5 rounded cursor-pointer transition ${chartType === 'line' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
            >
              <LineChart size={14} />
            </button>
          </div>

          {/* Indicator toggles */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-350 border-l border-slate-800 pl-3">
            <button
              onClick={() => setOverlays(p => ({ ...p, sma20: !p.sma20 }))}
              className={`px-2 py-1 rounded-md border font-bold transition ${overlays.sma20 ? 'bg-yellow-950/40 border-yellow-500/35 text-yellow-500' : 'bg-transparent border-slate-800 hover:text-white'}`}
            >
              SMA 20
            </button>
            <button
              onClick={() => setOverlays(p => ({ ...p, ema50: !p.ema50 }))}
              className={`px-2 py-1 rounded-md border font-bold transition ${overlays.ema50 ? 'bg-indigo-950/40 border-indigo-500/35 text-indigo-500' : 'bg-transparent border-slate-800 hover:text-white'}`}
            >
              EMA 50
            </button>
            <button
              onClick={() => setOverlays(p => ({ ...p, bollinger: !p.bollinger }))}
              className={`px-2 py-1 rounded-md border font-bold transition ${overlays.bollinger ? 'bg-cyan-950/40 border-cyan-500/35 text-cyan-500' : 'bg-transparent border-slate-800 hover:text-white'}`}
            >
              BBands
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Area */}
      {loading ? (
        <div className="h-[400px] flex items-center justify-center text-xs text-slate-400 font-mono">
          Loading charts vectors...
        </div>
      ) : candles.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center text-xs text-slate-450 font-mono">
          No chart candles available
        </div>
      ) : (
        <div className="w-full select-none">
          <svg
            viewBox={`0 0 ${width} ${mainHeight}`}
            className="w-full overflow-visible border-b border-slate-850/50"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background horizontal pricing grids */}
            {horizontalGridPrices.map((p, i) => (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={getY(p)}
                  x2={width - paddingRight}
                  y2={getY(p)}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - paddingRight + 5}
                  y={getY(p) + 4}
                  fill="#64748b"
                  fontSize="9px"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {formatLargePrice(p)}
                </text>
              </g>
            ))}

            {/* In-Chart Volume Indicators (Translucent layer in Background) */}
            {candles.map((c, i) => {
              const barHeight = (c.volume / maxVolume) * plotHeight * 0.22;
              const barWidth = plotWidth / candles.length * 0.72;
              const xIdx = getX(i) - barWidth / 2;
              const yIdx = mainHeight - paddingBottom - barHeight;
              const isGain = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={xIdx}
                  y={yIdx}
                  width={barWidth}
                  height={barHeight}
                  fill={isGain ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)'}
                />
              );
            })}

            {/* BOLLINGER BANDS GRID OVERLAY */}
            {overlays.bollinger && (
              <>
                {/* Upper curve */}
                <path d={getIndicatorPath('upperBand')} fill="none" stroke="rgba(6, 182, 212, 0.55)" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Lower curve */}
                <path d={getIndicatorPath('lowerBand')} fill="none" stroke="rgba(6, 182, 212, 0.55)" strokeWidth="1.2" strokeDasharray="3 3" />
              </>
            )}

            {/* SMA 20 OVERLAY */}
            {overlays.sma20 && (
              <path d={getIndicatorPath('sma20')} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            )}

            {/* EMA 50 OVERLAY */}
            {overlays.ema50 && (
              <path d={getIndicatorPath('ema50')} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
            )}

            {/* Main price representation */}
            {chartType === 'line' ? (
              <path
                d={getLinePath()}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              // Candlesticks layout
              candles.map((c, i) => {
                const xIdx = getX(i);
                const isGain = c.close >= c.open;
                const candleColor = isGain ? '#34d399' : '#f87171';
                const wickColor = isGain ? '#10b981' : '#ef4444';

                // Box geometry
                const topVal = Math.max(c.open, c.close);
                const botVal = Math.min(c.open, c.close);
                const boxY = getY(topVal);
                const boxHeight = Math.max(1.8, getY(botVal) - boxY);
                const scaleWidth = Math.max(1.8, (plotWidth / candles.length) * 0.65);

                return (
                  <g key={i}>
                    {/* Wick Line */}
                    <line
                      x1={xIdx}
                      y1={getY(c.high)}
                      x2={xIdx}
                      y2={getY(c.low)}
                      stroke={wickColor}
                      strokeWidth="1.1"
                    />
                    {/* Body Box */}
                    <rect
                      x={xIdx - scaleWidth / 2}
                      y={boxY}
                      width={scaleWidth}
                      height={boxHeight}
                      fill={candleColor}
                      stroke={wickColor}
                      strokeWidth="1"
                    />
                  </g>
                );
              })
            )}

            {/* Hover details crosshair */}
            {hoverIndex !== null && hoverCoords && (
              <>
                {/* Vertical hair */}
                <line
                  x1={getX(hoverIndex)}
                  y1={paddingTop}
                  x2={getX(hoverIndex)}
                  y2={mainHeight - paddingBottom}
                  stroke="#475569"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                {/* Prices Bubble Tracker label */}
                <g transform={`translate(${width - paddingRight + 2}, ${getY(activeCandle.close) - 6})`}>
                  <rect width="52" height="13" rx="2" fill="#334155" />
                  <text x="26" y="9" fill="white" fontSize="8px" fontFamily="monospace" textAnchor="middle">
                    {activeCandle.close.toFixed(1)}
                  </text>
                </g>
                <circle cx={getX(hoverIndex)} cy={getY(activeCandle.close)} r="4.5" fill="#10b981" stroke="white" strokeWidth="1" />
              </>
            )}

            {/* Time labels axis */}
            {candles.map((c, i) => {
              if (i % Math.round(candles.length / 5) === 0) {
                return (
                  <text
                    key={`time-${i}`}
                    x={getX(i)}
                    y={mainHeight - 5}
                    fill="#64748b"
                    fontSize="8px"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {c.time}
                  </text>
                );
              }
              return null;
            })}
          </svg>

          {/* SUB-TECHNICAL Indicators View (RSI or MACD Panels) */}
          <div className="mt-3" id="sub_panels">
            {/* View selectors */}
            <div className="flex border-b border-slate-900 pb-1.5 mb-2 gap-3 text-[10px] font-sans font-bold">
              <button
                onClick={() => setSubChart('rsi')}
                className={`flex items-center gap-1 cursor-pointer transition ${subChart === 'rsi' ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Activity size={10} />
                RSI (14 INDEX)
              </button>
              <button
                onClick={() => setSubChart('macd')}
                className={`flex items-center gap-1 cursor-pointer transition ${subChart === 'macd' ? 'text-indigo-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileBarChart2 size={10} />
                MACD (12, 26, 9 OSCILLA)
              </button>
              <button
                onClick={() => setSubChart('none')}
                className={`cursor-pointer transition ${subChart === 'none' ? 'text-white' : 'text-slate-550 hover:text-slate-300'}`}
              >
                CLOSE SUBPANEL
              </button>
            </div>

            {subChart === 'rsi' && (
              <svg viewBox={`0 0 ${width} ${subHeight}`} className="w-full bg-slate-950/30 overflow-visible rounded-lg p-1.5 border border-slate-900">
                {/* RSI levels bounds */}
                <line x1={paddingLeft} y1={subHeight - 15 - 0.7 * (subHeight - 30)} x2={width - paddingRight} y2={subHeight - 15 - 0.7 * (subHeight - 30)} stroke="rgba(244, 63, 94, 0.22)" strokeWidth="1.2" />
                <line x1={paddingLeft} y1={subHeight - 15 - 0.5 * (subHeight - 30)} x2={width - paddingRight} y2={subHeight - 15 - 0.5 * (subHeight - 30)} stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1.1" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={subHeight - 15 - 0.3 * (subHeight - 30)} x2={width - paddingRight} y2={subHeight - 15 - 0.3 * (subHeight - 30)} stroke="rgba(16, 185, 129, 0.22)" strokeWidth="1.2" />
                
                {/* Labels */}
                <text x={width - paddingRight + 5} y={subHeight - 15 - 0.7 * (subHeight - 30) + 3} fill="#f43f5e" fontSize="7.5px" fontFamily="monospace">70 OB</text>
                <text x={width - paddingRight + 5} y={subHeight - 15 - 0.3 * (subHeight - 30) + 3} fill="#10b981" fontSize="7.5px" fontFamily="monospace">30 OS</text>

                {/* RSI Line curve */}
                <path d={getRSIPath()} fill="none" stroke="#a855f7" strokeWidth="1.5" />

                {/* Vertical hair overlay */}
                {hoverIndex !== null && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={activeCandle.rsi !== undefined ? subHeight - 15 - (activeCandle.rsi / 100) * (subHeight - 30) : 0}
                    r="4"
                    fill="#a855f7"
                    stroke="white"
                    strokeWidth="1"
                  />
                )}
              </svg>
            )}

            {subChart === 'macd' && (
              <svg viewBox={`0 0 ${width} ${subHeight}`} className="w-full bg-slate-950/30 overflow-visible rounded-lg p-1.5 border border-slate-900">
                {/* Center baseline zero */}
                <line x1={paddingLeft} y1={subHeight / 2} x2={width - paddingRight} y2={subHeight / 2} stroke="#334155" strokeWidth="1" />

                {/* Histogram Bars */}
                {candles.map((c, i) => {
                  const hist = c.histogram;
                  if (hist === undefined) return null;
                  const values = candles.map(cc => cc.macdLine).filter((v): v is number => v !== undefined);
                  const maxVal = Math.max(...values.map(v => Math.abs(v))) || 1;
                  const scale = subHeight - 20;

                  const barHeight = (Math.abs(hist) / (maxVal * 2)) * scale;
                  const xIdx = getX(i);
                  const yIdx = hist >= 0 ? subHeight / 2 - barHeight : subHeight / 2;
                  const isPositive = hist >= 0;

                  return (
                    <rect
                      key={`hist-${i}`}
                      x={xIdx - (plotWidth / candles.length) * 0.25}
                      y={yIdx}
                      width={Math.max(1, (plotWidth / candles.length) * 0.5)}
                      height={Math.max(1, barHeight)}
                      fill={isPositive ? 'rgba(52, 211, 153, 0.45)' : 'rgba(248, 113, 113, 0.45)'}
                    />
                  );
                })}

                {/* Macd line plot and signal line curve */}
                <path d={getMACDPath('macdLine')} fill="none" stroke="#6366f1" strokeWidth="1.2" />
                <path d={getMACDPath('signalLine')} fill="none" stroke="#f59e0b" strokeWidth="1.2" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
