/**
 * ECS World — manages entities and components.
 */

import type { Entity, World, System } from './types.js';

export function createWorld(): World {
  return {
    tick: 0,
    nextEntity: 1,
    entities: new Set(),
    toDestroy: [],
    position: new Map(),
    velocity: new Map(),
    health: new Map(),
    collider: new Map(),
    sprite: new Map(),
    weapon: new Map(),
    enemyAI: new Map(),
    bulletPattern: new Map(),
    playerTag: new Map(),
    dropTag: new Map(),
    bossTag: new Map(),
  };
}

export function createEntity(world: World): Entity {
  const id = world.nextEntity++;
  world.entities.add(id);
  return id;
}

export function destroyEntity(world: World, entity: Entity): void {
  world.toDestroy.push(entity);
}

/** Actually remove queued entities and all their components */
export function flushDestroyed(world: World): void {
  for (const e of world.toDestroy) {
    world.entities.delete(e);
    world.position.delete(e);
    world.velocity.delete(e);
    world.health.delete(e);
    world.collider.delete(e);
    world.sprite.delete(e);
    world.weapon.delete(e);
    world.enemyAI.delete(e);
    world.bulletPattern.delete(e);
    world.playerTag.delete(e);
    world.dropTag.delete(e);
    world.bossTag.delete(e);
  }
  world.toDestroy.length = 0;
}

/** Run an ordered list of systems */
export function runSystems(world: World, systems: System[]): void {
  for (const system of systems) {
    system(world);
  }
}
