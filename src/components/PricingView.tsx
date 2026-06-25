import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Check, ShieldCheck, Zap, Lock, Crown, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingView() {
  const { user, loginWithGoogle, isPro, setProStatus } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    if (!user) {
      loginWithGoogle();
      return;
    }

    setLoading(true);

    const options = {
      key: process.env.VITE_RAZORPAY_TEST_KEY || "rzp_test_YourTestKeyHere", // Use your test key if VITE_ key is not set
      amount: "99900", // ₹999.00 in paise
      currency: "INR",
      name: "StockPro Screener",
      description: "Upgrade to F&O PRO",
      image:
        "https://ui-avatars.com/api/?name=StockPro&color=10b981&background=020617", // Simple logo placeholder
      handler: function (response: any) {
        setLoading(false);
        // Successful payment processing
        setProStatus(true);
        alert(
          `Payment Successful! Payment ID: ${response.razorpay_payment_id}. You are now a PRO user.`,
        );
      },
      prefill: {
        name: user?.displayName || "",
        email: user?.email || "",
      },
      theme: {
        color: "#10b981", // emerald-500
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-8 text-slate-900 dark:text-white">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black mb-4">StockPro Membership</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Unlock institutional-grade options data, real-time analytics, and
          unlimited tracking to gain an edge in the Indian equity markets.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Free Core Access</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Essential tools for everyday monitoring.
            </p>
            <div className="mt-4 text-3xl font-black">
              ₹0{" "}
              <span className="text-sm font-medium text-slate-400">
                / forever
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Basic Market Screener
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Interactive Stock Charts
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                10 Watchlist Items Limit
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Delayed Option Chain (15m delay)
              </span>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <Lock size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-500 line-through">
                Real-time Options & IV Calculator
              </span>
            </div>
            <div className="flex items-start gap-3 opacity-50">
              <Lock size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-500 line-through">
                Block Trades & Real-time Alerts
              </span>
            </div>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold text-sm cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-900 dark:to-black border border-emerald-500/30 rounded-2xl p-8 shadow-xl shadow-emerald-500/5 flex flex-col relative overflow-hidden">
          {/* Pro indicator */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Crown size={20} className="text-emerald-400" /> PRO Traders
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                Most Popular
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Full institutional analytics capabilities.
            </p>
            <div className="mt-4 text-3xl font-black text-white">
              ₹999{" "}
              <span className="text-sm font-medium text-slate-500">
                / month
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-200">
                Everything in Free +
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Zap
                size={18}
                className="text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/20"
              />
              <span className="text-sm font-bold text-white">
                Real-Time Option Chain & Greeks
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-200">
                Implied Volatility (IV) Calculator
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-200">
                Live Block Trades & Institutional Flow
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-200">
                Unlimited Watchlists & Price Alerts
              </span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="text-emerald-400 shrink-0 mt-0.5"
              />
              <span className="text-sm font-medium text-slate-200">
                Premium Support Line
              </span>
            </div>
          </div>

          {isPro ? (
            <button
              disabled
              className="w-full py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm cursor-default flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Active PRO Member
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade to PRO Now"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
