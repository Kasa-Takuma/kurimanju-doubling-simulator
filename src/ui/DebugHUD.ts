import { RendererStats } from '../renderer/Renderer';
import { KurimanjuSystemStats } from '../kurimanju/KurimanjuSystem';

export class DebugHUD {
  readonly element = document.createElement('aside');
  private readonly values = new Map<string, HTMLElement>();

  constructor() {
    this.element.className = 'debug-hud glass-panel';
    this.element.hidden = true;
    const labels = [
      ['fps', 'FPS'],
      ['frameTimeMs', 'frame time'],
      ['renderScale', 'render scale'],
      ['drawCalls', 'draw calls'],
      ['visibleInstanceCount', 'visible instances'],
      ['lod0', 'LOD0'],
      ['lod1', 'LOD1'],
      ['lod2', 'LOD2'],
      ['lod3', 'LOD3'],
      ['rigidBodyCount', 'Rapier rigid bodies'],
      ['activeBodyCount', 'active bodies'],
      ['sleepingBodyCount', 'sleeping bodies'],
      ['generation', 'generation'],
      ['stage', 'representation stage'],
      ['assetStatus', 'asset status'],
    ];
    const title = document.createElement('h2');
    title.textContent = 'Debug';
    this.element.append(title);
    for (const [key, label] of labels) {
      const row = document.createElement('div');
      row.className = 'debug-row';
      row.innerHTML = `<span>${label}</span><strong></strong>`;
      const value = row.querySelector('strong');
      if (value) {
        this.values.set(key, value);
      }
      this.element.append(row);
    }
  }

  mount(root: HTMLElement): void {
    root.append(this.element);
  }

  toggle(): void {
    this.element.hidden = !this.element.hidden;
  }

  setVisible(visible: boolean): void {
    this.element.hidden = !visible;
  }

  update(renderer: RendererStats, system: KurimanjuSystemStats): void {
    this.set('fps', renderer.fps.toFixed(1));
    this.set('frameTimeMs', `${renderer.frameTimeMs.toFixed(1)} ms`);
    this.set('renderScale', renderer.renderScale.toFixed(2));
    this.set('drawCalls', String(renderer.drawCalls));
    this.set('visibleInstanceCount', system.visibleInstanceCount.toLocaleString('ja-JP'));
    this.set('lod0', String(system.lodCounts[0]));
    this.set('lod1', String(system.lodCounts[1]));
    this.set('lod2', String(system.lodCounts[2]));
    this.set('lod3', String(system.lodCounts[3]));
    this.set('rigidBodyCount', String(system.rigidBodyCount));
    this.set('activeBodyCount', String(system.activeBodyCount));
    this.set('sleepingBodyCount', String(system.sleepingBodyCount));
    this.set('generation', String(system.generation));
    this.set('stage', system.stage);
    this.set('assetStatus', system.assetStatus);
  }

  private set(key: string, value: string): void {
    const element = this.values.get(key);
    if (element) {
      element.textContent = value;
    }
  }
}
