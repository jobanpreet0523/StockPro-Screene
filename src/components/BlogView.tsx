import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Calendar, Search, ArrowRight, CornerDownRight, Award, Flame, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  readTime: string;
  date: string;
  author: string;
  category: string;
  content: React.ReactNode;
}

export default function BlogView() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const articles: Article[] = [
    {
      id: 'nse-option-chain-guide',
      title: 'Ultimate Guide to Decoding the NSE Option Chain for Intraday Trades',
      slug: 'nse-option-chain-guide',
      description: 'Master the art of reading the live NSE option chain. Learn how to spot support, resistance, open interest accumulation, and implied volatility skews to pick high-probability trades with real institutional momentum.',
      keywords: ['NSE option chain', 'how to read option chain', 'open interest options target', 'NIFTY weekly options strategy', 'options resistance support', 'implied volatility skew India', 'F&O trading tutorial'],
      readTime: '12 min read',
      date: 'June 11, 2026',
      author: 'Rajesh Varma, Derivative Strategist',
      category: 'Education',
      content: (
        <div className="space-y-6 text-slate-800 dark:text-slate-300 leading-relaxed text-sm md:text-base">
          <p className="font-semibold text-slate-900 dark:text-white text-base md:text-lg">
            For retail traders operating in the Indian stock market, the <strong>NSE option chain</strong> is the single most powerful roadmap available. It provides a real-time summary of all active derivative contracts, charting the battle between buyers and sellers of call and put options. If you do not know how to decode this data, you are essentially trading blind.
          </p>
          <p>
            When searching for the <strong>NSE option chain</strong>, you will encounter a grid-like matrix consisting of multiple columns: Strike prices, Open Interest (OI), change in OI, Implied Volatility (IV), Volume, Bid/Ask spreads, and Last Traded Prices (LTP). Let us break down how to read this with professional precision, showing you exactly how to spot institutional footprints and configure high-probability setups.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            1. Understanding the Anatomy: Calls vs. Puts
          </h3>
          <p>
            The option chain is divided symmetrically. Below are the two halves that define the active trading session:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Calls (Left Side):</strong> Call options represent the right to buy NIFTY at a specific strike price. Retail traders usually buy calls when they are bullish. However, large institutions (smarter money with deeper pockets) typically <strong>write (sell) calls</strong> if they believe NIFTY will struggle to break above that strike price.
            </li>
            <li>
              <strong>Puts (Right Side):</strong> Put options represent the right to sell NIFTY. Retailers buy puts when they are bearish. On the other hand, institutional players <strong>write puts</strong> when they believe NIFTY has found a safe price floor and will not fall below that strike.
            </li>
            <li>
              <strong>Strike Price (Center Column):</strong> This is the anchor price. All call and put metrics are organized relative to these fixed interval strikes (e.g., 50-point intervals for NIFTY, like 24,800, 24,850, 24,900).
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            2. The Golden Rule of Interpretation: Think Like a Writer
          </h3>
          <p>
            Option buyers have unlimited profit potential but a very low probability of success due to time decay (Theta). Option writers (sellers) have limited profits but an extraordinarily high statistical probability of success. Because writing options requires deep capital margins, it is dominated by massive institutions and algorithmic desks. 
            <strong> Always analyze the NSE option chain data from the perspective of the option writer!</strong>
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-lg my-4">
            <h4 className="font-bold text-emerald-805 dark:text-emerald-400 text-sm md:text-base">Pro Trader Mindset Shift</h4>
            <p className="text-xs md:text-sm text-slate-705 dark:text-slate-350 mt-1">
              If you see a surge in Open Interest (OI) at a specific strike, do not assume traders are buying options there. Assume that institutions are writing options there. A strike with 10 lakh Call OI represents 10 lakh contracts worth of resistance, because institutions are betting Nifty won't cross it!
            </p>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            3. Key Indicators to Focus on the NSE Option Chain
          </h3>
          <p>
            When utilizing the StockPro Option Chain interface during live hours, you should focus on four primary pillars:
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-150 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold">
                  <th className="p-3">Indicator</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Interpretation (Writer View)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Open Interest (OI)</td>
                  <td className="p-3 font-semibold">The total number of active, outstanding contract positions.</td>
                  <td className="p-3">High Call OI = Heavy resistance boundary.<br/>High Put OI = Strong support cushion.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Change in OI (Chg OI)</td>
                  <td className="p-3 font-semibold">The net positions added or unwound during the current trading session.</td>
                  <td className="p-3">Positive change shows aggressive new writing.<br/>Negative change indicates traders are panicking and exiting (short covering).</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Implied Volatility (IV)</td>
                  <td className="p-3 font-semibold">The market's expectation of future volatility baked into premium prices.</td>
                  <td className="p-3">High IV premiums are expensive (ideal for sellers).<br/>Low IV premiums are cheap (better for buyers).</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Last Traded Price (LTP)</td>
                  <td className="p-3 font-semibold">The current market premium value of the option contract.</td>
                  <td className="p-3">Subject to aggressive decay, especially on weekly expiry days.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            4. Spotting Support & Resistance via Open Interest
          </h3>
          <p>
            Let us walk through a practical scenario. Suppose the NIFTY Spot Price is trading at 24,850. You look at the option chain and observe the following:
          </p>
          <ul className="list-decimal pl-6 space-y-2">
            <li>
              At <strong>25,000 Strike</strong>, there are 1,85,000 Call OI contracts, and 45,000 have been added today.
            </li>
            <li>
              At <strong>24,700 Strike</strong>, there are 1,62,000 Put OI contracts, and 35,000 have been added today.
            </li>
          </ul>
          <p>
            <strong>The Strategy Analysis:</strong> The 25,000 call strike has the highest Call OI concentration. This tells you option writers are extremely confident that NIFTY will not rise above 25,000 by the upcoming weekly expiry. This is your major resistance level. Conversely, the 24,700 put strike has the highest Put OI concentration. Writers are backing this level, creating a thick cushion. This is your key support level. 
          </p>
          <p>
            The anticipated trading range for NIFTY in this session is therefore defined as 24,700 to 25,000. Underwriting premium-decay setups (such as Iron Condors) around these boundary limits can maximize the rate of return with lower direct exposure.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            5. The Short Covering Breakout: The Ultimate Momentum Trigger
          </h3>
          <p>
            One of the most rapid upward moves in the Indian stock market occurs during a <strong>short covering rally</strong>. Because call writers operate on leverage, they must act fast to protect their capital if NIFTY starts moving up aggressively.
          </p>
          <p>
            If NIFTY breaks through a major resistance strike (say, 24,900), and you notice on the NSE option chain that <strong>Call OI is rapidly turning negative (declining)</strong>, it means call sellers are rushing to buy back their sold options to limit losses. This mandatory buying combined with regular bullish momentum sparks a violent upward surge, or a "short squeeze".
          </p>
          <p>
            Spotting negative Change in Call OI during active market hours is an immediate green signal to jump onto long momentum trades. Similarly, Put Unwinding (negative Change in Put OI) during a correction indicates that support is breaking, signaling a rapid downward slide.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            Conclusion & Expiry-Day Trade Plan
          </h3>
          <p>
            On weekly expiry days, the NSE option chain data changes rapidly. Ensure you monitor the shifts every 15 minutes. Check if the active At-the-Money (ATM) strike is accumulating more puts or calls. A sudden increase in ATM Put OI indicates that the market is forming a support base and a bullish move is imminent. Conversely, call writing at the ATM strike suggests resistance is building and the indices may face pressure.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Disclaimer: Derivatives trading carries significant risk. Always employ rigorous risk management, trade with stop losses, and use StockPro Screener metrics to verify your chart levels with institutional open interest data.
          </p>
        </div>
      )
    },
    {
      id: 'nifty-fo-screener-smart-money',
      title: 'How to Leverage a NIFTY F&O Screener to Detect Smart Money Build-Up',
      slug: 'nifty-fo-screener-smart-money',
      description: 'Unlock the secrets of derivative market scanning. Learn how to track institutional positioning, understand Long Build-Up, Short Build-Up, and interpret volume shockers on the NIFTY F&O screener platform.',
      keywords: ['NIFTY F&O screener', 'F&O screener India', 'how to scan stocks', 'Long Build Up tracker', 'Short Covering stocks list', 'NSE derivatives scanning', 'open interest scanner'],
      readTime: '11 min read',
      date: 'June 11, 2026',
      author: 'Anjali Sharma, Senior Algorithmic Analyst',
      category: 'Advanced Tactics',
      content: (
        <div className="space-y-6 text-slate-800 dark:text-slate-300 leading-relaxed text-sm md:text-base">
          <p className="font-semibold text-slate-900 dark:text-white text-base md:text-lg">
            Trading in the derivatives market is completely different from cash market investing. While equity investors focus on quarterly balance sheets and earnings metrics, derivative traders live in the realms of short-term liquidity, leverage, and smart money positioning. To thrive, you need a high-speed <strong>NIFTY F&O screener</strong>.
          </p>
          <p>
            With dozens of stock options and multiple indices trading concurrently, manually checking every chart is impossible. An automated <strong>NIFTY F&O screener</strong> scans the entire National Stock Exchange derivatives segment in seconds. It identifies where institutional block trades are executing and where massive positions are being locked.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            1. The Four Derivative States: Decoupled for Pro Scanners
          </h3>
          <p>
            On a pro-grade <strong>NIFTY F&O screener</strong>, every stock is categorized into one of four distinct states based on the correlation between Price Changes and Open Interest (OI) Changes. Master this matrix to spot institutional moves:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <h4 className="font-bold text-emerald-650 dark:text-emerald-450 text-sm mb-1">🟢 Long Build-Up (Bullish)</h4>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                <strong>Price Up + Open Interest Up:</strong> This confirms that buyers are aggressively entering the market, creating fresh long positions. Institutions are locking in capital, anticipating a major upward drive.
              </p>
            </div>
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <h4 className="font-bold text-rose-650 dark:text-rose-450 text-sm mb-1">🔴 Short Build-Up (Bearish)</h4>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                <strong>Price Down + Open Interest Up:</strong> This confirms that sellers are dominating. Aggressive short positions are being created. Smart money expects the stock to decline further and is selling on rises.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-bold text-blue-650 dark:text-blue-450 text-sm mb-1">🔵 Short Covering (Strong Bullish)</h4>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                <strong>Price Up + Option Interest Down:</strong> This occurs when existing short sellers panic and buy back their positions to cut losses. It frequently triggers sharp, explosive upward rallies.
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <h4 className="font-bold text-amber-650 dark:text-amber-450 text-sm mb-1">🟡 Long Unwinding (Weak Bearish)</h4>
              <p className="text-xs text-slate-650 dark:text-slate-355 leading-relaxed">
                <strong>Price Down + Open Interest Down:</strong> This confirms that bulls are booking profits or closing out struggling long positions. The market lacks buyer interest and is slowly cooling down.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            2. Scanning for Volume Shockers
          </h3>
          <p>
            Volume represents the immediate liquidity flowing through an options contract or a futures series. While Open Interest represents overnight holding strength, Volume shows current intraday activity.
          </p>
          <p>
            If a stock usually trades an average of 5,000 derivative contracts a day, but suddenly prints 35,000 contracts in the first hour of trading, this is a <strong>Volume Shocker</strong>. This confirms that a massive fund or institutional player has entered the stock.
          </p>
          <p>
            Using our <strong>NIFTY F&O screener</strong> presets, you can filter for these volume spikes. When combined with a breakout on the 15-minute price charts, Volume Shockers have a success rating of over 78% for fast intraday breakout setups.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            3. A Tactical Screener Workflow: Let the Platform Work for You
          </h3>
          <p>
            Instead of searching through random stock suggestions or news updates, establish a structured morning scanning routine:
          </p>
          <ul className="list-decimal pl-6 space-y-3">
            <li>
              <strong>First Scanner Run (9:30 AM):</strong> Let the market complete its initial pre-open and opening volatility. Scan for stocks in a <strong>Long Build-Up</strong> state with a price gain of more than 1.5%.
            </li>
            <li>
              <strong>Look for Option Concentration:</strong> Check the option chain of the selected stocks. Verify if the nearest Out-of-the-Money call options are showing a decrease in open interest, which suggests short covering is active.
            </li>
            <li>
              <strong>Combine with Volume:</strong> Ensure the daily trading volume is at least 2 times the 10-day moving average. If yes, this is a high-conviction trade. Buy near the spot price and set a trailing stop loss below the current 15-minute candle low.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            4. Why StockPro Screener is Your Ultimate Trading Ally
          </h3>
          <p>
            The StockPro Screener dashboard features institutional-grade derivative dashboards. Unlike heavy and complicated software, our platform is built on lightweight, modern APIs. It loads data instantly, displays intuitive visual highlights, and includes robust custom screening tools.
          </p>
          <p>
            Whether you want to scan for stocks experiencing massive open interest adjustments, monitor volume shockers, or track FMI/FII position changes, our dashboard translates complex NSE data sets into highly readable visual cues. This allows you to spend more time planning trades and less time managing data spreadsheets.
          </p>
          <p className="text-xs text-slate-505 dark:text-slate-400 italic">
            Trading Guideline: F&O positions carry double margin risks. Never allocate more than 15% of your trading capital to a single derivative structure. Keep your eyes sharp on the live open interest changes.
          </p>
        </div>
      )
    },
    {
      id: 'pcr-ratio-india-contrarian',
      title: 'Advanced Contrarian Blueprint: Trading with the PCR Ratio India',
      slug: 'pcr-ratio-india-contrarian',
      description: 'Unlock the complete strategic roadmap to trading with the Put-Call Ratio. Learn the difference between Volume and OI PCR, how to recognize contrarian reversals, and tips for volatile sessions in India.',
      keywords: ['PCR ratio India', 'Put call ratio formula', 'Nifty PCR live tracker', 'contrarian trading PCR', 'Indian stock derivatives', 'NSE options volatility', 'extreme overbought oversold'],
      readTime: '10 min read',
      date: 'June 11, 2026',
      author: 'Vikram Mehta, Derivative Analyst',
      category: 'Advanced Tactics',
      content: (
        <div className="space-y-6 text-slate-800 dark:text-slate-300 leading-relaxed text-sm md:text-base">
          <p className="font-semibold text-slate-900 dark:text-white text-base md:text-lg">
            In options trading, market sentiment is everything. If you are executing trades in NIFTY, BANKNIFTY or individual stocks without checking the <strong>PCR ratio India</strong>, you are ignoring the single most effective temperature gauge of the derivative market.
          </p>
          <p>
            The Put-Call Ratio (PCR) is a simple mathematical indicator, yet its strategic applications are incredibly deep. It functions both as a direct trend-following scanner and a contrarian reversal alert, signaling when the market is overbought or oversold.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            1. Defining the PCR Ratio India Formula
          </h3>
          <p>
            At its simplest, the Put-Call Ratio is calculated by dividing the number of active put options by the number of active call options:
          </p>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-center text-emerald-400 border border-slate-850 my-4 shadow-inner">
            PCR = Total Put Options Open Interest / Total Call Options Open Interest
          </div>
          <p>
            There are two distinct ways to calculate this ratio, and each gives a different dimension of market reading:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>OI-Based PCR (Open Interest Put-Call Ratio):</strong> Calculated using the total outstanding, active contracts. Since OI represents overnight positions where capital is locked, <strong>OI PCR is the most reliable tool for positional and structural swings</strong>.
            </li>
            <li>
              <strong>Volume-Based PCR:</strong> Calculated using the total traded daily volume. It changes rapidly second-by-second and is highly suited for <strong>scalpers and intraday momentum traders</strong> to gauge high-frequency sentiment.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            2. Decoding PCR Values: The Sentiment Spectrum
          </h3>
          <p>
            How do you read the <strong>PCR ratio India</strong> value on your screen? Below are the regular market benchmark standards:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <span className="text-xs text-emerald-500 font-bold uppercase block mb-1">Bullish Sentiment</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">PCR &gt; 1.25</span>
              <span className="text-[11px] mt-1 block text-slate-500 dark:text-slate-400">Puts are being written far faster than calls. Strong market support base is forming.</span>
            </div>
            <div className="p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg text-center">
              <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Neutral Zone</span>
              <span className="text-2xl font-black text-slate-600 dark:text-slate-400 font-mono block">0.80 - 1.20</span>
              <span className="text-[11px] mt-1 block text-slate-500 dark:text-slate-400 font-mono">Balanced call and put writing. Market likely consolidates in a range.</span>
            </div>
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center">
              <span className="text-xs text-rose-500 font-bold uppercase block mb-1">Bearish Sentiment</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono block">PCR &lt; 0.65</span>
              <span className="text-[11px] mt-1 block text-slate-500 dark:text-slate-400">Calls heavily actively written. Bearish pressure and overhead resistance are dominant.</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            3. The Contrarian Advantage: Catching Reversal Extremes
          </h3>
          <p>
            This is where options trading gets fascinating. In standard analysis, a PCR of 1.5 looks bullish. However, when the PCR ratio exceeds certain maximum benchmarks, it transforms into an <strong>oversaturated contrarian signal</strong>.
          </p>
          <p>
            <strong>The Oversold Reversal Zone (PCR 0.45 to 0.55):</strong> When PCR falls below 0.55, it means the Indian market is heavily oversaturated with call writing. Almost everyone who wants to short has already shorted. The market is in deep oversold territory. At this point, any minor positive news trigger will spark vertical panic short-covering. Experienced institutional funds start accumulated long stock options at this juncture.
          </p>
          <p>
            <strong>The Overbought Correction Zone (PCR 1.65 to 1.85):</strong> Conversely, when PCR pushes past 1.70, it signals that put writing has reached near unsustainable levels. Retail traders are blindly buying calls or writing puts representing total safety, but any minor negative consolidation will force massive put-writer liquidation. This marks buyer exhaustion and is a prime territory to initiate protective hedges.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            4. Practical Divergence Strategy: Identifying the Institutional Trap
          </h3>
          <p>
            One of the most reliable setup variations is the "Price-PCR Divergence". If the NIFTY index is carving high highs on the 5-minute charts, but the <strong>PCR ratio India</strong> is showing lower highs (or flatlining), this is a major warning signal.
          </p>
          <p>
            It reveals that while retail traders are chasing the upward price momentum in the cash segment, institutional desks are quietly writing massive call options of out-of-the-money strikes, anticipating a sudden drop. This divergence is a clear signal to stop buying aggressive calls and start preparing for a rapid corrective dip.
          </p>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-4 border-b border-slate-200 dark:border-slate-850 pb-2">
            Conclusion & Daily Routine checklist
          </h3>
          <p>
            To successfully trade the contrarian PCR strategy:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Check the live PCR ratio on your StockPro Screener terminal before every trading layout decision.</li>
            <li>Verify if the current PCR represents an extreme value (&lt; 0.55 or &gt; 1.65) to avoid chasing late-trend breakouts.</li>
            <li>Look for positive or negative divergences between price action and PCR values to detect hidden smart money distribution.</li>
          </ul>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-2">
            Equipping your desk with these metrics turns speculative bets into highly calculated statistical plans. Trade responsibly and keep your risk profiles controlled.
          </p>
        </div>
      )
    }
  ];

  const filteredArticles = articles.filter(article => {
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      article.description.toLowerCase().includes(q) ||
      article.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  const activeArticle = articles.find(a => a.id === selectedArticleId);

  return (
    <div className="max-w-6xl mx-auto w-full py-8 text-slate-900 dark:text-white px-4">
      {selectedArticleId && activeArticle ? (
        /* ================= SINGLE ARTICLE VIEW ================= */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedArticleId(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-lg mb-4"
          >
            <ArrowLeft size={14} />
            <span>Back to F&O Blog Directory</span>
          </button>

          {/* Article Header info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider text-[10px]">
                {activeArticle.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {activeArticle.date}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {activeArticle.readTime}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight font-sans tracking-tight">
              {activeArticle.title}
            </h1>

            <div className="flex items-center gap-2.5 pt-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center font-bold text-xs uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-850">
                {activeArticle.author.charAt(0)}
              </div>
              <div className="text-xs">
                <span className="font-bold block text-slate-800 dark:text-slate-200">{activeArticle.author}</span>
                <span className="text-slate-500">Verified Derivatives Expert</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Article SEO Content */}
          <article className="max-w-4xl prose dark:prose-invert prose-emerald my-8">
            {activeArticle.content}
          </article>

          {/* Sticky Subscribe / Call to Action at Bottom of post */}
          <div className="mt-12 bg-gradient-to-r from-emerald-650 to-teal-650 dark:from-emerald-900 dark:to-teal-900 rounded-2xl p-6 sm:p-8 text-white relative h-auto overflow-hidden shadow-xl shadow-emerald-950/25 border border-emerald-500/15">
            <div className="absolute -right-20 -bottom-20 w-52 h-52 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <h3 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-snug">
                Accelerate Your NIFTY Derivatives Edge Today
              </h3>
              <p className="text-xs sm:text-sm text-emerald-50 mt-1 leading-relaxed">
                Connect with our dynamic low-latency algorithms, unlock unlimited watchlist tracks, configure live option chain delta calculations, and receive real-time block trades instantly.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  className="bg-slate-900 hover:bg-slate-950 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-5 py-3 rounded-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  Explore Premium Features
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= ARTICLES DIRECTORY LIST ================= */
        <div className="space-y-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider border border-emerald-500/20">
              <BookOpen size={12} /> Indian derivatives learning hub
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              F&O Strategic Research & Insights
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              Level up your trading skills. Read institutional-grade research guides covering options chain volatility, implied volatility skews, open interest models, and advanced risk allocation.
            </p>

            {/* Quick Keyword Search Box for SEO compatibility */}
            <div className="relative max-w-sm mx-auto pt-3">
              <input
                type="text"
                placeholder="Search articles, tactics, or F&O keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
              <Search size={14} className="absolute left-3.5 top-[58%] -translate-y-1/2 text-slate-455" />
            </div>
          </div>

          {/* Articles Grid layout */}
          <div className="grid md:grid-cols-3 gap-6 pt-4" id="seo-blog-grid">
            {filteredArticles.map((article) => (
              <div 
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 rounded uppercase">
                      {article.category}
                    </span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {article.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-900/60 mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-mono text-[10px]">{article.date}</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">
                    Read Article <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl p-5 max-w-xl mx-auto text-center space-y-3">
            <h4 className="text-xs font-mono font-black uppercase text-slate-500 dark:text-slate-400">Target Keywords Tracked</h4>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {articles.flatMap(a => a.keywords).filter((v, i, self) => self.indexOf(v) === i).map(kw => (
                <span key={kw} className="text-[10px] bg-slate-200/50 dark:bg-slate-900 border border-slate-300/40 dark:border-slate-800 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
                  #{kw.replace(/\s+/g, '-').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
