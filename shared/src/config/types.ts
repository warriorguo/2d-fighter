/**
 * TypeScript interfaces for JSON data schemas.
 */

export interface LevelConfig {
  id: string;
  name: string;
  duration: number;        // total ticks
  scrollSpeed: number;     // will be converted to Fixed
  background: {
    layers: BackgroundLayer[];
  };
  waves: WaveConfig[];
  boss: BossConfig;
}

export interface BackgroundLayer {
  color: string;
  speed: number;           // multiplier relative to scroll speed
  stars?: number;          // number of star particles
}

export interface WaveConfig {
  trigger: {
    type: 'time' | 'kills' | 'position';
    value: number;
  };
  enemies: WaveEnemy[];
}

export interface WaveEnemy {
  type: string;
  count: number;
  formation: string;       // 'line' | 'v' | 'circle' | 'random'
  spawnX?: number;         // center x position (0-1 normalized)
  spawnY?: number;         // y position
  delay?: number;          // ticks between spawns
}

export interface EnemyConfig {
  id: string;
  hp: number;
  speed: number;
  radius: number;
  score: number;
  color: string;
  width: number;
  height: number;
  ai: string;              // movement script name
  bulletPattern?: string;
  fireRate?: number;
  drops?: DropChance[];
}

export interface DropChance {
  type: string;
  chance: number;          // 0-1 probability
}

export interface BulletConfig {
  id: string;
  speed: number;
  radius: number;
  damage: number;
  color: string;
  width: number;
  height: number;
}

export interface BossConfig {
  id: string;
  name: string;
  phases: BossPhaseConfig[];
}

export interface BossPhaseConfig {
  hp: number;
  speed: number;
  radius: number;
  color: string;
  width: number;
  height: number;
  ai: string;
  bulletPatterns: string[];
  fireRate: number;
  minions?: WaveEnemy[];
}

export interface DropConfig {
  id: string;
  type: string;            // 'weapon' | 'bomb' | 'shield' | 'score_small' | 'score_large'
  radius: number;
  color: string;
  width: number;
  height: number;
  lifetime: number;        // ticks
  fallSpeed: number;
}
