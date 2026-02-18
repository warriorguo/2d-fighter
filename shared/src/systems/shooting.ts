/**
 * Shooting system: handles player auto-fire and weapon upgrades.
 */

import type { World } from '../ecs/types.js';
import { fpAdd, toFixed } from '../math/fixed.js';
import { PLAYER_BULLET_SPEED } from '../constants.js';
import { createPlayerBullet } from '../factory.js';
import type { GameSimulation } from '../simulation.js';

export function createShootingSystem(sim: GameSimulation) {
  return function shootingSystem(world: World): void {
    for (const [entity, weapon] of world.weapon) {
      const tag = world.playerTag.get(entity);
      if (!tag) continue;

      // Dead players don't shoot
      const hp = world.health.get(entity);
      if (hp && hp.current <= 0) continue;

      const pos = world.position.get(entity);
      if (!pos) continue;

      const input = sim.inputs[tag.playerId] || sim.inputs[0];

      // Update weapon level from player tag
      weapon.level = tag.weaponLevel;

      // Cooldown
      if (weapon.cooldown > 0) {
        weapon.cooldown--;
        continue;
      }

      // Auto-fire when shoot is held (or always fire)
      if (!input.shoot) continue;

      weapon.cooldown = weapon.fireRate;

      const level = weapon.level;
      const bulletSpeed = PLAYER_BULLET_SPEED;
      const damage = 1;

      // Spread pattern based on level
      if (level === 1) {
        // Single shot
        createPlayerBullet(world, pos.x, fpAdd(pos.y, toFixed(-20)), 0, bulletSpeed, damage, level);
      } else if (level === 2) {
        // Double shot
        createPlayerBullet(world, fpAdd(pos.x, toFixed(-8)), fpAdd(pos.y, toFixed(-20)), 0, bulletSpeed, damage, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(8)), fpAdd(pos.y, toFixed(-20)), 0, bulletSpeed, damage, level);
      } else if (level === 3) {
        // Triple shot
        createPlayerBullet(world, pos.x, fpAdd(pos.y, toFixed(-20)), 0, bulletSpeed, damage, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(-12)), fpAdd(pos.y, toFixed(-16)), toFixed(-1), bulletSpeed, damage, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(12)), fpAdd(pos.y, toFixed(-16)), toFixed(1), bulletSpeed, damage, level);
      } else {
        // Level 4+: wide fan
        createPlayerBullet(world, pos.x, fpAdd(pos.y, toFixed(-20)), 0, bulletSpeed, damage + 1, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(-10)), fpAdd(pos.y, toFixed(-18)), toFixed(-0.5), bulletSpeed, damage, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(10)), fpAdd(pos.y, toFixed(-18)), toFixed(0.5), bulletSpeed, damage, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(-16)), fpAdd(pos.y, toFixed(-14)), toFixed(-1.5), bulletSpeed, damage, level);
        createPlayerBullet(world, fpAdd(pos.x, toFixed(16)), fpAdd(pos.y, toFixed(-14)), toFixed(1.5), bulletSpeed, damage, level);
      }
    }
  };
}
