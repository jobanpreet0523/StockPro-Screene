(() => {
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  if (!isLanding) return;

  const tools = [
    { title: 'Live Screener', desc: 'Market scanner, F&O stocks, gainers, losers, volume and technical filters.', href: '/screener', icon: '📊', tag: 'Core' },
    { title: 'Chartink Scanner', desc: 'Custom scan builder, saved scanner logic and condition-based discovery.', href: '/scanner', icon: '🧪', tag: 'Scanner' },
    { title: 'F&O Analytics', desc: 'NIFTY/BANKNIFTY option chain, OI, PCR, IV, expiry and strike intelligence.', href: '/option-chain', icon: '🎯', tag: 'Options' },
    { title: 'US Markets', desc: 'Global market view for US indices, stocks and macro watch.', href: '/us-markets', icon: '🌎', tag: 'Global' },
    { title: 'Strategy Builder', desc: 'Build option strategies and compare payoff possibilities.', href: '/strategy-builder', icon: '🧩', tag: 'Builder' },
    { title: 'Options Greeks', desc: 'Delta, gamma, theta, vega and option sensitivity calculators.', href: '/greeks-calculator', icon: 'Σ', tag: 'Greeks' },
    { title: 'Risk Calculator', desc: 'Position sizing, loss control, reward/risk and trade planning.', href: '/risk-calculator', icon: '🛡️', tag: 'Risk' },
    { title: 'Market Heatmap', desc: 'Sector strength, stock heat, breadth and flow map.', href: '/heatmap', icon: '🔥', tag: 'Heatmap' },
    { title: 'FII/DII Data', desc: 'Institutional buying and selling flow dashboard.', href: '/fii-dii', icon: '🏦', tag: 'Flow' },
    { title: 'Trading Signals', desc: 'Bullish, bearish, volatility and breakout signal workspace.', href: '/signals', icon: '⚡', tag: 'Signals' },
    { title: 'Bulk & Block Deals', desc: 'Track large deals and institutional activity.', href: '/deals', icon: '📦', tag: 'Deals' },
    { title: 'Stock Market News', desc: 'Daily news and market updates inside the platform.', href: '/news', icon: '📰', tag: 'News' },
    { title: 'Free Access', desc: 'All tools unlocked with no paid upgrade required.', href: '/pricing', icon: '✅', tag: 'Free' },
    { title: 'F&O Blog', desc: 'Strategy education, market notes and learning content.', href: '/blog', icon: '📚', tag: 'Learn' },
  ];

  const css = document.createElement('style');
  css.id = 'stockpro-landing-tools-enhancer-style';
  css.textContent = `
    .stockpro-tools-shell {
      position: relative;
      z-index: 30;
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px 96px;
      color: white;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .stockpro-tools-panel {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 34px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.84));
      box-shadow: 0 32px 110px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08);
      backdrop-filter: blur(26px) saturate(160%);
      padding: 28px;
    }
    .stockpro-tools-panel::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 2px;
      background: linear-gradient(90deg, #34d399, #22d3ee, #818cf8, #34d399);
      background-size: 200% 100%;
      animation: stockproGlowLine 5s linear infinite;
    }
    .stockpro-tools-panel::after {
      content: '';
      position: absolute;
      right: -120px;
      top: -120px;
      width: 320px;
      height: 320px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.18);
      filter: blur(60px);
      pointer-events: none;
    }
    .stockpro-tools-head {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      align-items: end;
      margin-bottom: 24px;
    }
    .stockpro-tools-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(52, 211, 153, 0.25);
      background: rgba(52, 211, 153, 0.1);
      color: #6ee7b7;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .stockpro-tools-title {
      margin: 16px 0 0;
      font-size: clamp(34px, 5vw, 62px);
      line-height: 0.95;
      letter-spacing: -0.055em;
      font-weight: 950;
    }
    .stockpro-tools-subtitle {
      margin: 16px 0 0;
      max-width: 720px;
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.75;
      font-weight: 600;
    }
    .stockpro-tools-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 0;
      border-radius: 18px;
      background: #34d399;
      color: #020617;
      padding: 14px 18px;
      font-weight: 950;
      text-decoration: none;
      box-shadow: 0 20px 60px rgba(52, 211, 153, 0.22);
      transition: transform 0.22s ease, background 0.22s ease;
      white-space: nowrap;
    }
    .stockpro-tools-cta:hover { transform: translateY(-3px); background: #6ee7b7; }
    .stockpro-tool-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }
    .stockpro-tool-card {
      position: relative;
      overflow: hidden;
      min-height: 172px;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(255, 255, 255, 0.055);
      padding: 18px;
      color: white;
      text-decoration: none;
      transform-style: preserve-3d;
      transition: transform 0.28s ease, border-color 0.28s ease, background 0.28s ease, box-shadow 0.28s ease;
    }
    .stockpro-tool-card::before {
      content: '';
      position: absolute;
      inset: -90% -35%;
      background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.16), transparent 62%);
      transform: translateX(-55%) rotate(12deg);
      transition: transform 0.7s ease;
    }
    .stockpro-tool-card:hover {
      transform: translateY(-8px) rotateX(2deg) rotateY(-2deg);
      border-color: rgba(52, 211, 153, 0.42);
      background: rgba(255, 255, 255, 0.085);
      box-shadow: 0 22px 60px rgba(0,0,0,0.25);
    }
    .stockpro-tool-card:hover::before { transform: translateX(55%) rotate(12deg); }
    .stockpro-tool-top {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 10px;
      margin-bottom: 18px;
    }
    .stockpro-tool-icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border-radius: 18px;
      background: rgba(52, 211, 153, 0.12);
      border: 1px solid rgba(52, 211, 153, 0.2);
      font-size: 22px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .stockpro-tool-tag {
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 23, 42, 0.75);
      color: #a7f3d0;
      border-radius: 999px;
      padding: 5px 8px;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .stockpro-tool-card h3 {
      position: relative;
      z-index: 1;
      margin: 0;
      font-size: 16px;
      font-weight: 950;
      letter-spacing: -0.02em;
    }
    .stockpro-tool-card p {
      position: relative;
      z-index: 1;
      margin: 10px 0 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.55;
      font-weight: 650;
    }
    .stockpro-tools-dock {
      position: fixed;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      z-index: 80;
      display: flex;
      gap: 6px;
      max-width: calc(100vw - 28px);
      overflow-x: auto;
      padding: 8px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 22px;
      background: rgba(2, 6, 23, 0.82);
      backdrop-filter: blur(22px) saturate(150%);
      box-shadow: 0 24px 70px rgba(0,0,0,0.35);
    }
    .stockpro-tools-dock a {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 14px;
      padding: 9px 10px;
      color: #e2e8f0;
      text-decoration: none;
      font-size: 11px;
      font-weight: 900;
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
    }
    .stockpro-tools-dock a:hover {
      background: rgba(52, 211, 153, 0.14);
      color: #6ee7b7;
      transform: translateY(-2px);
    }
    @keyframes stockproGlowLine {
      from { background-position: 0% 50%; }
      to { background-position: 200% 50%; }
    }
    @media (max-width: 1024px) { .stockpro-tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) {
      .stockpro-tools-shell { padding: 18px 14px 88px; }
      .stockpro-tools-panel { padding: 20px; border-radius: 26px; }
      .stockpro-tools-head { grid-template-columns: 1fr; }
      .stockpro-tool-grid { grid-template-columns: 1fr; }
      .stockpro-tools-dock a span:last-child { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .stockpro-tools-panel::before, .stockpro-tool-card::before { animation: none !important; transition: none !important; }
      .stockpro-tool-card, .stockpro-tools-cta, .stockpro-tools-dock a { transition: none !important; }
    }
  `;

  function renderTools() {
    const root = document.getElementById('root');
    if (!root || document.getElementById('stockpro-all-tools-restored')) return;

    const shell = document.createElement('section');
    shell.id = 'stockpro-all-tools-restored';
    shell.className = 'stockpro-tools-shell';
    shell.innerHTML = `
      <div class="stockpro-tools-panel">
        <div class="stockpro-tools-head">
          <div>
            <div class="stockpro-tools-kicker">🧭 All Original Tools Restored</div>
            <h2 class="stockpro-tools-title">Every StockPro function is back on the landing page.</h2>
            <p class="stockpro-tools-subtitle">The 3D landing upgrade now keeps direct access to every platform module: Screener, Scanner, F&O Analytics, Greeks, Risk, Heatmap, FII/DII, Signals, Deals, News, Blog and Free Access.</p>
          </div>
          <a class="stockpro-tools-cta" href="/screener">Launch Dashboard →</a>
        </div>
        <div class="stockpro-tool-grid">
          ${tools.map((tool) => `
            <a class="stockpro-tool-card" href="${tool.href}">
              <div class="stockpro-tool-top">
                <span class="stockpro-tool-icon">${tool.icon}</span>
                <span class="stockpro-tool-tag">${tool.tag}</span>
              </div>
              <h3>${tool.title}</h3>
              <p>${tool.desc}</p>
            </a>
          `).join('')}
        </div>
      </div>
    `;

    const existingFinal = root.querySelector('main > section:last-child');
    if (existingFinal && existingFinal.parentElement) {
      existingFinal.parentElement.insertBefore(shell, existingFinal);
    } else {
      root.appendChild(shell);
    }

    const dock = document.createElement('nav');
    dock.id = 'stockpro-landing-tools-dock';
    dock.className = 'stockpro-tools-dock';
    dock.innerHTML = tools.slice(0, 10).map((tool) => `<a href="${tool.href}"><span>${tool.icon}</span><span>${tool.title}</span></a>`).join('');
    document.body.appendChild(dock);
  }

  if (!document.getElementById('stockpro-landing-tools-enhancer-style')) {
    document.head.appendChild(css);
  }

  const run = () => requestAnimationFrame(() => requestAnimationFrame(renderTools));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  const observer = new MutationObserver(() => run());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
