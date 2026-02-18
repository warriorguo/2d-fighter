/**
 * Screen state types for game flow.
 */

export type Screen = 'menu' | 'lobby' | 'game' | 'pause' | 'results' | 'stageClear';

export interface StageClearData {
  clearedName: string;
  nextName: string;
  scores: number[];
  playerCount: number;
  savedScores: number[];
  startTime: number;
}

export interface ScreenState {
  current: Screen;
  menuSelection: number;
  results: {
    victory: boolean;
    scores: number[];
    levelName?: string;
  } | null;
  stageClear: StageClearData | null;
}

export function createScreenState(): ScreenState {
  return {
    current: 'menu',
    menuSelection: 0,
    results: null,
    stageClear: null,
  };
}
