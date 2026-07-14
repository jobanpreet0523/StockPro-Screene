import { useEffect, useRef, useState } from 'react';
import { useLanding3DQuality } from '../../hooks/useLanding3DQuality';
import { useWebGLCapability } from '../../hooks/useWebGLCapability';
import Hero3DFallback from './Hero3DFallback';
import type { HeroFinancialScene } from './HeroFinancialScene';
import '../../styles/landing-3d.css';

type SceneState = 'fallback' | 'loading' | 'running' | 'paused' | 'error';

export default function LandingHero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeroFinancialScene | null>(null);
  const quality = useLanding3DQuality();
  const capability = useWebGLCapability();
  const [inView, setInView] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const [state, setState] = useState<SceneState>('fallback');
  const eligible = quality.enabled && capability === 'supported';

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!eligible || !inView || sceneRef.current || !canvasRef.current) return;
    let cancelled = false;
    const initialize = async () => {
      setState('loading');
      try {
        const { HeroFinancialScene: Scene } = await import('./HeroFinancialScene');
        if (cancelled || !canvasRef.current) return;
        sceneRef.current = new Scene({
          canvas: canvasRef.current,
          pixelRatio: quality.pixelRatio,
          onError: () => setState('error'),
        });
        setState(document.hidden ? 'paused' : 'running');
      } catch {
        setState('error');
      }
    };
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number };
    const idleId = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(() => void initialize(), { timeout: 900 })
      : window.setTimeout(() => void initialize(), 80);
    return () => {
      sceneRef.current?.setRunning(false);
      cancelled = true;
      if (idleWindow.requestIdleCallback) window.cancelIdleCallback?.(idleId);
      else window.clearTimeout(idleId);
    };
  }, [eligible, inView, quality.pixelRatio]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (state === 'error') {
      scene.setRunning(false);
      return;
    }
    const running = eligible && inView && documentVisible;
    scene.setRunning(running);
    setState(running ? 'running' : 'paused');
  }, [documentVisible, eligible, inView, state]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => sceneRef.current?.setPointer(event.clientX, event.clientY);
    const resizeObserver = new ResizeObserver(() => sceneRef.current?.resize());
    if (rootRef.current) resizeObserver.observe(rootRef.current);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const visibleState = eligible ? state : 'fallback';
  return (
    <div
      ref={rootRef}
      className="landing-3d-root"
      data-landing-3d-state={visibleState}
      data-landing-3d-quality={quality.reason}
      aria-hidden="true"
    >
      <Hero3DFallback />
      {eligible && (
        <canvas
          ref={canvasRef}
          className={`landing-3d-canvas ${state === 'running' || state === 'paused' ? 'is-ready' : ''}`}
          data-testid="landing-hero-canvas"
        />
      )}
    </div>
  );
}
