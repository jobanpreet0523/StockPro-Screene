import * as THREE from 'three';
import { landingSceneDefinitions, type LandingSceneId, type LandingSceneState } from './landingSceneContract';

export type HeroSceneOptions = {
  canvas: HTMLCanvasElement;
  pixelRatio: number;
  targetFps: 30 | 60;
  onError: (error: Error) => void;
  onRenderReady: () => void;
  onContextLost: () => void;
  onSceneSetupMeasured: (durationMs: number, visualCount: number) => void;
};

type SceneVisual = { group: THREE.Group; materials: THREE.Material[]; opacity: number; target: number };
const BLUE = 0x2f6bff;
const CYAN = 0x42d7d0;
const AMBER = 0xffb35c;
const SLATE = 0x7890ad;

function standard(color: number, opacity = 0.86, wireframe = false) {
  const value = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.07, metalness: 0.16, roughness: 0.5,
    transparent: true, opacity, wireframe,
  });
  value.userData.baseOpacity = opacity;
  return value;
}

function basic(color: number, opacity = 0.7) {
  const value = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  value.userData.baseOpacity = opacity;
  return value;
}

function mesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  value: THREE.Material,
  position: readonly [number, number, number],
  rotation?: readonly [number, number, number],
) {
  const mark = new THREE.Mesh(geometry, value);
  mark.position.set(...position);
  if (rotation) mark.rotation.set(...rotation);
  group.add(mark);
  return mark;
}

function path(group: THREE.Group, points: readonly (readonly [number, number, number])[], color = CYAN) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return mesh(group, new THREE.TubeGeometry(curve, 24, 0.035, 6, false), basic(color), [0, 0, 0]);
}

function candles(group: THREE.Group) {
  const xs = [-3, -1.8, -0.6, 0.6, 1.8];
  const wick = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), standard(BLUE), xs.length);
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 1, 0.42), standard(CYAN), xs.length);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  xs.forEach((x, index) => {
    const height = 0.85 + (index % 3) * 0.46;
    matrix.compose(new THREE.Vector3(x, height / 2, 0), quaternion, new THREE.Vector3(1, height + 0.7, 1));
    wick.setMatrixAt(index, matrix);
    matrix.compose(new THREE.Vector3(x, height / 2, 0), quaternion, new THREE.Vector3(1, height, 1));
    body.setMatrixAt(index, matrix);
    body.setColorAt(index, new THREE.Color(index === 3 ? AMBER : CYAN));
  });
  wick.instanceMatrix.needsUpdate = true;
  body.instanceMatrix.needsUpdate = true;
  if (body.instanceColor) body.instanceColor.needsUpdate = true;
  group.add(wick, body);
}

function createVisual(id: LandingSceneId) {
  const group = new THREE.Group();
  if (id === 'research-universe') {
    candles(group);
    mesh(group, new THREE.IcosahedronGeometry(1.35, 2), standard(BLUE, 0.7, true), [3.1, 2, 0.6]);
    [1.85, 2.25].forEach((radius, index) => mesh(group, new THREE.TorusGeometry(radius, 0.03, 8, 56), basic(index ? AMBER : CYAN), [3.1, 2, 0.6], [Math.PI / 2.6, index * 0.42, 0]));
    path(group, [[-3.2, 0.2, 1], [-1.4, 1.6, 0.7], [0.6, 0.4, 0.5], [2.3, 1.8, 0]]);
  } else if (id === 'verified-source') {
    [-3.2, 0, 3.2].forEach((x, index) => mesh(group, new THREE.IcosahedronGeometry(index === 1 ? 1.1 : 0.68, 1), standard(index === 2 ? SLATE : index === 1 ? CYAN : BLUE), [x, 0.8, 0]));
    mesh(group, new THREE.TorusGeometry(1.7, 0.07, 10, 56), basic(CYAN), [0, 0.8, 0], [Math.PI / 2, 0, 0]);
    path(group, [[-2.6, 0.8, 0], [-1.5, 1.5, 0], [0, 0.8, 0]]).userData.providerOnly = true;
    mesh(group, new THREE.BoxGeometry(1.2, 1.7, 0.4), standard(SLATE, 0.4, true), [3.2, 0.8, 0]);
  } else if (id === 'product-constellation') {
    const modules = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.72, 0.28), standard(BLUE), 10);
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < 10; index += 1) {
      const angle = index / 10 * Math.PI * 2;
      const radius = index % 2 ? 3.6 : 2.65;
      matrix.makeTranslation(Math.cos(angle) * radius, 0.7 + Math.sin(angle * 2) * 0.45, Math.sin(angle) * radius);
      modules.setMatrixAt(index, matrix);
      modules.setColorAt(index, new THREE.Color(index ? BLUE : CYAN));
    }
    modules.instanceMatrix.needsUpdate = true;
    if (modules.instanceColor) modules.instanceColor.needsUpdate = true;
    group.add(modules);
  } else if (id === 'crt-laboratory') {
    [BLUE, CYAN, AMBER, SLATE].forEach((color, index) => mesh(group, new THREE.BoxGeometry(6.4 - index * 0.6, 0.06, 3.5 - index * 0.32), standard(color, 0.28), [0, -0.8 + index * 0.65, 0]));
    candles(group);
  } else if (id === 'pro-workspace') {
    for (let index = 0; index < 7; index += 1) {
      const column = index % 3;
      const row = Math.floor(index / 3);
      mesh(group, new THREE.BoxGeometry(2, 1.2, 0.12), standard(index ? BLUE : CYAN, 0.42), [(column - 1) * 2.35, 2 - row * 1.45, -row * 0.24], [-0.08, 0, 0]);
    }
  } else if (id === 'broker-vault') {
    mesh(group, new THREE.BoxGeometry(3, 3.2, 1.25), standard(BLUE), [0, 0.7, 0]);
    mesh(group, new THREE.TorusGeometry(0.78, 0.15, 12, 48), standard(AMBER), [0, 0.7, 0.7]);
    [-3.6, 3.6].forEach((x, index) => mesh(group, new THREE.IcosahedronGeometry(0.56, 1), standard(index ? SLATE : CYAN), [x, 1.5, 0]));
    path(group, [[-3, 1.5, 0], [-2.1, 2.1, 0], [-1.5, 1.1, 0]], BLUE);
  } else if (id === 'screener-funnel') {
    [4.2, 3.3, 2.4, 1.5].forEach((radius, index) => mesh(group, new THREE.CylinderGeometry(radius, radius - 0.62, 0.46, 6, 1, true), standard(index === 3 ? CYAN : BLUE, 0.36), [0, 2.1 - index * 0.9, 0]));
  } else if (id === 'personal-vault') {
    [-2.1, 0, 2.1].forEach((x, index) => mesh(group, new THREE.BoxGeometry(1.55, 2, 1.3), standard(index === 1 ? CYAN : BLUE, 0.52, true), [x, 0.5, 0]));
    mesh(group, new THREE.TorusGeometry(3.7, 0.04, 8, 64), basic(AMBER, 0.42), [0, 0.5, 0], [Math.PI / 2, 0, 0]);
  } else if (id === 'trust-core') {
    for (let index = 0; index < 5; index += 1) {
      mesh(group, new THREE.CylinderGeometry(3.6 - index * 0.52, 3.6 - index * 0.52, 0.22, 8), standard(index === 4 ? CYAN : index === 3 ? AMBER : BLUE, 0.3 + index * 0.08), [0, -1 + index * 0.68, 0]);
    }
  } else {
    const points: [number, number, number][] = [];
    for (let index = 0; index < 7; index += 1) {
      const point: [number, number, number] = [-3.5 + index * 1.15, -1 + index * 0.48, Math.sin(index * 1.2) * 0.75];
      points.push(point);
      mesh(group, new THREE.IcosahedronGeometry(0.4, 1), standard(index ? BLUE : CYAN), point);
    }
    path(group, points, BLUE);
    mesh(group, new THREE.TorusGeometry(4.5, 0.04, 8, 72), basic(AMBER, 0.4), [0, 0.5, 0], [Math.PI / 2, 0, 0]);
  }
  return group;
}

export class HeroFinancialScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  private readonly world = new THREE.Group();
  private readonly visuals = new Map<LandingSceneId, SceneVisual>();
  private readonly cameraTarget = new THREE.Vector3(0, 0.8, 0);
  private readonly positionTarget = new THREE.Vector3(8.8, 6.2, 11.8);
  private frame = 0;
  private running = false;
  private disposed = false;
  private contextLost = false;
  private pointerX = 0;
  private pointerY = 0;
  private lastTime = 0;
  private lastRenderTime = 0;
  private motion: LandingSceneState['motion'] = 'full';

  constructor(private readonly options: HeroSceneOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, alpha: true, antialias: options.pixelRatio > 1, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(options.pixelRatio, 1.5));
    this.renderer.setClearColor(0x06101f, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.position.copy(this.positionTarget);
    this.scene.add(this.world, new THREE.HemisphereLight(0xbce8ff, 0x08152c, 1.8));
    const light = new THREE.DirectionalLight(0xffffff, 2.7);
    light.position.set(5, 8, 7);
    this.scene.add(light);
    this.ensureVisual('research-universe');
    options.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.resize();
    try {
      this.render();
      options.onRenderReady();
    } catch (error) {
      this.dispose(false);
      throw error;
    }
  }

  setScene(state: LandingSceneState) {
    if (this.disposed || this.contextLost) return;
    const definition = landingSceneDefinitions.find((item) => item.id === state.id) ?? landingSceneDefinitions[0];
    this.ensureVisual(definition.id);
    this.positionTarget.set(...definition.camera.position);
    this.cameraTarget.set(...definition.camera.target);
    this.motion = state.motion;
    const verifiedVisual = this.visuals.get('verified-source');
    verifiedVisual?.group.traverse((object) => {
      if (object.userData.providerOnly) object.visible = state.providerVerified;
    });
    this.visuals.forEach((visual, id) => {
      visual.target = state.active && id === definition.id ? 1 : 0;
      if (state.motion !== 'full') {
        visual.opacity = visual.target;
        this.applyOpacity(visual);
      }
    });
    if (state.motion !== 'full') {
      this.camera.position.copy(this.positionTarget);
      this.camera.lookAt(this.cameraTarget);
      this.render();
    }
  }

  setPointer(clientX: number, clientY: number) {
    if (this.motion !== 'full') return;
    const bounds = this.options.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    this.pointerX = ((clientX - bounds.left) / bounds.width - 0.5) * 2;
    this.pointerY = ((clientY - bounds.top) / bounds.height - 0.5) * 2;
  }

  resize() {
    if (this.disposed || this.contextLost) return;
    const width = Math.max(1, this.options.canvas.clientWidth);
    const height = Math.max(1, this.options.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setRunning(running: boolean) {
    const next = running && !this.disposed && !this.contextLost;
    if (this.running === next) return;
    this.running = next;
    if (next) {
      this.lastTime = performance.now();
      this.lastRenderTime = 0;
      this.frame = requestAnimationFrame(this.animate);
    } else {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private readonly animate = (time: number) => {
    if (!this.running || this.disposed || this.contextLost) return;
    if (this.options.targetFps === 30 && this.lastRenderTime && time - this.lastRenderTime < 32) {
      this.frame = requestAnimationFrame(this.animate);
      return;
    }
    try {
      const delta = Math.min(32, Math.max(0, time - this.lastTime));
      this.lastTime = time;
      this.lastRenderTime = time;
      this.camera.position.lerp(this.positionTarget, 1 - Math.pow(0.001, delta / 1_000));
      this.camera.lookAt(this.cameraTarget);
      this.visuals.forEach((visual) => {
        visual.opacity += (visual.target - visual.opacity) * Math.min(1, delta * 0.008);
        this.applyOpacity(visual);
      });
      this.world.rotation.y += (this.pointerX * 0.02 - this.world.rotation.y) * Math.min(0.08, delta * 0.0025);
      this.world.rotation.x += (-this.pointerY * 0.01 - this.world.rotation.x) * Math.min(0.08, delta * 0.0025);
      this.render();
      this.frame = requestAnimationFrame(this.animate);
    } catch (error) {
      this.setRunning(false);
      this.options.onError(error instanceof Error ? error : new Error('The explanatory 3D scene stopped unexpectedly.'));
    }
  };

  private applyOpacity(visual: SceneVisual) {
    visual.group.visible = visual.opacity > 0.008;
    visual.materials.forEach((value) => {
      value.opacity = (typeof value.userData.baseOpacity === 'number' ? value.userData.baseOpacity : 1) * visual.opacity;
      value.depthWrite = visual.opacity > 0.98;
    });
  }

  private ensureVisual(id: LandingSceneId) {
    if (this.visuals.has(id)) return;
    const startedAt = performance.now();
    const group = createVisual(id);
    const materials: THREE.Material[] = [];
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      materials.push(...(Array.isArray(object.material) ? object.material : [object.material]));
    });
    const active = this.visuals.size === 0 && id === 'research-universe';
    group.visible = active;
    this.visuals.set(id, { group, materials, opacity: active ? 1 : 0, target: active ? 1 : 0 });
    this.world.add(group);
    this.options.onSceneSetupMeasured(performance.now() - startedAt, this.visuals.size);
  }

  private render() {
    if (!this.contextLost && !this.disposed) this.renderer.render(this.scene, this.camera);
  }

  private readonly handleContextLost = (event: Event) => {
    event.preventDefault();
    if (this.contextLost || this.disposed) return;
    this.contextLost = true;
    this.setRunning(false);
    this.options.onContextLost();
  };

  dispose(forceContextLoss = true) {
    if (this.disposed) return;
    this.disposed = true;
    this.setRunning(false);
    this.options.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((value) => value.dispose());
    });
    this.renderer.dispose();
    if (forceContextLoss && !this.contextLost) this.renderer.forceContextLoss();
    this.visuals.clear();
    this.scene.clear();
  }
}
