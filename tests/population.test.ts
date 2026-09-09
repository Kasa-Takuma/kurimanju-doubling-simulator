import { describe, expect, it } from 'vitest';
import { exactPopulationNumber, populationSnapshot, representationStage } from '../src/kurimanju/PopulationModel';
import { formatPopulation } from '../src/utils/formatting';

describe('population model', () => {
  it('keeps ordinary generations exact without building an unbounded number', () => {
    expect(exactPopulationNumber(0)).toBe(1);
    expect(exactPopulationNumber(10)).toBe(1024);
    expect(formatPopulation(10)).toBe('1,024');
    expect(exactPopulationNumber(53)).toBeNull();
  });

  it('switches to scientific notation for large generations', () => {
    expect(formatPopulation(1024)).toContain('× 10^');
    expect(formatPopulation(1000000)).not.toContain('Infinity');
    expect(populationSnapshot(22).stage).toBe('C');
  });

  it('uses the three representation stages', () => {
    expect(representationStage(0)).toBe('A');
    expect(representationStage(11)).toBe('B');
    expect(representationStage(22)).toBe('C');
  });
});
