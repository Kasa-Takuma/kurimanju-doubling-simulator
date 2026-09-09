import { clamp } from '../utils/math';

export const QUALITY_STEPS = [1, 0.9, 0.8, 0.7] as const;

export class QualityController {
  private renderScale = 1;
  private elapsed = 0;
  private accumulatedFrameTime = 0;
  private frameCount = 0;
  private lowPerformanceSeconds = 0;
  private healthySeconds = 0;

  update(frameTimeSeconds: number, apply: (scale: number) => void): void {
    this.elapsed += clamp(frameTimeSeconds, 0, 0.5);
    this.accumulatedFrameTime += frameTimeSeconds;
    this.frameCount += 1;
    if (this.elapsed < 2 || this.frameCount === 0) {
      return;
    }

    const averageFrameTime = this.accumulatedFrameTime / this.frameCount;
    const averageFps = averageFrameTime > 0 ? 1 / averageFrameTime : 60;
    if (averageFps < 22) {
      this.lowPerformanceSeconds += this.elapsed;
      this.healthySeconds = 0;
    } else if (averageFps > 52) {
      this.healthySeconds += this.elapsed;
      this.lowPerformanceSeconds = 0;
    } else {
      this.lowPerformanceSeconds = 0;
      this.healthySeconds = 0;
    }

    if (this.lowPerformanceSeconds >= 3) {
      this.stepDown(apply);
      this.lowPerformanceSeconds = 0;
    } else if (this.healthySeconds >= 8) {
      this.stepUp(apply);
      this.healthySeconds = 0;
    }

    this.elapsed = 0;
    this.accumulatedFrameTime = 0;
    this.frameCount = 0;
  }

  private stepDown(apply: (scale: number) => void): void {
    const index = QUALITY_STEPS.indexOf(this.renderScale as (typeof QUALITY_STEPS)[number]);
    const next = QUALITY_STEPS[Math.min(QUALITY_STEPS.length - 1, index + 1)];
    if (next !== this.renderScale) {
      this.renderScale = next;
      apply(next);
    }
  }

  private stepUp(apply: (scale: number) => void): void {
    const index = QUALITY_STEPS.indexOf(this.renderScale as (typeof QUALITY_STEPS)[number]);
    const next = QUALITY_STEPS[Math.max(0, index - 1)];
    if (next !== this.renderScale) {
      this.renderScale = next;
      apply(next);
    }
  }

  get scale(): number {
    return this.renderScale;
  }
}
