/**
 * Shop screen: currency-driven UI. Shows balance and per-tier prices.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';
import { SHOP_ITEMS, nextTier, type ShopConfig } from '../shop.js';

export function drawShop(
  ctx: CanvasRenderingContext2D,
  cfg: ShopConfig,
  selection: number,
  tick: number,
  flash: { type: 'nofunds' | 'maxed' | null; ticks: number },
): void {
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Background stars
  for (let i = 0; i < 30; i++) {
    const seed = i * 7919;
    const x = (seed * 13) % GAME_WIDTH;
    const y = ((seed * 17 + tick * 0.3) % GAME_HEIGHT);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + (i % 4) * 0.1})`;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ffaa44';
  ctx.fillText('SHOP', GAME_WIDTH / 2, 44);

  // Credits balance
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ffff66';
  ctx.fillText(`Credits: ${cfg.credits.toLocaleString()}`, GAME_WIDTH / 2, 80);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('Earned from previous runs', GAME_WIDTH / 2, 100);

  // Items
  const startY = 138;
  const rowH = 50;
  for (let i = 0; i < SHOP_ITEMS.length; i++) {
    const item = SHOP_ITEMS[i];
    const y = startY + i * rowH;
    const selected = i === selection;
    const value = item.format(cfg[item.key]);
    const next = nextTier(cfg, item);
    const affordable = next !== null && cfg.credits >= next.cost;

    // Label (left)
    ctx.textAlign = 'left';
    ctx.font = selected ? 'bold 13px monospace' : '13px monospace';
    ctx.fillStyle = selected ? '#ffffff' : '#8899aa';
    ctx.fillText(item.label, 30, y);

    // Current value (centered)
    ctx.textAlign = 'center';
    ctx.font = selected ? 'bold 13px monospace' : '13px monospace';
    ctx.fillStyle = selected ? '#aaffaa' : '#8899aa';
    ctx.fillText(value, GAME_WIDTH / 2 + 20, y);

    // Next tier price (right)
    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    if (next === null) {
      ctx.fillStyle = selected ? '#888' : '#555';
      ctx.fillText('MAX', GAME_WIDTH - 30, y);
    } else {
      ctx.fillStyle = affordable
        ? (selected ? '#44ff88' : '#338855')
        : (selected ? '#ff5555' : '#883333');
      const arrow = selected ? '> ' : '';
      const nextLabel = item.format(next.value);
      ctx.fillText(`${arrow}${nextLabel}  ${next.cost.toLocaleString()}c`, GAME_WIDTH - 30, y);
    }
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('Up/Down: select   Right/Enter: buy   R: reset (refunds)', GAME_WIDTH / 2, GAME_HEIGHT - 58);
  ctx.fillStyle = '#666';
  ctx.fillText('Esc to save and return', GAME_WIDTH / 2, GAME_HEIGHT - 40);

  // Transient flash
  if (flash.type && flash.ticks > 0) {
    const alpha = Math.min(1, flash.ticks / 30);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = flash.type === 'nofunds'
      ? `rgba(255, 80, 80, ${alpha})`
      : `rgba(180, 180, 180, ${alpha})`;
    const msg = flash.type === 'nofunds' ? 'NOT ENOUGH CREDITS' : 'ALREADY MAXED';
    ctx.fillText(msg, GAME_WIDTH / 2, GAME_HEIGHT - 86);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function getShopItemCount(): number {
  return SHOP_ITEMS.length;
}
