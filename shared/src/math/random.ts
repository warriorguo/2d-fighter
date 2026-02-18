/**
 * Seeded xorshift128 PRNG for deterministic randomness.
 * Every random value in the simulation must come from this.
 */

export class SeededRNG {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // Initialize state from seed using splitmix32
    this.s0 = this.splitmix32(seed);
    this.s1 = this.splitmix32(this.s0);
    this.s2 = this.splitmix32(this.s1);
    this.s3 = this.splitmix32(this.s2);
  }

  private splitmix32(state: number): number {
    state = (state + 0x9e3779b9) | 0;
    state = Math.imul(state ^ (state >>> 16), 0x85ebca6b);
    state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35);
    return (state ^ (state >>> 16)) >>> 0;
  }

  /** Returns a 32-bit unsigned integer */
  nextU32(): number {
    const t = this.s3;
    let s = this.s0;
    this.s3 = this.s2;
    this.s2 = this.s1;
    this.s1 = s;
    s ^= s << 11;
    s ^= s >>> 8;
    this.s0 = s ^ t ^ (t >>> 19);
    return this.s0 >>> 0;
  }

  /** Returns integer in [0, max) */
  nextInt(max: number): number {
    return (this.nextU32() % max) | 0;
  }

  /** Returns a Fixed in [0, FP_ONE) */
  nextFixed(): number {
    return (this.nextU32() & 0xFFFF); // 0..65535, which is [0, FP_ONE)
  }

  /** Returns a Fixed in [min, max) */
  nextFixedRange(min: number, max: number): number {
    const range = max - min;
    return (min + ((this.nextFixed() * range) >> 16)) | 0;
  }

  /** Clone current state for snapshot/restore */
  getState(): [number, number, number, number] {
    return [this.s0, this.s1, this.s2, this.s3];
  }

  setState(state: [number, number, number, number]): void {
    [this.s0, this.s1, this.s2, this.s3] = state;
  }
}
