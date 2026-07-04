import React, { Component, ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import ParticleBackground from './components/ParticleBackground';
import ScreenerPage from './pages/ScreenerPage';
import ScannerPage from './pages/ScannerPage';
import OptionChainPage from './pages/OptionChainPage';
import UsMarketsPage from './pages/UsMarketsPage';
import StrategyPage from './pages/StrategyPage';
import GreeksPage from './pages/GreeksPage';
import RiskPage from './pages/RiskPage';
import HeatmapPage from './pages/HeatmapPage';
import FiiDiiPage from './pages/FiiDiiPage';
import DealsPage from './pages/DealsPage';
import NewsPage from './pages/NewsPage';
import PricingPage from './pages/PricingPage';
import BlogPage from './pages/BlogPage';
import SignalsPage from './pages/SignalsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RiskDisclosurePage from './pages/RiskDisclosurePage';
import ContactPage from './pages/ContactPage';

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Screener crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: 'white', background: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ParticleBackground />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/screener" element={<ScreenerPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/option-chain" element={<OptionChainPage />} />
            <Route path="/us-markets" element={<UsMarketsPage />} />
            <Route path="/strategy-builder" element={<StrategyPage />} />
            <Route path="/greeks-calculator" element={<GreeksPage />} />
            <Route path="/risk-calculator" element={<RiskPage />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
            <Route path="/fii-dii" element={<FiiDiiPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/screener" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
