import { useEffect, useRef, useState } from 'react';
import { useLanding3DQuality } from '../../hooks/useLanding3DQuality';
import { useWebGLCapability } from '../../hooks/useWebGLCapability';
import Hero3DFallback from './Hero3DFallback';
import type { HeroFinancialScene } from './HeroFinancialScene';
import {
  acquireLandingRendererLease,
  isLandingSceneId,
  releaseLandingRendererLease,
  type LandingSceneId,
  type LandingSceneState,
} from './landingSceneContract';
import '../../styles/landing-3d.css';

type SceneStatus = 'fallback' | 'loading' | 'running' | 'paused' | 'error';
type ContextStatus = 'unavailable' | 'available' | 'lost';
const defaultScene: LandingSceneState = {
  id: 'research-universe', active: true, providerVerified: false, motion: 'full',
};

export default function LandingHero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeroFinancialScene | null>(null);
  const sceneStateRef = useRef<LandingSceneState>(defaultScene);
  const quality = useLanding3DQuality();
  const capability = useWebGLCapability();
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [status, setStatus] = useState<SceneStatus>('fallback');
  const [activeScene, setActiveScene] = useState<LandingSceneId>('research-universe');
  const [renderReady, setRenderReady] = useState(false);
  const [contextStatus, setContextStatus] = useState<ContextStatus>('unavailable');
  const [leaseHeld, setLeaseHeld] = useState(false);
  const eligible = quality.enabled && capability === 'supported';

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-landing-scene]'))
      .filter((node) => isLandingSceneId(node.dataset.landingScene));
    if (!sections.length) {
      const node = rootRef.current;
      if (!node) return;
      const fallbackObserver = new IntersectionObserver(([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasEntered(true);
      }, { threshold: 0.08 });
      fallbackObserver.observe(node);
      return () => fallbackObserver.disconnect();
    }
    const visible = new Map<Element, IntersectionObserverEntry>();
    const selectNearest = () => {
      const center = window.innerHeight / 2;
      const nearest = [...visible.values()]
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => {
          const leftDistance = Math.abs(left.boundingClientRect.top + left.boundingClientRect.height / 2 - center);
          const rightDistance = Math.abs(right.boundingClientRect.top + right.boundingClientRect.height / 2 - center);
          return leftDistance - rightDistance || right.intersectionRatio - left.intersectionRatio;
        })[0];
      const id = (nearest?.target as HTMLElement | undefined)?.dataset.landingScene;
      if (isLandingSceneId(id)) setActiveScene(id);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry));
      const storyVisible = [...visible.values()].some((entry) => entry.isIntersecting);
      setInView(storyVisible);
      if (storyVisible) setHasEntered(true);
      selectNearest();
    }, { rootMargin: '-18% 0px -18%', threshold: [0, 0.15, 0.35, 0.6] });
    sections.forEach((section) => observer.observe(section));
    const onFocus = (event: FocusEvent) => {
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-landing-scene]');
      const id = section?.dataset.landingScene;
      if (isLandingSceneId(id)) setActiveScene(id);
    };
    document.addEventListener('focusin', onFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>(`[data-landing-scene="${activeScene}"]`);
    const nextState: LandingSceneState = {
      id: activeScene,
      active: true,
      focusedModule: section?.dataset.focusedModule,
      providerVerified: section?.dataset.providerVerified === 'true',
      motion: quality.enabled ? 'full' : 'static',
    };
    sceneStateRef.current = nextState;
    sceneRef.current?.setScene(nextState);
  }, [activeScene, quality.enabled]);

  useEffect(() => {
    if (!eligible || !hasEntered || !canvasRef.current) return;
    const lease = acquireLandingRendererLease();
    if (!lease) {
      setStatus('error');
      return;
    }
    setLeaseHeld(true);
    let cancelled = false;
    let failed = false;
    let scene: HeroFinancialScene | null = null;
    const failScene = (contextLost: boolean) => {
      if (cancelled || failed) return;
      failed = true;
      setRenderReady(false);
      setContextStatus(contextLost ? 'lost' : 'unavailable');
      setStatus('error');
      window.queueMicrotask(() => {
        scene?.dispose(!contextLost);
        if (sceneRef.current === scene) sceneRef.current = null;
        releaseLandingRendererLease(lease);
        setLeaseHeld(false);
      });
    };
    const initialize = async () => {
      setStatus('loading');
      try {
        const { HeroFinancialScene: Scene } = await import('./HeroFinancialScene');
        if (cancelled || !canvasRef.current) return;
        scene = new Scene({
          canvas: canvasRef.current,
          pixelRatio: quality.pixelRatio,
          onRenderReady: () => {
            if (!cancelled) setRenderReady(true);
          },
          onContextLost: () => failScene(true),
          onError: () => failScene(false),
        });
        if (cancelled || failed) {
          scene.dispose(!failed);
          return;
        }
        sceneRef.current = scene;
        scene.setScene(sceneStateRef.current);
        setContextStatus('available');
        const shouldRun = inView && !document.hidden;
        scene.setRunning(shouldRun);
        setStatus(shouldRun ? 'running' : 'paused');
      } catch {
        failScene(false);
      }
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };
    let idleId = 0;
    let delayId = 0;
    const schedule = () => {
      delayId = window.setTimeout(() => {
        idleId = idleWindow.requestIdleCallback
          ? idleWindow.requestIdleCallback(() => void initialize(), { timeout: 1_500 })
          : window.setTimeout(() => void initialize(), 400);
      }, 3_500);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      window.clearTimeout(delayId);
      if (idleWindow.requestIdleCallback) window.cancelIdleCallback?.(idleId);
      else window.clearTimeout(idleId);
      scene?.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
      releaseLandingRendererLease(lease);
      setLeaseHeld(false);
      setRenderReady(false);
      setContextStatus('unavailable');
    };
  }, [eligible, hasEntered, quality.pixelRatio]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || status === 'error') return;
    const running = eligible && inView && documentVisible;
    scene.setRunning(running);
    setStatus(running ? 'running' : 'paused');
  }, [documentVisible, eligible, inView, renderReady, status]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onPointerMove = (event: PointerEvent) => sceneRef.current?.setPointer(event.clientX, event.clientY);
    const resizeObserver = new ResizeObserver(() => sceneRef.current?.resize());
    resizeObserver.observe(node);
    node.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      node.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
    };
  }, []);

  const visibleStatus = eligible ? status : 'fallback';
  return (
    <div
      ref={rootRef}
      className="landing-3d-root"
      data-landing-3d-state={visibleStatus}
      data-landing-3d-quality={quality.reason}
      data-landing-3d-visible={inView ? 'true' : 'false'}
      data-landing-scene-active={activeScene}
      data-render-ready={renderReady ? 'true' : 'false'}
      data-landing-3d-context={eligible ? contextStatus : 'unavailable'}
      data-landing-3d-lease={leaseHeld ? 'held' : 'none'}
      aria-hidden="true"
    >
      <Hero3DFallback activeScene={activeScene} />
      {eligible && (
        <canvas
          ref={canvasRef}
          className={`landing-3d-canvas ${renderReady && status !== 'error' ? 'is-ready' : ''}`}
          data-testid="landing-hero-canvas"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
