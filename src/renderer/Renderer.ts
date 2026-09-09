import {
  ACESFilmicToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
} from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { QualityController } from './QualityController';
import { PostProcessing } from './PostProcessing';

export interface RendererStats {
  fps: number;
  frameTimeMs: number;
  renderScale: number;
  drawCalls: number;
}

export class Renderer {
  private readonly quality = new QualityController();
  private readonly postProcessing = new PostProcessing();
  private renderer: WebGPURenderer | null = null;
  private lastFrameTime = 1 / 60;
  private smoothedFrameTime = 1 / 60;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (!('gpu' in navigator)) {
      throw new Error('このブラウザはWebGPUに対応していません。Safari 26以降またはWebGPU対応Chromeをご利用ください。');
    }

    const renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    await renderer.init();
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    this.renderer = renderer;
    this.resize();
  }

  resize(): void {
    if (!this.renderer) {
      return;
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) * this.quality.scale;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
  }

  setRenderScale(scale: number): void {
    if (!this.renderer) {
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) * scale;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  render(scene: Scene, camera: PerspectiveCamera): void {
    if (!this.renderer) {
      return;
    }
    this.postProcessing.render(() => this.renderer?.render(scene, camera));
  }

  configurePostProcessing(scene: Scene, camera: PerspectiveCamera): void {
    if (this.renderer) {
      this.postProcessing.configure(this.renderer, scene, camera);
    }
  }

  recordFrame(frameTimeSeconds: number): void {
    this.lastFrameTime = frameTimeSeconds;
    this.smoothedFrameTime += (frameTimeSeconds - this.smoothedFrameTime) * 0.08;
    this.quality.update(frameTimeSeconds, (scale) => this.setRenderScale(scale));
  }

  get domElement(): HTMLCanvasElement | null {
    return this.renderer?.domElement ?? null;
  }

  getStats(): RendererStats {
    const renderer = this.renderer as unknown as { info?: { render?: { calls?: number } } } | null;
    return {
      fps: this.smoothedFrameTime > 0 ? 1 / this.smoothedFrameTime : 0,
      frameTimeMs: this.smoothedFrameTime * 1000,
      renderScale: this.quality.scale,
      drawCalls: renderer?.info?.render?.calls ?? 0,
    };
  }
}

export function isWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}

// Keep WebGL out of the app runtime. This type-only reference prevents accidental
// fallback imports from being added while allowing editor tooling to inspect the API.
export type NoWebGLFallback = import('three').WebGLRenderer;
