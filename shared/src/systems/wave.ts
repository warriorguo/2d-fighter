/**
 * Wave system: spawns enemy waves based on level config triggers.
 */

import type { World } from '../ecs/types.js';
import { toFixed, fpAdd, fpSub } from '../math/fixed.js';
import { createEnemy } from '../factory.js';
import type { LevelConfig, WaveConfig, WaveEnemy } from '../config/types.js';
import type { GameSimulation } from '../simulation.js';
import { GAME_WIDTH } from '../constants.js';
import { debugLog } from '../debug.js';

export interface WaveState {
  level: LevelConfig;
  waveIndex: number;
  killCount: number;
  bossSpawned: boolean;
  levelComplete: boolean;
  pendingSpawns: PendingSpawn[];
}

interface PendingSpawn {
  ticksUntil: number;
  enemy: WaveEnemy;
  formation: FormationPos[];
}

interface FormationPos {
  x: number;
  y: number;
}

export function createWaveState(level: LevelConfig): WaveState {
  return {
    level,
    waveIndex: 0,
    killCount: 0,
    bossSpawned: false,
    levelComplete: false,
    pendingSpawns: [],
  };
}

export function createWaveSystem(sim: GameSimulation, waveState: WaveState) {
  return function waveSystem(world: World): void {
    const tick = world.tick;
    const level = waveState.level;

    // Check for wave triggers
    while (waveState.waveIndex < level.waves.length) {
      const wave = level.waves[waveState.waveIndex];
      let triggered = false;

      switch (wave.trigger.type) {
        case 'time':
          triggered = tick >= wave.trigger.value;
          break;
        case 'kills':
          triggered = waveState.killCount >= wave.trigger.value;
          break;
      }

      if (!triggered) break;

      // Spawn this wave
      debugLog.log('WAVE', `Wave ${waveState.waveIndex + 1}/${level.waves.length} triggered at tick ${tick}`);
      spawnWave(world, wave, waveState, sim);
      waveState.waveIndex++;
    }

    // Process pending delayed spawns
    for (let i = waveState.pendingSpawns.length - 1; i >= 0; i--) {
      const ps = waveState.pendingSpawns[i];
      ps.ticksUntil--;
      if (ps.ticksUntil <= 0) {
        for (const fp of ps.formation) {
          spawnEnemyFromConfig(world, ps.enemy, fp.x, fp.y, sim);
        }
        waveState.pendingSpawns.splice(i, 1);
      }
    }

    // Check for boss trigger (all waves done and no enemies left)
    if (!waveState.bossSpawned &&
        waveState.waveIndex >= level.waves.length &&
        waveState.pendingSpawns.length === 0) {
      const enemyCount = world.enemyAI.size;
      if (enemyCount === 0 && level.boss) {
        waveState.bossSpawned = true;
        debugLog.log('BOSS', 'All waves cleared — boss incoming!');
      }
    }

    // Count kills (track enemy deaths)
    // This is updated externally by collision system
  };
}

function spawnWave(world: World, wave: WaveConfig, state: WaveState, sim: GameSimulation): void {
  for (const enemyDef of wave.enemies) {
    const positions = computeFormation(
      enemyDef.formation,
      enemyDef.count,
      enemyDef.spawnX ?? 0.5,
      enemyDef.spawnY ?? -30,
      sim,
    );

    if (enemyDef.delay && enemyDef.delay > 0) {
      // Stagger spawns
      for (let i = 0; i < positions.length; i++) {
        state.pendingSpawns.push({
          ticksUntil: i * enemyDef.delay,
          enemy: enemyDef,
          formation: [positions[i]],
        });
      }
    } else {
      for (const fp of positions) {
        spawnEnemyFromConfig(world, enemyDef, fp.x, fp.y, sim);
      }
    }
  }
}

function spawnEnemyFromConfig(
  world: World,
  def: WaveEnemy,
  x: number,
  y: number,
  sim: GameSimulation,
): void {
  // Map enemy type to stats
  const configs: Record<string, {
    hp: number; speed: number; radius: number; color: string;
    width: number; height: number; bulletPattern?: string; fireRate?: number;
  }> = {
    small: { hp: 1, speed: 1.5, radius: 8, color: '#ff4444', width: 20, height: 20 },
    medium: { hp: 3, speed: 1, radius: 12, color: '#ff8844', width: 28, height: 28, bulletPattern: 'aimed', fireRate: 90 },
    elite: { hp: 8, speed: 0.8, radius: 16, color: '#ff44ff', width: 36, height: 36, bulletPattern: 'radial', fireRate: 120 },
    fast: { hp: 1, speed: 3, radius: 6, color: '#ffff44', width: 16, height: 16 },
    tank: { hp: 15, speed: 0.5, radius: 20, color: '#884444', width: 40, height: 40, bulletPattern: 'spread', fireRate: 60 },
  };

  const cfg = configs[def.type] || configs.small;
  createEnemy(
    world,
    toFixed(x), toFixed(y),
    cfg.hp, cfg.speed, cfg.radius, 100,
    cfg.color, cfg.width, cfg.height,
    def.type === 'fast' ? 'zigzag' : def.type === 'elite' ? 'circle' : 'linear',
    cfg.bulletPattern, cfg.fireRate,
  );
}

function computeFormation(
  type: string,
  count: number,
  centerXNorm: number,
  baseY: number,
  sim: GameSimulation,
): FormationPos[] {
  const centerX = centerXNorm * GAME_WIDTH;
  const positions: FormationPos[] = [];
  const spacing = 40;

  switch (type) {
    case 'line':
      for (let i = 0; i < count; i++) {
        positions.push({
          x: centerX - ((count - 1) * spacing / 2) + i * spacing,
          y: baseY,
        });
      }
      break;

    case 'v':
      for (let i = 0; i < count; i++) {
        const offset = i - ((count - 1) / 2);
        positions.push({
          x: centerX + offset * spacing,
          y: baseY - Math.abs(offset) * 20,
        });
      }
      break;

    case 'circle':
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        positions.push({
          x: centerX + Math.cos(angle) * spacing,
          y: baseY + Math.sin(angle) * spacing,
        });
      }
      break;

    case 'random':
      for (let i = 0; i < count; i++) {
        positions.push({
          x: 40 + sim.rng.nextInt(GAME_WIDTH - 80),
          y: baseY - sim.rng.nextInt(60),
        });
      }
      break;

    default:
      // Single column
      for (let i = 0; i < count; i++) {
        positions.push({ x: centerX, y: baseY - i * spacing });
      }
  }

  return positions;
}
