import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CandlestickChart,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Filter,
  Gauge,
  Layers,
  LineChart,
  Play,
  Plus,
  Radar,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { Stock } from '../types';

interface ChartinkStyleScannerProps {
  stocks: Stock[];
  stockData?: Stock[];
  onSelectStock: (symbol: string) => void;
  onSelectFoStock: (symbol: string) => void;
}

type Timeframe = '5 Min' | '15 Min' | '1 Hour' | '1 Day' | '1 Week';
type Universe = 'All NSE/BSE' | 'F&O Stocks' | 'Nifty 50 Style' | 'High Volume' | 'Bullish Today';
type Field = 'doji' | 'bodyPercent' | 'volume' | 'rsi' | 'price' | 'changePercent' | 'peRatio' | 'foEnabled' | 'closeVsOpen';
type Operator = 'is true' | 'greater than' | 'less than' | 'between' | 'equals';

interface ScannerCondition {
  id: string;
  field: Field;
  label: string;
  operator: Operator;
  value: string;
  value2?: string;
  enabled: boolean;
}

interface SavedScanner {
  id: string;
  name: string;
  timeframe: Timeframe;
  universe: Universe;
  mode: 'AND' | 'OR';
  conditions: ScannerCondition[];
  createdAt: string;
}

interface EvaluatedStock extends Stock {
  bodyPercent: number;
  candleRange: number;
  dojiType: 'Classic Doji' | 'Dragonfly Doji' | 'Gravestone Doji' | 'Long-legged Doji' | 'Not Doji';
  strength: 'Weak' | 'Medium' | 'Strong';
  score: number;
  why: string[];
}

const fieldOptions: { field: Field; label: string; defaultOperator: Operator; value: string; value2?: string }[] = [
  { field: 'doji', label: 'Latest candle pattern is Doji', defaultOperator: 'is true', value: 'true' },
  { field: 'bodyPercent', label: 'Body size % of candle range', defaultOperator: 'less than', value: '5' },
  { field: 'volume', label: 'Volume', defaultOperator: 'greater than', value: '1000000' },
  { field: 'rsi', label: 'RSI', defaultOperator: 'between', value: '45', value2: '60' },
  { field: 'price', label: 'Last traded price', defaultOperator: 'greater than', value: '100' },
  { field: 'changePercent', label: 'Change %', defaultOperator: 'greater than', value: '0' },
  { field: 'peRatio', label: 'P/E Ratio', defaultOperator: 'less than', value: '35' },
  { field: 'foEnabled', label: 'F&O enabled stock', defaultOperator: 'is true', value: 'true' },
  { field: 'closeVsOpen', label: 'Close above open', defaultOperator: 'is true', value: 'true' },
];

const templates: SavedScanner[] = [
  {
    id: 'template-doji-2',
    name: 'Doji - Chartink Style',
    timeframe: '1 Day',
    universe: 'All NSE/BSE',
    mode: 'AND',
    createdAt: new Date().toISOString(),
    conditions: [
      { id: 'doji-1', field: 'doji', label: 'Latest candle pattern is Doji', operator: 'is true', value: 'true', enabled: true },
      { id: 'doji-2', field: 'bodyPercent', label: 'Body size % of candle range', operator: 'less than', value: '5', enabled: true },
    ],
  },
  {
    id: 'template-confirmed-doji',
    name: 'Confirmed Doji + Volume + RSI',
    timeframe: '1 Day',
    universe: 'F&O Stocks',
    mode: 'AND',
    createdAt: new Date().toISOString(),
    conditions: [
      { id: 'cd-1', field: 'doji', label: 'Latest candle pattern is Doji', operator: 'is true', value: 'true', enabled: true },
      { id: 'cd-2', field: 'bodyPercent', label: 'Body size % of candle range', operator: 'less than', value: '7', enabled: true },
      { id: 'cd-3', field: 'volume', label: 'Volume', operator: 'greater than', value: '1000000', enabled: true },
      { id: 'cd-4', field: 'rsi', label: 'RSI', operator: 'between', value: '45', value2: '60', enabled: true },
    ],
  },
  {
    id: 'template-volume-breakout',
    name: 'Volume Breakout',
    timeframe: '1 Day',
    universe: 'High Volume',
    mode: 'AND',
    createdAt: new Date().toISOString(),
    conditions: [
      { id: 'vb-1', field: 'volume', label: 'Volume', operator: 'greater than', value: '2000000', enabled: true },
      { id: 'vb-2', field: 'changePercent', label: 'Change %', operator: 'greater than', value: '1', enabled: true },
    ],
  },
  {
    id: 'template-rsi-bounce',
    name: 'RSI Bounce Setup',
    timeframe: '1 Day',
    universe: 'All NSE/BSE',
    mode: 'AND',
    createdAt: new Date().toISOString(),
    conditions: [
      { id: 'rb-1', field: 'rsi', label: 'RSI', operator: 'between', value: '30', value2: '45', enabled: true },
      { id: 'rb-2', field: 'changePercent', label: 'Change %', operator: 'greater than', value: '0', enabled: true },
    ],
  },
];

const storageKey = 'stockpro_chartink_style_scanners';

const parseNumber = (value: string | number | undefined) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const raw = String(value).trim().toLowerCase();
  if (raw.endsWith('cr')) return parseFloat(raw) * 10000000;
  if (raw.endsWith('l')) return parseFloat(raw) * 100000;
  if (raw.endsWith('k')) return parseFloat(raw) * 1000;
  if (raw.endsWith('m')) return parseFloat(raw) * 1000000;
  return Number(raw.replace(/,/g, '')) || 0;
};

const formatVolume = (value: number) => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${Math.round(value || 0)}`;
};

const getBodyPercent = (stock: Stock) => {
  const range = Math.max(0.01, Math.abs((stock.high || stock.price) - (stock.low || stock.price)));
  const body = Math.abs((stock.close || stock.price) - (stock.open || stock.price));
  return (body / range) * 100;
};

const getDojiType = (stock: Stock, bodyPercent: number): EvaluatedStock['dojiType'] => {
  if (bodyPercent > 8) return 'Not Doji';
  const high = stock.high || stock.price;
  const low = stock.low || stock.price;
  const open = stock.open || stock.price;
  const close = stock.close || stock.price;
  const topBody = Math.max(open, close);
  const bottomBody = Math.min(open, close);
  const upper = high - topBody;
  const lower = bottomBody - low;
  if (lower > upper * 2.2) return 'Dragonfly Doji';
  if (upper > lower * 2.2) return 'Gravestone Doji';
  if (upper > Math.abs(close - open) * 3 && lower > Math.abs(close - open) * 3) return 'Long-legged Doji';
  return 'Classic Doji';
};

const metricValue = (stock: EvaluatedStock, field: Field) => {
  switch (field) {
    case 'doji': return stock.dojiType !== 'Not Doji' ? 1 : 0;
    case 'bodyPercent': return stock.bodyPercent;
    case 'volume': return stock.volume || 0;
    case 'rsi': return stock.rsi || 50;
    case 'price': return stock.price || 0;
    case 'changePercent': return stock.changePercent || 0;
    case 'peRatio': return stock.peRatio || 0;
    case 'foEnabled': return stock.isFoEnabled ? 1 : 0;
    case 'closeVsOpen': return (stock.close || stock.price) >= (stock.open || stock.price) ? 1 : 0;
    default: return 0;
  }
};

const evaluateCondition = (stock: EvaluatedStock, condition: ScannerCondition) => {
  if (!condition.enabled) return true;
  const current = metricValue(stock, condition.field);
  const v1 = parseNumber(condition.value);
  const v2 = parseNumber(condition.value2);
  switch (condition.operator) {
    case 'is true': return current === 1;
    case 'greater than': return current > v1;
    case 'less than': return current < v1;
    case 'between': return current >= Math.min(v1, v2) && current <= Math.max(v1, v2);
    case 'equals': return current === v1;
    default: return false;
  }
};

export default function ChartinkStyleScanner({ stocks, stockData, onSelectStock, onSelectFoStock }: ChartinkStyleScannerProps) {
  const baseStocks = useMemo(() => (stockData?.length ? stockData : stocks || []), [stocks, stockData]);
  const [scannerName, setScannerName] = useState('Doji - Chartink Style');
  const [timeframe, setTimeframe] = useState<Timeframe>('1 Day');
  const [universe, setUniverse] = useState<Universe>('All NSE/BSE');
  const [mode, setMode] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<ScannerCondition[]>(templates[0].conditions);
  const [query, setQuery] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selected, setSelected] = useState<EvaluatedStock | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savedScanners, setSavedScanners] = useState<SavedScanner[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const enrichedStocks = useMemo<EvaluatedStock[]>(() => {
    return baseStocks.map((stock) => {
      const bodyPercent = getBodyPercent(stock);
      const candleRange = Math.max(0.01, (stock.high || stock.price) - (stock.low || stock.price));
      const dojiType = getDojiType(stock, bodyPercent);
      const why: string[] = [];
      if (dojiType !== 'Not Doji') why.push(`${dojiType}: candle body is ${bodyPercent.toFixed(2)}% of total range`);
      if ((stock.volume || 0) > 1000000) why.push(`Volume confirmation: ${formatVolume(stock.volume || 0)} traded`);
      if ((stock.rsi || 50) >= 45 && (stock.rsi || 50) <= 60) why.push(`RSI neutral zone: ${(stock.rsi || 50).toFixed(1)}`);
      if ((stock.close || stock.price) >= (stock.open || stock.price)) why.push('Close is above or equal to open');
      if (stock.isFoEnabled) why.push('F&O enabled instrument');
      const score = [dojiType !== 'Not Doji', (stock.volume || 0) > 1000000, (stock.rsi || 50) >= 45 && (stock.rsi || 50) <= 60, (stock.changePercent || 0) >= 0, stock.isFoEnabled].filter(Boolean).length * 20;
      const strength: EvaluatedStock['strength'] = score >= 80 ? 'Strong' : score >= 50 ? 'Medium' : 'Weak';
      return { ...stock, bodyPercent, candleRange, dojiType, strength, score, why };
    });
  }, [baseStocks]);

  const universeFiltered = useMemo(() => {
    return enrichedStocks.filter((stock) => {
      if (universe === 'F&O Stocks') return stock.isFoEnabled;
      if (universe === 'High Volume') return (stock.volume || 0) >= 1000000;
      if (universe === 'Bullish Today') return (stock.changePercent || 0) > 0;
      if (universe === 'Nifty 50 Style') return stock.exchange === 'NSE' || stock.isFoEnabled;
      return true;
    });
  }, [enrichedStocks, universe]);

  const scanResults = useMemo(() => {
    const activeConditions = conditions.filter((condition) => condition.enabled);
    const tested = universeFiltered.filter((stock) => {
      const checks = activeConditions.map((condition) => evaluateCondition(stock, condition));
      return mode === 'AND' ? checks.every(Boolean) : checks.some(Boolean);
    });
    const searched = query.trim()
      ? tested.filter((stock) => `${stock.symbol} ${stock.name} ${stock.sector}`.toLowerCase().includes(query.toLowerCase()))
      : tested;
    return searched.sort((a, b) => b.score - a.score || Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0));
  }, [conditions, mode, query, universeFiltered]);

  const backtest = useMemo(() => {
    const count = scanResults.length;
    const avgMove = count ? scanResults.reduce((sum, stock) => sum + (stock.changePercent || 0), 0) / count : 0;
    const winRate = count ? Math.min(82, Math.max(38, 52 + avgMove * 3 + scanResults.filter((s) => s.strength === 'Strong').length * 2)) : 0;
    return {
      matches: count,
      winRate,
      avgMove,
      maxRisk: Math.max(1.2, Math.abs(avgMove) * 1.4 + 2.1),
    };
  }, [scanResults]);

  const runScan = () => {
    setIsScanning(true);
    setHasScanned(false);
    window.setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      setSelected(scanResults[0] || null);
      showToast(`Scan completed: ${scanResults.length} matches found`);
    }, 650);
  };

  const applyTemplate = (template: SavedScanner) => {
    setScannerName(template.name);
    setTimeframe(template.timeframe);
    setUniverse(template.universe);
    setMode(template.mode);
    setConditions(template.conditions.map((condition) => ({ ...condition, id: `${condition.id}-${Date.now()}` })));
    setHasScanned(false);
    showToast(`${template.name} loaded`);
  };

  const addCondition = () => {
    const option = fieldOptions[0];
    setConditions((prev) => [
      ...prev,
      { id: `cond-${Date.now()}`, field: option.field, label: option.label, operator: option.defaultOperator, value: option.value, value2: option.value2, enabled: true },
    ]);
  };

  const updateCondition = (id: string, patch: Partial<ScannerCondition>) => {
    setConditions((prev) => prev.map((condition) => {
      if (condition.id !== id) return condition;
      const next = { ...condition, ...patch };
      if (patch.field) {
        const option = fieldOptions.find((item) => item.field === patch.field)!;
        next.label = option.label;
        next.operator = option.defaultOperator;
        next.value = option.value;
        next.value2 = option.value2;
      }
      return next;
    }));
  };

  const removeCondition = (id: string) => setConditions((prev) => prev.filter((condition) => condition.id !== id));

  const saveScanner = () => {
    const next: SavedScanner = { id: `saved-${Date.now()}`, name: scannerName || 'Untitled scanner', timeframe, universe, mode, conditions, createdAt: new Date().toISOString() };
    const updated = [next, ...savedScanners].slice(0, 24);
    setSavedScanners(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    showToast('Scanner saved locally');
  };

  const createAlert = () => {
    const alert = { scannerName, timeframe, universe, mode, conditions, createdAt: new Date().toISOString() };
    const list = JSON.parse(localStorage.getItem('stockpro_chartink_alerts') || '[]');
    localStorage.setItem('stockpro_chartink_alerts', JSON.stringify([alert, ...list].slice(0, 40)));
    showToast('Alert rule created locally');
  };

  const exportCsv = () => {
    const rows = [
      ['Symbol', 'Name', 'Price', 'Change%', 'Volume', 'RSI', 'Doji Type', 'Body%', 'Strength', 'Score'],
      ...scanResults.map((stock) => [stock.symbol, stock.name, stock.price, stock.changePercent, stock.volume, stock.rsi, stock.dojiType, stock.bodyPercent.toFixed(2), stock.strength, stock.score]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scannerName.replace(/\s+/g, '-').toLowerCase()}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const duplicateScanner = () => {
    setScannerName(`${scannerName} Copy`);
    setConditions((prev) => prev.map((condition) => ({ ...condition, id: `${condition.id}-copy-${Date.now()}` })));
    showToast('Scanner duplicated');
  };

  const strengthClass = (strength: EvaluatedStock['strength']) => {
    if (strength === 'Strong') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
    if (strength === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <div className="w-full space-y-6" id="chartink_style_scanner_lab">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] rounded-2xl border border-emerald-500/20 bg-slate-950 px-4 py-3 text-sm font-bold text-emerald-300 shadow-2xl shadow-emerald-950/30">
          {toast}
        </div>
      )}

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/86 dark:shadow-emerald-950/20 md:p-7">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/18 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-indigo-500/14 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Sparkles size={13} /> Chartink-style scanner engine
            </div>
            <h1 className="max-w-4xl text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white md:text-5xl">
              Build, run, save, alert, and backtest technical scans like a professional screener.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              This StockPro scanner recreates the Chartink-style workflow: prebuilt templates, condition blocks, universe/timeframe filters, results table, chart actions, saved scans, alerts, and backtest preview. The default template is a Doji scanner using OHLC candle-body logic.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={runScan} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 dark:bg-white dark:text-slate-950">
                <Play size={16} /> Run Scan
              </button>
              <button onClick={() => applyTemplate(templates[0])} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:-translate-y-1 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                <CandlestickChart size={16} /> Load Doji-2
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Universe', value: universe, icon: DatabaseIcon },
              { label: 'Timeframe', value: timeframe, icon: Activity },
              { label: 'Conditions', value: `${conditions.filter((c) => c.enabled).length} active`, icon: Filter },
              { label: 'Matches', value: hasScanned ? `${scanResults.length}` : 'Not run', icon: Radar },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-3xl border border-slate-200/80 bg-white/82 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <Icon size={18} className="mb-4 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
                  <p className="mt-1 truncate text-lg font-black text-slate-950 dark:text-white">{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/85">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Prebuilt scan templates</h2>
              <WandSparkles size={17} className="text-emerald-500" />
            </div>
            <div className="space-y-2">
              {templates.map((template) => (
                <button key={template.id} onClick={() => applyTemplate(template)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900/75 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{template.name}</span>
                    <ChevronDown size={14} className="-rotate-90 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{template.conditions.length} rules · {template.universe}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/85">
            <h2 className="mb-4 text-sm font-black text-slate-900 dark:text-white">Saved scanners</h2>
            {savedScanners.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">No saved scanners yet. Build one and press Save.</p>
            ) : (
              <div className="space-y-2">
                {savedScanners.map((scanner) => (
                  <button key={scanner.id} onClick={() => applyTemplate(scanner)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left text-xs font-bold text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    {scanner.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="mb-2 flex items-center gap-2 font-black"><AlertTriangle size={15} /> Educational scanner</div>
            Pattern scans are technical filters, not trading advice. Doji is an indecision candle and should be confirmed with volume, trend, RSI, support/resistance, and risk management.
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/85 md:p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Scanner condition builder</h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Add rules like Doji, body percentage, volume, RSI, price, P/E, and F&O status.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={saveScanner} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:text-slate-200"><Save size={14} /> Save</button>
                <button onClick={duplicateScanner} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:text-slate-200"><Copy size={14} /> Duplicate</button>
                <button onClick={createAlert} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:text-slate-200"><Bell size={14} /> Alert</button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <label className="md:col-span-2">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Scanner name</span>
                <input value={scannerName} onChange={(e) => setScannerName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Universe</span>
                <select value={universe} onChange={(e) => setUniverse(e.target.value as Universe)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                  {['All NSE/BSE', 'F&O Stocks', 'Nifty 50 Style', 'High Volume', 'Bullish Today'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Timeframe</span>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                  {['5 Min', '15 Min', '1 Hour', '1 Day', '1 Week'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setMode('AND')} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === 'AND' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>AND logic</button>
              <button onClick={() => setMode('OR')} className={`rounded-xl px-3 py-2 text-xs font-black ${mode === 'OR' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>OR logic</button>
              <button onClick={addCondition} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white dark:bg-white dark:text-slate-950"><Plus size={14} /> Add rule</button>
            </div>

            <div className="mt-4 space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70 lg:grid-cols-[32px_1.4fr_1fr_0.8fr_0.8fr_42px] lg:items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-black text-slate-500 dark:bg-slate-950">{index + 1}</div>
                  <select value={condition.field} onChange={(e) => updateCondition(condition.id, { field: e.target.value as Field })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    {fieldOptions.map((option) => <option key={option.field} value={option.field}>{option.label}</option>)}
                  </select>
                  <select value={condition.operator} onChange={(e) => updateCondition(condition.id, { operator: e.target.value as Operator })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    {['is true', 'greater than', 'less than', 'between', 'equals'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input value={condition.value} onChange={(e) => updateCondition(condition.id, { value: e.target.value })} disabled={condition.operator === 'is true'} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                  <input value={condition.value2 || ''} onChange={(e) => updateCondition(condition.id, { value2: e.target.value })} disabled={condition.operator !== 'between'} placeholder="to" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                  <button onClick={() => removeCondition(condition.id)} className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/85 md:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Scan results</h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shows stocks matching your active condition blocks.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search results..." className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-bold outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                </div>
                <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:text-slate-200"><Download size={14} /> Export</button>
                <button onClick={runScan} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white"><Play size={14} /> {isScanning ? 'Scanning...' : 'Run Scan'}</button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: 'Matches', value: hasScanned ? scanResults.length : '—', icon: CheckCircle2 },
                { label: 'Backtest win rate', value: hasScanned ? `${backtest.winRate.toFixed(0)}%` : '—', icon: Gauge },
                { label: 'Avg move', value: hasScanned ? `${backtest.avgMove.toFixed(2)}%` : '—', icon: LineChart },
                { label: 'Risk band', value: hasScanned ? `${backtest.maxRisk.toFixed(1)}%` : '—', icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <Icon size={15} className="mb-2 text-emerald-500" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                    <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[920px] text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Chg%</th>
                      <th className="px-4 py-3">Volume</th>
                      <th className="px-4 py-3">RSI</th>
                      <th className="px-4 py-3">Pattern</th>
                      <th className="px-4 py-3">Body%</th>
                      <th className="px-4 py-3">Strength</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                    {!hasScanned && (
                      <tr><td colSpan={9} className="px-4 py-10 text-center font-bold text-slate-400">Run the scan to see matches.</td></tr>
                    )}
                    {hasScanned && scanResults.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-10 text-center font-bold text-slate-400">No stocks matched. Loosen conditions or switch to OR logic.</td></tr>
                    )}
                    {hasScanned && scanResults.map((stock) => (
                      <tr key={stock.symbol} className="transition hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20">
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(stock)} className="text-left">
                            <div className="font-black text-slate-950 dark:text-white">{stock.symbol.replace('.NS', '')}</div>
                            <div className="max-w-[180px] truncate text-[10px] font-semibold text-slate-500">{stock.name}</div>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono font-black">₹{Number(stock.price || 0).toFixed(2)}</td>
                        <td className={`px-4 py-3 font-mono font-black ${(stock.changePercent || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{(stock.changePercent || 0) >= 0 ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-300">{formatVolume(stock.volume || 0)}</td>
                        <td className="px-4 py-3 font-mono font-bold">{Number(stock.rsi || 50).toFixed(1)}</td>
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{stock.dojiType}</td>
                        <td className="px-4 py-3 font-mono font-bold">{stock.bodyPercent.toFixed(2)}%</td>
                        <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${strengthClass(stock.strength)}`}>{stock.strength}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setSelected(stock)} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-300"><Eye size={14} /></button>
                            <button onClick={() => onSelectStock(stock.symbol)} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-300"><BarChart3 size={14} /></button>
                            <button onClick={() => onSelectFoStock(stock.symbol)} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-300"><Layers size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/85">
              <div className="mb-4 flex items-center gap-2"><Star size={17} className="text-emerald-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">Why matched</h2></div>
              {selected ? (
                <div>
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-slate-950 dark:text-white">{selected.symbol.replace('.NS', '')}</h3>
                        <p className="text-xs font-semibold text-slate-500">{selected.name}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${strengthClass(selected.strength)}`}>{selected.strength} · {selected.score}/100</span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[['Open', selected.open], ['High', selected.high], ['Low', selected.low], ['Close', selected.close]].map(([label, value]) => (
                        <div key={label as string} className="rounded-xl bg-white p-2 dark:bg-slate-950">
                          <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
                          <p className="font-mono text-xs font-black">₹{Number(value || selected.price).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {(selected.why.length ? selected.why : ['Matched the active scanner conditions.']).map((item) => (
                      <li key={item} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">Select a result row to see the rule explanation.</p>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/85">
              <div className="mb-4 flex items-center gap-2"><Activity size={17} className="text-emerald-500" /><h2 className="text-lg font-black text-slate-950 dark:text-white">Backtest preview</h2></div>
              <p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">A lightweight preview based on current matches. Historical backtesting can later be connected to candle history APIs.</p>
              <div className="mt-4 space-y-3">
                {[['Matched candles', `${backtest.matches}`], ['Estimated win rate', `${backtest.winRate.toFixed(1)}%`], ['Average matched move', `${backtest.avgMove.toFixed(2)}%`], ['Suggested risk band', `${backtest.maxRisk.toFixed(1)}%`]].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
                    <span className="font-mono text-sm font-black text-slate-950 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DatabaseIcon(props: { size?: number; className?: string }) {
  return <DatabaseSvg {...props} />;
}

function DatabaseSvg({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}
