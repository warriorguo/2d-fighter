/**
 * Pause screen overlay with menu options.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

const PAUSE_OPTIONS = ['Resume', 'Restart', 'Quit to Menu'];

export function drawPause(ctx: CanvasRenderingContext2D, selection: number, tick: number): void {
  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 32px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

  // Options
  for (let i = 0; i < PAUSE_OPTIONS.length; i++) {
    const y = GAME_HEIGHT / 2 - 10 + i * 40;
    const selected = i === selection;

    ctx.font = selected ? 'bold 18px monospace' : '16px monospace';
    ctx.fillStyle = selected ? '#00ccff' : '#888888';

    if (selected) {
      const bounce = Math.sin(tick * 0.1) * 3;
      ctx.fillText(`> ${PAUSE_OPTIONS[i]} <`, GAME_WIDTH / 2 + bounce, y);
    } else {
      ctx.fillText(PAUSE_OPTIONS[i], GAME_WIDTH / 2, y);
    }
  }

  // Hints
  ctx.font = '11px monospace';
  ctx.fillStyle = '#555555';
  ctx.fillText('Arrow keys to select, Enter to confirm', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
  ctx.fillText('Esc to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 138);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function getPauseOptionCount(): number {
  return PAUSE_OPTIONS.length;
}
