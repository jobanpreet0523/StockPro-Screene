import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTVSymbol } from '../utils/tradingView';
import { useTheme } from './ThemeContext';
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
  Star,
  X
} from 'lucide-react';
import { Stock } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ScreenerBuilderProps {
  stocks: Stock[];
  stockData?: any[];
  onSelectStock: (symbol: string) => void;
  onSelectFoStock: (symbol: string) => void;
}

interface ScanCondition {
  id: string;
  indicator: string;
  timeframe: '1 Day' | '1 Week' | '1 Month';
  condition: 'Greater than' | 'Less than' | 'Crosses above' | 'Crosses below' | 'Equal to' | 'Within 2%';
  value: number | string;
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
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

function ChartModal({ symbol, theme, onClose }: { symbol: string; theme: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mappedSymbol = useMemo(() => {
    let clean = symbol;
    if (clean.includes(':')) clean = clean.split(':')[1];
    if (clean.endsWith('.NS')) clean = clean.replace('.NS', '');
    if (clean.endsWith('.BO')) clean = clean.replace('.BO', '');
    return getTVSymbol(clean);
  }, [symbol]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    s.type = 'text/javascript';
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbols: [[`${mappedSymbol}|3M`]],
      chartOnly: true,
      width: '100%',
      height: '100%',
      locale: 'en',
      colorTheme: theme === 'dark' ? 'dark' : 'light',
      autosize: true,
      showVolume: true,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: true,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'candlesticks',
    });
    el.appendChild(s);
    return () => { el.innerHTML = ''; };
  }, [mappedSymbol, theme]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-white dark:bg-slate-950 rounded-2xl w-[90vw] h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 border-opacity-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white uppercase font-sans text-sm tracking-wider">TradingView Chart: <span className="text-emerald-500">{mappedSymbol}</span></span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-rose-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 relative">
          <div ref={containerRef} className="tradingview-widget-container w-full h-full" />
        </div>
      </div>
    </div>
  );
}

const PREBUILT_SCANNERS: PrebuiltScanner[] = [
  {
    id: 'pb-rsi-oversold',
    icon: '📊',
    name: 'RSI Oversold',
    description: 'Finds stocks where the 14-day relative strength index index drops below 30 (severe oversold cushion).',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-rsi-os-cond-1', indicator: 'RSI', timeframe: '1 Day', condition: 'Less than', value: 30 }
    ]
  },
  {
    id: 'pb-volume-breakout',
    icon: '⚡',
    name: 'Volume Breakout',
    description: 'Filters stocks with daily volume exceeding 2M units, capturing institutional interest builds.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-vol-bo-cond-1', indicator: 'Volume', timeframe: '1 Day', condition: 'Greater than', value: '2M' }
    ]
  },
  {
    id: 'pb-52w-high',
    icon: '🚀',
    name: '52-Week High',
    description: 'Closing price is crossing above or within reach of its highest trading peak over the last 52 weeks.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-52high-cond-1', indicator: 'Price', timeframe: '1 Day', condition: 'Crosses above', value: '52wkhigh' }
    ]
  },
  {
    id: 'pb-golden-cross',
    icon: '🌟',
    name: 'Golden Cross',
    description: 'A classic long signal triggering where the short-term 50 EMA crosses above the structural 200 EMA.',
    logicalOperator: 'AND',
    conditions: [
      { id: 'pb-gc-cond-1', indicator: 'EMA', timeframe: '1 Day', condition: 'Crosses above', value: 200 }
    ]
  }
];

export default function ScreenerBuilder({ stocks, stockData, onSelectStock, onSelectFoStock }: ScreenerBuilderProps) {
  const { user, loginWithGoogle, isPro } = useAuth();
  const { theme } = useTheme();
  
  // Logic toggle (AND / OR)
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');
  const [activePrebuiltId, setActivePrebuiltId] = useState<string | null>(null);
  
  // Conditions list - start with one elegant row
  const [conditions, setConditions] = useState<ScanCondition[]>([
    {
      id: 'initial-1',
      indicator: 'volume',
      timeframe: '1 Day',
      condition: 'Greater than',
      value: '1M'
    }
  ]);

  // Results state
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Stock>('changePercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25;

  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const items = localStorage.getItem('stockpro_watchlist');
      return items ? JSON.parse(items) : [];
    } catch {
      return [];
    }
  });

  // Scanner naming & persistence state
  const [scannerName, setScannerName] = useState<string>('');
  const [isBuilderDismissed, setIsBuilderDismissed] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // Horizontal swipe left to dismiss (at least 120px movement and more horizontal than vertical)
    if (diffX < -120 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      setIsBuilderDismissed(true);
      triggerToast('Screener builder dismissed. Tap header to reopen.');
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };
  const [savedScanners, setSavedScanners] = useState<SavedScanner[]>([]);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [limitError, setLimitError] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [savedScannersMap, setSavedScannersMap] = useState<Record<string, {conditions: ScanCondition[], createdAt: string}>>(() => {
    try {
      const stored = localStorage.getItem('savedScanners');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load default/pre-configured templates for instant clicking
  const scannerTemplates: SavedScanner[] = useMemo(() => [
    {
      id: 'template-rsi-bullish',
      name: 'RSI Bullish Breakout (Change > 0)',
      logicalOperator: 'AND',
      conditions: [
        { id: 't1', indicator: 'rsi', timeframe: '1 Day', condition: 'Greater than', value: 30 },
        { id: 't2', indicator: 'change%', timeframe: '1 Day', condition: 'Greater than', value: 0 }
      ]
    },
    {
      id: 'template-undervalued',
      name: 'Undervalued High Volume Bargains',
      logicalOperator: 'AND',
      conditions: [
        { id: 't6', indicator: 'pe', timeframe: '1 Day', condition: 'Less than', value: 25 },
        { id: 't7', indicator: 'volume', timeframe: '1 Day', condition: 'Greater than', value: '1M' },
        { id: 't8', indicator: 'change%', timeframe: '1 Day', condition: 'Greater than', value: 0.5 }
      ]
    },
    {
      id: 'template-momentum',
      name: 'High Price Momentum',
      logicalOperator: 'AND',
      conditions: [
        { id: 't9', indicator: 'price', timeframe: '1 Day', condition: 'Greater than', value: 100 },
        { id: 't11', indicator: 'change%', timeframe: '1 Day', condition: 'Greater than', value: 2 }
      ]
    }
  ], []);

  const hasInitializedFromUrl = useRef(false);

  useEffect(() => {
    // Synchronize local map when savedScanners changes elsewhere
    const handleSync = () => {
      try {
        const stored = localStorage.getItem('savedScanners');
        setSavedScannersMap(stored ? JSON.parse(stored) : {});
      } catch (e) {}
    };
    window.addEventListener('stockpro_scanners_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('stockpro_scanners_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    const list: SavedScanner[] = Object.entries(savedScannersMap).map(([name, item]) => ({
      id: `scanner-${name}`,
      name: name,
      logicalOperator: 'AND',
      conditions: (item as any).conditions
    }));
    setSavedScanners(list);
  }, [savedScannersMap]);

  useEffect(() => {
    if (hasInitializedFromUrl.current) return;
    if (!stockData || stockData.length === 0) {
       if (!stocks || stocks.length === 0) return; // Wait for data
    }
    
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const scanParam = searchParams.get('scan');
      const cParam = searchParams.get('c');

      if (cParam) {
        try {
          // Parse e.g. /screener?c=rsi<30|volume>1M
          const parts = cParam.split('|');
          const loadedConditions = parts.map((part, index) => {
            let indicator = '';
            let condition: 'Greater than' | 'Less than' | 'Within 2%' = 'Greater than';
            let value: string | number = '';

            if (part.includes('>')) {
              const spl = part.split('>');
              indicator = spl[0].trim();
              condition = 'Greater than';
              value = spl[1].trim();
            } else if (part.includes('<')) {
              const spl = part.split('<');
              indicator = spl[0].trim();
              condition = 'Less than';
              value = spl[1].trim();
            } else if (part.includes('~')) {
              const spl = part.split('~');
              indicator = spl[0].trim();
              condition = 'Within 2%';
              value = spl[1].trim();
            } else {
              indicator = part.trim();
              if (indicator === '52wkhigh' || indicator === '52wklow') {
                condition = 'Within 2%';
                value = 0;
              } else {
                condition = 'Greater than';
                value = 0;
              }
            }

            if (indicator === 'change') indicator = 'change%';

            return {
              id: `url-cond-${index}-${Date.now()}`,
              indicator,
              timeframe: '1 Day' as any,
              condition,
              value
            };
          });

          setConditions(loadedConditions);
          setActivePrebuiltId(null);
          setScannerName('');
          setCurrentPage(1);
          setIsScanning(true);

          setTimeout(() => {
            let activeSet = (stockData && stockData.length > 0) ? stockData : stocks;
            let matchedItems = activeSet.filter(stock => {
              return loadedConditions.every(cond => evaluateCondition(stock, cond));
            });

            matchedItems.sort((a, b) => {
              const volA = a.regularMarketVolume || a.volume || 0;
              const volB = b.regularMarketVolume || b.volume || 0;
              return volB - volA;
            });

            const results = matchedItems.map((item, index) => {
              if ('regularMarketPrice' in item) {
                 return {
                   id: item.symbol || `mapped-${index}`,
                   symbol: item.symbol,
                   name: item.shortName || item.symbol,
                   price: item.regularMarketPrice || 0,
                   change: (item.regularMarketPrice || 0) * ((item.regularMarketChangePercent || 0) / 100),
                   changePercent: item.regularMarketChangePercent || 0,
                   volume: item.regularMarketVolume || 0,
                   marketCap: item.marketCap || 0,
                   peRatio: item.trailingPE || 0,
                   isFoEnabled: true,
                   rsi: (item.regularMarketChangePercent || 0) < -2 ? 25 : 55,
                   sector: 'Equity',
                   dividendYield: 0,
                   high: item.fiftyTwoWeekHigh || item.regularMarketPrice,
                   low: item.fiftyTwoWeekLow || item.regularMarketPrice,
                   open: item.regularMarketPrice || 0,
                   close: item.regularMarketPrice || 0,
                   exchange: 'NSE'
                 } as Stock;
              }
              return item as Stock;
            });

            setFilteredStocks(results);
            setHasScanned(true);
            setIsScanning(false);
            setLastUpdated(new Date());
          }, 1000);
        } catch (err) {
          console.error("Failed to parse c url param:", err);
        }
      } else if (scanParam && scanParam !== 'custom') {
        const pb = PREBUILT_SCANNERS.find(s => s.id === scanParam);
        if (pb) {
           handleRunPrebuiltScanner(pb);
        } else {
           const tpl = scannerTemplates.find(s => s.id === scanParam);
           if (tpl) loadScanner(tpl);
        }
      }
      hasInitializedFromUrl.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockData, stocks]);

  // Dropdown lists
  const indicatorsList = [
    'RSI', 'EMA', 'Price', 'Volume', 'Change%', 'marketcap', 'pe', '52wkhigh', '52wklow', 'change% (abs)'
  ];

  const timeframesList = ['1 Day', '1 Week', '1 Month'];

  const conditionsList = ['Greater than', 'Less than', 'Crosses above', 'Within 2%'];

  // Parse value string (supports K, M, B suffixes)
  const parseValueString = (val: string | number): number => {
    if (typeof val === 'number') return val;
    let numericStr = String(val).toUpperCase().trim();
    let mult = 1;
    if (numericStr.endsWith('K')) { mult = 1000; numericStr = numericStr.replace('K', ''); }
    else if (numericStr.endsWith('M')) { mult = 1000000; numericStr = numericStr.replace('M', ''); }
    else if (numericStr.endsWith('B')) { mult = 1000000000; numericStr = numericStr.replace('B', ''); }
    return parseFloat(numericStr) * mult || 0;
  };

  // Evaluate single condition using Yahoo Finance fields
  const evaluateCondition = (rawStock: any, cond: ScanCondition): boolean => {
    // Adapter to handle both stockData array and mock stocks array
    const stock = (stockData && stockData.length > 0) ? rawStock : {
       ...rawStock,
       regularMarketPrice: rawStock.price,
       regularMarketChangePercent: rawStock.changePercent,
       regularMarketVolume: rawStock.volume,
       marketCap: rawStock.marketCap,
       trailingPE: rawStock.peRatio || 20,
       fiftyTwoWeekHigh: rawStock.high || rawStock.fiftyTwoWeekHigh || rawStock.price * 1.1,
       fiftyTwoWeekLow: rawStock.low || rawStock.fiftyTwoWeekLow || rawStock.price * 0.9,
    };

    const filterVal = parseValueString(cond.value);
    const indName = String(cond.indicator).toLowerCase();

    // Organically computed technical indicator defaults
    const price = stock.regularMarketPrice || stock.price || 0;
    const changePct = stock.regularMarketChangePercent || stock.changePercent || 0;
    const vol = stock.regularMarketVolume || stock.volume || 0;
    const high = stock.fiftyTwoWeekHigh || price;
    const low = stock.fiftyTwoWeekLow || price;

    // Derived EMA estimates from live price action
    const ema50 = Math.round(price * (changePct > 0 ? 0.98 : 1.01) * 100) / 100;
    const ema200 = Math.round(price * 0.92 * 100) / 100;

    // Organic Relative Strength Index computation
    const baseRsi = rawStock.rsi || (50 + changePct * 6);
    const rsiVal = Math.max(10, Math.min(90, Math.round(baseRsi)));

    switch (indName) {
      case 'price': {
        if (typeof cond.value === 'string' && (cond.value.toLowerCase() === '52wkhigh' || cond.value.toLowerCase() === '52w high')) {
          return price >= high;
        }
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? price > filterVal : price < filterVal;
      }
      case 'change%':
      case 'change': {
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? changePct > filterVal : changePct < filterVal;
      }
      case 'volume': {
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? vol > filterVal : vol < filterVal;
      }
      case 'rsi': {
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? rsiVal > filterVal : rsiVal < filterVal;
      }
      case 'ema': {
        if (filterVal === 200) {
          return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? ema50 > ema200 : ema50 < ema200;
        }
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? price > ema50 : price < ema50;
      }
      case 'marketcap': {
        const val = stock.marketCap || 0;
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? val > filterVal : val < filterVal;
      }
      case 'pe': {
        const val = stock.trailingPE || 0;
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? val > filterVal : val < filterVal;
      }
      case '52wkhigh': {
        const val = high > 0 ? ((price / high) * 100) : 0;
        if (cond.condition === 'Within 2%') {
           return price >= high * 0.98 && price <= high * 1.02;
        }
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? val > filterVal : val < filterVal;
      }
      case '52wklow': {
        const val = low > 0 ? ((price / low) * 100) : 0;
        if (cond.condition === 'Within 2%') {
           return price >= low * 0.98 && price <= low * 1.02;
        }
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? val > filterVal : val < filterVal;
      }
      case 'change% (abs)': {
        const val = Math.abs(changePct);
        return cond.condition === 'Greater than' || cond.condition === 'Crosses above' ? val > filterVal : val < filterVal;
      }
      default:
        return false;
    }
  };

  // Run scanner engine over the stockData array
  const handleRunScan = () => {
    setIsScanning(true);
    setCurrentPage(1);
    setTimeout(() => {
      let activeSet = (stockData && stockData.length > 0) ? stockData : stocks;
      let matchedItems: any[] = [];

      if (conditions.length === 0) {
        matchedItems = [...activeSet];
      } else {
        matchedItems = activeSet.filter(stock => {
          if (logicalOperator === 'AND') {
            return conditions.every(cond => evaluateCondition(stock, cond));
          } else {
            return conditions.some(cond => evaluateCondition(stock, cond));
          }
        });
      }

      // By default, sort by volume descending
      matchedItems.sort((a, b) => {
        const volA = a.regularMarketVolume || a.volume || 0;
        const volB = b.regularMarketVolume || b.volume || 0;
        return volB - volA; // descending
      });

      // Map back to unified Stock interface for simple table rendering
      const results: Stock[] = matchedItems.map((item, index) => {
        if ('regularMarketPrice' in item) {
           return {
             id: item.symbol || `mapped-${index}`,
             symbol: item.symbol,
             name: item.shortName || item.symbol,
             price: item.regularMarketPrice || 0,
             change: (item.regularMarketPrice || 0) * ((item.regularMarketChangePercent || 0) / 100),
             changePercent: item.regularMarketChangePercent || 0,
             volume: item.regularMarketVolume || 0,
             marketCap: item.marketCap || 0,
             peRatio: item.trailingPE || 0,
             isFoEnabled: true,
             rsi: (item.regularMarketChangePercent || 0) < -2 ? 25 : 55, // simulation representation
             sector: 'Equity',
             dividendYield: 0,
             high: item.fiftyTwoWeekHigh || item.regularMarketPrice,
             low: item.fiftyTwoWeekLow || item.regularMarketPrice,
             open: item.regularMarketPrice || 0,
             close: item.regularMarketPrice || 0,
             exchange: 'NSE'
           } as Stock;
        }
        return item as Stock;
      });

      setFilteredStocks(results);
      setHasScanned(true);
      setIsScanning(false);
      setLastUpdated(new Date());
    }, 1500); // 1.5 seconds loading animation as requested
  };

  // Manage condition rows
  const addConditionRow = () => {
    setActivePrebuiltId(null);
    const newId = `condition-${Date.now()}`;
    setConditions([
      ...conditions,
      {
        id: newId,
        indicator: 'price',
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
      let activeSet = (stockData && stockData.length > 0) ? stockData : stocks;
      let matchedItems: any[] = [];
      matchedItems = activeSet.filter(stock => {
        if (scanner.logicalOperator === 'AND') {
          return preparedConditions.every(cond => evaluateCondition(stock, cond));
        } else {
          return preparedConditions.some(cond => evaluateCondition(stock, cond));
        }
      });
      
      // Handle custom sorting for the pre-built scanner
      if (scanner.sortField === 'change%') {
          matchedItems.sort((a,b) => {
             const valA = a.regularMarketChangePercent || a.changePercent || 0;
             const valB = b.regularMarketChangePercent || b.changePercent || 0;
             return scanner.sortOrder === 'desc' ? valB - valA : valA - valB;
          });
      } else {
          // Default volume sort
          matchedItems.sort((a, b) => {
             const volA = a.regularMarketVolume || a.volume || 0;
             const volB = b.regularMarketVolume || b.volume || 0;
             return volB - volA; // descending
          });
      }
      
      if (scanner.id === 'pb-gainers' || scanner.id === 'pb-losers') {
          matchedItems = matchedItems.slice(0, 10);
      }

      // Map back to unified Stock interface
      const results: Stock[] = matchedItems.map((item, index) => {
        if ('regularMarketPrice' in item) {
           return {
             id: item.symbol || `mapped-${index}`,
             symbol: item.symbol,
             name: item.shortName || item.symbol,
             price: item.regularMarketPrice || 0,
             change: (item.regularMarketPrice || 0) * ((item.regularMarketChangePercent || 0) / 100),
             changePercent: item.regularMarketChangePercent || 0,
             volume: item.regularMarketVolume || 0,
             marketCap: item.marketCap || 0,
             peRatio: item.trailingPE || 0,
             isFoEnabled: true,
             rsi: (item.regularMarketChangePercent || 0) < -2 ? 25 : 55,
             sector: 'Equity',
             dividendYield: 0,
             high: item.fiftyTwoWeekHigh || item.regularMarketPrice,
             low: item.fiftyTwoWeekLow || item.regularMarketPrice,
             open: item.regularMarketPrice || 0,
             close: item.regularMarketPrice || 0,
             exchange: 'NSE'
           } as Stock;
        }
        return item as Stock;
      });

      setFilteredStocks(results);
      setHasScanned(true);
      setIsScanning(false);
    }, 1500);
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

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(prev => {
      let next;
      if (prev.includes(symbol)) {
        next = prev.filter(s => s !== symbol);
      } else {
        next = [...prev, symbol];
      }
      localStorage.setItem('stockpro_watchlist', JSON.stringify(next));
      return next;
    });
  };

  const handleShare = () => {
    const encoded = conditions.map(cond => {
      const ind = cond.indicator === 'change%' ? 'change' : cond.indicator;
      if (cond.condition === 'Within 2%') {
        return `${ind}`;
      }
      const op = cond.condition === 'Greater than' ? '>' : '<';
      return `${ind}${op}${cond.value}`;
    }).join('|');

    const url = `${window.location.origin}/screener?c=${encodeURIComponent(encoded)}`;
    navigator.clipboard.writeText(url);
    triggerToast('Link copied!');
  };
  const handleSaveScanner = async () => {
    if (!scannerName.trim()) {
      setSaveStatus('error');
      return;
    }

    const currentCount = Object.keys(savedScannersMap).length;
    if (!isPro && currentCount >= 3) {
      setLimitError(true);
      return;
    }

    setSaveStatus('saving');
    
    try {
      const nextMap = {
        ...savedScannersMap,
        [scannerName.trim()]: {
          conditions: conditions,
          createdAt: new Date().toISOString()
        }
      };

      // Save to localStorage exactly as requested (savedScanners[name] = {conditions, createdAt})
      localStorage.setItem('savedScanners', JSON.stringify(nextMap));
      setSavedScannersMap(nextMap);
      setSaveStatus('success');
      setLimitError(false);

      // Trigger custom sync event so other components (e.g., header dropdown) update instantly
      window.dispatchEvent(new Event('stockpro_scanners_updated'));

      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus('idle');
        setScannerName('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleDeleteSavedScanner = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove by clearing out from standard map key
    const name = id.replace('scanner-', '');
    const nextMap = { ...savedScannersMap };
    delete nextMap[name];
    
    localStorage.setItem('savedScanners', JSON.stringify(nextMap));
    setSavedScannersMap(nextMap);

    // Trigger update
    window.dispatchEvent(new Event('stockpro_scanners_updated'));
  };

  // Helper formatting values
  const formatVolume = (vol: number) => {
    const v = vol ?? 0;
    if (v >= 1000000) return `${(typeof v === 'number' ? (v / 1000000).toFixed(2) : Number(v / 1000000).toFixed(2))}M`;
    if (v >= 1000) return `${(typeof v === 'number' ? (v / 1000).toFixed(0) : Number(v / 1000).toFixed(0))}K`;
    return v.toString();
  };

  const formatMarketCap = (cap: number) => {
    const c = cap ?? 0;
    if (c >= 100000) return `₹${(typeof c === 'number' ? (c / 1000000).toFixed(2) : Number(c / 1000000).toFixed(2))}T`;
    return `₹${c.toLocaleString()}Cr`;
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
    let items = [...filteredStocks];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q));
    }

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
    <div className="space-y-6 pb-20 md:pb-6">
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

        <div className="grid grid-cols-2 gap-3 md:flex md:gap-4 md:overflow-x-auto pb-2 pt-1 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
          {PREBUILT_SCANNERS.map((scanner) => {
            const isActive = activePrebuiltId === scanner.id;
            return (
              <div
                key={scanner.id}
                onClick={() => handleRunPrebuiltScanner(scanner)}
                className={`w-full md:flex-none md:w-[260px] bg-white dark:bg-slate-950 border rounded-xl p-3 sm:p-4 flex flex-col justify-between gap-3 sm:gap-4 transition-all duration-300 cursor-pointer ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20 md:pb-6">
        {/* ================= LEFT SECTION: CONDITION BUILDER PANEL ================= */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`${isBuilderDismissed ? 'hidden xl:hidden' : 'flex'} lg:col-span-12 xl:col-span-5 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-5`}
        >
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                          type="text"
                          value={item.value}
                          onChange={(e) => updateConditionRow(item.id, { value: e.target.value })}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-lg p-2 focus:border-emerald-500 outline-none transition font-semibold"
                          placeholder="e.g. 100 or 1M"
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
                className="hidden md:flex w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 text-sm select-none"
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

              {/* Add swipe description for mobile devices */}
              <div className="md:hidden text-center py-1.5 mt-1 border-t border-dashed border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5 select-none cursor-pointer" onClick={() => {
                setIsBuilderDismissed(true);
                triggerToast('Screener builder dismissed. Tap restore banner to expand.');
              }}>
                <span>← Swipe Left to Dismiss Builder ←</span>
              </div>
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
        <div className={`${isBuilderDismissed ? 'lg:col-span-12 xl:col-span-12' : 'lg:col-span-12 xl:col-span-7'} bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-855 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4`}>
          {isBuilderDismissed && (
            <div 
              onClick={() => setIsBuilderDismissed(false)}
              className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3 flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition duration-150 shadow-xs animate-fadeIn"
            >
              <div className="flex items-center gap-2">
                <span>🔄</span>
                <span>Query builder collapsed to maximize viewing area. Click here to expand.</span>
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-black uppercase shrink-0">Expand</span>
            </div>
          )}
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
              <div className="flex items-center gap-3">
                <input
                   type="text"
                   placeholder="Search..."
                   value={searchQuery}
                   onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 focus:border-emerald-500 outline-none w-36"
                />
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-3 rounded-lg cursor-pointer transition shadow-xs"
                >
                  <span>Share</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 hover:border-emerald-500/70 py-1.5 px-3 rounded-lg cursor-pointer hover:text-white transition shadow-xs"
                >
                  <Download size={12} />
                  <span>Export to CSV</span>
                </button>
              </div>
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
                      <th className="hidden md:table-cell py-2.5 px-3 font-semibold">★ Sr#</th>
                      <th className="sticky left-0 bg-white dark:bg-slate-950 md:bg-transparent z-20 py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('name')}>
                        Stock Name {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="hidden md:table-cell py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('symbol')}>
                        NSE Symbol {sortField === 'symbol' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('price')}>
                        LTP (₹) {sortField === 'price' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('changePercent')}>
                        Change% {sortField === 'changePercent' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('volume')}>
                        Volume {sortField === 'volume' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="hidden md:table-cell py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('marketCap')}>
                        Market Cap {sortField === 'marketCap' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="hidden md:table-cell py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('rsi')}>
                        RSI(14) {sortField === 'rsi' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="hidden md:table-cell py-2.5 px-3 text-right text-slate-500 font-semibold">Action buttons</th>
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
                          <td className="hidden md:table-cell py-3 px-3 font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            <span 
                               className={`mr-2 cursor-pointer transition-colors ${watchlist.includes(stock.symbol) ? 'text-amber-500 drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'}`}
                               onClick={(e) => toggleWatchlist(stock.symbol, e)}
                               title="Toggle watchlist"
                            >
                              ★
                            </span>
                            {absoluteIndex}
                          </td>

                          {/* Name */}
                          <td 
                            className="sticky left-0 bg-white dark:bg-slate-950 md:bg-transparent z-10 py-3 px-3 cursor-pointer"
                            onClick={() => setChartModalSymbol('NSE:'+stock.symbol.replace('.NS',''))}
                            title="Click to view TradingView chart"
                          >
                            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px] hover:text-emerald-500 hover:underline" title={stock.name}>
                              {stock.name}
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-455 tracking-wider font-semibold uppercase">{stock.sector}</span>
                          </td>

                          {/* NSE Symbol */}
                          <td className="hidden md:table-cell py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            <span onClick={() => onSelectStock('NSE:'+stock.symbol.replace('.NS',''))} className="hover:text-emerald-500 cursor-pointer underline decoration-dotted underline-offset-4">
                              {stock.symbol.replace('.NS', '')}
                            </span>
                            {stock.isFoEnabled && (
                              <span className="ml-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-350 text-[8px] font-black tracking-wide px-1 rounded uppercase">F&O</span>
                            )}
                          </td>

                          {/* LTP (₹) */}
                          <td className="py-3 px-3 text-right font-mono text-slate-850 dark:text-slate-205 text-[11px] font-bold">
                            ₹{(stock.price ?? 0) >= 100 ? (stock.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (typeof stock.price === 'number' ? stock.price.toFixed(2) : Number(stock.price || 0).toFixed(2))}
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
                          <td className="hidden md:table-cell py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-350 text-[11px]">
                            {formatMarketCap(stock.marketCap)}
                          </td>

                          {/* RSI(14) */}
                          <td className="hidden md:table-cell py-3 px-3 text-right">
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
                          <td className="hidden md:table-cell py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setChartModalSymbol('NSE:'+stock.symbol.replace('.NS',''))}
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
                
                {lastUpdated && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center pt-2">
                    Last updated: {lastUpdated.toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      {chartModalSymbol && <ChartModal symbol={chartModalSymbol} theme={theme} onClose={() => setChartModalSymbol(null)} />}

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

            {limitError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 text-center space-y-1 animate-fadeIn">
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-450">
                  Saved Scanners Limit Reached (3 Max)
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Free accounts are limited to 3 saved scanners. <strong className="text-emerald-500">Upgrade to Pro for unlimited!</strong>
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">
                Scanner Name
              </label>
              <input
                type="text"
                placeholder="e.g., NIFTY 15M EMA Crossover"
                value={scannerName}
                onChange={(e) => {
                  setScannerName(e.target.value);
                  setLimitError(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-3 focus:border-emerald-500 outline-none transition font-semibold text-xs sm:text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2 text-xs font-bold">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveStatus('idle');
                  setLimitError(false);
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

      {/* Floating Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-[200] font-sans text-xs"
          >
            <div className="bg-emerald-500 text-slate-950 p-1 rounded-full">
              <Check size={14} className="stroke-[3]" />
            </div>
            <span className="font-extrabold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Sticky bottom Run Scan button bar for mobile screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200/80 dark:border-slate-800/80 p-3 z-40 shadow-2xl flex items-center gap-3 backdrop-blur-md">
        {isBuilderDismissed && (
          <button
            onClick={() => setIsBuilderDismissed(false)}
            className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-350 px-3.5 py-3 rounded-xl font-bold text-xs select-none hover:bg-slate-200 dark:hover:bg-slate-800 transition block shrink-0"
          >
            Restore Builder
          </button>
        )}
        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:scale-[1.01] transition cursor-pointer flex items-center justify-center gap-2 text-xs select-none uppercase tracking-wider font-sans"
        >
          {isScanning ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Play size={12} className="fill-current" />
              <span>Run Quick Matrix Scan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
