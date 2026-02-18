/**
 * Precomputed sin/cos lookup table for deterministic trigonometry.
 * 4096 entries = ~0.088° resolution.
 * Angles are represented as integers 0..4095 mapping to 0..2π.
 */

import { type Fixed, FP_ONE, toFixed } from './fixed.js';

export const TRIG_TABLE_SIZE = 4096;
export const TRIG_MASK = TRIG_TABLE_SIZE - 1;

/** Full circle in angle units */
export const ANGLE_FULL = TRIG_TABLE_SIZE;
export const ANGLE_HALF = TRIG_TABLE_SIZE >> 1;
export const ANGLE_QUARTER = TRIG_TABLE_SIZE >> 2;

const sinTable: Fixed[] = new Array(TRIG_TABLE_SIZE);
const cosTable: Fixed[] = new Array(TRIG_TABLE_SIZE);

// Precompute at module load time
for (let i = 0; i < TRIG_TABLE_SIZE; i++) {
  const rad = (i / TRIG_TABLE_SIZE) * Math.PI * 2;
  sinTable[i] = toFixed(Math.sin(rad));
  cosTable[i] = toFixed(Math.cos(rad));
}

/** Look up sin for angle (0..4095 = 0..2π). Wraps automatically. */
export const fpSin = (angle: number): Fixed => sinTable[angle & TRIG_MASK];

/** Look up cos for angle (0..4095 = 0..2π). Wraps automatically. */
export const fpCos = (angle: number): Fixed => cosTable[angle & TRIG_MASK];

/** Convert degrees (0..360) to angle units (0..4096) */
export const degToAngle = (deg: number): number => ((deg / 360) * TRIG_TABLE_SIZE) | 0;

/** Approximate atan2 using the LUT. Returns angle in 0..4095. */
export function fpAtan2(y: Fixed, x: Fixed): number {
  if (x === 0 && y === 0) return 0;

  // Use floating point for atan2 but return as angle unit
  const rad = Math.atan2(y, x);
  let angle = ((rad / (Math.PI * 2)) * TRIG_TABLE_SIZE) | 0;
  if (angle < 0) angle += TRIG_TABLE_SIZE;
  return angle & TRIG_MASK;
}
