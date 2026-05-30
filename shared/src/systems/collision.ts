/**
 * Collision system: detects circle-circle collisions between different layers.
 */

import type { World, Entity } from '../ecs/types.js';
import { CollisionLayer, DropType, SpriteType } from '../ecs/types.js';
import { toFixed, toFloat } from '../math/fixed.js';
import { destroyEntity } from '../ecs/world.js';
import { createExplosion, createDrop } from '../factory.js';
import { PLAYER_INVULN_TICKS } from '../constants.js';
import type { GameSimulation } from '../simulation.js';
import { debugLog } from '../debug.js';

const EXPLOSIVE_BULLET_RADIUS = 60; // pixels

function applyBulletDamage(world: World, enemy: Entity, damage: number, sim: GameSimulation): void {
  const hp = world.health.get(enemy);
  if (!hp || hp.invulnTicks > 0) return;
  hp.current -= damage;
  if (hp.current > 0) return;
  if (world.bossTag.has(enemy)) return; // boss system handles phase transitions
  const ePos = world.position.get(enemy);
  if (ePos) {
    createExplosion(world, ePos.x, ePos.y, 32);
    if (sim.rng.nextInt(100) < 20) {
      const dropTypes = [DropType.WeaponUpgrade, DropType.Bomb, DropType.ScoreSmall, DropType.ScoreLarge];
      const dt = dropTypes[sim.rng.nextInt(dropTypes.length)];
      createDrop(world, ePos.x, ePos.y, dt);
    }
  }
  for (const [, tag] of world.playerTag) {
    tag.score += 100 * tag.scoreMultiplier;
  }
  destroyEntity(world, enemy);
}

/**
 * Circle overlap using float conversion to avoid Q16.16 overflow.
 * fpMul overflows when squaring distances > ~180px, producing false collisions.
 * Since the result is a boolean, float math is safe for determinism.
 */
function circleOverlap(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number,
): boolean {
  const dx = toFloat(x1 - x2);
  const dy = toFloat(y1 - y2);
  const radSum = toFloat(r1 + r2);
  return dx * dx + dy * dy < radSum * radSum;
}

export function createCollisionSystem(sim: GameSimulation) {
  return function collisionSystem(world: World): void {
    // Collect entities by layer
    const players: Entity[] = [];
    const playerBullets: Entity[] = [];
    const enemies: Entity[] = [];
    const enemyBullets: Entity[] = [];
    const drops: Entity[] = [];

    for (const [entity, col] of world.collider) {
      if (!world.position.has(entity)) continue;
      switch (col.layer) {
        case CollisionLayer.Player: players.push(entity); break;
        case CollisionLayer.PlayerBullet: playerBullets.push(entity); break;
        case CollisionLayer.Enemy: enemies.push(entity); break;
        case CollisionLayer.EnemyBullet: enemyBullets.push(entity); break;
        case CollisionLayer.Drop: drops.push(entity); break;
      }
    }

    // Player bullets vs Enemies
    for (const bullet of playerBullets) {
      const bPos = world.position.get(bullet)!;
      const bCol = world.collider.get(bullet)!;
      const bSprite = world.sprite.get(bullet);
      const isExplosive = bSprite?.type === SpriteType.ExplosivePlayerBullet;
      for (const enemy of enemies) {
        const ePos = world.position.get(enemy)!;
        const eCol = world.collider.get(enemy)!;
        if (!circleOverlap(bPos.x, bPos.y, bCol.radius, ePos.x, ePos.y, eCol.radius)) continue;

        if (isExplosive) {
          createExplosion(world, bPos.x, bPos.y, 64);
          debugLog.log('BOOM', `Explosive bullet at (${toFloat(bPos.x).toFixed(0)}, ${toFloat(bPos.y).toFixed(0)})`);
          const r2 = EXPLOSIVE_BULLET_RADIUS * EXPLOSIVE_BULLET_RADIUS;
          for (const other of enemies) {
            const oPos = world.position.get(other);
            if (!oPos) continue;
            const dx = toFloat(bPos.x - oPos.x);
            const dy = toFloat(bPos.y - oPos.y);
            if (dx * dx + dy * dy < r2) {
              applyBulletDamage(world, other, bCol.damage, sim);
            }
          }
        } else {
          debugLog.log('HIT', `Enemy#${enemy} hit dmg=${bCol.damage}`);
          applyBulletDamage(world, enemy, bCol.damage, sim);
        }

        destroyEntity(world, bullet);
        break;
      }
    }

    // Enemy bullets vs Players
    for (const bullet of enemyBullets) {
      const bPos = world.position.get(bullet)!;
      const bCol = world.collider.get(bullet)!;
      for (const player of players) {
        const pPos = world.position.get(player)!;
        const pCol = world.collider.get(player)!;
        const hp = world.health.get(player);
        if (!hp || hp.invulnTicks > 0) continue;
        if (circleOverlap(bPos.x, bPos.y, bCol.radius, pPos.x, pPos.y, pCol.radius)) {
          hp.current -= bCol.damage;
          hp.invulnTicks = PLAYER_INVULN_TICKS;
          const tag = world.playerTag.get(player);
          debugLog.log('DMG', `P${(tag?.playerId ?? 0) + 1} hit by bullet! hp=${hp.current}/${hp.max}`);
          if (hp.current <= 0) {
            debugLog.log('DEATH', `P${(tag?.playerId ?? 0) + 1} destroyed!`);
            createExplosion(world, pPos.x, pPos.y, 48);
          }
          destroyEntity(world, bullet);
          break;
        }
      }
    }

    // Enemy body vs Players
    for (const enemy of enemies) {
      // Skip enemies already queued for destruction (killed by bullets above)
      const eHp = world.health.get(enemy);
      if (eHp && eHp.current <= 0) continue;

      const ePos = world.position.get(enemy)!;
      const eCol = world.collider.get(enemy)!;
      for (const player of players) {
        const pPos = world.position.get(player)!;
        const pCol = world.collider.get(player)!;
        const hp = world.health.get(player);
        if (!hp || hp.invulnTicks > 0) continue;
        if (circleOverlap(ePos.x, ePos.y, eCol.radius, pPos.x, pPos.y, pCol.radius)) {
          hp.current -= 1;
          hp.invulnTicks = PLAYER_INVULN_TICKS;
          const tag = world.playerTag.get(player);
          debugLog.log('DMG', `P${(tag?.playerId ?? 0) + 1} collide E#${enemy} @(${toFloat(ePos.x).toFixed(0)},${toFloat(ePos.y).toFixed(0)}) hp=${hp.current}/${hp.max}`);
          if (hp.current <= 0) {
            debugLog.log('DEATH', `P${(tag?.playerId ?? 0) + 1} destroyed!`);
            createExplosion(world, pPos.x, pPos.y, 48);
          }
          break;
        }
      }
    }

    // Drops vs Players
    for (const drop of drops) {
      const dPos = world.position.get(drop)!;
      const dCol = world.collider.get(drop)!;
      const dTag = world.dropTag.get(drop);
      if (!dTag) continue;
      for (const player of players) {
        const pPos = world.position.get(player)!;
        const pCol = world.collider.get(player)!;
        if (circleOverlap(dPos.x, dPos.y, dCol.radius, pPos.x, pPos.y, pCol.radius)) {
          const tag = world.playerTag.get(player);
          if (tag) {
            const dropNames = ['WeaponUp', 'Bomb', 'Shield', 'Score+200', 'Score+1000'];
            debugLog.log('DROP', `P${tag.playerId + 1} picked up ${dropNames[dTag.type] ?? 'unknown'}`);
            switch (dTag.type) {
              case DropType.WeaponUpgrade:
                tag.weaponLevel = Math.min(tag.weaponLevel + 1, 5);
                break;
              case DropType.Bomb:
                tag.bombs = Math.min(tag.bombs + 1, 9);
                break;
              case DropType.Shield:
                const hp = world.health.get(player);
                if (hp) hp.current = Math.min(hp.current + 1, hp.max);
                break;
              case DropType.ScoreSmall:
                tag.score += 200 * tag.scoreMultiplier;
                break;
              case DropType.ScoreLarge:
                tag.score += 1000 * tag.scoreMultiplier;
                break;
            }
          }
          destroyEntity(world, drop);
          break;
        }
      }
    }

    // Decrement invulnerability timers
    for (const [, hp] of world.health) {
      if (hp.invulnTicks > 0) hp.invulnTicks--;
    }
  };
}
