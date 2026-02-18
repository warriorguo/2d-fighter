/**
 * Controls display screen.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

const CONTROLS = [
  ['Move', 'WASD / Arrow Keys'],
  ['Shoot', 'Space / Z'],
  ['Bomb', 'X / B'],
  ['Focus (slow)', 'Shift'],
  ['Pause', 'Esc'],
];

export function drawControls(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#00ccff';
  ctx.fillText('CONTROLS', GAME_WIDTH / 2, 80);

  for (let i = 0; i < CONTROLS.length; i++) {
    const y = 180 + i * 50;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(CONTROLS[i][0], GAME_WIDTH / 2, y);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(CONTROLS[i][1], GAME_WIDTH / 2, y + 20);
  }

  ctx.font = '12px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('Press Esc to go back', GAME_WIDTH / 2, GAME_HEIGHT - 60);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
