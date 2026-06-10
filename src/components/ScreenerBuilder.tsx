import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Trash2, 
  Plus, 
  Save, 
  Download, 
  Sparkles, 
  HelpCircle, 
  SlidersHorizontal, 
  ChevronRight, 
  Check, 
  Database, 
  Info, 
  Calendar,
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  Star
} from 'lucide-react';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ScreenerBuilderProps {
  stocks: Stock[];
  onSelectStock: (symbol: string) => void;
  onSelectFoStock: (symbol: string) => void;
}

interface ScanCondition {
  id: string;
  indicator: string;
  timeframe: '1 Day' | '1 Week' | '1 Month';
  condition: 'Greater than' | 'Less than' | 'Crosses above' | 'Crosses below' | 'Equal to';
  value: number;
}

interface SavedScanner {
  id: string;
  name: string;
  logicalOperator: 'AND' | 'OR';
  conditions: ScanCondition[];
}

interface PrebuiltScanner {
  id: string;
  icon: string;
  name: string;
  description: string;
  logicalOperator: 'AND' | 'OR';
  conditions: ScanCondition[];
}

const PREBUILT_SCANNERS: PrebuiltScanner[] = [
  {
    id: 'pb-doji',
    icon: '🕯️',
    name: 'Doji Pattern',
    description: 'Identifies stocks with extremely narrow body (Open ≈ Close) signaling trend reversal.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-doji-cond-1', indicator: 'Doji Ratio', timeframe: '1 Day', condition: 'Less than', value: 10 }
    ]
  },
  {
    id: 'pb-rsi-oversold',
    icon: '📈',
    name: 'RSI Oversold',
    description: 'RSI(14) drops below 30. Potential bullish reversal candidate.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-rsi-os-cond-1', indicator: 'RSI(14)', timeframe: '1 Day', condition: 'Less than', value: 30 }
    ]
  },
  {
    id: 'pb-rsi-overbought',
    icon: '📉',
    name: 'RSI Overbought',
    description: 'RSI(14) rises above 70. Potential overstretched/cooling zone.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-rsi-ob-cond-1', indicator: 'RSI(14)', timeframe: '1 Day', condition: 'Greater than', value: 70 }
    ]
  },
  {
    id: 'pb-volume-breakout',
    icon: '⚡',
    name: 'Volume Breakout',
    description: 'Current volume exceeds 3x average, indicating institutional interest.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-vol-bo-cond-1', indicator: 'Volume Multiplier', timeframe: '1 Day', condition: 'Greater than', value: 3 }
    ]
  },
  {
    id: 'pb-52w-high',
    icon: '🚀',
    name: '52-Week High Breakout',
    description: 'Closing price exceeds the 52-week highest traded price.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-52high-cond-1', indicator: 'Close vs 52W High Ratio', timeframe: '1 Day', condition: 'Greater than', value: 100 }
    ]
  },
  {
    id: 'pb-golden-cross',
    icon: '💎',
    name: 'Golden Cross',
    description: 'Short-term EMA(20) crosses above medium-term EMA(50), a major bullish signal.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-gc-cond-1', indicator: 'EMA(20) / EMA(50) Ratio', timeframe: '1 Day', condition: 'Crosses above', value: 100 }
    ]
  },
  {
    id: 'pb-death-cross',
    icon: '☠️',
    name: 'Death Cross',
    description: 'Short-term EMA(20) drops below medium-term EMA(50), highly bearish.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-dc-cond-1', indicator: 'EMA(20) / EMA(50) Ratio', timeframe: '1 Day', condition: 'Less than', value: 100 }
    ]
  },
  {
    id: 'pb-macd-crossover',
    icon: '📊',
    name: 'MACD Bullish Crossover',
    description: 'MACD line crossed above the zero line reflecting increasing upward momentum.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-macd-cond-1', indicator: 'MACD', timeframe: '1 Day', condition: 'Crosses above', value: 0 }
    ]
  },
  {
    id: 'pb-bb-squeeze',
    icon: '🔵',
    name: 'Bollinger Band Squeeze',
    description: 'Band width tightens under extreme low volatility, anticipating an explosive breakout.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-bb-sq-cond-1', indicator: 'Bollinger Band Width%', timeframe: '1 Day', condition: 'Less than', value: 12 }
    ]
  },
  {
    id: 'pb-undervalued',
    icon: '💰',
    name: 'Undervalued',
    description: 'Attractive fundamental entry: low price-to-earnings ratios paired with high Return on Equity.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-uv-cond-1', indicator: 'P/E Ratio', timeframe: '1 Day', condition: 'Less than', value: 15 },
      { id: 'pb-uv-cond-2', indicator: 'ROE%', timeframe: '1 Day', condition: 'Greater than', value: 15 }
    ]
  }
];

export default function ScreenerBuilder({ stocks, onSelectStock, onSelectFoStock }: ScreenerBuilderProps) {
  const { user, loginWithGoogle } = useAuth();
  
  // Logic toggle (AND / OR)
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');
  const [activePrebuiltId, setActivePrebuiltId] = useState<string | null>(null);
  
  // Conditions list - start with one elegant row
  const [conditions, setConditions] = useState<ScanCondition[]>([
    {
      id: 'initial-1',
      indicator: 'RSI(14)',
      timeframe: '1 Day',
      condition: 'Greater than',
      value: 50
    }
  ]);

  // Results state
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [sortField, setSortField] = useState<keyof Stock>('changePercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25;

  // Scanner naming & persistence state
  const [scannerName, setScannerName] = useState<string>('');
  const [savedScanners, setSavedScanners] = useState<SavedScanner[]>([]);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load default/pre-configured templates for instant clicking
  const scannerTemplates: SavedScanner[] = useMemo(() => [
    {
      id: 'template-rsi-bullish',
      name: 'RSI Bullish Breakout (RSI > 60)',
      logicalOperator: 'AND',
      conditions: [
        { id: 't1', indicator: 'RSI(14)', timeframe: '1 Day', condition: 'Greater than', value: 60 },
        { id: 't2', indicator: 'Day Change%', timeframe: '1 Day', condition: 'Greater than', value: 0 }
      ]
    },
    {
      id: 'template-golden-cross',
      name: 'EMA 50 Bullish Long Build-up',
      logicalOperator: 'AND',
      conditions: [
        { id: 't3', indicator: 'Close Price', timeframe: '1 Day', condition: 'Greater than', value: 1000 },
        { id: 't4', indicator: 'EMA(50)', timeframe: '1 Day', condition: 'Less than', value: 4000 },
        { id: 't5', indicator: 'RSI(14)', timeframe: '1 Day', condition: 'Greater than', value: 50 }
      ]
    },
    {
      id: 'template-undervalued',
      name: 'Undervalued High Volume Bargains',
      logicalOperator: 'AND',
      conditions: [
        { id: 't6', indicator: 'P/E Ratio', timeframe: '1 Day', condition: 'Less than', value: 25 },
        { id: 't7', indicator: 'Volume', timeframe: '1 Day', condition: 'Greater than', value: 1000000 },
        { id: 't8', indicator: 'Day Change%', timeframe: '1 Day', condition: 'Greater than', value: 0.5 }
      ]
    },
    {
      id: 'template-bollinger-breakout',
      name: 'Bollinger Band Squeeze Breakout',
      logicalOperator: 'AND',
      conditions: [
        { id: 't9', indicator: 'Close Price', timeframe: '1 Day', condition: 'Greater than', value: 100 },
        { id: 't10', indicator: 'Bollinger Band Upper', timeframe: '1 Day', condition: 'Less than', value: 5000 },
        { id: 't11', indicator: 'RSI(14)', timeframe: '1 Day', condition: 'Greater than', value: 55 }
      ]
    }
  ], []);

  // Dropdown lists
  const indicatorsList = [
    'Close Price', 'Open', 'High', 'Low', 'Volume', 'RSI(14)', 
    'EMA(20)', 'EMA(50)', 'EMA(200)', 'MACD', 
    'Bollinger Band Upper', 'Bollinger Band Lower', 
    '52W High', '52W Low', 'Market Cap', 'P/E Ratio', 'Day Change%',
    'ROE%', 'Bollinger Band Width%', 'Volume Multiplier', 'Close vs 52W High Ratio', 'EMA(20) / EMA(50) Ratio', 'Doji Ratio'
  ];

  const timeframesList = ['1 Day', '1 Week', '1 Month'];

  const conditionsList = ['Greater than', 'Less than', 'Crosses above', 'Crosses below', 'Equal to'];

  // Calculate dynamic indicator for a specific stock deterministically
  const getIndicatorValueForStock = (stock: Stock, indicator: string, timeframe: '1 Day' | '1 Week' | '1 Month'): number => {
    let baseValue = 0;
    const symbolCode = stock.symbol.charCodeAt(0) + (stock.symbol.charCodeAt(1) || 0);

    // Pick indicator base on name
    switch (indicator) {
      case 'Close Price':
        baseValue = stock.price;
        break;
      case 'Open':
        baseValue = stock.open || stock.price * 0.99;
        break;
      case 'High':
        baseValue = stock.high || stock.price * 1.015;
        break;
      case 'Low':
        baseValue = stock.low || stock.price * 0.98;
        break;
      case 'Volume':
        baseValue = stock.volume;
        break;
      case 'RSI(14)':
        baseValue = stock.rsi;
        break;
      case 'EMA(20)':
        baseValue = stock.price * (0.985 + (stock.symbol.length % 5) * 0.003);
        break;
      case 'EMA(50)':
        baseValue = stock.price * (0.954 + (stock.symbol.length % 7) * 0.004);
        break;
      case 'EMA(200)':
        baseValue = stock.price * (0.865 + (stock.symbol.length % 11) * 0.006);
        break;
      case 'MACD':
        baseValue = (stock.price * 0.0012) * ((symbolCode % 5) - 2);
        break;
      case 'Bollinger Band Upper':
        baseValue = stock.price * (1.05 + (symbolCode % 3) * 0.008);
        break;
      case 'Bollinger Band Lower':
        baseValue = stock.price * (0.95 - (symbolCode % 3) * 0.008);
        break;
      case '52W High':
        baseValue = stock.price * (1.21 + (stock.symbol.length % 4) * 0.02);
        break;
      case '52W Low':
        baseValue = stock.price * (0.69 - (stock.symbol.length % 3) * 0.02);
        break;
      case 'Market Cap':
        baseValue = stock.marketCap;
        break;
      case 'P/E Ratio':
        baseValue = stock.peRatio || 22.5;
        break;
      case 'Day Change%':
        baseValue = stock.changePercent;
        break;
      case 'ROE%':
        baseValue = 10 + (symbolCode % 18); // simulated ROE% (10% to 28%)
        break;
      case 'Bollinger Band Width%':
        const bbUpper = stock.price * (1.05 + (symbolCode % 3) * 0.008);
        const bbLower = stock.price * (0.95 - (symbolCode % 3) * 0.008);
        baseValue = ((bbUpper - bbLower) / stock.price) * 100;
        break;
      case 'Volume Multiplier':
        baseValue = 0.8 + (symbolCode % 5) * 0.6 + (stock.changePercent >= 2 ? 1.4 : 0.2);
        break;
      case 'Close vs 52W High Ratio':
        const h52w = stock.price * (1.11 + (stock.symbol.length % 4) * 0.01);
        const isBreakout = (symbolCode % 5) === 0;
        baseValue = isBreakout ? 101.5 + (symbolCode % 4) * 0.5 : (stock.price / h52w) * 100;
        break;
      case 'EMA(20) / EMA(50) Ratio':
        const ema20Value = stock.price * (0.985 + (stock.symbol.length % 5) * 0.003);
        const ema50Value = stock.price * (0.954 + (stock.symbol.length % 7) * 0.004);
        baseValue = (ema20Value / ema50Value) * 100;
        break;
      case 'Doji Ratio':
        const bodyDiff = Math.abs(stock.price - (stock.open || stock.price * 0.99));
        const totalRange = (stock.high || stock.price * 1.015) - (stock.low || stock.price * 0.98);
        baseValue = totalRange > 0 ? (bodyDiff / totalRange) * 100 : 8.0;
        break;
      default:
        baseValue = stock.price;
    }

    // Apply Timeframe adjustment multiplier to make week/month scans look authentic and distinct!
    if (timeframe === '1 Week') {
      const multiplier = 0.975 + (symbolCode % 10) * 0.005;
      baseValue = indicator === 'Volume' ? baseValue * 5.2 : baseValue * multiplier;
    } else if (timeframe === '1 Month') {
      const multiplier = 0.942 + (symbolCode % 13) * 0.009;
      baseValue = indicator === 'Volume' ? baseValue * 22.5 : baseValue * multiplier;
    }

    return Number(baseValue.toFixed(2));
  };

  // Evaluate single condition
  const evaluateCondition = (stock: Stock, cond: ScanCondition): boolean => {
    const stockVal = getIndicatorValueForStock(stock, cond.indicator, cond.timeframe);
    const filterVal = cond.value;

    switch (cond.condition) {
      case 'Greater than':
        return stockVal > filterVal;
      case 'Less than':
        return stockVal < filterVal;
      case 'Crosses above':
        // Simulates crossing over by evaluating current state and checking closeness
        return stockVal >= filterVal && stockVal < filterVal * 1.05;
      case 'Crosses below':
        return stockVal <= filterVal && stockVal > filterVal * 0.95;
      case 'Equal to':
        // 2% close approximation for decimals standard in Indian trading apps
        return Math.abs(stockVal - filterVal) <= (filterVal * 0.02);
      default:
        return false;
    }
  };

  // Run scanner over the stocks array
  const handleRunScan = () => {
    setIsScanning(true);
    setCurrentPage(1);
    setTimeout(() => {
      let results: Stock[] = [];

      if (conditions.length === 0) {
        results = [...stocks];
      } else {
        results = stocks.filter(stock => {
          if (logicalOperator === 'AND') {
            return conditions.every(cond => evaluateCondition(stock, cond));
          } else {
            return conditions.some(cond => evaluateCondition(stock, cond));
          }
        });
      }

      setFilteredStocks(results);
      setHasScanned(true);
      setIsScanning(false);
    }, 450); // Fluid mock latency for high-fidelity scanning feedback
  };

  // Manage condition rows
  const addConditionRow = () => {
    setActivePrebuiltId(null);
    const newId = `condition-${Date.now()}`;
    setConditions([
      ...conditions,
      {
        id: newId,
        indicator: 'Close Price',
        timeframe: '1 Day',
        condition: 'Greater than',
        value: 100
      }
    ]);
  };

  const deleteConditionRow = (id: string) => {
    setActivePrebuiltId(null);
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateConditionRow = (id: string, updatedFields: Partial<ScanCondition>) => {
    setActivePrebuiltId(null);
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  // Run a Pre-built power scanner instantly
  const handleRunPrebuiltScanner = (scanner: PrebuiltScanner) => {
    setActivePrebuiltId(scanner.id);
    setLogicalOperator(scanner.logicalOperator);
    // Instantiate conditions with unique IDs to avoid conflicts and allow editing
    const preparedConditions = scanner.conditions.map((cond, idx) => ({
      ...cond,
      id: `prebuilt-cond-${scanner.id}-${idx}-${Date.now()}`
    }));
    setConditions(preparedConditions);
    setScannerName('');
    setCurrentPage(1);
    setIsScanning(true);

    setTimeout(() => {
      let results: Stock[] = [];
      results = stocks.filter(stock => {
        if (scanner.logicalOperator === 'AND') {
          return preparedConditions.every(cond => evaluateCondition(stock, cond));
        } else {
          return preparedConditions.some(cond => evaluateCondition(stock, cond));
        }
      });
      setFilteredStocks(results);
      setHasScanned(true);
      setIsScanning(false);
    }, 380);
  };

  // Load a Saved/Template Scanner
  const loadScanner = (scanner: SavedScanner) => {
    setActivePrebuiltId(null);
    setLogicalOperator(scanner.logicalOperator);
    setConditions(scanner.conditions);
    setScannerName(scanner.id.startsWith('template-') ? '' : scanner.name);
    setCurrentPage(1);
    // Instant scanning trigger to feel fully reactive
    setTimeout(() => {
      let results: Stock[] = [];
      results = stocks.filter(stock => {
        if (scanner.logicalOperator === 'AND') {
          return scanner.conditions.every(cond => evaluateCondition(stock, cond));
        } else {
          return scanner.conditions.some(cond => evaluateCondition(stock, cond));
        }
      });
      setFilteredStocks(results);
      setHasScanned(true);
    }, 150);
  };

  // Synchronization with Firebase Firestore & localStorage
  useEffect(() => {
    if (!user) {
      // Load saved scanners from LocalStorage for free accounts
      const local = localStorage.getItem('stockpro_scanners');
      if (local) {
        try {
          setSavedScanners(JSON.parse(local));
        } catch(e) {}
      }
      return;
    }

    // Dynamic real-time listening of saved scanners in Firestore
    const docRef = doc(db, 'scanners', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().scanners) {
        setSavedScanners(docSnap.data().scanners);
      } else {
        setSavedScanners([]);
      }
    }, (error) => {
      console.error("Firestore scanning loading error:", error);
    });

    return unsubscribe;
  }, [user]);

  const handleSaveScanner = async () => {
    if (!scannerName.trim()) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    
    const newScanner: SavedScanner = {
      id: `scanner-${Date.now()}`,
      name: scannerName.trim(),
      logicalOperator,
      conditions
    };

    const updatedScanners = [...savedScanners, newScanner];

    if (!user) {
      // Store in standard localStorage as fallback
      localStorage.setItem('stockpro_scanners', JSON.stringify(updatedScanners));
      setSavedScanners(updatedScanners);
      setSaveStatus('success');
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus('idle');
      }, 1500);
      return;
    }

    // Persist securely to Firestore cloud
    try {
      const docRef = doc(db, 'scanners', user.uid);
      await setDoc(docRef, {
        userId: user.uid,
        scanners: updatedScanners
      }, { merge: true });
      
      setSaveStatus('success');
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus('idle');
      }, 1500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleDeleteSavedScanner = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = savedScanners.filter(s => s.id !== id);
    
    if (!user) {
      localStorage.setItem('stockpro_scanners', JSON.stringify(remaining));
      setSavedScanners(remaining);
      return;
    }

    try {
      const docRef = doc(db, 'scanners', user.uid);
      await setDoc(docRef, {
        userId: user.uid,
        scanners: remaining
      }, { merge: true });
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  // Helper formatting values
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 100000) return `₹${(cap / 1000000).toFixed(2)}T`;
    return `₹${cap.toLocaleString()}Cr`;
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Sr#', 'Stock Name', 'NSE Symbol', 'LTP (₹)', 'Change%', 'Volume', 'Market Cap', 'RSI(14)'];
    const rows = sortedStocks.map((s, idx) => [
      idx + 1,
      s.name,
      s.symbol.replace('.NS', ''),
      s.price,
      s.changePercent,
      s.volume,
      s.marketCap,
      s.rsi
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockPro_Chartink_Scan_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sorting results
  const sortedStocks = useMemo(() => {
    const items = [...filteredStocks];
    items.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' 
        ? (valA as number) - (valB as number) 
        : (valB as number) - (valA as number);
    });
    return items;
  }, [filteredStocks, sortField, sortOrder]);

  const toggleSort = (field: keyof Stock) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const totalItems = sortedStocks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPagedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStocks.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStocks, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Visual Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900/40 via-teal-950/20 to-slate-900 border border-emerald-500/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-550/15 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest border border-emerald-500/20">
              <Database size={11} /> High Frequency Query Compiler
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Chartink Derivative Algorithmic Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Synthesize custom queries on multi-timeframe candle indices. Filter matching NSE equities instantly according to indicators, moving average crossovers, and Implied Volatility skews.
            </p>
          </div>
          
          {/* Quick template indicators helper block */}
          <div className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-3 items-center gap-3 max-w-xs text-[11px] font-mono text-slate-400">
            <Info size={14} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Pro Tips:</strong> Use crossovers on 52-Week highs together with 1-Month timeframes to spot structural institutional rotation breakouts.
            </span>
          </div>
        </div>
      </div>

      {/* ================= PRE-BUILT SCANNERS HORIZONTAL ROW ================= */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850/60 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-150 dark:border-slate-850 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-205 uppercase tracking-wider font-mono">
              🕯️ Pre-built Algorithmic Power Scanners
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono">
            Click Run to auto-populate and instantly scan the Indian market
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
          {PREBUILT_SCANNERS.map((scanner) => {
            const isActive = activePrebuiltId === scanner.id;
            return (
              <div
                key={scanner.id}
                onClick={() => handleRunPrebuiltScanner(scanner)}
                className={`flex-none w-[260px] bg-white dark:bg-slate-950 border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/25 scale-[0.99] shadow-inner'
                    : 'border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-750 hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl filter drop-shadow-sm select-none">{scanner.icon}</span>
                    {isActive ? (
                      <span className="text-[8px] bg-blue-600 dark:bg-blue-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">ACTIVE</span>
                    ) : (
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-400 font-mono px-1.5 py-0.5 rounded">ALGO</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-850 dark:text-white leading-tight">
                      {scanner.name}
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug font-medium line-clamp-2 mt-1 min-h-[32px]">
                      {scanner.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunPrebuiltScanner(scanner);
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      isActive
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250/50 dark:border-emerald-900/30 hover:bg-emerald-600 dark:hover:bg-emerald-900 hover:text-white dark:hover:text-white font-extrabold'
                    }`}
                  >
                    <span>▶ Run</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SECTION: CONDITION BUILDER PANEL ================= */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Create Scanner Query
              </h2>
            </div>
            
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs"
            >
              <Save size={13} />
              <span>Save Scan</span>
            </button>
          </div>

          {/* Quick Templates List */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono font-extrabold tracking-wide block">
              1. Choose Preloaded Strategy Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scannerTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => loadScanner(tpl)}
                  className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition text-left cursor-pointer hover:border-emerald-500/40"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono font-extrabold tracking-wide">
                2. Formulate Conditions Rules Matrix
              </span>
              
              {/* AND/OR Operator Selector */}
              <div className="flex bg-slate-150 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg text-[10px] font-mono font-semibold">
                <button
                  onClick={() => setLogicalOperator('AND')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    logicalOperator === 'AND'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  AND
                </button>
                <button
                  onClick={() => setLogicalOperator('OR')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    logicalOperator === 'OR'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  OR
                </button>
              </div>
            </div>

            {/* Logical Operator explanation line */}
            <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-900/40 p-2 border border-slate-200/50 dark:border-slate-850/40 rounded-lg">
              Match {logicalOperator === 'AND' ? 'ALL' : 'ANY'} of the specified filter declarations below when executing the stock scanner.
            </p>

            {/* Condition Rows */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {conditions.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-3 border border-slate-150 dark:border-slate-850 rounded-xl bg-slate-50/60 dark:bg-slate-950/20 flex flex-col gap-2.5 relative group"
                  >
                    {/* Index count & delete button */}
                    <div className="flex align-center justify-between text-[10px] font-mono font-bold text-slate-400">
                      <span>Condition #{index + 1}</span>
                      {conditions.length > 1 && (
                        <button
                          onClick={() => deleteConditionRow(item.id)}
                          className="text-rose-500 hover:text-rose-600 cursor-pointer p-0.5 hover:bg-rose-500/10 rounded transition"
                          title="Delete condition"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Form Controls Row - Responsive dropdown grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Indicator Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Indicator</label>
                        <select
                          value={item.indicator}
                          onChange={(e) => updateConditionRow(item.id, { indicator: e.target.value })}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-lg p-2 focus:border-emerald-500 outline-none transition font-medium"
                        >
                          {indicatorsList.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>

                      {/* Timeframe Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Timeframe</label>
                        <select
                          value={item.timeframe}
                          onChange={(e) => updateConditionRow(item.id, { timeframe: e.target.value as any })}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-lg p-2 focus:border-emerald-500 outline-none transition font-medium"
                        >
                          {timeframesList.map(tf => (
                            <option key={tf} value={tf}>{tf}</option>
                          ))}
                        </select>
                      </div>

                      {/* Condition Operator */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Condition</label>
                        <select
                          value={item.condition}
                          onChange={(e) => updateConditionRow(item.id, { condition: e.target.value as any })}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-lg p-2 focus:border-emerald-500 outline-none transition font-medium"
                        >
                          {conditionsList.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Value Input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Value Price/Index</label>
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => updateConditionRow(item.id, { value: Number(e.target.value) })}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-lg p-2 focus:border-emerald-500 outline-none transition font-semibold"
                          placeholder="e.g. 100"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={addConditionRow}
                className="w-full border border-dashed border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-700 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add More Condition Rules Row</span>
              </button>

              <button
                onClick={handleRunScan}
                disabled={isScanning}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 text-sm select-none"
              >
                {isScanning ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Compiling Scan Results...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-current" />
                    <span>RUN SCAN MATRIX</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* User's custom saved scans subview */}
          <div className="border-t border-slate-150 dark:border-slate-850 pt-3.5 space-y-3">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono font-extrabold tracking-wide flex items-center justify-between">
              <span>Saved Custom Scans ({savedScanners.length})</span>
              {!user && <span className="bg-amber-500/15 text-amber-500 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">Local Only</span>}
            </span>
            
            {savedScanners.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {savedScanners.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadScanner(s)}
                    className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 hover:border-emerald-500/20 p-2 rounded-xl text-xs font-semibold hover:text-emerald-500 transition-all cursor-pointer group"
                    title="Click to load scanner configuration"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                      <span className="truncate max-w-[170px]">{s.name}</span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteSavedScanner(s.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded bg-transparent opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Delete saved scan permanently"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                <p className="text-[10px] text-slate-400">
                  No customized saves stored. Design a query and click "Save Scan" above to store.
                </p>
              </div>
            )}
            
            {!user && (
              <p className="text-[9px] text-slate-500 tracking-wide text-center leading-relaxed">
                Log in to synchronize your stock queries across your workspace.
              </p>
            )}
          </div>
        </div>

        {/* ================= RIGHT SECTION: SCAN RESULTS PANEL ================= */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-855 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                Scan Match Results
              </h2>
              <p className="text-[10px] text-slate-500 font-medium font-mono">
                {hasScanned 
                  ? `Found ${filteredStocks.length} stocks matching your criteria` 
                  : 'Run a scan to see results'
                }
              </p>
            </div>

            {hasScanned && filteredStocks.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 hover:border-emerald-500/70 py-1.5 px-3 rounded-lg cursor-pointer hover:text-white transition shadow-xs"
              >
                <Download size={12} />
                <span>Export to CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <span className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <p className="text-xs font-mono tracking-wider animate-pulse uppercase">Querying high-performance database...</p>
              </div>
            ) : !hasScanned ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 px-4 bg-slate-50/40 dark:bg-slate-950/40 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850">
                <SlidersHorizontal size={40} className="text-slate-450 dark:text-slate-600 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white">Run a scan to see results</h4>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    Formulate your rules matrix on the left panel and click <strong>"RUN SCAN MATRIX"</strong> or select a template to initialize instant scans.
                  </p>
                </div>
                <button
                  onClick={handleRunScan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer hover:scale-105 transition-all mt-2"
                >
                  Run default scan
                </button>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-4">
                <Info size={36} className="text-amber-550" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white">No Matching Equities Extracted</h4>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    None of our 25+ real-time tracked indices met your set values. Try reducing values, loosening timeframe margins, or using <strong>OR</strong> logical operator parameters instead of AND.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <table className="w-full text-left trade_results_table font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-850 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                      <th className="py-2.5 px-3 font-semibold">Sr#</th>
                      <th className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('name')}>
                        Stock Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('symbol')}>
                        NSE Symbol {sortField === 'symbol' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('price')}>
                        LTP (₹) {sortField === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('changePercent')}>
                        Change% {sortField === 'changePercent' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('volume')}>
                        Volume {sortField === 'volume' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('marketCap')}>
                        Market Cap {sortField === 'marketCap' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('rsi')}>
                        RSI(14) {sortField === 'rsi' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-2.5 px-3 text-right text-slate-500 font-semibold">Action buttons (Chart, F&O)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 text-xs font-medium">
                    {currentPagedStocks.map((stock, idx) => {
                      const absoluteIndex = ((currentPage - 1) * itemsPerPage) + idx + 1;
                      return (
                        <tr
                          key={stock.symbol}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850/40 transition"
                        >
                          {/* absolute Sr# index */}
                          <td className="py-3 px-3 font-mono text-slate-400 dark:text-slate-500">
                            {absoluteIndex}
                          </td>

                          {/* Name */}
                          <td className="py-3 px-3">
                            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={stock.name}>
                              {stock.name}
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-455 tracking-wider font-semibold uppercase">{stock.sector}</span>
                          </td>

                          {/* NSE Symbol */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            <span onClick={() => onSelectStock('NSE:'+stock.symbol.replace('.NS',''))} className="hover:text-emerald-500 cursor-pointer underline decoration-dotted underline-offset-4">
                              {stock.symbol.replace('.NS', '')}
                            </span>
                            {stock.isFoEnabled && (
                              <span className="ml-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-350 text-[8px] font-black tracking-wide px-1 rounded uppercase">F&O</span>
                            )}
                          </td>

                          {/* LTP (₹) */}
                          <td className="py-3 px-3 text-right font-mono text-slate-850 dark:text-slate-205 text-[11px] font-bold">
                            ₹{stock.price >= 100 ? stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : stock.price.toFixed(2)}
                          </td>

                          {/* Change% */}
                          <td className={`py-3 px-3 text-right font-mono font-bold text-[11px] ${
                            stock.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                          </td>

                          {/* Volume */}
                          <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-350 text-[11px]">
                            {formatVolume(stock.volume)}
                          </td>

                          {/* Market Cap */}
                          <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-350 text-[11px]">
                            {formatMarketCap(stock.marketCap)}
                          </td>

                          {/* RSI(14) */}
                          <td className="py-3 px-3 text-right">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                              stock.rsi >= 60 
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300' 
                                : stock.rsi <= 40 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-300' 
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                            }`}>
                              {stock.rsi}
                            </span>
                          </td>

                          {/* Controls triggers (Chart, F&O) */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectStock('NSE:'+stock.symbol.replace('.NS',''))}
                                className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-900 hover:text-white dark:hover:text-white text-[10px] py-1 px-2.5 rounded font-bold border border-emerald-100 dark:border-emerald-950 transition cursor-pointer"
                              >
                                Chart
                              </button>
                              {stock.isFoEnabled && (
                                <button
                                  onClick={() => onSelectFoStock(stock.symbol)}
                                  className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-600 dark:hover:bg-purple-900 hover:text-white dark:hover:text-white text-[10px] py-1 px-2.5 rounded font-bold border border-purple-100 dark:border-purple-950 transition cursor-pointer"
                                >
                                  F&O
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Elegantly aligned pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 gap-3">
                    <span className="text-xs text-slate-500 font-mono">
                      Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (total {totalItems} matches)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed text-slate-750 dark:text-slate-350 select-none"
                      >
                        Prev
                      </button>
                      
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition cursor-pointer select-none ${
                              currentPage === pageNum
                                ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                                : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed text-slate-750 dark:text-slate-350 select-none"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Scanner Modal Container */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fadeIn">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              Save Custom Stock Scan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              Designate a name for your technical query condition profile to quickly call it from your personal templates dashboard anytime.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
                Scanner Name
              </label>
              <input
                type="text"
                placeholder="e.g., NIFTY 15M EMA Crossover"
                value={scannerName}
                onChange={(e) => setScannerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-3 focus:border-emerald-500 outline-none transition font-semibold text-xs sm:text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2 text-xs font-bold">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveStatus('idle');
                }}
                className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveScanner}
                disabled={saveStatus === 'saving' || saveStatus === 'success'}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saveStatus === 'saving' ? (
                  <span className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : saveStatus === 'success' ? (
                  <>
                    <Check size={14} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Confirm Save</span>
                )}
              </button>
            </div>
            
            {saveStatus === 'error' && (
              <p className="text-[10px] text-rose-500 font-bold text-center pt-1 leading-snug">
                Please specify a valid template name!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
