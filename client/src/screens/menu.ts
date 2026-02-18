/**
 * Main menu screen rendering and input.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

const MENU_OPTIONS = [
  'Level 1 — Sky Assault',
  'Level 2 — Deep Space',
  'Level 3 — Crimson Nebula',
  'Level 4 — Event Horizon',
  'Level 5 — Final Frontier',
  'Co-op (LAN)',
  'Controls',
];

export function drawMenu(ctx: CanvasRenderingContext2D, selection: number, tick: number): void {
  // Background
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Scrolling stars background effect
  for (let i = 0; i < 50; i++) {
    const seed = i * 7919;
    const x = (seed * 13) % GAME_WIDTH;
    const y = ((seed * 17 + tick * (0.2 + (i % 3) * 0.3)) % GAME_HEIGHT);
    const size = 0.5 + (i % 3) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 5) * 0.15})`;
    ctx.fillRect(x, y, size, size);
  }

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title glow
  const glow = Math.sin(tick * 0.05) * 0.3 + 0.7;
  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = `rgba(0, 200, 255, ${glow})`;
  ctx.fillText('SKY ASSAULT', GAME_WIDTH / 2, 160);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#6688aa';
  ctx.fillText('2D SCROLLING SHOOTER', GAME_WIDTH / 2, 200);

  // Menu options
  for (let i = 0; i < MENU_OPTIONS.length; i++) {
    const y = 280 + i * 38;
    const selected = i === selection;
    ctx.font = selected ? 'bold 16px monospace' : '14px monospace';

    // Color-code difficulty levels
    if (i < 5) {
      const diffColors = ['#44cc88', '#44aacc', '#cc6644', '#4488cc', '#ccaa44'];
      ctx.fillStyle = selected ? '#ffffff' : diffColors[i];
    } else {
      ctx.fillStyle = selected ? '#00ccff' : '#8899aa';
    }

    if (selected) {
      const bounce = Math.sin(tick * 0.1) * 3;
      ctx.fillText(`> ${MENU_OPTIONS[i]} <`, GAME_WIDTH / 2 + bounce, y);
    } else {
      ctx.fillText(MENU_OPTIONS[i], GAME_WIDTH / 2, y);
    }
  }

  // Difficulty hint
  ctx.font = '11px monospace';
  ctx.fillStyle = '#445566';
  ctx.fillText('Arrow keys to select, Enter to confirm', GAME_WIDTH / 2, GAME_HEIGHT - 40);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function getMenuOptionCount(): number {
  return MENU_OPTIONS.length;
}
