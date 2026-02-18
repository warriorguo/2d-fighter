/**
 * Core ECS type definitions.
 * Entities are just numeric IDs. Components are typed Maps.
 */

import type { Fixed } from '../math/fixed.js';

export type Entity = number;

// Component types
export interface Position {
  x: Fixed;
  y: Fixed;
}

export interface Velocity {
  vx: Fixed;
  vy: Fixed;
}

export interface Health {
  current: number;
  max: number;
  invulnTicks: number; // remaining invulnerability ticks
}

export interface Collider {
  radius: Fixed;         // for circle collision
  halfW?: Fixed;         // for AABB
  halfH?: Fixed;         // for AABB
  layer: CollisionLayer;
  damage: number;
}

export const enum CollisionLayer {
  Player = 1,
  PlayerBullet = 2,
  Enemy = 4,
  EnemyBullet = 8,
  Drop = 16,
}

export interface Sprite {
  type: SpriteType;
  width: number;
  height: number;
  color: string;         // fallback color for rectangle rendering
  frame: number;
  animTick: number;
}

export const enum SpriteType {
  Player,
  PlayerBullet,
  Enemy,
  EnemyBullet,
  Boss,
  Drop,
  Explosion,
}

export interface Weapon {
  fireRate: number;       // ticks between shots
  cooldown: number;       // ticks until next shot
  level: number;          // upgrade level
  bulletType: string;     // key into bullet config
}

export interface EnemyAI {
  type: string;           // movement script name
  phase: number;          // current AI phase
  timer: number;          // ticks in current phase
  params: number[];       // script-specific parameters (Fixed values)
}

export interface BulletPattern {
  type: string;           // pattern name
  timer: number;
  interval: number;       // ticks between bursts
  params: number[];       // pattern-specific parameters
}

export interface PlayerTag {
  playerId: number;       // 0 or 1 for co-op
  bombs: number;
  score: number;
  weaponLevel: number;
}

export interface DropTag {
  type: DropType;
  lifetime: number;       // ticks remaining
}

export const enum DropType {
  WeaponUpgrade,
  Bomb,
  Shield,
  ScoreSmall,
  ScoreLarge,
}

export interface BossTag {
  id: string;
  phase: number;
  maxPhases: number;
}

/** System function signature: runs each tick, mutates World */
export type System = (world: World) => void;

// Forward reference — actual definition in world.ts
export interface World {
  tick: number;
  nextEntity: Entity;
  entities: Set<Entity>;
  toDestroy: Entity[];

  // Component stores
  position: Map<Entity, Position>;
  velocity: Map<Entity, Velocity>;
  health: Map<Entity, Health>;
  collider: Map<Entity, Collider>;
  sprite: Map<Entity, Sprite>;
  weapon: Map<Entity, Weapon>;
  enemyAI: Map<Entity, EnemyAI>;
  bulletPattern: Map<Entity, BulletPattern>;
  playerTag: Map<Entity, PlayerTag>;
  dropTag: Map<Entity, DropTag>;
  bossTag: Map<Entity, BossTag>;
}
