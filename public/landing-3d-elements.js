(() => {
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  if (!isLanding) return;

  const marketItems = [
    { label: 'NIFTY 50', value: '24,270.85', change: '+1.35%' },
    { label: 'BANK NIFTY', value: '57,038.50', change: '+1.10%' },
    { label: 'PCR', value: '1.34', change: 'SAMPLE' },
    { label: 'MAX PAIN', value: '24,250', change: 'ACTIVE' },
  ];

  const css = document.createElement('style');
  css.id = 'stockpro-hero-only-3d-style';
  css.textContent = `
    body { cursor: auto !important; }

    #hero-header {
      position: relative !important;
      min-height: 680px !important;
      overflow: hidden !important;
      isolation: isolate !important;
      background:
        radial-gradient(circle at 12% 18%, rgba(16, 185, 129, 0.20), transparent 28rem),
        radial-gradient(circle at 86% 22%, rgba(34, 211, 238, 0.18), transparent 32rem),
        linear-gradient(135deg, #020617 0%, #061826 48%, #020617 100%) !important;
      border-bottom: 1px solid rgba(52, 211, 153, 0.18) !important;
    }

    #hero-header .relative.max-w-7xl {
      position: relative !important;
      z-index: 8 !important;
      perspective: 1300px;
    }

    #hero-header::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
      background-size: 54px 54px;
      mask-image: radial-gradient(circle at center, black, transparent 76%);
    }

    #hero-header::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      background: linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.055) 45%, transparent 56%);
      animation: heroSweepOnly 7.5s ease-in-out infinite;
    }

    #stockpro-landing-canvas {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      z-index: 1 !important;
      pointer-events: none !important;
      opacity: 0.42 !important;
      mix-blend-mode: screen;
      margin: 0 !important;
      padding: 0 !important;
    }

    #stockpro-3d-layer {
      position: absolute !important;
      inset: 0 !important;
      z-index: 3 !important;
      pointer-events: none !important;
      overflow: hidden !important;
      perspective: 1400px;
      height: 100% !important;
      width: 100% !important;
      margin: 0 !important;
    }

    .sp3d-ring-stack {
      position: absolute;
      right: 5%;
      top: 8%;
      width: 520px;
      height: 520px;
      transform-style: preserve-3d;
      transform: rotateX(68deg) rotateZ(0deg);
      animation: heroRingOnly 22s linear infinite;
      opacity: 0.72;
    }
    .sp3d-ring-stack span {
      position: absolute;
      inset: var(--i);
      border-radius: 999px;
      border: 1px solid rgba(52, 211, 153, 0.22);
      box-shadow: inset 0 0 36px rgba(52, 211, 153, 0.05), 0 0 34px rgba(34, 211, 238, 0.06);
    }

    .sp3d-data-plane {
      position: absolute;
      left: 7%;
      bottom: 8%;
      width: 420px;
      height: 250px;
      border: 1px solid rgba(34, 211, 238, 0.18);
      border-radius: 30px;
      transform: rotateX(64deg) rotateZ(-8deg);
      background:
        linear-gradient(rgba(34, 211, 238, 0.13) 1px, transparent 1px),
        linear-gradient(90deg, rgba(52, 211, 153, 0.13) 1px, transparent 1px),
        radial-gradient(circle at center, rgba(52, 211, 153, 0.11), transparent 60%);
      background-size: 30px 30px, 30px 30px, 100% 100%;
      animation: heroPlaneOnly 10s ease-in-out infinite;
    }

    .sp3d-orb {
      position: absolute;
      border-radius: 999px;
      background: radial-gradient(circle at 34% 28%, rgba(255,255,255,0.70), rgba(52,211,153,0.22) 20%, rgba(34,211,238,0.10) 45%, transparent 72%);
      opacity: 0.46;
      animation: heroOrbOnly 11s ease-in-out infinite;
      filter: blur(0.2px);
    }
    .sp3d-orb.orb-a { width: 180px; height: 180px; left: 4%; top: 18%; }
    .sp3d-orb.orb-b { width: 110px; height: 110px; right: 10%; top: 24%; animation-delay: 1.2s; }
    .sp3d-orb.orb-c { width: 138px; height: 138px; left: 48%; bottom: 8%; animation-delay: 2.3s; }

    .sp3d-floating-card {
      position: absolute;
      width: 196px;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(2, 6, 23, 0.66));
      color: #f8fafc;
      padding: 15px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08);
      backdrop-filter: blur(22px) saturate(165%);
      animation: heroCardFloatOnly 8.5s ease-in-out infinite;
    }
    .sp3d-floating-card.card-a { left: 2%; top: 28%; }
    .sp3d-floating-card.card-b { right: 2%; top: 54%; animation-delay: 1s; }
    .sp3d-floating-card.card-c { left: 37%; top: 11%; animation-delay: 2s; }
    .sp3d-floating-card.card-d { right: 23%; bottom: 10%; animation-delay: 2.7s; }
    .sp3d-card-label { font-size: 10px; font-weight: 950; color: #94a3b8; letter-spacing: 0.18em; text-transform: uppercase; }
    .sp3d-card-value { margin-top: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 20px; font-weight: 950; color: #fff; }
    .sp3d-card-change { margin-top: 7px; display: inline-flex; border: 1px solid rgba(52, 211, 153, 0.26); background: rgba(52, 211, 153, 0.11); color: #6ee7b7; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 950; letter-spacing: 0.12em; }

    .sp3d-holo-badge {
      position: absolute;
      right: 15%;
      top: 37%;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(52, 211, 153, 0.32);
      border-radius: 999px;
      background: rgba(2, 6, 23, 0.76);
      color: #a7f3d0;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      box-shadow: 0 18px 60px rgba(52, 211, 153, 0.18);
      backdrop-filter: blur(22px) saturate(170%);
      animation: heroBadgeOnly 7s ease-in-out infinite;
    }
    .sp3d-holo-badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 18px #34d399; }

    #hero-header h1 {
      letter-spacing: -0.065em !important;
      text-shadow: 0 24px 90px rgba(34, 211, 238, 0.22);
      max-width: 760px;
    }

    #hero-header p {
      color: rgba(226, 232, 240, 0.88) !important;
      max-width: 670px;
    }

    #hero-header a[href='/screener'],
    #hero-header a[href='#pricing-section'] {
      border-radius: 18px !important;
      position: relative;
      overflow: hidden;
      transform-style: preserve-3d;
      transition: transform 0.26s ease, box-shadow 0.26s ease, background 0.26s ease !important;
    }
    #hero-header a[href='/screener'] {
      background: linear-gradient(135deg, #34d399, #22d3ee) !important;
      color: #020617 !important;
      box-shadow: 0 26px 72px rgba(52, 211, 153, 0.28) !important;
    }
    #hero-header a[href='/screener'] span { color: #020617 !important; }
    #hero-header a:hover { transform: translateY(-5px) scale(1.018) !important; }

    #hero-header .grid > div:last-child {
      transform-style: preserve-3d;
      animation: heroTerminalOnly 8s ease-in-out infinite;
      filter: drop-shadow(0 38px 110px rgba(52, 211, 153, 0.22));
    }

    .sp-hero-glass-panel {
      position: absolute;
      left: 50%;
      bottom: 34px;
      transform: translateX(-50%);
      z-index: 7;
      width: min(980px, calc(100% - 40px));
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      padding: 10px;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.55);
      backdrop-filter: blur(22px) saturate(160%);
      box-shadow: 0 30px 90px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .sp-hero-glass-panel a {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 54px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      color: #e2e8f0 !important;
      background: rgba(255, 255, 255, 0.055);
      text-decoration: none;
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: transform 0.22s ease, background 0.22s ease, color 0.22s ease;
    }
    .sp-hero-glass-panel a:hover {
      transform: translateY(-3px);
      background: rgba(52, 211, 153, 0.13);
      color: #6ee7b7 !important;
    }

    body:has(#hero-header) section:not(#hero-header),
    body:has(#hero-header) footer {
      background: initial !important;
      backdrop-filter: none !important;
      animation: none !important;
      transform: none !important;
    }

    @keyframes heroSweepOnly { 0%, 62% { transform: translateX(-70%); opacity: 0; } 78% { opacity: 0.72; } 100% { transform: translateX(70%); opacity: 0; } }
    @keyframes heroRingOnly { from { transform: rotateX(68deg) rotateZ(0deg); } to { transform: rotateX(68deg) rotateZ(360deg); } }
    @keyframes heroPlaneOnly { 0%, 100% { transform: rotateX(64deg) rotateZ(-8deg) translateY(0); } 50% { transform: rotateX(61deg) rotateZ(-4deg) translateY(-22px); } }
    @keyframes heroOrbOnly { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(22px,-30px,80px) scale(1.08); } }
    @keyframes heroCardFloatOnly { 0%, 100% { transform: translate3d(0,0,44px) rotateX(0deg) rotateY(0deg); } 50% { transform: translate3d(14px,-22px,90px) rotateX(7deg) rotateY(-9deg); } }
    @keyframes heroBadgeOnly { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
    @keyframes heroTerminalOnly { 0%, 100% { transform: rotateX(0deg) rotateY(0deg) translateY(0); } 50% { transform: rotateX(2.8deg) rotateY(-4deg) translateY(-13px); } }

    @media (max-width: 1024px) {
      #hero-header { min-height: auto !important; }
      .sp3d-floating-card, .sp3d-ring-stack, .sp3d-data-plane, .sp3d-holo-badge, .sp-hero-glass-panel { display: none !important; }
      #stockpro-landing-canvas { opacity: 0.24 !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      #hero-header::after, .sp3d-ring-stack, .sp3d-data-plane, .sp3d-orb, .sp3d-floating-card, .sp3d-holo-badge, #hero-header .grid > div:last-child { animation: none !important; }
    }
  `;

  function cleanPremiumCopy() {
    const walker = document.createTreeWalker(document.getElementById('hero-header') || document.body, NodeFilter.SHOW_TEXT);
    const replacements = [
      [/Access Pro Terminal/g, 'Access Free Terminal'],
      [/Pro Derivatives Terminal/g, 'Free Derivatives Terminal'],
      [/F&O Analytics Pro/g, 'F&O Analytics Terminal'],
      [/VIEW PRICING/g, 'FREE ACCESS'],
      [/PRO/g, 'FREE'],
    ];
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      let next = textNode.nodeValue || '';
      replacements.forEach(([pattern, replacement]) => { next = next.replace(pattern, replacement); });
      textNode.nodeValue = next;
    });
  }

  function createHeroCanvas(hero) {
    if (hero.querySelector('#stockpro-landing-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'stockpro-landing-canvas';
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let mouse = { x: 0, y: 0 };

    function resize() {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.max(45, Math.floor(width / 20)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.5 + 0.5,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx + (mouse.x - width / 2) * 0.00025;
        p.y += p.vy + (mouse.y - height / 2) * 0.00025;
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;
      });
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.08 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        g.addColorStop(0, 'rgba(110, 231, 183, 0.42)');
        g.addColorStop(0.35, 'rgba(34, 211, 238, 0.14)');
        g.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, { passive: true });
    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  function createHeroLayer(hero) {
    if (hero.querySelector('#stockpro-3d-layer')) return;
    const layer = document.createElement('div');
    layer.id = 'stockpro-3d-layer';
    layer.innerHTML = `
      <div class="sp3d-orb orb-a"></div><div class="sp3d-orb orb-b"></div><div class="sp3d-orb orb-c"></div>
      <div class="sp3d-data-plane"></div>
      <div class="sp3d-ring-stack"><span style="--i:0px"></span><span style="--i:38px"></span><span style="--i:76px"></span><span style="--i:114px"></span></div>
      ${marketItems.map((item, index) => `<div class="sp3d-floating-card card-${['a','b','c','d'][index]}"><div class="sp3d-card-label">${item.label}</div><div class="sp3d-card-value">${item.value}</div><div class="sp3d-card-change">${item.change}</div></div>`).join('')}
      <div class="sp3d-holo-badge">AI Market Cockpit Active</div>
    `;
    hero.prepend(layer);
  }

  function addHeroQuickPanel(hero) {
    if (hero.querySelector('.sp-hero-glass-panel')) return;
    const panel = document.createElement('div');
    panel.className = 'sp-hero-glass-panel';
    panel.innerHTML = `
      <a href="/screener">📊 Screener</a>
      <a href="/option-chain">🎯 Option Chain</a>
      <a href="/greeks-calculator">Σ Greeks</a>
      <a href="/signals">⚡ Signals</a>
    `;
    hero.appendChild(panel);
  }

  function attachMagneticHero(hero) {
    const target = hero.querySelector('.grid > div:last-child');
    if (!target || target.dataset.spHeroMagnetic === 'true') return;
    target.dataset.spHeroMagnetic = 'true';
    hero.addEventListener('mousemove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      target.style.transform = `rotateX(${y * -3.2}deg) rotateY(${x * 5.2}deg) translateY(-8px) scale(1.01)`;
      target.style.filter = 'drop-shadow(0 42px 110px rgba(52, 211, 153, 0.22))';
    });
    hero.addEventListener('mouseleave', () => {
      target.style.transform = '';
      target.style.filter = '';
    });
  }

  function init() {
    const hero = document.getElementById('hero-header');
    if (!hero) return;
    document.body.classList.remove('stockpro-premium-landing');
    document.getElementById('stockpro-scroll-progress')?.remove();
    document.getElementById('stockpro-premium-cursor')?.remove();
    document.querySelectorAll('body > #stockpro-landing-canvas, body > #stockpro-3d-layer, body > .sp3d-scanline').forEach((el) => el.remove());
    if (!document.getElementById('stockpro-hero-only-3d-style')) document.head.appendChild(css);
    cleanPremiumCopy();
    createHeroCanvas(hero);
    createHeroLayer(hero);
    addHeroQuickPanel(hero);
    attachMagneticHero(hero);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else requestAnimationFrame(init);

  const mo = new MutationObserver(() => {
    if (!document.getElementById('hero-header')?.querySelector('#stockpro-3d-layer')) init();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
