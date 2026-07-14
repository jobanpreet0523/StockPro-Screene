import React, { Component, ErrorInfo, lazy, ReactNode, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingProductPage';
import RouteSeo from './components/RouteSeo';
import AnalyticsProvider from './components/analytics/AnalyticsProvider';
import StructuredData from './components/StructuredData';

const Layout = lazy(() => import('./components/Layout'));
const ParticleBackground = lazy(() => import('./components/ParticleBackground'));
const ScreenerPage = lazy(() => import('./pages/ScreenerPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const OptionChainPage = lazy(() => import('./pages/OptionChainPage'));
const UsMarketsPage = lazy(() => import('./pages/UsMarketsPage'));
const StrategyPage = lazy(() => import('./pages/StrategyPage'));
const GreeksPage = lazy(() => import('./pages/GreeksPage'));
const RiskPage = lazy(() => import('./pages/RiskPage'));
const HeatmapPage = lazy(() => import('./pages/HeatmapPage'));
const FiiDiiPage = lazy(() => import('./pages/FiiDiiPage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const DailyBriefPage = lazy(() => import('./pages/DailyBriefPage'));
const SignalsPage = lazy(() => import('./pages/SignalsPage'));
const ConnectBrokerPage = lazy(() => import('./pages/ConnectBrokerProductPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const RiskDisclosurePage = lazy(() => import('./pages/RiskDisclosurePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminWaitlistPage = lazy(() => import('./pages/AdminWaitlistPage'));
const StartTrialPage = lazy(() => import('./pages/StartTrialPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const DataMethodologyPage = lazy(() => import('./pages/DataMethodologyPage'));
const SupportPolicyPage = lazy(() => import('./pages/SupportPolicyPage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const BetaLaunchPage = lazy(() => import('./pages/BetaLaunchPage'));
const ProPage = lazy(() => import('./pages/ProPage'));
const CrtScannerPage = lazy(() => import('./pages/CrtScannerPage'));
const AdminBetaFeedbackPage = lazy(() => import('./pages/AdminBetaFeedbackPage'));

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

function RouteLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-600">Loading StockPro...</div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnalyticsProvider>
          <RouteSeo />
        <StructuredData />
        <Suspense fallback={<RouteLoading />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/admin/waitlist" element={<AdminWaitlistPage />} />
          <Route path="/admin/beta-feedback" element={<AdminBetaFeedbackPage />} />
          <Route element={<><ParticleBackground /><Layout /></>}>
            <Route path="/screener" element={<ScreenerPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/crt-scanner" element={<CrtScannerPage />} />
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
            <Route path="/pro" element={<ProPage />} />
            <Route path="/start-trial" element={<StartTrialPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/daily-brief" element={<DailyBriefPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/connect-broker" element={<ConnectBrokerPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/data-methodology" element={<DataMethodologyPage />} />
            <Route path="/support-policy" element={<SupportPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/beta" element={<BetaLaunchPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/screener" replace />} />
          </Routes>
        </Suspense>
        </AnalyticsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

