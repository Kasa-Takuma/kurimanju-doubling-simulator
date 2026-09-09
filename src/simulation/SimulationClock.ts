import { clamp } from '../utils/math';

export const DOUBLING_INTERVAL_SECONDS = 300;

export interface SimulationClockSnapshot {
  elapsedSeconds: number;
  timeScale: number;
  paused: boolean;
  generation: number;
  secondsUntilDoubling: number;
}

export class SimulationClock {
  private elapsedSeconds = 0;
  private timeScale = 1;
  private paused = false;

  update(realDeltaSeconds: number): number {
    if (this.paused) {
      return 0;
    }

    const boundedDelta = clamp(realDeltaSeconds, 0, 0.25);
    const simulatedDelta = boundedDelta * this.timeScale;
    const maximum = Number.MAX_VALUE / 2;
    const next = this.elapsedSeconds + simulatedDelta;
    const safeNext = Number.isFinite(next) ? next : maximum;
    const actualDelta = safeNext - this.elapsedSeconds;
    this.elapsedSeconds = Math.min(maximum, safeNext);
    return actualDelta;
  }

  reset(): void {
    this.elapsedSeconds = 0;
    this.paused = false;
  }

  setTimeScale(timeScale: number): void {
    if (!Number.isFinite(timeScale) || timeScale <= 0) {
      return;
    }
    this.timeScale = timeScale;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  togglePaused(): void {
    this.paused = !this.paused;
  }

  getSnapshot(): SimulationClockSnapshot {
    const remainder = this.elapsedSeconds % DOUBLING_INTERVAL_SECONDS;
    return {
      elapsedSeconds: this.elapsedSeconds,
      timeScale: this.timeScale,
      paused: this.paused,
      generation: Math.floor(this.elapsedSeconds / DOUBLING_INTERVAL_SECONDS),
      secondsUntilDoubling: remainder === 0 ? DOUBLING_INTERVAL_SECONDS : DOUBLING_INTERVAL_SECONDS - remainder,
    };
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get scale(): number {
    return this.timeScale;
  }

  get elapsed(): number {
    return this.elapsedSeconds;
  }
}
