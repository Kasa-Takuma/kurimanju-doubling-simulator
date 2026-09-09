/** A small deterministic generator used for all world-visible randomness. */
export class DeterministicRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  signed(amount: number): number {
    return (this.next() * 2 - 1) * amount;
  }

  integer(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}

export function hashSeed(...values: number[]): number {
  let hash = 2166136261;
  for (const value of values) {
    const integer = Math.trunc(value) | 0;
    hash ^= integer;
    hash = Math.imul(hash, 16777619);
    hash ^= integer >>> 16;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function randomFor(...values: number[]): DeterministicRandom {
  return new DeterministicRandom(hashSeed(...values));
}
