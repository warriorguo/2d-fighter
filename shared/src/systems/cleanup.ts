/**
 * Cleanup system: remove off-screen bullets/enemies and expired entities.
 */

import type { World } from '../ecs/types.js';
import { CollisionLayer, SpriteType } from '../ecs/types.js';
import { toFloat } from '../math/fixed.js';
import { destroyEntity } from '../ecs/world.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

const MARGIN = 50;

export function cleanupSystem(world: World): void {
  for (const [entity, pos] of world.position) {
    // Don't clean up players
    if (world.playerTag.has(entity)) continue;

    const x = toFloat(pos.x);
    const y = toFloat(pos.y);

    // Remove if off screen with margin
    if (x < -MARGIN || x > GAME_WIDTH + MARGIN ||
        y < -MARGIN || y > GAME_HEIGHT + MARGIN) {
      destroyEntity(world, entity);
      continue;
    }
  }

  // Expire drops
  for (const [entity, drop] of world.dropTag) {
    drop.lifetime--;
    if (drop.lifetime <= 0) {
      destroyEntity(world, entity);
    }
  }

  // Expire explosions
  for (const [entity, sprite] of world.sprite) {
    if (sprite.type === SpriteType.Explosion) {
      sprite.frame--;
      if (sprite.frame <= 0) {
        destroyEntity(world, entity);
      }
    }
  }
}
