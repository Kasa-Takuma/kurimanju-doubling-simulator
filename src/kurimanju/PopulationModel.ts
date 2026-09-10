import { formatPopulation } from '../utils/formatting';

export type RepresentationStage = 'A' | 'B' | 'C';
export const MAX_VISIBLE_INSTANCES = 60000;

export interface PopulationSnapshot {
  generation: number;
  display: string;
  stage: RepresentationStage;
  estimatedVisibleCount: number;
  exactNumericCount: number | null;
}

export function generationFromElapsed(elapsedSeconds: number): number {
  return Math.max(0, Math.floor(Math.max(0, elapsedSeconds) / 300));
}

export function exactPopulationNumber(generation: number): number | null {
  if (!Number.isFinite(generation) || generation < 0 || generation > 52) {
    return null;
  }
  return 2 ** Math.floor(generation);
}

export function representationStage(generation: number): RepresentationStage {
  if (generation <= 10) {
    return 'A';
  }
  if (generation < 22) {
    return 'B';
  }
  return 'C';
}

export function estimatedVisibleCount(generation: number): number {
  const safeGeneration = Math.max(0, Math.floor(Number.isFinite(generation) ? generation : 0));
  if (safeGeneration <= 10) {
    return 2 ** safeGeneration;
  }
  if (safeGeneration < 22) {
    return Math.min(24000, 2 ** safeGeneration);
  }
  return Math.min(MAX_VISIBLE_INSTANCES, 24000 + (safeGeneration - 22) * 1200);
}

export function populationSnapshot(generation: number): PopulationSnapshot {
  const safeGeneration = Math.max(0, Math.floor(Number.isFinite(generation) ? generation : 0));
  return {
    generation: safeGeneration,
    display: formatPopulation(safeGeneration),
    stage: representationStage(safeGeneration),
    estimatedVisibleCount: estimatedVisibleCount(safeGeneration),
    exactNumericCount: exactPopulationNumber(safeGeneration),
  };
}
