/**
 * Results screen — shown after level complete or game over.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

export function drawResults(
  ctx: CanvasRenderingContext2D,
  victory: boolean,
  scores: number[],
  tick: number,
  levelName?: string,
): void {
  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Level name
  if (levelName) {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#6688aa';
    ctx.fillText(levelName, GAME_WIDTH / 2, 170);
  }

  // Title
  ctx.font = 'bold 32px monospace';
  if (victory) {
    const hue = (tick * 2) % 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.fillText('VICTORY!', GAME_WIDTH / 2, 210);
  } else {
    ctx.fillStyle = '#ff4444';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 210);
  }

  // Scores
  ctx.font = '16px monospace';
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < scores.length; i++) {
    ctx.fillText(
      `Player ${i + 1}: ${scores[i].toLocaleString()}`,
      GAME_WIDTH / 2,
      290 + i * 30,
    );
  }

  // Total
  if (scores.length > 1) {
    const total = scores.reduce((a, b) => a + b, 0);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Total: ${total.toLocaleString()}`, GAME_WIDTH / 2, 290 + scores.length * 30 + 20);
  }

  // Prompt
  const alpha = Math.abs(Math.sin(tick * 0.05));
  ctx.font = '14px monospace';
  ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
  ctx.fillText('Press Enter to continue', GAME_WIDTH / 2, GAME_HEIGHT - 80);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
