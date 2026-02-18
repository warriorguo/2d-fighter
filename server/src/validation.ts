/**
 * Basic validation for network messages.
 */

export function isValidRoomCode(code: unknown): code is string {
  return typeof code === 'string' && /^[A-Z0-9]{4}$/.test(code);
}

export function isValidTick(tick: unknown): tick is number {
  return typeof tick === 'number' && Number.isInteger(tick) && tick >= 0 && tick < 1_000_000;
}

export function isValidInputBits(bits: unknown): bits is number {
  return typeof bits === 'number' && Number.isInteger(bits) && bits >= 0 && bits < 128;
}

export function isValidSeed(seed: unknown): seed is number {
  return typeof seed === 'number' && Number.isInteger(seed);
}
