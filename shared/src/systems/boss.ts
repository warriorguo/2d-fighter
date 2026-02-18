/**
 * Boss system: multi-phase boss with transitions, bullet patterns, minion spawning.
 */

import type { World, Entity } from '../ecs/types.js';
import { CollisionLayer, SpriteType } from '../ecs/types.js';
import { createEntity, destroyEntity } from '../ecs/world.js';
import { toFixed, fpAdd } from '../math/fixed.js';
import { createExplosion, createEnemy } from '../factory.js';
import type { BossConfig, BossPhaseConfig } from '../config/types.js';
import type { WaveState } from './wave.js';
import type { GameSimulation } from '../simulation.js';
import { GAME_WIDTH } from '../constants.js';
import { debugLog } from '../debug.js';

export interface BossState {
  config: BossConfig;
  entity: Entity | null;
  phase: number;
  phaseHP: number;
  totalHP: number;
  maxTotalHP: number;
  defeated: boolean;
  spawnTimer: number;
  minionTimer: number;
  warningTicks: number; // warning display before boss appears
}

export function createBossState(config: BossConfig): BossState {
  let totalHP = 0;
  for (const phase of config.phases) {
    totalHP += phase.hp;
  }
  return {
    config,
    entity: null,
    phase: 0,
    phaseHP: config.phases[0]?.hp || 100,
    totalHP,
    maxTotalHP: totalHP,
    defeated: false,
    spawnTimer: 0,
    minionTimer: 0,
    warningTicks: 0,
  };
}

export function createBossSystem(sim: GameSimulation, waveState: WaveState, bossState: BossState) {
  return function bossSystem(world: World): void {
    if (bossState.defeated) return;

    // Show warning before boss
    if (waveState.bossSpawned && !bossState.entity && bossState.warningTicks === 0) {
      bossState.warningTicks = 180; // 3 seconds warning
    }

    if (bossState.warningTicks > 0) {
      bossState.warningTicks--;
      if (bossState.warningTicks === 0) {
        spawnBoss(world, bossState);
      }
      return;
    }

    if (!bossState.entity) return;

    const entity = bossState.entity;
    const hp = world.health.get(entity);
    if (!hp) return;

    // Check for phase transition
    if (hp.current <= 0) {
      bossState.phase++;
      if (bossState.phase >= bossState.config.phases.length) {
        // Boss defeated!
        const pos = world.position.get(entity);
        if (pos) {
          // Big explosion
          for (let i = 0; i < 8; i++) {
            createExplosion(world, fpAdd(pos.x, toFixed(sim.rng.nextInt(80) - 40)),
                           fpAdd(pos.y, toFixed(sim.rng.nextInt(60) - 30)), 48);
          }
        }
        debugLog.log('BOSS', `${bossState.config.name} DEFEATED!`);
        destroyEntity(world, entity);
        bossState.entity = null;
        bossState.defeated = true;
        waveState.levelComplete = true;

        // Award big score
        for (const [, tag] of world.playerTag) {
          tag.score += 10000;
        }
        return;
      }

      // Transition to next phase
      debugLog.log('BOSS', `Phase ${bossState.phase + 1}/${bossState.config.phases.length} started`);
      const phaseConfig = bossState.config.phases[bossState.phase];
      hp.current = phaseConfig.hp;
      hp.max = phaseConfig.hp;
      bossState.phaseHP = phaseConfig.hp;
      bossState.totalHP -= bossState.config.phases[bossState.phase - 1].hp;

      // Update sprite color
      const sprite = world.sprite.get(entity);
      if (sprite) {
        sprite.color = phaseConfig.color;
      }

      // Update AI
      const ai = world.enemyAI.get(entity);
      if (ai) {
        ai.type = phaseConfig.ai;
        ai.params[0] = toFixed(phaseConfig.speed);
        ai.timer = 0;
      }

      // Update bullet pattern
      const pattern = world.bulletPattern.get(entity);
      if (pattern && phaseConfig.bulletPatterns.length > 0) {
        pattern.type = phaseConfig.bulletPatterns[0];
        pattern.interval = phaseConfig.fireRate;
        pattern.timer = 0;
      }

      // Flash effect
      const pos = world.position.get(entity);
      if (pos) {
        createExplosion(world, pos.x, pos.y, 64);
      }
    }

    // Spawn minions periodically in later phases
    const phaseConfig = bossState.config.phases[bossState.phase];
    if (phaseConfig.minions && phaseConfig.minions.length > 0) {
      bossState.minionTimer++;
      if (bossState.minionTimer >= 300) { // every 5 seconds
        bossState.minionTimer = 0;
        // Minion spawning will be handled by the wave system's spawn logic
        // For now, spawn simple small enemies
        const pos = world.position.get(entity);
        if (pos) {
          for (let i = 0; i < 3; i++) {
            const offsetX = toFixed(sim.rng.nextInt(100) - 50);
            createEnemy(
              world,
              fpAdd(pos.x, offsetX), fpAdd(pos.y, toFixed(40)),
              1, 1.5, 8, 50,
              '#ff6666', 20, 20, 'linear',
            );
          }
        }
      }
    }
  };
}

function spawnBoss(world: World, bossState: BossState): void {
  debugLog.log('BOSS', `${bossState.config.name} spawned! Phase 1/${bossState.config.phases.length}`);
  const config = bossState.config;
  const phaseConfig = config.phases[0];

  const entity = createEntity(world);
  bossState.entity = entity;

  world.position.set(entity, {
    x: toFixed(GAME_WIDTH / 2),
    y: toFixed(80),
  });
  world.velocity.set(entity, { vx: 0, vy: 0 });
  world.health.set(entity, {
    current: phaseConfig.hp,
    max: phaseConfig.hp,
    invulnTicks: 60,
  });
  world.collider.set(entity, {
    radius: toFixed(phaseConfig.radius),
    layer: CollisionLayer.Enemy,
    damage: 1,
  });
  world.sprite.set(entity, {
    type: SpriteType.Boss,
    width: phaseConfig.width,
    height: phaseConfig.height,
    color: phaseConfig.color,
    frame: 0,
    animTick: 0,
  });
  world.enemyAI.set(entity, {
    type: phaseConfig.ai,
    phase: 0,
    timer: 0,
    params: [toFixed(phaseConfig.speed), 0, 0, 0],
  });
  if (phaseConfig.bulletPatterns.length > 0) {
    world.bulletPattern.set(entity, {
      type: phaseConfig.bulletPatterns[0],
      timer: 0,
      interval: phaseConfig.fireRate,
      params: [0, 0, 0, 0],
    });
  }
  world.bossTag.set(entity, {
    id: config.id,
    phase: 0,
    maxPhases: config.phases.length,
  });
}
