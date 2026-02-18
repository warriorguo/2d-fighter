/**
 * GameSimulation — deterministic game state.
 * step(inputs) advances one tick with given player inputs.
 */

import type { World, System } from './ecs/types.js';
import { createWorld, flushDestroyed, runSystems } from './ecs/world.js';
import { SeededRNG } from './math/random.js';
import type { PlayerInput } from './input.js';
import { emptyInput } from './input.js';
import { debugLog } from './debug.js';

export interface SimulationConfig {
  seed: number;
  playerCount: number;   // 1 or 2
  levelId: string;
}

export class GameSimulation {
  world: World;
  rng: SeededRNG;
  config: SimulationConfig;
  inputs: PlayerInput[];
  systems: System[] = [];
  gameOver = false;
  victory = false;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.world = createWorld();
    this.rng = new SeededRNG(config.seed);
    this.inputs = [];
    for (let i = 0; i < config.playerCount; i++) {
      this.inputs.push(emptyInput());
    }
  }

  /** Register systems in execution order */
  addSystem(system: System): void {
    this.systems.push(system);
  }

  /** Advance simulation by one tick */
  step(inputs: PlayerInput[]): void {
    debugLog.setTick(this.world.tick);

    // Store inputs for systems to read
    for (let i = 0; i < inputs.length; i++) {
      this.inputs[i] = inputs[i];
    }

    // Run all systems in order
    runSystems(this.world, this.systems);

    // Clean up destroyed entities
    flushDestroyed(this.world);

    this.world.tick++;
  }
}
