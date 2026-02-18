/**
 * Stage Clear transition screen — shown between levels.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';
import type { StageClearData } from './types.js';

const STAGE_CLEAR_DURATION = 3000;

export function drawStageClear(
  ctx: CanvasRenderingContext2D,
  data: StageClearData,
  tick: number,
): void {
  // Dark overlay on frozen game frame
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Cleared level name
  ctx.font = '14px monospace';
  ctx.fillStyle = '#6688aa';
  ctx.fillText(data.clearedName, GAME_WIDTH / 2, 170);

  // "STAGE CLEAR" title with color cycling
  ctx.font = 'bold 32px monospace';
  const hue = (tick * 2) % 360;
  ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
  ctx.fillText('STAGE CLEAR', GAME_WIDTH / 2, 210);

  // Player scores
  ctx.font = '16px monospace';
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < data.scores.length; i++) {
    ctx.fillText(
      `Player ${i + 1}: ${data.scores[i].toLocaleString()}`,
      GAME_WIDTH / 2,
      280 + i * 30,
    );
  }

  // Total score for multi-player
  let scoreBlockEnd = 280 + data.scores.length * 30;
  if (data.scores.length > 1) {
    const total = data.scores.reduce((a, b) => a + b, 0);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`Total: ${total.toLocaleString()}`, GAME_WIDTH / 2, scoreBlockEnd + 10);
    scoreBlockEnd += 40;
  }

  // "Next: <level name>" with pulsing alpha
  const alpha = 0.5 + 0.5 * Math.abs(Math.sin(tick * 0.05));
  ctx.font = '16px monospace';
  ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
  ctx.fillText(`Next: ${data.nextName}`, GAME_WIDTH / 2, scoreBlockEnd + 30);

  // Countdown bar
  const elapsed = performance.now() - data.startTime;
  const progress = Math.min(elapsed / STAGE_CLEAR_DURATION, 1);
  const barWidth = 200;
  const barHeight = 6;
  const barX = (GAME_WIDTH - barWidth) / 2;
  const barY = GAME_HEIGHT - 70;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
  ctx.fillRect(barX, barY, barWidth * (1 - progress), barHeight);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export { STAGE_CLEAR_DURATION };
