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
  const [sceneMetadata, setSceneMetadata] = useState<{ focusedModule?: string; providerVerified: boolean }>({ providerVerified: false });
  const [renderReady, setRenderReady] = useState(false);
  const [contextStatus, setContextStatus] = useState<ContextStatus>('unavailable');
  const [leaseHeld, setLeaseHeld] = useState(false);
  const [initDuration, setInitDuration] = useState<number | null>(null);
  const [sceneSetup, setSceneSetup] = useState<{ duration: number; count: number } | null>(null);
  const eligible = quality.enabled && capability === 'supported';

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    let frame = 0;
    const onFocus = (event: FocusEvent) => {
      const section = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-landing-scene]');
      const id = section?.dataset.landingScene;
      if (isLandingSceneId(id)) setActiveScene(id);
    };
    const updateFromLayout = () => {
      frame = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-landing-scene]'))
        .filter((node) => isLandingSceneId(node.dataset.landingScene));
      const viewportTop = window.innerHeight * 0.18;
      const viewportBottom = window.innerHeight * 0.82;
      const viewportCenter = window.innerHeight / 2;
      const candidates = sections
        .map((section) => ({ section, rect: section.getBoundingClientRect() }))
        .filter(({ rect }) => rect.bottom > viewportTop && rect.top < viewportBottom)
        .sort((left, right) => {
          const leftDistance = Math.abs(left.rect.top + left.rect.height / 2 - viewportCenter);
          const rightDistance = Math.abs(right.rect.top + right.rect.height / 2 - viewportCenter);
          return leftDistance - rightDistance;
        });
      const storyVisible = candidates.length > 0;
      setInView(storyVisible);
      if (storyVisible) setHasEntered(true);
      const id = candidates[0]?.section.dataset.landingScene;
      if (isLandingSceneId(id)) setActiveScene(id);
    };
    const scheduleLayoutUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateFromLayout);
    };
    const sectionsObserver = new MutationObserver(scheduleLayoutUpdate);
    sectionsObserver.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('focusin', onFocus);
    window.addEventListener('scroll', scheduleLayoutUpdate, { passive: true });
    window.addEventListener('resize', scheduleLayoutUpdate, { passive: true });
    updateFromLayout();
    return () => {
      sectionsObserver.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleLayoutUpdate);
      window.removeEventListener('resize', scheduleLayoutUpdate);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>(`[data-landing-scene="${activeScene}"]`);
    if (!section) {
      setSceneMetadata({ providerVerified: false });
      return;
    }
    const readMetadata = () => setSceneMetadata({
      focusedModule: section.dataset.focusedModule,
      providerVerified: section.dataset.providerVerified === 'true',
    });
    readMetadata();
    const observer = new MutationObserver(readMetadata);
    observer.observe(section, {
      attributes: true,
      attributeFilter: ['data-focused-module', 'data-provider-verified'],
    });
    return () => observer.disconnect();
  }, [activeScene]);

  useEffect(() => {
    const nextState: LandingSceneState = {
      id: activeScene,
      active: true,
      focusedModule: sceneMetadata.focusedModule,
      providerVerified: sceneMetadata.providerVerified,
      motion: quality.enabled ? 'full' : 'static',
    };
    sceneStateRef.current = nextState;
    sceneRef.current?.setScene(nextState);
  }, [activeScene, quality.enabled, sceneMetadata]);

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
        const startedAt = performance.now();
        scene = new Scene({
          canvas: canvasRef.current,
          pixelRatio: quality.pixelRatio,
          targetFps: quality.tier === 'standard' ? 30 : 60,
          onRenderReady: () => {
            if (!cancelled) setRenderReady(true);
          },
          onContextLost: () => failScene(true),
          onError: () => failScene(false),
          onSceneSetupMeasured: (duration, count) => {
            if (!cancelled) setSceneSetup({ duration, count });
          },
        });
        setInitDuration(performance.now() - startedAt);
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
          ? idleWindow.requestIdleCallback(() => void initialize(), { timeout: 1_000 })
          : window.setTimeout(() => void initialize(), 400);
      }, 1_200);
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
      setInitDuration(null);
      setSceneSetup(null);
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
      data-landing-provider-verified={sceneMetadata.providerVerified ? 'true' : 'false'}
      data-render-ready={renderReady ? 'true' : 'false'}
      data-landing-3d-context={eligible ? contextStatus : 'unavailable'}
      data-landing-3d-lease={leaseHeld ? 'held' : 'none'}
      data-landing-3d-target-fps={eligible ? (quality.tier === 'standard' ? '30' : '60') : '0'}
      data-landing-3d-init-ms={initDuration === null ? 'unavailable' : initDuration.toFixed(2)}
      data-landing-3d-scene-setup-ms={sceneSetup === null ? 'unavailable' : sceneSetup.duration.toFixed(2)}
      data-landing-3d-visual-count={sceneSetup?.count ?? 0}
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
