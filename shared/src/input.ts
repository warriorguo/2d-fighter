/**
 * Player input definition for the simulation.
 * This is what gets sent over the network for lockstep.
 */

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  bomb: boolean;
  slow: boolean;   // hold for focused/slow movement
}

export function emptyInput(): PlayerInput {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    bomb: false,
    slow: false,
  };
}

/** Encode input as a single byte for network efficiency */
export function encodeInput(input: PlayerInput): number {
  let bits = 0;
  if (input.up) bits |= 1;
  if (input.down) bits |= 2;
  if (input.left) bits |= 4;
  if (input.right) bits |= 8;
  if (input.shoot) bits |= 16;
  if (input.bomb) bits |= 32;
  if (input.slow) bits |= 64;
  return bits;
}

export function decodeInput(bits: number): PlayerInput {
  return {
    up: !!(bits & 1),
    down: !!(bits & 2),
    left: !!(bits & 4),
    right: !!(bits & 8),
    shoot: !!(bits & 16),
    bomb: !!(bits & 32),
    slow: !!(bits & 64),
  };
}
