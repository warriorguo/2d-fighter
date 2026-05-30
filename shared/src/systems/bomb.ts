/**
 * Bomb system: rising-edge bomb input spawns a green projectile that
 * detonates after a fuse, destroying enemy bullets and damaging enemies.
 */

import type { World } from '../ecs/types.js';
import { CollisionLayer, SpriteType } from '../ecs/types.js';
import { toFixed, fpAdd } from '../math/fixed.js';
import { destroyEntity } from '../ecs/world.js';
import { createBomb, createBombExplosion, createExplosion } from '../factory.js';
import type { GameSimulation } from '../simulation.js';
import { debugLog } from '../debug.js';

export function createBombSystem(sim: GameSimulation) {
  return function bombSystem(world: World): void {
    // 1. Handle player input — spawn bombs on rising edge
    for (const [entity, tag] of world.playerTag) {
      const hp = world.health.get(entity);
      if (hp && hp.current <= 0) {
        tag.lastBombPressed = false;
        continue;
      }
      const pos = world.position.get(entity);
      if (!pos) continue;

      const input = sim.inputs[tag.playerId] || sim.inputs[0];
      const pressed = !!input.bomb;

      if (pressed && !tag.lastBombPressed && tag.bombs > 0) {
        tag.bombs--;
        createBomb(world, pos.x, fpAdd(pos.y, toFixed(-20)));
        debugLog.log('BOMB', `P${tag.playerId + 1} launched bomb (${tag.bombs} left)`);
      }
      tag.lastBombPressed = pressed;
    }

    // 2. Tick bomb fuses and detonate
    for (const [entity, sprite] of world.sprite) {
      if (sprite.type !== SpriteType.Bomb) continue;
      sprite.frame--;

      const pos = world.position.get(entity);
      // Detonate when fuse expires or bomb leaves top of screen
      const offTop = pos && pos.y < toFixed(20);
      if (sprite.frame <= 0 || offTop) {
        if (pos) {
          detonate(world, pos.x, pos.y);
        }
        destroyEntity(world, entity);
      }
    }
  };
}

function detonate(world: World, x: number, y: number): void {
  createBombExplosion(world, x, y, 240);

  // Destroy every enemy bullet on screen
  for (const [entity, col] of world.collider) {
    if (col.layer === CollisionLayer.EnemyBullet) {
      destroyEntity(world, entity);
    }
  }

  // Kill every non-boss enemy; bosses lose 1/3 of phase max HP
  let killed = 0;
  for (const [entity, hp] of world.health) {
    if (world.playerTag.has(entity)) continue;
    const col = world.collider.get(entity);
    if (!col || col.layer !== CollisionLayer.Enemy) continue;

    if (world.bossTag.has(entity)) {
      hp.current -= Math.ceil(hp.max / 3);
      continue;
    }

    const ePos = world.position.get(entity);
    if (ePos) createExplosion(world, ePos.x, ePos.y, 32);
    hp.current = 0;
    destroyEntity(world, entity);
    killed++;
  }

  if (killed > 0) {
    for (const [, tag] of world.playerTag) {
      tag.score += killed * 100 * tag.scoreMultiplier;
    }
  }

  debugLog.log('BOMB', `Detonated at (${(x >> 16)}, ${(y >> 16)}) — killed ${killed}`);
}
