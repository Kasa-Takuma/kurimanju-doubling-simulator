import { SimulationClockSnapshot } from '../simulation/SimulationClock';
import { formatCountdown, formatDuration, formatPopulation } from '../utils/formatting';
import { KurimanjuSystemStats } from '../kurimanju/KurimanjuSystem';

export interface HUDActions {
  onTogglePause: () => void;
  onResetSimulation: () => void;
  onResetCamera: () => void;
  onTimeScaleChange: (scale: number) => void;
}

export class HUD {
  readonly element = document.createElement('section');
  private populationValue!: HTMLElement;
  private elapsedValue!: HTMLElement;
  private nextValue!: HTMLElement;
  private stageValue!: HTMLElement;
  private pauseButton!: HTMLButtonElement;
  private assetNote!: HTMLElement;
  private timeScaleSelect!: HTMLSelectElement;

  constructor(actions: HUDActions) {
    this.element.className = 'hud glass-panel';
    this.element.setAttribute('aria-label', 'シミュレーション情報');
    this.element.innerHTML = `
      <div class="hud-heading">
        <div>
          <p class="eyebrow">OBSERVATION MODE</p>
          <h1>栗饅頭倍増シミュレータ</h1>
        </div>
        <span class="status-dot" aria-label="稼働中"></span>
      </div>
      <dl class="stats-grid">
        <div><dt>総個数</dt><dd data-role="population"></dd></div>
        <div><dt>経過時間</dt><dd data-role="elapsed"></dd></div>
        <div><dt>次の倍化まで</dt><dd data-role="next"></dd></div>
        <div><dt>表現段階</dt><dd data-role="stage"></dd></div>
      </dl>
      <p class="asset-note" data-role="asset-note"></p>
      <div class="hud-controls">
        <label>時間倍率 <select data-role="time-scale"></select></label>
        <button data-role="pause"></button>
        <button data-role="reset">シミュレーションをリセット</button>
        <button data-role="camera-reset">カメラをリセット</button>
      </div>
    `;

    const population = this.element.querySelector<HTMLElement>('[data-role="population"]');
    const elapsed = this.element.querySelector<HTMLElement>('[data-role="elapsed"]');
    const next = this.element.querySelector<HTMLElement>('[data-role="next"]');
    const stage = this.element.querySelector<HTMLElement>('[data-role="stage"]');
    const assetNote = this.element.querySelector<HTMLElement>('[data-role="asset-note"]');
    const pause = this.element.querySelector<HTMLButtonElement>('[data-role="pause"]');
    const reset = this.element.querySelector<HTMLButtonElement>('[data-role="reset"]');
    const cameraReset = this.element.querySelector<HTMLButtonElement>('[data-role="camera-reset"]');
    const scale = this.element.querySelector<HTMLSelectElement>('[data-role="time-scale"]');
    if (!population || !elapsed || !next || !stage || !assetNote || !pause || !reset || !cameraReset || !scale) {
      throw new Error('HUD要素の初期化に失敗しました');
    }
    for (const value of [1, 10, 60, 300, 1000, 10000]) {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = `×${value.toLocaleString('ja-JP')}`;
      scale.append(option);
    }
    scale.value = '1';
    pause.addEventListener('click', actions.onTogglePause);
    reset.addEventListener('click', actions.onResetSimulation);
    cameraReset.addEventListener('click', actions.onResetCamera);
    scale.addEventListener('change', () => actions.onTimeScaleChange(Number(scale.value)));

    this.populationValue = population;
    this.elapsedValue = elapsed;
    this.nextValue = next;
    this.stageValue = stage;
    this.assetNote = assetNote;
    this.pauseButton = pause;
    this.timeScaleSelect = scale;
  }

  mount(root: HTMLElement): void {
    root.append(this.element);
  }

  update(snapshot: SimulationClockSnapshot, stats: KurimanjuSystemStats): void {
    this.populationValue.textContent = formatPopulation(Math.max(0, stats.generation));
    this.elapsedValue.textContent = formatDuration(snapshot.elapsedSeconds);
    this.nextValue.textContent = formatCountdown(snapshot.secondsUntilDoubling);
    this.stageValue.textContent = `Stage ${stats.stage} / ${stats.visibleInstanceCount.toLocaleString('ja-JP')}表示`;
    this.assetNote.textContent = stats.assetStatus;
    this.assetNote.classList.toggle('warning', stats.assetStatus.includes('未提供'));
    this.pauseButton.textContent = snapshot.paused ? '再開' : '一時停止';
    this.pauseButton.setAttribute('aria-pressed', String(snapshot.paused));
    this.timeScaleSelect.value = String(snapshot.timeScale);
  }

}
