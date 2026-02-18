/**
 * Enemy AI system: drives enemy movement patterns.
 */

import type { World, Entity } from '../ecs/types.js';
import { fpMul, fpAdd, fpSub, toFixed, toFloat } from '../math/fixed.js';
import { fpSin, fpCos, ANGLE_FULL } from '../math/trig.js';
import { GAME_WIDTH_FP } from '../constants.js';

export function enemyAISystem(world: World): void {
  for (const [entity, ai] of world.enemyAI) {
    const vel = world.velocity.get(entity);
    const pos = world.position.get(entity);
    if (!vel || !pos) continue;

    ai.timer++;

    switch (ai.type) {
      case 'linear':
        // Move straight down at constant speed
        vel.vx = 0;
        vel.vy = ai.params[0]; // speed stored in params[0]
        break;

      case 'zigzag': {
        // Move down with horizontal sine-wave oscillation
        const speed = ai.params[0];
        const amplitude = ai.params[1] || toFixed(2);
        const freq = ai.params[2] || 32;
        vel.vy = speed;
        const angle = ((ai.timer * (ANGLE_FULL / freq)) | 0) % ANGLE_FULL;
        vel.vx = fpMul(amplitude, fpSin(angle));
        break;
      }

      case 'swoop': {
        // Dive in, pause, then exit to the side
        const speed = ai.params[0];
        if (ai.timer < 60) {
          vel.vy = speed;
          vel.vx = 0;
        } else if (ai.timer < 120) {
          vel.vy = 0;
          vel.vx = 0;
        } else {
          vel.vy = toFixed(-1);
          vel.vx = pos.x > (GAME_WIDTH_FP >> 1) ? speed : -speed;
        }
        break;
      }

      case 'circle': {
        // Move in a circular pattern
        const speed = ai.params[0];
        const radius = ai.params[1] || toFixed(1);
        const angle = ((ai.timer * 16) % ANGLE_FULL);
        vel.vx = fpMul(radius, fpCos(angle));
        vel.vy = fpAdd(fpMul(radius, fpSin(angle)), (speed >> 2));
        break;
      }

      case 'tracking': {
        // Move toward nearest player (slow tracking)
        const speed = ai.params[0];
        let nearestX = GAME_WIDTH_FP >> 1;
        let nearestY = GAME_WIDTH_FP; // bottom of screen
        for (const [, pPos] of filterPlayers(world)) {
          nearestX = pPos.x;
          nearestY = pPos.y;
          break;
        }
        const dx = fpSub(nearestX, pos.x);
        const dy = fpSub(nearestY, pos.y);
        // Simple normalize: just use signs with speed
        const trackSpeed = speed >> 1;
        vel.vx = dx > 0 ? trackSpeed : dx < 0 ? -trackSpeed : 0;
        vel.vy = dy > 0 ? trackSpeed : dy < 0 ? -trackSpeed : 0;
        break;
      }

      case 'boss_sweep': {
        // Horizontal sweeping at top of screen
        const speed = ai.params[0];
        const margin = toFixed(60);
        if (pos.x <= margin) {
          ai.phase = 0; // move right
        } else if (pos.x >= fpSub(GAME_WIDTH_FP, margin)) {
          ai.phase = 1; // move left
        }
        vel.vx = ai.phase === 0 ? speed : -speed;
        vel.vy = 0;
        break;
      }

      default:
        // Fallback: drift down
        vel.vy = toFixed(1);
        break;
    }
  }
}

function* filterPlayers(world: World): Generator<[Entity, { x: number; y: number }]> {
  for (const [entity, tag] of world.playerTag) {
    const pos = world.position.get(entity);
    if (pos) yield [entity, pos];
  }
}
