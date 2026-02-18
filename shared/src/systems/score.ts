/**
 * Score system: tracks and manages score multipliers.
 */

import type { World } from '../ecs/types.js';
import type { WaveState } from './wave.js';

export interface ScoreState {
  multiplier: number;
  comboTimer: number;
  comboKills: number;
  totalKills: number;
}

export function createScoreState(): ScoreState {
  return {
    multiplier: 1,
    comboTimer: 0,
    comboKills: 0,
    totalKills: 0,
  };
}

export function createScoreSystem(scoreState: ScoreState, waveState: WaveState) {
  let lastEnemyCount = 0;

  return function scoreSystem(world: World): void {
    // Count current enemies
    const currentEnemyCount = world.enemyAI.size;

    // Detect kills (enemy count decreased)
    if (currentEnemyCount < lastEnemyCount) {
      const kills = lastEnemyCount - currentEnemyCount;
      scoreState.totalKills += kills;
      scoreState.comboKills += kills;
      scoreState.comboTimer = 120; // 2 seconds to chain combo
      waveState.killCount += kills;

      // Update multiplier based on combo
      if (scoreState.comboKills >= 20) {
        scoreState.multiplier = 4;
      } else if (scoreState.comboKills >= 10) {
        scoreState.multiplier = 3;
      } else if (scoreState.comboKills >= 5) {
        scoreState.multiplier = 2;
      }

      // Apply multiplier bonus to all player scores
      for (const [, tag] of world.playerTag) {
        tag.score += kills * 50 * (scoreState.multiplier - 1);
      }
    }

    lastEnemyCount = currentEnemyCount;

    // Combo timer countdown
    if (scoreState.comboTimer > 0) {
      scoreState.comboTimer--;
      if (scoreState.comboTimer === 0) {
        scoreState.comboKills = 0;
        scoreState.multiplier = 1;
      }
    }
  };
}
