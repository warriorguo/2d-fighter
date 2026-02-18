/**
 * Bullet pattern system: enemies fire bullets in configurable patterns.
 */

import type { World, Entity } from '../ecs/types.js';
import { fpMul, fpSub, toFixed } from '../math/fixed.js';
import { fpSin, fpCos, fpAtan2, ANGLE_FULL } from '../math/trig.js';
import { createEnemyBullet } from '../factory.js';
import type { GameSimulation } from '../simulation.js';

export function createBulletPatternSystem(sim: GameSimulation) {
  return function bulletPatternSystem(world: World): void {
    for (const [entity, pattern] of world.bulletPattern) {
      const pos = world.position.get(entity);
      if (!pos) continue;

      pattern.timer++;
      if (pattern.timer < pattern.interval) continue;
      pattern.timer = 0;

      switch (pattern.type) {
        case 'aimed':
          fireAimed(world, entity, pos);
          break;
        case 'radial':
          fireRadial(world, pos, pattern.params[0] || 8);
          break;
        case 'spiral':
          fireSpiral(world, pos, pattern, entity);
          break;
        case 'spread':
          fireSpread(world, pos, sim);
          break;
        case 'boss_radial':
          fireRadial(world, pos, 16);
          break;
        case 'boss_aimed_burst':
          fireAimedBurst(world, entity, pos);
          break;
        default:
          // Default: single aimed shot
          fireAimed(world, entity, pos);
          break;
      }
    }
  };
}

function findNearestPlayer(world: World, fromX: number, fromY: number): { x: number; y: number } | null {
  let nearest = null;
  let nearestDist = Infinity;
  for (const [, tag] of world.playerTag) {
    for (const [entity] of world.playerTag) {
      const pos = world.position.get(entity);
      if (!pos) continue;
      const dx = fromX - pos.x;
      const dy = fromY - pos.y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = pos;
      }
    }
    break;
  }
  return nearest;
}

function fireAimed(world: World, entity: Entity, pos: { x: number; y: number }): void {
  const target = findNearestPlayer(world, pos.x, pos.y);
  if (!target) {
    // Fire straight down
    createEnemyBullet(world, pos.x, pos.y, 0, toFixed(3), 1, '#ff4488', 4);
    return;
  }
  const speed = toFixed(3);
  const angle = fpAtan2(fpSub(target.y, pos.y), fpSub(target.x, pos.x));
  const vx = fpMul(speed, fpCos(angle));
  const vy = fpMul(speed, fpSin(angle));
  createEnemyBullet(world, pos.x, pos.y, vx, vy, 1, '#ff4488', 4);
}

function fireRadial(world: World, pos: { x: number; y: number }, count: number): void {
  const speed = toFixed(2);
  const step = (ANGLE_FULL / count) | 0;
  for (let i = 0; i < count; i++) {
    const angle = (i * step) | 0;
    const vx = fpMul(speed, fpCos(angle));
    const vy = fpMul(speed, fpSin(angle));
    createEnemyBullet(world, pos.x, pos.y, vx, vy, 1, '#ff66aa', 3);
  }
}

function fireSpiral(world: World, pos: { x: number; y: number }, pattern: { params: number[] }, entity: Entity): void {
  const speed = toFixed(2);
  const baseAngle = pattern.params[1] || 0;
  const arms = 3;
  for (let i = 0; i < arms; i++) {
    const angle = (baseAngle + (i * (ANGLE_FULL / arms))) & 0xFFF;
    const vx = fpMul(speed, fpCos(angle));
    const vy = fpMul(speed, fpSin(angle));
    createEnemyBullet(world, pos.x, pos.y, vx, vy, 1, '#aa44ff', 3);
  }
  // Rotate spiral
  pattern.params[1] = ((baseAngle + 64) % ANGLE_FULL) | 0;
}

function fireSpread(world: World, pos: { x: number; y: number }, sim: GameSimulation): void {
  const speed = toFixed(2.5);
  const count = 3 + sim.rng.nextInt(3);
  const startAngle = (ANGLE_FULL / 4) - ((count * 64) >> 1); // roughly downward
  for (let i = 0; i < count; i++) {
    const angle = (startAngle + i * 64) & 0xFFF;
    const vx = fpMul(speed, fpCos(angle));
    const vy = fpMul(speed, fpSin(angle));
    createEnemyBullet(world, pos.x, pos.y, vx, vy, 1, '#ffaa44', 3);
  }
}

function fireAimedBurst(world: World, entity: Entity, pos: { x: number; y: number }): void {
  const target = findNearestPlayer(world, pos.x, pos.y);
  const speed = toFixed(3.5);
  const baseAngle = target
    ? fpAtan2(fpSub(target.y, pos.y), fpSub(target.x, pos.x))
    : (ANGLE_FULL / 4); // straight down

  // 5-bullet burst with slight spread
  for (let i = -2; i <= 2; i++) {
    const angle = (baseAngle + i * 48) & 0xFFF;
    const vx = fpMul(speed, fpCos(angle));
    const vy = fpMul(speed, fpSin(angle));
    createEnemyBullet(world, pos.x, pos.y, vx, vy, 1, '#ff2222', 4);
  }
}
