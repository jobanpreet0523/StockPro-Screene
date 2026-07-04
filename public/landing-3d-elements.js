(() => {
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  if (!isLanding) return;

  const marketItems = [
    { label: 'NIFTY 50', value: '24,270.85', change: '+1.35%' },
    { label: 'BANK NIFTY', value: '57,038.50', change: '+1.10%' },
    { label: 'PCR', value: '1.34', change: 'LIVE' },
    { label: 'MAX PAIN', value: '24,250', change: 'ACTIVE' },
  ];

  const css = document.createElement('style');
  css.id = 'stockpro-3d-elements-style';
  css.textContent = `
    body.stockpro-premium-landing {
      cursor: none;
      background:
        radial-gradient(circle at var(--spx, 50%) var(--spy, 20%), rgba(34, 211, 238, 0.11), transparent 28rem),
        radial-gradient(circle at 10% 8%, rgba(16, 185, 129, 0.24), transparent 32rem),
        radial-gradient(circle at 90% 12%, rgba(79, 70, 229, 0.22), transparent 36rem),
        #020617 !important;
    }

    #stockpro-landing-canvas {
      position: fixed;
      inset: 0;
      z-index: 2;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      opacity: 0.72;
      mix-blend-mode: screen;
    }

    #stockpro-scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      z-index: 9999;
      background: linear-gradient(90deg, #34d399, #22d3ee, #818cf8, #34d399);
      background-size: 220% 100%;
      box-shadow: 0 0 24px rgba(52, 211, 153, 0.70);
      pointer-events: none;
      animation: spGradientMove 4s linear infinite;
    }

    #stockpro-premium-cursor {
      position: fixed;
      left: var(--spx, 50%);
      top: var(--spy, 50%);
      z-index: 9998;
      width: 28px;
      height: 28px;
      margin-left: -14px;
      margin-top: -14px;
      border: 1px solid rgba(52, 211, 153, 0.55);
      border-radius: 999px;
      pointer-events: none;
      mix-blend-mode: screen;
      box-shadow: 0 0 28px rgba(52, 211, 153, 0.45), inset 0 0 16px rgba(34, 211, 238, 0.18);
      transition: width 0.18s ease, height 0.18s ease, margin 0.18s ease, opacity 0.2s ease;
    }

    body.stockpro-premium-landing:has(a:hover) #stockpro-premium-cursor,
    body.stockpro-premium-landing:has(button:hover) #stockpro-premium-cursor {
      width: 46px;
      height: 46px;
      margin-left: -23px;
      margin-top: -23px;
      background: rgba(52, 211, 153, 0.08);
    }

    #stockpro-3d-layer {
      position: fixed;
      inset: 0;
      z-index: 4;
      pointer-events: none;
      overflow: hidden;
      perspective: 1400px;
    }

    .sp3d-orb {
      position: absolute;
      width: 180px;
      height: 180px;
      border-radius: 999px;
      background: radial-gradient(circle at 35% 28%, rgba(255,255,255,0.62), rgba(52, 211, 153, 0.24) 18%, rgba(34, 211, 238, 0.11) 42%, transparent 70%);
      opacity: 0.54;
      transform-style: preserve-3d;
      filter: blur(0.2px);
      animation: spOrbFloat 13s ease-in-out infinite;
    }
    .sp3d-orb.orb-a { left: 4%; top: 18%; }
    .sp3d-orb.orb-b { right: 8%; top: 22%; width: 110px; height: 110px; animation-delay: 1.2s; animation-duration: 10s; }
    .sp3d-orb.orb-c { left: 52%; bottom: 8%; width: 140px; height: 140px; animation-delay: 2.4s; animation-duration: 15s; }

    .sp3d-ring-stack {
      position: absolute;
      right: 4vw;
      top: 170px;
      width: 460px;
      height: 460px;
      transform-style: preserve-3d;
      transform: rotateX(66deg) rotateZ(0deg);
      animation: spRingSpin 24s linear infinite;
      opacity: 0.72;
    }
    .sp3d-ring-stack span {
      position: absolute;
      inset: var(--i);
      border-radius: 999px;
      border: 1px solid rgba(52, 211, 153, 0.24);
      box-shadow: 0 0 30px rgba(34, 211, 238, 0.08), inset 0 0 24px rgba(52, 211, 153, 0.08);
    }

    .sp3d-data-plane {
      position: absolute;
      left: 5vw;
      bottom: 13vh;
      width: 360px;
      height: 220px;
      border: 1px solid rgba(34, 211, 238, 0.18);
      border-radius: 28px;
      transform: rotateX(66deg) rotateZ(-10deg);
      background:
        linear-gradient(rgba(34, 211, 238, 0.16) 1px, transparent 1px),
        linear-gradient(90deg, rgba(52, 211, 153, 0.12) 1px, transparent 1px),
        radial-gradient(circle at center, rgba(52, 211, 153, 0.10), transparent 62%);
      background-size: 28px 28px, 28px 28px, 100% 100%;
      box-shadow: 0 0 60px rgba(34, 211, 238, 0.08), inset 0 0 40px rgba(52, 211, 153, 0.05);
      animation: spPlaneFloat 12s ease-in-out infinite;
    }

    .sp3d-floating-card {
      position: absolute;
      width: 196px;
      border: 1px solid rgba(148, 163, 184, 0.24);
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.64));
      color: #f8fafc;
      padding: 15px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.08);
      backdrop-filter: blur(24px) saturate(170%);
      transform-style: preserve-3d;
      animation: spCardFloat 9s ease-in-out infinite;
    }
    .sp3d-floating-card.card-a { left: 1.4vw; top: 245px; }
    .sp3d-floating-card.card-b { right: 2.5vw; top: 540px; animation-delay: 1.1s; }
    .sp3d-floating-card.card-c { left: 32vw; top: 116px; animation-delay: 2s; }
    .sp3d-floating-card.card-d { right: 20vw; bottom: 80px; animation-delay: 2.9s; }

    .sp3d-card-label { font-size: 10px; font-weight: 950; color: #94a3b8; letter-spacing: 0.18em; text-transform: uppercase; }
    .sp3d-card-value { margin-top: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 20px; font-weight: 950; color: #ffffff; }
    .sp3d-card-change { margin-top: 7px; display: inline-flex; border: 1px solid rgba(52, 211, 153, 0.28); background: rgba(52, 211, 153, 0.11); color: #6ee7b7; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 950; letter-spacing: 0.12em; }

    .sp3d-scanline {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      height: 160px;
      z-index: 5;
      pointer-events: none;
      background: linear-gradient(180deg, transparent, rgba(52, 211, 153, 0.08), rgba(34, 211, 238, 0.05), transparent);
      animation: spScanline 7.5s ease-in-out infinite;
      opacity: 0.7;
    }

    .sp3d-holo-badge {
      position: absolute;
      right: 16vw;
      top: 410px;
      z-index: 5;
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
      text-transform: uppercase;
      letter-spacing: 0.14em;
      backdrop-filter: blur(22px) saturate(170%);
      box-shadow: 0 18px 60px rgba(52, 211, 153, 0.20);
      animation: spBadgeFloat 8s ease-in-out infinite;
    }
    .sp3d-holo-badge::before { content: ''; width: 8px; height: 8px; border-radius: 999px; background: #34d399; box-shadow: 0 0 18px #34d399; animation: spPulse 1.6s ease-in-out infinite; }

    .sp3d-reveal { opacity: 0; transform: translateY(38px) scale(0.985); transition: opacity 0.78s cubic-bezier(.22,1,.36,1), transform 0.78s cubic-bezier(.22,1,.36,1); will-change: opacity, transform; }
    .sp3d-reveal.is-visible { opacity: 1; transform: translateY(0) scale(1); }

    .sp-pro-card {
      position: relative;
      overflow: hidden;
      transform-style: preserve-3d;
      will-change: transform;
    }
    .sp-pro-card::after {
      content: '';
      position: absolute;
      inset: -110% -35%;
      background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.18), transparent 62%);
      transform: translateX(-60%) rotate(12deg);
      transition: transform 0.8s ease;
      pointer-events: none;
    }
    .sp-pro-card:hover::after { transform: translateX(55%) rotate(12deg); }

    #hero-header .sp3d-magnetic-active { transition: transform 0.18s ease, filter 0.28s ease; }

    @keyframes spOrbFloat { 0%, 100% { transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg); } 50% { transform: translate3d(26px, -34px, 90px) rotateX(12deg) rotateY(-18deg); } }
    @keyframes spRingSpin { from { transform: rotateX(66deg) rotateZ(0deg); } to { transform: rotateX(66deg) rotateZ(360deg); } }
    @keyframes spPlaneFloat { 0%, 100% { transform: rotateX(66deg) rotateZ(-10deg) translateY(0); } 50% { transform: rotateX(64deg) rotateZ(-5deg) translateY(-24px); } }
    @keyframes spCardFloat { 0%, 100% { transform: translate3d(0, 0, 44px) rotateX(0deg) rotateY(0deg); } 50% { transform: translate3d(16px, -24px, 92px) rotateX(7deg) rotateY(-9deg); } }
    @keyframes spScanline { 0%, 100% { transform: translateY(-180px); opacity: 0; } 48% { opacity: 0.75; } 70% { transform: translateY(82vh); opacity: 0; } }
    @keyframes spBadgeFloat { 0%, 100% { transform: translateY(0) rotateZ(0deg); } 50% { transform: translateY(-14px) rotateZ(-1deg); } }
    @keyframes spPulse { 0%, 100% { transform: scale(0.8); opacity: 0.6; } 50% { transform: scale(1.18); opacity: 1; } }
    @keyframes spGradientMove { from { background-position: 0% 50%; } to { background-position: 220% 50%; } }

    @media (max-width: 1024px) {
      body.stockpro-premium-landing { cursor: auto; }
      #stockpro-premium-cursor,
      .sp3d-floating-card,
      .sp3d-holo-badge,
      .sp3d-ring-stack,
      .sp3d-data-plane { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .sp3d-orb, .sp3d-ring-stack, .sp3d-data-plane, .sp3d-floating-card, .sp3d-scanline, .sp3d-holo-badge, .sp3d-holo-badge::before, #stockpro-scroll-progress { animation: none !important; }
      .sp3d-reveal { opacity: 1 !important; transform: none !important; }
    }
  `;

  function createCanvas() {
    if (document.getElementById('stockpro-landing-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'stockpro-landing-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(130, Math.max(70, Math.floor(width / 14)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 1 + 0.25,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.8 + 0.6,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const mx = (mouse.x - width / 2) * 0.0009 * p.z;
        const my = (mouse.y - height / 2) * 0.0009 * p.z;
        p.x += p.vx + mx;
        p.y += p.vy + my;
        if (p.x < -40) p.x = width + 40;
        if (p.x > width + 40) p.x = -40;
        if (p.y < -40) p.y = height + 40;
        if (p.y > height + 40) p.y = -40;
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 118) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.09 * (1 - dist / 118)})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 9);
        gradient.addColorStop(0, 'rgba(110, 231, 183, 0.52)');
        gradient.addColorStop(0.28, 'rgba(34, 211, 238, 0.16)');
        gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 9, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
    resize();
    draw();
  }

  function createLayer() {
    document.body.classList.add('stockpro-premium-landing');
    if (!document.getElementById('hero-header')) return;
    if (!document.getElementById('stockpro-3d-elements-style')) document.head.appendChild(css);
    createCanvas();

    if (!document.getElementById('stockpro-premium-cursor')) {
      const cursor = document.createElement('div');
      cursor.id = 'stockpro-premium-cursor';
      document.body.appendChild(cursor);
    }

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
      <div class="sp3d-data-plane"></div>
      <div class="sp3d-ring-stack">
        <span style="--i:0px"></span><span style="--i:38px"></span><span style="--i:76px"></span><span style="--i:114px"></span>
      </div>
      ${marketItems.map((item, index) => `
        <div class="sp3d-floating-card card-${['a','b','c','d'][index]}">
          <div class="sp3d-card-label">${item.label}</div>
          <div class="sp3d-card-value">${item.value}</div>
          <div class="sp3d-card-change">${item.change}</div>
        </div>
      `).join('')}
      <div class="sp3d-holo-badge">AI Market Cockpit Active</div>
    `;
    document.body.appendChild(layer);
  }

  function cleanPremiumCopy() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
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
      let value = textNode.nodeValue || '';
      let next = value;
      replacements.forEach(([pattern, replacement]) => { next = next.replace(pattern, replacement); });
      if (next !== value) textNode.nodeValue = next;
    });
  }

  function attachRevealAndCards() {
    const revealTargets = Array.from(document.querySelectorAll('section, header, footer, article')).filter((el) => !el.classList.contains('sp3d-reveal'));
    revealTargets.forEach((el) => el.classList.add('sp3d-reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => observer.observe(el));

    const cardTargets = document.querySelectorAll('section [class*="rounded"], section article, section .card, #hero-header a');
    cardTargets.forEach((el) => el.classList.add('sp-pro-card'));
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
      target.style.transform = `rotateX(${y * -4}deg) rotateY(${x * 6}deg) translateY(-10px) scale(1.012)`;
      target.style.filter = 'drop-shadow(0 42px 110px rgba(52, 211, 153, 0.22))';
    });
    hero.addEventListener('mouseleave', () => {
      target.style.transform = '';
      target.style.filter = '';
    });
  }

  function updateProgressAndCursor(event) {
    if (event && event.clientX != null) {
      document.documentElement.style.setProperty('--spx', `${event.clientX}px`);
      document.documentElement.style.setProperty('--spy', `${event.clientY}px`);
    }
    const progress = document.getElementById('stockpro-scroll-progress');
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = (window.scrollY / max) * 100;
      progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  }

  function init() {
    createLayer();
    cleanPremiumCopy();
    attachRevealAndCards();
    attachMagneticHero();
    updateProgressAndCursor();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else requestAnimationFrame(init);

  window.addEventListener('scroll', updateProgressAndCursor, { passive: true });
  window.addEventListener('mousemove', updateProgressAndCursor, { passive: true });
  window.addEventListener('resize', updateProgressAndCursor);

  const mo = new MutationObserver(() => {
    if (!document.getElementById('stockpro-3d-layer') || !document.getElementById('hero-header')) init();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
