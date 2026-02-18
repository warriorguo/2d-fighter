/**
 * Lockstep synchronization manager.
 * Handles input buffering, tick synchronization, and stall detection.
 */

import type { PlayerInput } from 'shared/input.js';
import { encodeInput, decodeInput, emptyInput } from 'shared/input.js';
import { INPUT_DELAY_TICKS } from 'shared/constants.js';
import type { NetworkClient } from './client.js';

export class LockstepManager {
  private client: NetworkClient;
  private localPlayerId: number;
  private inputBuffer: Map<number, PlayerInput[]> = new Map(); // tick → [p0input, p1input]
  private sentTicks: Set<number> = new Set();

  constructor(client: NetworkClient, localPlayerId: number) {
    this.client = client;
    this.localPlayerId = localPlayerId;

    // Listen for confirmed inputs from server
    client.onTickInputs = (tick: number, inputs: number[]) => {
      const decoded: PlayerInput[] = inputs.map(bits => decodeInput(bits));
      this.inputBuffer.set(tick, decoded);
    };

    // Pre-send empty inputs for the initial delay window (ticks 0..INPUT_DELAY_TICKS-1)
    // so the server can confirm them immediately when both players connect
    for (let t = 0; t < INPUT_DELAY_TICKS; t++) {
      client.sendInput(t, encodeInput(emptyInput()));
      this.sentTicks.add(t);
    }
  }

  /** Record local input for a tick and send to server */
  setLocalInput(currentTick: number, input: PlayerInput): void {
    const targetTick = currentTick + INPUT_DELAY_TICKS;
    const encoded = encodeInput(input);

    // Only send if we haven't sent this tick yet
    if (!this.sentTicks.has(targetTick)) {
      this.sentTicks.add(targetTick);
      this.client.sendInput(targetTick, encoded);
    }
  }

  /** Get confirmed inputs for a tick, or null if not yet available */
  getInputsForTick(tick: number): PlayerInput[] | null {
    const inputs = this.inputBuffer.get(tick);
    if (!inputs) return null;

    // Clean up old entries
    for (const key of this.inputBuffer.keys()) {
      if (key < tick - 10) this.inputBuffer.delete(key);
    }
    for (const key of this.sentTicks) {
      if (key < tick - 10) this.sentTicks.delete(key);
    }

    return inputs;
  }
}
