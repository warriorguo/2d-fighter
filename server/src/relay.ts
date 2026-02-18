/**
 * Input relay: collects inputs from both players, broadcasts when complete.
 */

import type { WebSocket } from 'ws';
import type { Room } from './room.js';

export function handleTickInput(
  room: Room,
  ws: WebSocket,
  tick: number,
  inputBits: number,
): void {
  const playerId = room.playerIds.get(ws);
  if (playerId === undefined) return;

  // Store input for this tick
  if (!room.tickInputs.has(tick)) {
    room.tickInputs.set(tick, new Map());
  }
  room.tickInputs.get(tick)!.set(playerId, inputBits);

  // Check if we have inputs from all players
  const tickMap = room.tickInputs.get(tick)!;
  if (tickMap.size >= room.players.length) {
    // Build inputs array ordered by player ID
    const inputs: number[] = [];
    for (let i = 0; i < room.players.length; i++) {
      inputs.push(tickMap.get(i) ?? 0);
    }

    // Broadcast to all players
    const msg = JSON.stringify({
      type: 'tick_inputs',
      tick,
      inputs,
    });

    for (const player of room.players) {
      if (player.readyState === 1) { // WebSocket.OPEN
        player.send(msg);
      }
    }

    // Clean up old ticks
    room.tickInputs.delete(tick);
    for (const key of room.tickInputs.keys()) {
      if (key < tick - 100) {
        room.tickInputs.delete(key);
      }
    }
  }
}
