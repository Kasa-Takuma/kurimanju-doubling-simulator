import { clamp } from './math';

const LOG10_2 = Math.log10(2);

export function formatPopulation(generation: number): string {
  const safeGeneration = Math.max(0, Math.floor(Number.isFinite(generation) ? generation : Number.MAX_VALUE));
  if (safeGeneration <= 1023) {
    return (1n << BigInt(safeGeneration)).toLocaleString('ja-JP');
  }

  const logarithm = Math.min(Number.MAX_VALUE, safeGeneration * LOG10_2);
  const exponent = Math.floor(logarithm);
  const mantissa = 10 ** (logarithm - exponent);
  return `${mantissa.toFixed(3)} × 10^${exponent.toLocaleString('ja-JP')}`;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : Number.MAX_SAFE_INTEGER));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  const clock = [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
  return days > 0 ? `${days}日 ${clock}` : clock;
}

export function formatCountdown(seconds: number): string {
  const safeSeconds = clamp(Math.ceil(Number.isFinite(seconds) ? seconds : 0), 0, 300);
  return formatDuration(safeSeconds);
}

export function formatCount(count: number): string {
  return Math.max(0, Math.floor(count)).toLocaleString('ja-JP');
}
