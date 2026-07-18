import * as THREE from 'three';

export type HeroSceneOptions = {
  canvas: HTMLCanvasElement;
  pixelRatio: number;
  onError: (error: Error) => void;
};

export class HeroFinancialScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  private readonly world = new THREE.Group();
  private readonly orbit = new THREE.Group();
  private readonly particles: THREE.Points;
  private frame = 0;
  private running = false;
  private pointerX = 0;
  private pointerY = 0;
  private lastTime = 0;
  private readonly onError: (error: Error) => void;

  constructor({ canvas, pixelRatio, onError }: HeroSceneOptions) {
    this.canvas = canvas;
    this.onError = onError;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: pixelRatio > 1,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setClearColor(0x071329, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.position.set(8.8, 6.2, 11.8);
    this.camera.lookAt(0, 1, 0);
    this.scene.add(this.world);

    const ambient = new THREE.HemisphereLight(0xbce8ff, 0x08152c, 2.1);
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(5, 8, 7);
    const teal = new THREE.PointLight(0x2dd4bf, 18, 16);
    teal.position.set(-4, 2, 2);
    this.scene.add(ambient, key, teal);

    const floor = new THREE.GridHelper(16, 20, 0x2e78d5, 0x173c67);
    floor.position.y = -1.45;
    floor.material.transparent = true;
    floor.material.opacity = 0.32;
    this.world.add(floor);

    const blue = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.35, roughness: 0.35 });
    const tealMaterial = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, metalness: 0.25, roughness: 0.3 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.2, roughness: 0.35 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x87cefa,
      transparent: true,
      opacity: 0.18,
      roughness: 0.18,
      metalness: 0.1,
      transmission: 0.1,
      side: THREE.DoubleSide,
    });

    [-4.3, -3.25, -2.2, -1.15].forEach((x, index) => {
      const height = [2.2, 3.2, 1.8, 2.7][index];
      const candle = new THREE.Mesh(new THREE.BoxGeometry(0.55, height, 0.55), index === 2 ? orange : tealMaterial);
      candle.position.set(x, -1.45 + height / 2, 0.2 + (index % 2) * 0.25);
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, height + 1.1, 8), blue);
      wick.position.copy(candle.position);
      this.world.add(wick, candle);
    });

    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.75, 0.12), glass);
    panel.position.set(1.6, 1.15, -1.8);
    panel.rotation.set(-0.08, -0.2, -0.03);
    this.world.add(panel);
    for (let index = 0; index < 4; index += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5 + index * 0.28, 0.18), index === 3 ? orange : blue);
      bar.position.set(0.1 + index * 0.75, 0.1 + index * 0.14, -1.65);
      this.world.add(bar);
    }

    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.55, 2),
      new THREE.MeshPhysicalMaterial({ color: 0x1769c2, wireframe: true, transparent: true, opacity: 0.8 }),
    );
    sphere.position.set(3.4, 2.25, 0.9);
    this.orbit.add(sphere);
    [2.05, 2.45].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025, 8, 72),
        new THREE.MeshBasicMaterial({ color: index ? 0xf59e0b : 0x2dd4bf, transparent: true, opacity: 0.7 }),
      );
      ring.rotation.set(Math.PI / 2.6, index * 0.4, 0);
      this.orbit.add(ring);
    });
    this.world.add(this.orbit);

    const vault = new THREE.Group();
    const vaultBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.05, 0.8), blue);
    const vaultRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 12, 48), orange);
    vaultRing.position.z = 0.48;
    vault.add(vaultBody, vaultRing);
    vault.position.set(-0.2, 0.05, 2.25);
    vault.rotation.y = 0.35;
    this.world.add(vault);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, -0.4, 1.7),
      new THREE.Vector3(-2.3, 1.2, 1.3),
      new THREE.Vector3(0.2, 0.1, 1),
      new THREE.Vector3(2.1, 2.1, 0.2),
      new THREE.Vector3(4.2, 1.1, -0.5),
    ]);
    const path = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.035, 6, false),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
    );
    this.world.add(path);

    const pointPositions = new Float32Array(54 * 3);
    for (let index = 0; index < pointPositions.length; index += 3) {
      const seed = index / 3;
      pointPositions[index] = Math.sin(seed * 12.73) * 5.5;
      pointPositions[index + 1] = (Math.cos(seed * 7.91) + 1) * 2.1 - 0.8;
      pointPositions[index + 2] = Math.sin(seed * 5.37) * 3.2;
    }
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    this.particles = new THREE.Points(
      pointGeometry,
      new THREE.PointsMaterial({ color: 0xb6f3ff, size: 0.065, transparent: true, opacity: 0.72 }),
    );
    this.world.add(this.particles);
    this.resize();
    this.render(0);
  }

  setPointer(clientX: number, clientY: number) {
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    this.pointerX = ((clientX - bounds.left) / bounds.width - 0.5) * 2;
    this.pointerY = ((clientY - bounds.top) / bounds.height - 0.5) * 2;
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setRunning(running: boolean) {
    if (this.running === running) return;
    this.running = running;
    if (running) {
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.animate);
    } else {
      cancelAnimationFrame(this.frame);
    }
  }

  private readonly animate = (time: number) => {
    if (!this.running) return;
    try {
      const delta = Math.min(32, time - this.lastTime);
      this.lastTime = time;
      this.orbit.rotation.y += delta * 0.00018;
      this.particles.rotation.y -= delta * 0.000035;
      this.world.rotation.y += (this.pointerX * 0.025 - this.world.rotation.y) * 0.025;
      this.world.rotation.x += (-this.pointerY * 0.012 - this.world.rotation.x) * 0.025;
      this.render(time);
      this.frame = requestAnimationFrame(this.animate);
    } catch (error) {
      this.setRunning(false);
      this.onError(error instanceof Error ? error : new Error('The decorative 3D scene stopped unexpectedly.'));
    }
  };

  private render(time: number) {
    this.orbit.position.y = Math.sin(time * 0.00045) * 0.08;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.setRunning(false);
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      materials.forEach((material) => material.dispose());
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
