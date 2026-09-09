import { describe, expect, it } from 'vitest';
import { SimulationClock } from '../src/simulation/SimulationClock';

describe('SimulationClock', () => {
  it('doubles every 300 simulation seconds and keeps elapsed time on scale changes', () => {
    const clock = new SimulationClock();
    clock.update(0.25);
    expect(clock.getSnapshot().elapsedSeconds).toBe(0.25);
    clock.setTimeScale(60);
    for (let index = 0; index < 20; index += 1) {
      clock.update(0.25);
    }
    expect(clock.getSnapshot().generation).toBe(1);
    expect(clock.getSnapshot().elapsedSeconds).toBe(300.25);
  });

  it('does not advance while paused', () => {
    const clock = new SimulationClock();
    clock.setPaused(true);
    expect(clock.update(10)).toBe(0);
    expect(clock.getSnapshot().elapsedSeconds).toBe(0);
  });
});
