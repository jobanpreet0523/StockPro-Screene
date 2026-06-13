import React, { useRef, useEffect } from 'react';

/**
 * 3D Floating Particle Background — Full Page Overlay
 * Fixed canvas covering the entire viewport with animated particles
 * floating in 3D perspective space. Uses mix-blend-mode: screen
 * so particles glow beautifully on dark sections and subtly on light sections.
 * pointer-events: none ensures all clicks pass through.
 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let isVisible = true;

    // Particle config
    const PARTICLE_COUNT = 130;
    const MAX_DEPTH = 1200;
    const FOV = 600;
    const CONNECTION_DISTANCE = 140;

    const COLORS = [
      { r: 56, g: 189, b: 248 },   // sky-400 (#38bdf8)
      { r: 6, g: 182, b: 212 },     // cyan-500 (#06b6d4)
      { r: 37, g: 99, b: 235 },     // blue-600 (#2563eb)
      { r: 16, g: 185, b: 129 },    // emerald-500 (#10b981)
      { r: 99, g: 102, b: 241 },    // indigo-500 (#6366f1)
      { r: 139, g: 92, b: 246 },    // violet-500 (#8b5cf6)
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
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = width + 'px';
      canvas!.style.height = height + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * width * 3,
          y: (Math.random() - 0.5) * height * 3,
          z: Math.random() * MAX_DEPTH,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          vz: -(Math.random() * 0.3 + 0.08),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          pulseOffset: Math.random() * Math.PI * 2,
          baseSize: Math.random() * 1.5 + 0.6,
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
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Mouse influence offset (subtle parallax)
      const mxOff = (mouseX - width / 2) * 0.012;
      const myOff = (mouseY - height / 2) * 0.012;

      // Update and project particles
      const projected: { px: number; py: number; scale: number; particle: Particle; depth: number }[] = [];

      for (const p of particles) {
        const depthFactor = 1 - p.z / MAX_DEPTH;
        p.x += p.vx + mxOff * depthFactor * 0.05;
        p.y += p.vy + myOff * depthFactor * 0.05;
        p.z += p.vz;

        // Wrap around depth
        if (p.z < 1) {
          p.z = MAX_DEPTH;
          p.x = (Math.random() - 0.5) * width * 3;
          p.y = (Math.random() - 0.5) * height * 3;
        }
        if (p.z > MAX_DEPTH) {
          p.z = 1;
        }

        const { x: px, y: py, scale } = project(p);

        if (px > -150 && px < width + 150 && py > -150 && py < height + 150) {
          projected.push({ px, py, scale, particle: p, depth: p.z });
        }
      }

      // Sort by depth (far first)
      projected.sort((a, b) => b.depth - a.depth);

      // Draw connections
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
            const alpha = (1 - dist / maxDist) * 0.08 * (1 - a.depth / MAX_DEPTH);
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
        const pulse = 0.55 + 0.45 * Math.sin(time * 0.0006 + p.pulseOffset);
        const depthAlpha = Math.max(0.05, (1 - depth / MAX_DEPTH) * 0.7);
        const alpha = depthAlpha * pulse;
        const radius = Math.max(0.5, p.baseSize * scale * 2.2);

        // Outer glow (larger, softer)
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius * 5);
        gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.3})`);
        gradient.addColorStop(0.25, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.1})`);
        gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(px, py, radius * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright center dot
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
        ctx.arc(px, py, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e: MouseEvent) {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    }

    // Pause when tab is not visible
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resize();
    initParticles();
    animationId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
      }}
    />
  );
}
