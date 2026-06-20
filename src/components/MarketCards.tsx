import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { IndexData } from '../types';

interface MarketCardsProps {
  indices: IndexData[];
  onSelectIndex: (symbol: string) => void;
}

export default function MarketCards({ indices, onSelectIndex }: MarketCardsProps) {
  
  // Renders a high-fidelity SVG sparkline from an array of numbers
  const renderSparkline = (data: number[], isPositive: boolean) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const width = 120;
    const height = 40;
    const padding = 2;
    
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
      })
      .join(' ');

    const strokeColor = isPositive ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)'; // Tailwind emerald-400 / rose-400
    const fillColor = isPositive ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)';

    // Path for SVG area fill
    const fillPath = `M ${padding},${height} L ${points} L ${width - padding},${height} Z`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path d={fillPath} fill={fillColor} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const formatPrice = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="indices_grid">
      {indices.map(idx => {
        const isPositive = idx.change >= 0;
        return (
          <div
            key={idx.symbol}
            onClick={() => onSelectIndex(idx.symbol)}
            id={`index-card-${idx.symbol.toLowerCase().replace('^', '')}`}
            className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 p-4 rounded-xl cursor-pointer shadow-sm dark:shadow hover:shadow-md dark:hover:shadow-lg transition-all duration-300 flex items-center justify-between group"
          >
            <div className="flex-1">
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] block uppercase tracking-wider">
                {idx.name}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-sans font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-mono">
                  {formatPrice(idx.price)}
                </span>
                <span className={`flex items-center text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span className="font-mono">{isPositive ? '+' : ''}{idx.changePercent}%</span>
                </span>
              </div>
              <p className={`text-[10px] font-mono mt-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} font-medium`}>
                {isPositive ? '+' : ''}{typeof idx.change === 'number' ? idx.change.toFixed(2) : Number(idx.change || 0).toFixed(2)}
              </p>
            </div>
            
            {/* Embedded Sparkline Graphic */}
            <div className="ml-4 pl-2 opacity-85 group-hover:opacity-100 transition-opacity">
              {renderSparkline(idx.sparkline, isPositive)}
            </div>
          </div>
        );
      })}
    </section>
  );
}
