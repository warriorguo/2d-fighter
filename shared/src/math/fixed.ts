/**
 * Q16.16 fixed-point arithmetic.
 * All simulation math uses these to guarantee determinism across JS runtimes.
 */

export type Fixed = number; // Q16.16 integer

export const FP_SHIFT = 16;
export const FP_ONE = 1 << FP_SHIFT; // 65536
export const FP_HALF = FP_ONE >> 1;  // 32768

export const toFixed = (n: number): Fixed => (n * FP_ONE) | 0;
export const toFloat = (n: Fixed): number => n / FP_ONE;

export const fpAdd = (a: Fixed, b: Fixed): Fixed => (a + b) | 0;
export const fpSub = (a: Fixed, b: Fixed): Fixed => (a - b) | 0;
export const fpMul = (a: Fixed, b: Fixed): Fixed => ((a * (b >> 8)) >> 8) | 0;
export const fpDiv = (a: Fixed, b: Fixed): Fixed => (((a << 8) / b) << 8) | 0;

export const fpNeg = (a: Fixed): Fixed => (-a) | 0;
export const fpAbs = (a: Fixed): Fixed => (a < 0 ? -a : a) | 0;

export const fpMin = (a: Fixed, b: Fixed): Fixed => a < b ? a : b;
export const fpMax = (a: Fixed, b: Fixed): Fixed => a > b ? a : b;
export const fpClamp = (v: Fixed, min: Fixed, max: Fixed): Fixed =>
  v < min ? min : v > max ? max : v;

/** Integer square root via Newton's method, returns Fixed */
export function fpSqrt(a: Fixed): Fixed {
  if (a <= 0) return 0;
  // sqrt in fixed point: sqrt(a * FP_ONE) gives us the right scale
  let x = a;
  let y = ((x + 1) >> 1) | 0;
  while (y < x) {
    x = y;
    y = ((x + ((((a << FP_SHIFT) / x) | 0)) >> 1)) | 0;
  }
  return x;
}

/** Distance squared between two points — uses float to avoid fpMul overflow */
export const fpDistSq = (dx: Fixed, dy: Fixed): number => {
  const fdx = dx / FP_ONE;
  const fdy = dy / FP_ONE;
  return fdx * fdx + fdy * fdy;
};
