/**
 * Game-wide constants.
 */

import { toFixed, type Fixed } from './math/fixed.js';

// Canvas logical dimensions (renderer may scale)
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 720;

export const GAME_WIDTH_FP: Fixed = toFixed(GAME_WIDTH);
export const GAME_HEIGHT_FP: Fixed = toFixed(GAME_HEIGHT);

// Simulation
export const TICKS_PER_SECOND = 60;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

// Player
export const PLAYER_SPEED: Fixed = toFixed(4);
export const PLAYER_SLOW_SPEED: Fixed = toFixed(1.5);
export const PLAYER_RADIUS: Fixed = toFixed(3);
export const PLAYER_HITBOX_RADIUS: Fixed = toFixed(2);
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 40;
export const PLAYER_START_HP = 5;
export const PLAYER_START_BOMBS = 3;
export const PLAYER_INVULN_TICKS = 120; // 2 seconds

// Player bullet defaults
export const PLAYER_BULLET_SPEED: Fixed = toFixed(-10);
export const PLAYER_FIRE_RATE = 6; // ticks between shots

// Networking
export const INPUT_DELAY_TICKS = 3;
export const SNAPSHOT_INTERVAL = 300; // every 5 seconds
