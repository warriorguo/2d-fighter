/**
 * Drop system: handles drop pickup attraction and lifetime.
 * (Drops themselves are created by the collision system when enemies die.)
 */

import type { World } from '../ecs/types.js';
import { toFixed, toFloat } from '../math/fixed.js';

const ATTRACT_DISTANCE = 100; // pixels
const ATTRACT_SPEED = toFixed(3);

export function dropSystem(world: World): void {
  // Drops gently attracted to nearest player when close
  for (const [entity, drop] of world.dropTag) {
    const pos = world.position.get(entity);
    const vel = world.velocity.get(entity);
    if (!pos || !vel) continue;

    // Find nearest player (use float to avoid overflow)
    let nearestDist = Infinity;
    let nearestDx = 0;
    let nearestDy = 0;

    for (const [pEntity] of world.playerTag) {
      const pPos = world.position.get(pEntity);
      if (!pPos) continue;
      const dx = toFloat(pPos.x - pos.x);
      const dy = toFloat(pPos.y - pos.y);
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestDx = dx;
        nearestDy = dy;
      }
    }

    // If close enough, attract toward player
    if (nearestDist < ATTRACT_DISTANCE * ATTRACT_DISTANCE) {
      vel.vx = nearestDx > 0 ? ATTRACT_SPEED : nearestDx < 0 ? -ATTRACT_SPEED : 0;
      vel.vy = nearestDy > 0 ? ATTRACT_SPEED : nearestDy < 0 ? -ATTRACT_SPEED : 0;
    } else {
      // Gentle downward drift
      vel.vx = 0;
      vel.vy = toFixed(0.5);
    }
  }
}
