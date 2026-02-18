/**
 * Entity factory — creates pre-configured game entities.
 */

import type { World, Entity } from './ecs/types.js';
import { CollisionLayer, SpriteType, DropType } from './ecs/types.js';
import { createEntity } from './ecs/world.js';
import { toFixed, type Fixed } from './math/fixed.js';
import {
  GAME_WIDTH, GAME_HEIGHT,
  PLAYER_SPEED, PLAYER_HITBOX_RADIUS,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_START_HP, PLAYER_START_BOMBS,
  PLAYER_FIRE_RATE, PLAYER_BULLET_SPEED,
} from './constants.js';

export function createPlayer(world: World, playerId: number): Entity {
  const e = createEntity(world);
  // Position: center-bottom area, offset for player 2
  const xOffset = playerId === 0 ? -40 : 40;
  world.position.set(e, {
    x: toFixed(GAME_WIDTH / 2 + xOffset),
    y: toFixed(GAME_HEIGHT - 80),
  });
  world.velocity.set(e, { vx: 0, vy: 0 });
  world.health.set(e, {
    current: PLAYER_START_HP,
    max: PLAYER_START_HP,
    invulnTicks: 120,
  });
  world.collider.set(e, {
    radius: PLAYER_HITBOX_RADIUS,
    layer: CollisionLayer.Player,
    damage: 0,
  });
  world.sprite.set(e, {
    type: SpriteType.Player,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    color: playerId === 0 ? '#00ccff' : '#00ff88',
    frame: 0,
    animTick: 0,
  });
  world.weapon.set(e, {
    fireRate: PLAYER_FIRE_RATE,
    cooldown: 0,
    level: 1,
    bulletType: 'player_normal',
  });
  world.playerTag.set(e, {
    playerId,
    bombs: PLAYER_START_BOMBS,
    score: 0,
    weaponLevel: 1,
  });
  return e;
}

export function createPlayerBullet(
  world: World,
  x: Fixed,
  y: Fixed,
  vx: Fixed,
  vy: Fixed,
  damage: number,
  level: number,
): Entity {
  const e = createEntity(world);
  world.position.set(e, { x, y });
  world.velocity.set(e, { vx, vy });
  world.collider.set(e, {
    radius: toFixed(3),
    layer: CollisionLayer.PlayerBullet,
    damage,
  });
  const w = 4 + level;
  const h = 10 + level * 2;
  world.sprite.set(e, {
    type: SpriteType.PlayerBullet,
    width: w,
    height: h,
    color: '#ffff00',
    frame: 0,
    animTick: 0,
  });
  return e;
}

export function createEnemyBullet(
  world: World,
  x: Fixed,
  y: Fixed,
  vx: Fixed,
  vy: Fixed,
  damage: number,
  color: string,
  radius: number,
): Entity {
  const e = createEntity(world);
  world.position.set(e, { x, y });
  world.velocity.set(e, { vx, vy });
  world.collider.set(e, {
    radius: toFixed(radius),
    layer: CollisionLayer.EnemyBullet,
    damage,
  });
  world.sprite.set(e, {
    type: SpriteType.EnemyBullet,
    width: radius * 2,
    height: radius * 2,
    color,
    frame: 0,
    animTick: 0,
  });
  return e;
}

export function createEnemy(
  world: World,
  x: Fixed,
  y: Fixed,
  hp: number,
  speed: number,
  radius: number,
  score: number,
  color: string,
  width: number,
  height: number,
  ai: string,
  bulletPattern?: string,
  fireRate?: number,
): Entity {
  const e = createEntity(world);
  world.position.set(e, { x, y });
  world.velocity.set(e, { vx: 0, vy: toFixed(speed) });
  world.health.set(e, { current: hp, max: hp, invulnTicks: 0 });
  world.collider.set(e, {
    radius: toFixed(radius),
    layer: CollisionLayer.Enemy,
    damage: 1,
  });
  world.sprite.set(e, {
    type: SpriteType.Enemy,
    width,
    height,
    color,
    frame: 0,
    animTick: 0,
  });
  world.enemyAI.set(e, {
    type: ai,
    phase: 0,
    timer: 0,
    params: [toFixed(speed), 0, 0, 0],
  });
  if (bulletPattern && fireRate) {
    world.bulletPattern.set(e, {
      type: bulletPattern,
      timer: 0,
      interval: fireRate,
      params: [0, 0, 0, 0],
    });
  }
  return e;
}

export function createDrop(
  world: World,
  x: Fixed,
  y: Fixed,
  dropType: DropType,
): Entity {
  const e = createEntity(world);
  world.position.set(e, { x, y });
  world.velocity.set(e, { vx: 0, vy: toFixed(1) });

  const colorMap: Record<DropType, string> = {
    [DropType.WeaponUpgrade]: '#ff4444',
    [DropType.Bomb]: '#ffaa00',
    [DropType.Shield]: '#44ff44',
    [DropType.ScoreSmall]: '#aaaaff',
    [DropType.ScoreLarge]: '#ffff44',
  };

  world.collider.set(e, {
    radius: toFixed(8),
    layer: CollisionLayer.Drop,
    damage: 0,
  });
  world.sprite.set(e, {
    type: SpriteType.Drop,
    width: 16,
    height: 16,
    color: colorMap[dropType] || '#ffffff',
    frame: 0,
    animTick: 0,
  });
  world.dropTag.set(e, {
    type: dropType,
    lifetime: 600, // 10 seconds
  });
  return e;
}

export function createExplosion(world: World, x: Fixed, y: Fixed, size: number): Entity {
  const e = createEntity(world);
  world.position.set(e, { x, y });
  world.sprite.set(e, {
    type: SpriteType.Explosion,
    width: size,
    height: size,
    color: '#ff8800',
    frame: 20, // countdown frames
    animTick: 0,
  });
  return e;
}
