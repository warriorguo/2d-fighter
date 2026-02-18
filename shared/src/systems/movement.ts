/**
 * Movement system: applies velocity to position, handles player input movement.
 */

import type { World } from '../ecs/types.js';
import { fpAdd, fpClamp, toFixed, toFloat } from '../math/fixed.js';
import {
  GAME_WIDTH_FP, GAME_HEIGHT_FP,
  PLAYER_SPEED, PLAYER_SLOW_SPEED,
} from '../constants.js';
import type { PlayerInput } from '../input.js';
import type { GameSimulation } from '../simulation.js';
import { debugLog } from '../debug.js';

export function createMovementSystem(sim: GameSimulation) {
  return function movementSystem(world: World): void {
    // Handle player input → velocity
    for (const [entity, tag] of world.playerTag) {
      const vel = world.velocity.get(entity);
      if (!vel) continue;

      const input: PlayerInput = sim.inputs[tag.playerId] || sim.inputs[0];
      const speed = input.slow ? PLAYER_SLOW_SPEED : PLAYER_SPEED;

      let vx = 0;
      let vy = 0;
      if (input.left) vx = fpAdd(vx, -speed);
      if (input.right) vx = fpAdd(vx, speed);
      if (input.up) vy = fpAdd(vy, -speed);
      if (input.down) vy = fpAdd(vy, speed);

      vel.vx = vx;
      vel.vy = vy;
    }

    // Apply velocity to all entities with position + velocity
    for (const [entity, pos] of world.position) {
      const vel = world.velocity.get(entity);
      if (!vel) continue;

      pos.x = fpAdd(pos.x, vel.vx);
      pos.y = fpAdd(pos.y, vel.vy);

      // Clamp players to screen bounds
      if (world.playerTag.has(entity)) {
        const margin = toFixed(16);
        pos.x = fpClamp(pos.x, margin, fpAdd(GAME_WIDTH_FP, -margin));
        pos.y = fpClamp(pos.y, margin, fpAdd(GAME_HEIGHT_FP, -margin));

        // Debug: log player position every 30 ticks
        if (debugLog.enabled && world.tick % 30 === 0) {
          const tag = world.playerTag.get(entity)!;
          debugLog.log('MOVE', `P${tag.playerId + 1} pos=(${toFloat(pos.x).toFixed(1)}, ${toFloat(pos.y).toFixed(1)})`);
        }
      }
    }
  };
}
