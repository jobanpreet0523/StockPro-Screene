import React, { useRef, useEffect } from 'react';

/**
 * 3D Floating Particle Background
 * Renders a canvas with animated particles floating in 3D perspective space.
 * Designed for the dark hero section of StockPro landing page.
 * Features: perspective projection, depth-based sizing/opacity, connecting lines,
 * mouse parallax interaction, and pulsing glow effects.
 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let isVisible = true;

    // Particle config
    const PARTICLE_COUNT = 100;
    const MAX_DEPTH = 1000;
    const FOV = 500;
    const CONNECTION_DISTANCE = 130;

    const COLORS = [
      { r: 56, g: 189, b: 248 },   // sky-400 (#38bdf8) — primary
      { r: 6, g: 182, b: 212 },     // cyan-500 (#06b6d4)
      { r: 37, g: 99, b: 235 },     // blue-600 (#2563eb)
      { r: 16, g: 185, b: 129 },    // emerald-500 (#10b981)
      { r: 99, g: 102, b: 241 },    // indigo-500 (#6366f1)
    ];

    interface Particle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      color: typeof COLORS[0];
      pulseOffset: number;
      baseSize: number;
    }

    const particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.offsetWidth;
        height = parent.offsetHeight;
      } else {
        width = window.innerWidth;
        height = window.innerHeight;
      }
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * width * 2.5,
          y: (Math.random() - 0.5) * height * 2.5,
          z: Math.random() * MAX_DEPTH,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          vz: -(Math.random() * 0.4 + 0.15),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          pulseOffset: Math.random() * Math.PI * 2,
          baseSize: Math.random() * 1.8 + 0.8,
        });
      }
    }

    function project(p: Particle) {
      const scale = FOV / (FOV + p.z);
      return {
        x: p.x * scale + width / 2,
        y: p.y * scale + height / 2,
        scale,
      };
    }

    function draw(time: number) {
      if (!ctx || !isVisible) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Mouse influence offset (subtle parallax)
      const mxOff = (mouseX - width / 2) * 0.015;
      const myOff = (mouseY - height / 2) * 0.015;

      // Update and project particles
      const projected: { px: number; py: number; scale: number; particle: Particle; depth: number }[] = [];

      for (const p of particles) {
        // Move with slight mouse influence based on depth
        const depthFactor = 1 - p.z / MAX_DEPTH;
        p.x += p.vx + mxOff * depthFactor * 0.08;
        p.y += p.vy + myOff * depthFactor * 0.08;
        p.z += p.vz;

        // Wrap around depth
        if (p.z < 1) {
          p.z = MAX_DEPTH;
          p.x = (Math.random() - 0.5) * width * 2.5;
          p.y = (Math.random() - 0.5) * height * 2.5;
        }
        if (p.z > MAX_DEPTH) {
          p.z = 1;
        }

        const { x: px, y: py, scale } = project(p);

        // Only process visible particles
        if (px > -100 && px < width + 100 && py > -100 && py < height + 100) {
          projected.push({ px, py, scale, particle: p, depth: p.z });
        }
      }

      // Sort by depth (far first)
      projected.sort((a, b) => b.depth - a.depth);

      // Draw connections (only for closer particles)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        if (a.depth > 500) continue;
        for (let j = i + 1; j < projected.length; j++) {
          const b = projected[j];
          if (b.depth > 500) continue;
          const dx = a.px - b.px;
          const dy = a.py - b.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = CONNECTION_DISTANCE * ((a.scale + b.scale) / 2);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12 * (1 - a.depth / MAX_DEPTH);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${a.particle.color.r}, ${a.particle.color.g}, ${a.particle.color.b}, ${alpha})`;
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const { px, py, scale, particle: p, depth } of projected) {
        const pulse = 0.65 + 0.35 * Math.sin(time * 0.0008 + p.pulseOffset);
        const depthAlpha = Math.max(0.08, (1 - depth / MAX_DEPTH) * 0.8);
        const alpha = depthAlpha * pulse;
        const radius = Math.max(0.5, p.baseSize * scale * 3);

        // Outer glow
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius * 4);
        gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.4})`);
        gradient.addColorStop(0.3, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.15})`);
        gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(px, py, radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
        ctx.arc(px, py, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    }

    // Use IntersectionObserver to pause animation when not visible
    const observer = new IntersectionObserver(
      (entries) => { isVisible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    resize();
    initParticles();
    animationId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    // Listen on the parent header for mouse events (canvas has pointer-events: none)
    const parentEl = canvas.parentElement;
    if (parentEl) {
      parentEl.addEventListener('mousemove', handleMouseMove as EventListener);
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (parentEl) {
        parentEl.removeEventListener('mousemove', handleMouseMove as EventListener);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
