// Confidence intervals for the eval reports. The sets are small (a few hundred messages, a few dozen
// chats), so every rate is printed with the range it could plausibly be in.

/** Wilson score interval for k successes out of n, 95% by default. [0, 0] when n is 0. */
export function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (!n) return [0, 0];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const mid = (p + (z * z) / (2 * n)) / d;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}

/** Seeded random numbers (mulberry32), so a rerun on the same predictions prints the same interval. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Percentile bootstrap: resample the items with replacement `reps` times, recompute the statistic,
 * and return the middle 95%. For statistics like F1 that have no simple closed-form interval.
 */
export function bootstrap<T>(items: T[], stat: (sample: T[]) => number, reps = 2000, seed = 26): [number, number] {
  if (!items.length) return [0, 0];
  const rand = rng(seed);
  const vals: number[] = [];
  for (let r = 0; r < reps; r++) {
    const s = Array.from({ length: items.length }, () => items[Math.floor(rand() * items.length)]!);
    vals.push(stat(s));
  }
  vals.sort((a, b) => a - b);
  return [vals[Math.floor(reps * 0.025)]!, vals[Math.ceil(reps * 0.975) - 1]!];
}

/** "84% (78–89)": a rate with its 95% interval, in whole percent. */
export function pctCI(k: number, n: number): string {
  if (!n) return "–";
  const [lo, hi] = wilson(k, n);
  return `${Math.round((k / n) * 100)}% (${Math.round(lo * 100)}–${Math.round(hi * 100)})`;
}
