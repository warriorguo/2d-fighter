/**
 * Screen state types for game flow.
 */

export type Screen = 'menu' | 'lobby' | 'game' | 'pause' | 'results';

export interface ScreenState {
  current: Screen;
  menuSelection: number;
  results: {
    victory: boolean;
    scores: number[];
  } | null;
}

export function createScreenState(): ScreenState {
  return {
    current: 'menu',
    menuSelection: 0,
    results: null,
  };
}
