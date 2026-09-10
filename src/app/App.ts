import { Vector3 } from 'three';
import { ObserverCamera } from '../camera/ObserverCamera';
import { KurimanjuAssets } from '../kurimanju/KurimanjuAssets';
import { KurimanjuPhysics } from '../kurimanju/KurimanjuPhysics';
import { KurimanjuSystem } from '../kurimanju/KurimanjuSystem';
import { Renderer } from '../renderer/Renderer';
import { Simulation } from '../simulation/Simulation';
import { DebugHUD } from '../ui/DebugHUD';
import { HUD } from '../ui/HUD';
import { World } from '../world/World';

export class App {
  private readonly renderer = new Renderer();
  private readonly simulation = new Simulation();
  private readonly physics = new KurimanjuPhysics();
  private readonly camera = new ObserverCamera();
  private readonly debugHUD = new DebugHUD();
  private readonly root: HTMLElement;
  private readonly loadingScreen: HTMLElement | null;
  private readonly loadingMessage: HTMLElement | null;
  private hud: HUD | null = null;
  private world: World | null = null;
  private kurimanju: KurimanjuSystem | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private lastFrameTime = performance.now();
  private animationFrame = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.loadingScreen = root.querySelector('#loading-screen');
    this.loadingMessage = root.querySelector('#loading-message');
  }

  async start(): Promise<void> {
    try {
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-label', '栗饅頭倍増シミュレータの3D表示');
      this.root.append(this.canvas);
      this.setLoadingMessage('WebGPUレンダラーを初期化中');
      await this.renderer.init(this.canvas);

      this.setLoadingMessage('物理シミュレーションを初期化中');
      await this.physics.init();

      this.setLoadingMessage('栗饅頭アセットを確認中');
      const assets = await new KurimanjuAssets().load();

      this.setLoadingMessage('フィールドと観察カメラを構築中');
      this.world = new World();
      await this.world.ready;
      this.kurimanju = new KurimanjuSystem(this.world.scene, assets, this.physics);
      this.hud = new HUD({
        onTogglePause: () => this.simulation.clock.togglePaused(),
        onResetSimulation: () => this.resetSimulation(),
        onResetCamera: () => this.camera.reset(),
        onTimeScaleChange: (scale) => this.simulation.clock.setTimeScale(scale),
      });
      this.hud.mount(this.root);
      this.debugHUD.mount(this.root);
      this.camera.attach(this.canvas);
      this.camera.resize(window.innerWidth, window.innerHeight);
      this.renderer.configurePostProcessing(this.world.scene, this.camera.camera);

      this.simulation.subscribe((snapshot) => {
        this.kurimanju?.applySimulation(snapshot);
      });
      const initialSnapshot = this.simulation.clock.getSnapshot();
      this.kurimanju.applySimulation(initialSnapshot);
      this.loadingScreen?.setAttribute('hidden', '');
      this.installEvents();
      this.lastFrameTime = performance.now();
      this.animationFrame = requestAnimationFrame(this.frame);
    } catch (error) {
      this.showFatalError(error instanceof Error ? error.message : '初期化に失敗しました');
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.camera.detach();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private readonly frame = (timestamp: number): void => {
    const deltaSeconds = Math.min(0.25, Math.max(0, (timestamp - this.lastFrameTime) / 1000));
    this.lastFrameTime = timestamp;
    const snapshot = this.simulation.update(deltaSeconds);
    this.camera.update();
    this.world?.update(this.camera.globalPosition);
    this.kurimanju?.update(this.camera.globalPosition);
    if (this.world && this.kurimanju && this.hud) {
      const stats = this.kurimanju.getStats();
      this.renderer.render(this.world.scene, this.camera.camera);
      this.renderer.recordFrame(deltaSeconds);
      this.hud.update(snapshot, stats);
      this.debugHUD.update(this.renderer.getStats(), stats);
    }
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private resetSimulation(): void {
    this.kurimanju?.reset();
    const snapshot = this.simulation.reset();
    if (this.kurimanju) {
      this.kurimanju.applySimulation(snapshot);
    }
  }

  private installEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private readonly onResize = (): void => {
    this.camera.resize(window.innerWidth, window.innerHeight);
    this.renderer.resize();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() === 'd') {
      this.debugHUD.toggle();
    }
  };

  private setLoadingMessage(message: string): void {
    if (this.loadingMessage) {
      this.loadingMessage.textContent = message;
    }
  }

  private showFatalError(message: string): void {
    this.loadingScreen?.setAttribute('hidden', '');
    const screen = document.createElement('div');
    screen.className = 'fatal-error-screen';
    screen.innerHTML = `
      <div class="fatal-error-card glass-panel">
        <p class="eyebrow">STARTUP ERROR</p>
        <h1>起動できませんでした</h1>
        <p>${this.escapeHTML(message)}</p>
        <p>開発用placeholderが必要な場合でも、WebGPUとJavaScriptが有効であることを確認してください。</p>
      </div>
    `;
    this.root.append(screen);
  }

  private escapeHTML(value: string): string {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }
}

export function showCompatibilityScreen(root: HTMLElement): void {
  root.querySelector('#loading-screen')?.setAttribute('hidden', '');
  const screen = document.createElement('div');
  screen.className = 'compatibility-screen';
  screen.innerHTML = `
    <div class="compatibility-card glass-panel">
      <p class="eyebrow">WEBGPU REQUIRED</p>
      <h1>WebGPUが必要です</h1>
      <p>このシミュレータは、遠距離の大量表示にWebGPUを使用します。WebGL版への切り替えは行いません。</p>
      <p>Safari 26以降、またはWebGPUに対応したChrome系ブラウザで開いてください。</p>
    </div>
  `;
  root.append(screen);
}
