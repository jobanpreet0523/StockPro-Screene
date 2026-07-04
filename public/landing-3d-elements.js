(() => {
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  if (!isLanding) return;

  const marketItems = [
    { label: 'NIFTY 50', value: '24,270.85', change: '+1.35%', tone: 'up' },
    { label: 'BANK NIFTY', value: '57,038.50', change: '+1.10%', tone: 'up' },
    { label: 'PCR', value: '1.34', change: 'LIVE', tone: 'neutral' },
    { label: 'MAX PAIN', value: '24,250', change: 'ACTIVE', tone: 'neutral' },
  ];

  const css = document.createElement('style');
  css.id = 'stockpro-3d-elements-style';
  css.textContent = `
    #stockpro-3d-layer {
      position: fixed;
      inset: 0;
      z-index: 6;
      pointer-events: none;
      overflow: hidden;
      perspective: 1200px;
    }

    .sp3d-orb {
      position: absolute;
      width: 180px;
      height: 180px;
      border-radius: 999px;
      background: radial-gradient(circle at 35% 28%, rgba(255,255,255,0.55), rgba(52, 211, 153, 0.22) 18%, rgba(34, 211, 238, 0.10) 42%, transparent 70%);
      filter: blur(0.2px);
      opacity: 0.58;
      transform-style: preserve-3d;
      animation: spOrbFloat 13s ease-in-out infinite;
    }

    .sp3d-orb.orb-a { left: 4%; top: 18%; }
    .sp3d-orb.orb-b { right: 8%; top: 22%; width: 110px; height: 110px; animation-delay: 1.2s; animation-duration: 10s; }
    .sp3d-orb.orb-c { left: 52%; bottom: 8%; width: 140px; height: 140px; animation-delay: 2.4s; animation-duration: 15s; }

    .sp3d-ring-stack {
      position: absolute;
      right: 4vw;
      top: 170px;
      width: 420px;
      height: 420px;
      transform-style: preserve-3d;
      transform: rotateX(66deg) rotateZ(0deg);
      animation: spRingSpin 22s linear infinite;
      opacity: 0.72;
    }

    .sp3d-ring-stack span {
      position: absolute;
      inset: var(--i);
      border-radius: 999px;
      border: 1px solid rgba(52, 211, 153, 0.22);
      box-shadow: 0 0 26px rgba(34, 211, 238, 0.07), inset 0 0 22px rgba(52, 211, 153, 0.06);
    }

    .sp3d-floating-card {
      position: absolute;
      width: 190px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.60));
      color: #f8fafc;
      padding: 14px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08);
      backdrop-filter: blur(22px) saturate(160%);
      transform-style: preserve-3d;
      animation: spCardFloat 9s ease-in-out infinite;
      pointer-events: auto;
    }

    .sp3d-floating-card:hover {
      transform: translateY(-8px) rotateX(8deg) rotateY(-8deg) scale(1.04) !important;
      border-color: rgba(52, 211, 153, 0.5);
    }

    .sp3d-floating-card.card-a { left: 1.5vw; top: 250px; }
    .sp3d-floating-card.card-b { right: 2.5vw; top: 540px; animation-delay: 1.1s; }
    .sp3d-floating-card.card-c { left: 32vw; top: 116px; animation-delay: 2s; }

    .sp3d-card-label {
      font-size: 10px;
      font-weight: 950;
      color: #94a3b8;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .sp3d-card-value {
      margin-top: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 20px;
      font-weight: 950;
      color: #ffffff;
    }

    .sp3d-card-change {
      margin-top: 6px;
      display: inline-flex;
      border: 1px solid rgba(52, 211, 153, 0.24);
      background: rgba(52, 211, 153, 0.10);
      color: #6ee7b7;
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: 0.12em;
    }

    #stockpro-scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      z-index: 9999;
      background: linear-gradient(90deg, #34d399, #22d3ee, #818cf8);
      box-shadow: 0 0 22px rgba(52, 211, 153, 0.55);
      pointer-events: none;
    }

    .sp3d-scanline {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      height: 160px;
      z-index: 7;
      pointer-events: none;
      background: linear-gradient(180deg, transparent, rgba(52, 211, 153, 0.08), transparent);
      animation: spScanline 7.5s ease-in-out infinite;
      opacity: 0.7;
    }

    .sp3d-holo-badge {
      position: absolute;
      right: 16vw;
      top: 410px;
      z-index: 8;
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(52, 211, 153, 0.30);
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.72);
      color: #a7f3d0;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      backdrop-filter: blur(20px) saturate(160%);
      box-shadow: 0 18px 60px rgba(52, 211, 153, 0.18);
      animation: spBadgeFloat 8s ease-in-out infinite;
    }

    .sp3d-holo-badge::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #34d399;
      box-shadow: 0 0 18px #34d399;
      animation: spPulse 1.6s ease-in-out infinite;
    }

    .sp3d-reveal {
      opacity: 0;
      transform: translateY(34px) scale(0.985);
      transition: opacity 0.72s cubic-bezier(.22,1,.36,1), transform 0.72s cubic-bezier(.22,1,.36,1);
      will-change: opacity, transform;
    }

    .sp3d-reveal.is-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    #hero-header .sp3d-magnetic-active {
      transition: transform 0.2s ease;
    }

    @keyframes spOrbFloat {
      0%, 100% { transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg); }
      50% { transform: translate3d(26px, -34px, 90px) rotateX(12deg) rotateY(-18deg); }
    }

    @keyframes spRingSpin {
      from { transform: rotateX(66deg) rotateZ(0deg); }
      to { transform: rotateX(66deg) rotateZ(360deg); }
    }

    @keyframes spCardFloat {
      0%, 100% { transform: translate3d(0, 0, 44px) rotateX(0deg) rotateY(0deg); }
      50% { transform: translate3d(16px, -24px, 92px) rotateX(7deg) rotateY(-9deg); }
    }

    @keyframes spScanline {
      0%, 100% { transform: translateY(-180px); opacity: 0; }
      48% { opacity: 0.75; }
      70% { transform: translateY(82vh); opacity: 0; }
    }

    @keyframes spBadgeFloat {
      0%, 100% { transform: translateY(0) rotateZ(0deg); }
      50% { transform: translateY(-14px) rotateZ(-1deg); }
    }

    @keyframes spPulse {
      0%, 100% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1.18); opacity: 1; }
    }

    @media (max-width: 1024px) {
      .sp3d-floating-card.card-a,
      .sp3d-floating-card.card-b,
      .sp3d-floating-card.card-c,
      .sp3d-holo-badge,
      .sp3d-ring-stack { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .sp3d-orb,
      .sp3d-ring-stack,
      .sp3d-floating-card,
      .sp3d-scanline,
      .sp3d-holo-badge,
      .sp3d-holo-badge::before {
        animation: none !important;
      }
      .sp3d-reveal { opacity: 1 !important; transform: none !important; }
    }
  `;

  function createLayer() {
    if (!document.getElementById('hero-header')) return;
    if (!document.getElementById('stockpro-3d-elements-style')) document.head.appendChild(css);
    if (!document.getElementById('stockpro-scroll-progress')) {
      const progress = document.createElement('div');
      progress.id = 'stockpro-scroll-progress';
      document.body.appendChild(progress);
    }
    if (!document.querySelector('.sp3d-scanline')) {
      const scan = document.createElement('div');
      scan.className = 'sp3d-scanline';
      document.body.appendChild(scan);
    }
    if (document.getElementById('stockpro-3d-layer')) return;

    const layer = document.createElement('div');
    layer.id = 'stockpro-3d-layer';
    layer.innerHTML = `
      <div class="sp3d-orb orb-a"></div>
      <div class="sp3d-orb orb-b"></div>
      <div class="sp3d-orb orb-c"></div>
      <div class="sp3d-ring-stack">
        <span style="--i:0px"></span>
        <span style="--i:38px"></span>
        <span style="--i:76px"></span>
        <span style="--i:114px"></span>
      </div>
      ${marketItems.slice(0, 3).map((item, index) => `
        <div class="sp3d-floating-card card-${['a','b','c'][index]}">
          <div class="sp3d-card-label">${item.label}</div>
          <div class="sp3d-card-value">${item.value}</div>
          <div class="sp3d-card-change">${item.change}</div>
        </div>
      `).join('')}
      <div class="sp3d-holo-badge">AI Market Cockpit Active</div>
    `;
    document.body.appendChild(layer);
  }

  function attachReveal() {
    const sections = Array.from(document.querySelectorAll('section, header, footer')).filter((el) => !el.classList.contains('sp3d-reveal'));
    sections.forEach((el) => el.classList.add('sp3d-reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.12 });
    sections.forEach((el) => observer.observe(el));
  }

  function attachMagneticHero() {
    const hero = document.getElementById('hero-header');
    if (!hero) return;
    const target = hero.querySelector('.grid > div:last-child');
    if (!target) return;
    target.classList.add('sp3d-magnetic-active');
    hero.addEventListener('mousemove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      target.style.transform = `rotateX(${y * -3}deg) rotateY(${x * 5}deg) translateY(-8px)`;
    });
    hero.addEventListener('mouseleave', () => {
      target.style.transform = '';
    });
  }

  function updateProgress() {
    const progress = document.getElementById('stockpro-scroll-progress');
    if (!progress) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = (window.scrollY / max) * 100;
    progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  function init() {
    createLayer();
    attachReveal();
    attachMagneticHero();
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    requestAnimationFrame(init);
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  const mo = new MutationObserver(() => {
    if (!document.getElementById('stockpro-3d-layer')) init();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
