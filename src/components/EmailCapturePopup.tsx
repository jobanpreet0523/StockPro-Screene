import React, { useState, useEffect } from 'react';
import { Mail, User, BookOpen, X, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailCapturePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Constants
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const LOCAL_STORAGE_KEY = 'popupShown';

  const markAsShown = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
  };

  const handleClose = () => {
    setIsOpen(false);
    markAsShown();
  };

  useEffect(() => {
    // Check if shown in the last 7 days
    const lastShownStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (lastShownStr) {
      const lastShown = parseInt(lastShownStr, 10);
      if (!isNaN(lastShown) && Date.now() - lastShown < SEVEN_DAYS_MS) {
        return;
      }
    }

    let hasOpened = false;

    const triggerOpen = () => {
      if (!hasOpened) {
        hasOpened = true;
        setIsOpen(true);
      }
    };

    // 1. Trigger after 45 seconds
    const timer = setTimeout(() => {
      triggerOpen();
    }, 45000);

    // 2. Trigger on exit intent (mouseleave on document)
    const handleMouseLeave = (e: MouseEvent) => {
      // Typically exit intent when mouse moves up past top of page
      if (e.clientY <= 15) {
        triggerOpen();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': 'YOUR_BREVO_KEY'
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          listIds: [1],
          updateEnabled: true
        })
      });

      if (response.ok || response.status === 201 || response.status === 204) {
        setStatus('success');
        markAsShown();
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data.message || 'Something went wrong, please try again.');
      }
    } catch (err: any) {
      console.error('Subscription exception:', err);
      setStatus('error');
      setErrorMessage('Something went wrong, please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative overflow-hidden text-white">
        
        {/* Absolute Glowing Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Access Granted!
            </h3>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Thank you! Check your email for the free PDF: 
              <span className="block font-bold text-slate-100 mt-1">"7 Option Strategies for NIFTY Traders"</span>
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition"
            >
              Back to Terminal
            </button>
          </div>
        ) : (
          <div>
            {/* Header / Offer details */}
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase flex items-center gap-1">
                <Sparkles size={10} /> Pro PDF Guide
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-slate-100 leading-snug">
              Get Free PDF: <span className="text-emerald-400 block sm:inline">7 Option Strategies for NIFTY Traders</span>
            </h3>
            
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Master professional F&O setups. Learn the exact Hedging, Iron Condors & Directional spreads that veteran Indian derivatives traders use to protect capital.
            </p>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 my-4 flex items-center gap-3">
              <BookOpen className="text-emerald-500 shrink-0" size={24} />
              <div>
                <h4 className="text-[11px] font-bold text-slate-200">Includes Active Strike Selector Formulas</h4>
                <p className="text-[10px] text-slate-400">Step-by-step risk management limits for NIFTY & BANKNIFTY.</p>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">First Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-450 dark:text-rose-450">
                  <AlertCircle size={14} className="shrink-0 text-rose-500" />
                  <span className="text-[10px] font-bold">{errorMessage || 'Something went wrong, please try again.'}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Adding to Premium Registry...</span>
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    <span>Download Free PDF Guide</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-500 mt-4">
              We respect your privacy. Safe unsubscribing in 1-click. No spam guaranteed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
