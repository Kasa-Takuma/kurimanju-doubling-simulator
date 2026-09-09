import { SimulationClock, SimulationClockSnapshot } from './SimulationClock';

export type SimulationListener = (snapshot: SimulationClockSnapshot, deltaSeconds: number) => void;

export class Simulation {
  readonly clock = new SimulationClock();
  private readonly listeners = new Set<SimulationListener>();
  private previousGeneration = 0;

  update(realDeltaSeconds: number): SimulationClockSnapshot {
    const deltaSeconds = this.clock.update(realDeltaSeconds);
    const snapshot = this.clock.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot, deltaSeconds);
    }
    this.previousGeneration = snapshot.generation;
    return snapshot;
  }

  subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): SimulationClockSnapshot {
    this.clock.reset();
    this.previousGeneration = 0;
    const snapshot = this.clock.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot, 0);
    }
    return snapshot;
  }

  get lastGeneration(): number {
    return this.previousGeneration;
  }
}
