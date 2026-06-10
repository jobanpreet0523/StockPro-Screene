import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calculator } from 'lucide-react';

export default function OptionsCalculator() {
  const [optionType, setOptionType] = useState<'Call' | 'Put'>('Call');
  const [action, setAction] = useState<'Buy' | 'Sell'>('Buy');
  const [strikeValue, setStrikeValue] = useState<string>('22000');
  const [premiumValue, setPremiumValue] = useState<string>('150');
  const [lotSizeValue, setLotSizeValue] = useState<string>('50');
  const [lotsValue, setLotsValue] = useState<string>('1');
  const [targetSpotValue, setTargetSpotValue] = useState<string>('22300');

  const strike = Number(strikeValue) || 0;
  const premium = Number(premiumValue) || 0;
  const lotSize = Number(lotSizeValue) || 0;
  const lots = Number(lotsValue) || 0;
  const targetSpot = Number(targetSpotValue) || 0;
  const totalQty = lotSize * lots;

  const results = useMemo(() => {
    let breakeven = 0;
    let maxProfit = '';
    let maxLoss = '';
    let netPnl = 0;
    const investment = premium * totalQty;

    if (optionType === 'Call') {
      breakeven = strike + premium;
      if (action === 'Buy') {
        maxProfit = 'Unlimited';
        maxLoss = `₹${investment.toLocaleString()}`;
        netPnl = (Math.max(targetSpot - strike, 0) - premium) * totalQty;
      } else {
        maxProfit = `₹${investment.toLocaleString()}`;
        maxLoss = 'Unlimited';
        netPnl = (premium - Math.max(targetSpot - strike, 0)) * totalQty;
      }
    } else {
      breakeven = strike - premium;
      if (action === 'Buy') {
        maxProfit = 'Unlimited*'; // Actually Strike * Qty
        maxLoss = `₹${investment.toLocaleString()}`;
        netPnl = (Math.max(strike - targetSpot, 0) - premium) * totalQty;
      } else {
        maxProfit = `₹${investment.toLocaleString()}`;
        maxLoss = 'Unlimited*';
        netPnl = (premium - Math.max(strike - targetSpot, 0)) * totalQty;
      }
    }
    return { breakeven, maxProfit, maxLoss, netPnl, investment };
  }, [optionType, action, strike, premium, totalQty, targetSpot]);

  const chartData = useMemo(() => {
    const data = [];
    const minSpot = Math.max(0, strike - 500);
    const maxSpot = strike + 500;
    const step = 20;
    for (let currentSpot = minSpot; currentSpot <= maxSpot; currentSpot += step) {
      let pnl = 0;
      if (optionType === 'Call') {
        if (action === 'Buy') {
          pnl = (Math.max(currentSpot - strike, 0) - premium) * totalQty;
        } else {
          pnl = (premium - Math.max(currentSpot - strike, 0)) * totalQty;
        }
      } else {
        if (action === 'Buy') {
          pnl = (Math.max(strike - currentSpot, 0) - premium) * totalQty;
        } else {
          pnl = (premium - Math.max(strike - currentSpot, 0)) * totalQty;
        }
      }
      data.push({
        spot: currentSpot,
        pnl: pnl
      });
    }
    return data;
  }, [optionType, action, strike, premium, totalQty]);

  return (
    <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Calculator size={16} className="text-emerald-500" />
        Options P&L Calculator
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Option Type</label>
          <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <button 
              className={`flex-1 py-1.5 text-xs font-bold transition ${optionType === 'Call' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setOptionType('Call')}
            >
              Call (CE)
            </button>
            <button 
              className={`flex-1 py-1.5 text-xs font-bold transition ${optionType === 'Put' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setOptionType('Put')}
            >
              Put (PE)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Action</label>
          <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <button 
              className={`flex-1 py-1.5 text-xs font-bold transition ${action === 'Buy' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setAction('Buy')}
            >
              Buy
            </button>
            <button 
              className={`flex-1 py-1.5 text-xs font-bold transition ${action === 'Sell' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
              onClick={() => setAction('Sell')}
            >
              Sell
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Strike Price</label>
          <input type="number" value={strikeValue} onChange={(e) => setStrikeValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Premium {action === 'Buy' ? 'Paid' : 'Received'}</label>
          <input type="number" value={premiumValue} onChange={(e) => setPremiumValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Lot Size</label>
          <input type="number" value={lotSizeValue} onChange={(e) => setLotSizeValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Number of Lots</label>
          <input type="number" value={lotsValue} onChange={(e) => setLotsValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white" />
        </div>

        <div className="space-y-1.5 xl:col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Target Spot Price at Expiry</label>
          <input type="number" value={targetSpotValue} onChange={(e) => setTargetSpotValue(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Breakeven</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">₹{results.breakeven.toFixed(2)}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Total investment</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">₹{results.investment.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Max Profit</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{results.maxProfit}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Max Loss</span>
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">{results.maxLoss}</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-850 col-span-2 md:col-span-1 shadow-inner">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">Net P&L @ Target</span>
          <span className={`text-base font-black mt-1 block ${results.netPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {results.netPnl >= 0 ? '+' : ''}₹{results.netPnl.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="h-64 mt-4 w-full border border-slate-100 dark:border-slate-850 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-900/30">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="spot" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
              type="number"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Net P&L']}
              labelFormatter={(label) => `Spot: ₹${label}`}
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <ReferenceLine x={strike} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'top', value: 'Strike', fill: '#3b82f6', fontSize: 10 }} />
            <ReferenceLine x={targetSpot} stroke="#a855f7" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: '#a855f7', fontSize: 10 }} />
            <Line 
              type="monotone" 
              dataKey="pnl" 
              stroke={results.netPnl >= 0 ? '#10b981' : '#f43f5e'} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
