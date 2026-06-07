import React, { useEffect, useState, useMemo } from 'react';
import { HelpCircle, RefreshCw, Calculator, ArrowUpRight, ArrowDownRight, ShieldCheck, PlayCircle, PlusCircle, Trash2, TrendingUp } from 'lucide-react';
import { OptionChain, OptionData, Position } from '../types';

interface OptionChainViewProps {
  symbol: string;
  onOrderAdded?: (pos: Position) => void;
}

export default function OptionChainView({ symbol, onOrderAdded }: OptionChainViewProps) {
  const [chain, setChain] = useState<OptionChain | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStrike, setSelectedStrike] = useState<OptionData | null>(null);
  const [simPositions, setSimPositions] = useState<Position[]>([]);
  const [simDirection, setSimDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [simOptionType, setSimOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [simQty, setSimQty] = useState<number>(50); // Lot size default for index

  // Fetch option chain data from Express API
  useEffect(() => {
    async function fetchChain() {
      setLoading(true);
      try {
        const cleanSymbol = symbol.endsWith('.NS') ? symbol.replace('.NS', '') : symbol;
        const res = await fetch(`/api/option-chain/${cleanSymbol}`);
        const json = await res.json();
        if (json.status === 'ok') {
          setChain(json.data);
          // Set anchor strike as default focus
          if (json.data.options && json.data.options.length > 10) {
            setSelectedStrike(json.data.options[10]);
          }
        }
      } catch (err) {
        console.error('Error fetching option chain:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChain();

    // Auto-ticking polling every 4 seconds to simulate live option updates
    const timer = setInterval(fetchChain, 4000);
    return () => clearInterval(timer);
  }, [symbol]);

  // Calculations for Option payoff diagrams
  const minStrategyPrice = chain ? chain.spotPrice * 0.88 : 0;
  const maxStrategyPrice = chain ? chain.spotPrice * 1.12 : 0;
  const payoffDataPointsCount = 20;

  const payoffPoints = useMemo(() => {
    if (simPositions.length === 0 || !chain) return [];
    
    const points: { price: number, pnl: number }[] = [];
    const step = (maxStrategyPrice - minStrategyPrice) / payoffDataPointsCount;

    for (let i = 0; i <= payoffDataPointsCount; i++) {
      const testPrice = minStrategyPrice + i * step;
      let totalPnL = 0;

      for (const pos of simPositions) {
        const underlyingStrike = pos.strike || 0;
        let pnlAtExpiry = 0;

        if (pos.optionType === 'CALL') {
          const payoff = Math.max(0, testPrice - underlyingStrike);
          pnlAtExpiry = pos.direction === 'BUY' 
            ? (payoff - pos.entryPrice) * pos.quantity 
            : (pos.entryPrice - payoff) * pos.quantity;
        } else {
          const payoff = Math.max(0, underlyingStrike - testPrice);
          pnlAtExpiry = pos.direction === 'BUY' 
            ? (payoff - pos.entryPrice) * pos.quantity 
            : (pos.entryPrice - payoff) * pos.quantity;
        }
        totalPnL += pnlAtExpiry;
      }

      points.push({ price: Math.round(testPrice), pnl: Math.round(totalPnL) });
    }
    return points;
  }, [simPositions, chain, minStrategyPrice, maxStrategyPrice]);

  const handleAddPositionFromStrike = (strike: OptionData, type: 'CALL' | 'PUT', direction: 'BUY' | 'SELL') => {
    const ltp = type === 'CALL' ? strike.callLtp : strike.putLtp;
    const newPos: Position = {
      id: Math.random().toString(36).substring(3),
      symbol: symbol,
      type: type === 'CALL' ? 'CE' : 'PE',
      strike: strike.strikePrice,
      optionType: type,
      direction: direction,
      entryPrice: ltp,
      currentPrice: ltp,
      quantity: simQty
    };

    setSimPositions(prev => [...prev, newPos]);
    if (onOrderAdded) onOrderAdded(newPos);
  };

  const handleRemovePosition = (id: string) => {
    setSimPositions(prev => prev.filter(p => p.id !== id));
  };

  const formatVolume = (vol: number) => {
    if (vol >= 100000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toLocaleString();
  };

  if (loading && !chain) {
    return (
      <div className="h-[400px] flex items-center justify-center text-xs text-slate-400 font-mono bg-slate-950 border border-slate-800 rounded-xl" id="option_chain_loader">
        Constructing derivative math matrix...
      </div>
    );
  }

  if (!chain) {
    return (
      <div className="h-[400px] flex items-center justify-center text-xs text-slate-400 font-mono bg-slate-950 border border-slate-800 rounded-xl">
        Failed to compile Option dataset
      </div>
    );
  }

  // Intermediary details
  const spot = chain.spotPrice;
  const pcrVal = chain.pcr;
  const getPcrSentiment = (p: number) => {
    if (p > 1.4) return 'Strong Bullish / Overbought support';
    if (p > 1.05) return 'Mild Bullish build-up';
    if (p > 0.85) return 'Standard Neutral Range';
    if (p > 0.6) return 'Bearish / Hard resistance';
    return 'Extreme Bearish / Oversold pressure';
  };

  return (
    <div className="flex flex-col gap-6" id="option_chain_workspace">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
        <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Spot Price</span>
          <span className="text-base font-extrabold text-white mt-1 block font-mono">
            ₹{spot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5 font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ticking Live
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Put-Call Ratio (PCR)</span>
          <span className="text-base font-extrabold text-purple-400 mt-1 block font-mono">
            {pcrVal}
          </span>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
            {getPcrSentiment(pcrVal)}
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Estimated MAX PAIN</span>
          <span className="text-base font-extrabold text-rose-400 mt-1 block font-mono">
            ₹{chain.maxPain.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-405 truncate block mt-0.5">
            Key expiration target for option sellers
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Aggregate Open Interest</span>
          <div className="flex items-center justify-between mt-1 text-xs font-mono text-slate-300">
            <div>
              <span className="text-[9px] text-slate-450 block font-bold">CALLS</span>
              <span className="text-xs text-rose-400 font-semibold">{formatVolume(chain.totalCallOi)}</span>
            </div>
            <span className="text-slate-600">/</span>
            <div className="text-right">
              <span className="text-[9px] text-slate-450 block font-bold font-sans">PUTS</span>
              <span className="text-xs text-emerald-400 font-semibold">{formatVolume(chain.totalPutOi)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Option Chain side-by-side Sheet Grid */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center px-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
            Derivatives Matrix ({chain.symbol}) — Expiry: {chain.expiryDate}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800/40">
            ITM Golden Highlight Enabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              {/* Calls Side / Strike / Puts Side Labels */}
              <tr className="border-b border-slate-800 bg-slate-950 font-sans text-[10px] font-extrabold text-center uppercase text-slate-400">
                <th colSpan={6} className="py-2 border-r border-slate-850 text-rose-400 bg-rose-950/5">Calls Derivatives</th>
                <th colSpan={1} className="py-2 border-r border-slate-800 bg-slate-900">Spot</th>
                <th colSpan={6} className="py-2 text-emerald-400 bg-emerald-950/5">Puts Derivatives</th>
              </tr>
              {/* Header Parameters */}
              <tr className="border-b border-slate-850 text-[9px] text-slate-400 text-center font-bold">
                <th className="py-2 px-2">OI (Lot)</th>
                <th className="py-2 px-1 text-center">Chg OI</th>
                <th className="py-2 px-1 text-right">Volume</th>
                <th className="py-2 px-1">IV %</th>
                <th className="py-2 px-2 text-right">LTP (₹)</th>
                <th className="py-2 px-1 text-center border-r border-slate-850">% Chg</th>
                
                <th className="py-2 px-3 text-white bg-slate-900 font-bold border-r border-slate-800 text-center">STRIKE</th>
                
                <th className="py-2 px-1 text-center font-semibold border-r border-slate-800">% Chg</th>
                <th className="py-2 px-2 text-left">LTP (₹)</th>
                <th className="py-2 px-1">IV %</th>
                <th className="py-2 px-1 text-left">Volume</th>
                <th className="py-2 px-1 text-center">Chg OI</th>
                <th className="py-2 px-2">OI (Lot)</th>
              </tr>
            </thead>
            <tbody>
              {chain.options.map(option => {
                const strike = option.strikePrice;
                // Calls are ITM when spot > strike
                const isCallItm = spot > strike;
                // Puts are ITM when spot < strike
                const isPutItm = spot < strike;

                return (
                  <tr
                    key={strike}
                    className="border-b border-slate-850/60 hover:bg-slate-900/20 text-center select-none"
                  >
                    {/* CALLS */}
                    <td className={`py-2 px-2 text-slate-350 border-l ${isCallItm ? 'bg-[#292211]/30 font-bold' : ''}`}>
                      {formatVolume(option.callOi)}
                    </td>
                    <td className={`py-2 px-1 ${option.callOiChg >= 0 ? 'text-emerald-400' : 'text-rose-400'} ${isCallItm ? 'bg-[#292211]/30' : ''}`}>
                      {option.callOiChg >= 0 ? '+' : ''}{formatVolume(option.callOiChg)}
                    </td>
                    <td className={`py-2 px-1 text-right text-slate-450 ${isCallItm ? 'bg-[#292211]/30' : ''}`}>
                      {formatVolume(option.callVol)}
                    </td>
                    <td className={`py-2 px-1 text-slate-400 text-[10px] ${isCallItm ? 'bg-[#292211]/30' : ''}`}>
                      {option.callIv}%
                    </td>
                    
                    {/* LTP - Click trigger simulation */}
                    <td
                      onClick={() => handleAddPositionFromStrike(option, 'CALL', 'BUY')}
                      title="Click to Simulate BUY CALL Order"
                      className={`py-2 px-2 text-right font-semibold text-emerald-400 hover:bg-emerald-900 hover:text-white cursor-pointer active:scale-95 transition ${
                        isCallItm ? 'bg-[#403310]/50' : 'bg-slate-950/20'
                      }`}
                    >
                      {option.callLtp.toFixed(1)}
                    </td>
                    <td className={`py-2 px-1 text-center border-r border-slate-850 text-[10px] ${option.callChange >= 0 ? 'text-emerald-400' : 'text-rose-400'} ${isCallItm ? 'bg-[#292211]/30' : ''}`}>
                      {option.callChange >= 0 ? '+' : ''}{option.callChange}%
                    </td>

                    {/* STRIKE PRICE */}
                    <td className="py-2 px-3 text-white bg-slate-900/90 font-extrabold text-[12px] border-r border-slate-800 text-center">
                      {strike}
                    </td>

                    {/* PUTS */}
                    <td className={`py-2 px-1 text-center border-r border-slate-800 text-[10px] ${option.putChange >= 0 ? 'text-emerald-400' : 'text-rose-400'} ${isPutItm ? 'bg-[#292211]/30' : ''}`}>
                      {option.putChange >= 0 ? '+' : ''}{option.putChange}%
                    </td>
                    <td
                      onClick={() => handleAddPositionFromStrike(option, 'PUT', 'BUY')}
                      title="Click to Simulate BUY PUT Order"
                      className={`py-2 px-2 text-left font-semibold text-emerald-400 hover:bg-emerald-900 hover:text-white cursor-pointer active:scale-95 transition ${
                        isPutItm ? 'bg-[#403310]/50' : 'bg-slate-950/20'
                      }`}
                    >
                      {option.putLtp.toFixed(1)}
                    </td>
                    <td className={`py-2 px-1 text-slate-400 text-[10px] ${isPutItm ? 'bg-[#292211]/30' : ''}`}>
                      {option.putIv}%
                    </td>
                    <td className={`py-2 px-1 text-left text-slate-450 ${isPutItm ? 'bg-[#292211]/30' : ''}`}>
                      {formatVolume(option.putVol)}
                    </td>
                    <td className={`py-2 px-1 ${option.putOiChg >= 0 ? 'text-emerald-400' : 'text-rose-400'} ${isPutItm ? 'bg-[#292211]/30' : ''}`}>
                      {option.putOiChg >= 0 ? '+' : ''}{formatVolume(option.putOiChg)}
                    </td>
                    <td className={`py-2 px-2 text-slate-350 border-r border-slate-850 ${isPutItm ? 'bg-[#292211]/30 font-bold' : ''}`}>
                      {formatVolume(option.putOi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DERIVATIVES STRATEGY BOARD (Simulator) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl" id="strategy_simulator">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator size={15} className="text-emerald-400" />
              Interactive Derivatives Strategy Simulator
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Click LTP values in the option chain above to pile positions into a test model and calculate payload outcomes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono font-medium">Model Multipliers Lot Qty:</span>
            <input
              type="number"
              value={simQty}
              onChange={(e) => setSimQty(Math.max(1, Number(e.target.value)))}
              className="bg-slate-900 border border-slate-800 text-center h-7 w-16 text-xs text-white rounded font-mono"
            />
          </div>
        </div>

        {simPositions.length === 0 ? (
          <div className="py-12 border-2 border-slate-850 border-dashed rounded-xl text-center text-xs font-mono text-slate-500">
            No derivative positions queued yet. Click option premiums in the LTP columns above to design custom payload profiles!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Queued Position Rows */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-450 block font-sans tracking-wide">Simulator Ledger</span>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {simPositions.map(pos => {
                  const isBuy = pos.direction === 'BUY';
                  const premiumPaidRec = pos.entryPrice * pos.quantity;
                  return (
                    <div
                      key={pos.id}
                      className="p-3 bg-slate-900 border border-slate-850/80 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white ${isBuy ? 'bg-indigo-900/60 border border-indigo-700/50' : 'bg-amber-950/60 border border-amber-700/50'}`}>
                            {pos.direction}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {pos.symbol.replace('.NS', '')} {pos.strike} {pos.optionType}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-400 mt-1.5 font-mono">
                          <span>Avg Entry: <span className="text-white font-semibold">₹{pos.entryPrice}</span></span>
                          <span>Qty: <span className="text-white font-semibold">{pos.quantity}</span></span>
                          <span>Cap: <span className="text-emerald-405 font-bold">₹{premiumPaidRec.toLocaleString()}</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePosition(pos.id)}
                        className="p-1 px-2 text-rose-450 hover:bg-rose-950/50 hover:text-rose-400 rounded transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setSimPositions([])}
                className="text-[10px] text-rose-400 font-bold bg-rose-950/20 hover:bg-rose-900 hover:text-white py-1.5 rounded transition self-end px-4 mt-2"
              >
                Flush Ledger
              </button>
            </div>

            {/* Right Column: Dynamic Payoff Visual Vector Chart */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-455 block font-sans tracking-wide">Payout Profile Expiry Projection</span>
              <div className="flex-1 min-h-[180px] bg-slate-950 rounded-lg p-2 flex flex-col justify-end border border-slate-900 relative">
                {/* Visual vectors projection svg bar lines */}
                <div className="absolute inset-x-4 top-4 flex justify-between font-mono text-[9px] text-slate-500">
                  <span>-12% Spot</span>
                  <span>PCR Target {pcrVal}</span>
                  <span>+12% Spot</span>
                </div>
                
                {/* Plot outline */}
                <div className="w-full h-[140px] flex items-end justify-between px-2 relative">
                  {/* Zero Line Marker */}
                  <div className="absolute left-0 right-0 top-[70px] h-[1px] bg-slate-800 border-dashed" />
                  
                  {/* Payoff Plot SVG curve */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#818cf8" // Tailwind Indigo-400
                      strokeWidth="2.1"
                      points={payoffPoints.map((pt, i) => {
                        const x = (i / (payoffPoints.length - 1)) * 360; // scale nicely
                        // Scale payload: range of pnl
                        const pnls = payoffPoints.map(p => p.pnl);
                        const maxPnl = Math.max(...pnls.map(Math.abs), 500);
                        const y = 70 - (pt.pnl / maxPnl) * 60;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    
                    {/* Expiry anchors */}
                    {payoffPoints.map((pt, i) => {
                      if (i % 4 === 0) {
                        const x = (i / (payoffPoints.length - 1)) * 360;
                        const pnls = payoffPoints.map(p => p.pnl);
                        const maxPnl = Math.max(...pnls.map(Math.abs), 500);
                        const y = 70 - (pt.pnl / maxPnl) * 60;
                        const isGain = pt.pnl >= 0;

                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="3" fill={isGain ? '#10b981' : '#f43f5e'} />
                            <text
                              x={x}
                              y={y > 70 ? y - 8 : y + 12}
                              fontSize="8px"
                              fill="#64748b"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              ₹{pt.price}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    })}
                  </svg>
                </div>
                
                <div className="flex border-t border-slate-900 pt-2 items-center justify-between text-[10px] text-slate-400 px-2 mt-4 font-mono">
                  <span>Strategy Outlook:</span>
                  <span className={`font-bold ${payoffPoints[payoffPoints.length-1]?.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {payoffPoints[payoffPoints.length-1]?.pnl >= 0 ? 'Net Bullish Payoff' : 'Net Bearish Hedged'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
