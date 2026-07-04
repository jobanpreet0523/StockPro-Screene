import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Copy, Lightbulb, MessageSquare, Send, Star, WandSparkles } from 'lucide-react';

type UtilityTab = 'guide' | 'examples' | 'feedback';

type FeedbackEntry = {
  id: string;
  rating: number;
  message: string;
  createdAt: string;
};

const examples = [
  'Daily volume greater than 200000 and close above SMA 20',
  'Doji candle with close above open and volume rising',
  'RSI between 45 and 60 with bullish close',
  '5-minute volume greater than 2x SMA(volume,10)',
  'Daily open equals daily close and volume above average',
  'F&O stocks with positive change and strong volume',
];

const guideSteps = [
  'Choose a scanner template such as Doji, Confirmed Doji, Volume Breakout, or RSI Bounce.',
  'Use Magic Filters to convert plain English ideas into scanner rules.',
  'Use “passes all” for mandatory filters and “passes any 1” for optional confirmation rules.',
  'Run Scan to filter the loaded StockPro stock universe.',
  'Use Why Matched to understand exactly why a stock appeared in results.',
  'Save scans or create alerts for repeated monitoring.',
];

const storageKey = 'stockpro_scanner_feedback';

export default function ChartinkScannerUtilityPanel() {
  const [activeTab, setActiveTab] = useState<UtilityTab>('guide');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });

  const latestFeedback = useMemo(() => feedback.slice(0, 3), [feedback]);

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  };

  const copyExample = async (example: string) => {
    try {
      await navigator.clipboard?.writeText(example);
      notify('Example copied to clipboard');
    } catch {
      notify('Example selected');
    }
  };

  const submitFeedback = () => {
    const clean = message.trim();
    if (!clean) {
      notify('Write feedback first');
      return;
    }
    const entry: FeedbackEntry = {
      id: `feedback-${Date.now()}`,
      rating,
      message: clean,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...feedback].slice(0, 20);
    setFeedback(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setMessage('');
    notify('Feedback saved locally');
  };

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" id="chartink_scanner_utility_panel">
      {toast && <div className="fixed right-6 top-24 z-[150] rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-emerald-300 shadow-2xl">{toast}</div>}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Scanner utility center</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Guide, ready-made scan examples, and feedback tools for the scanner workspace.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          {[
            { id: 'guide', label: 'Guide', icon: BookOpen },
            { id: 'examples', label: 'Examples', icon: WandSparkles },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as UtilityTab)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'guide' && (
        <div className="grid gap-3 lg:grid-cols-2">
          {guideSteps.map((step, index) => (
            <div key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-black text-white">{index + 1}</div>
              <p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{step}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="grid gap-3 md:grid-cols-2">
          {examples.map((example) => (
            <button key={example} onClick={() => copyExample(example)} className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/20">
              <span className="flex gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" /> {example}</span>
              <Copy size={15} className="shrink-0 text-slate-400 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Rating</span>
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} onClick={() => setRating(value)} className={`${value <= rating ? 'text-amber-400' : 'text-slate-300'}`}>
                  <Star size={18} fill="currentColor" />
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell what should be improved in the scanner tab..."
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
            <button onClick={submitFeedback} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"><Send size={14} /> Submit feedback</button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-3 text-sm font-black text-slate-950 dark:text-white">Recent feedback</h3>
            {latestFeedback.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">No feedback saved yet.</p>
            ) : (
              <div className="space-y-2">
                {latestFeedback.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="mb-1 flex items-center gap-1 text-amber-400">{Array.from({ length: entry.rating }).map((_, index) => <Star key={index} size={12} fill="currentColor" />)}</div>
                    <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
        <CheckCircle2 size={16} /> This panel is local-first: examples copy to clipboard, feedback saves in browser storage, and no paid lock is added.
      </div>
    </section>
  );
}
