/**
 * Debug overlay — toggled with F1.
 * Shows real-time game stats and a scrolling event log.
 */

import type { World } from 'shared/ecs/types.js';
import { toFloat } from 'shared/math/fixed.js';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_COLORS } from 'shared/constants.js';
import { debugLog, type DebugEvent } from 'shared/debug.js';
import type { ScoreState } from 'shared/systems/score.js';
import type { WaveState } from 'shared/systems/wave.js';
import type { BossState } from 'shared/systems/boss.js';

const CATEGORY_COLORS: Record<string, string> = {
  MOVE:  '#44aaff',
  HIT:   '#ffaa44',
  KILL:  '#44ff44',
  DMG:   '#ff4444',
  DEATH: '#ff0000',
  DROP:  '#ffff44',
  WAVE:  '#aa88ff',
  BOSS:  '#ff44ff',
};

export class DebugOverlay {
  enabled = false;

  toggle(): void {
    this.enabled = !this.enabled;
    debugLog.enabled = this.enabled;
    if (this.enabled) {
      debugLog.clear();
      console.log('[DEBUG] Debug mode ON — press F1 to toggle');
    } else {
      console.log('[DEBUG] Debug mode OFF');
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    world: World,
    scoreState: ScoreState,
    waveState: WaveState,
    bossState: BossState,
  ): void {
    if (!this.enabled) return;

    ctx.save();

    // --- Left panel: stats ---
    const panelX = 4;
    const panelY = 72;
    const lineH = 13;
    let y = panelY;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(panelX - 2, panelY - 2, 170, 180);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    // Title
    ctx.fillStyle = '#00ff00';
    ctx.fillText('[ DEBUG F1 ]', panelX, y); y += lineH + 2;

    // Tick
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Tick: ${world.tick}`, panelX, y); y += lineH;
    ctx.fillText(`Time: ${(world.tick / 60).toFixed(1)}s`, panelX, y); y += lineH;

    // Entity counts
    ctx.fillText(`Entities: ${world.entities.size}`, panelX, y); y += lineH;

    let enemies = 0, bullets = 0, pBullets = 0;
    for (const [e] of world.collider) {
      const c = world.collider.get(e)!;
      if (c.layer === 4) enemies++;      // CollisionLayer.Enemy
      if (c.layer === 8) bullets++;      // CollisionLayer.EnemyBullet
      if (c.layer === 2) pBullets++;     // CollisionLayer.PlayerBullet
    }
    ctx.fillText(`Enemies: ${enemies}`, panelX, y); y += lineH;
    ctx.fillText(`E-Bullets: ${bullets}`, panelX, y); y += lineH;
    ctx.fillText(`P-Bullets: ${pBullets}`, panelX, y); y += lineH;

    // Wave info
    ctx.fillStyle = '#aa88ff';
    ctx.fillText(`Wave: ${waveState.waveIndex}/${waveState.level.waves.length}`, panelX, y); y += lineH;
    ctx.fillText(`Kills: ${waveState.killCount}`, panelX, y); y += lineH;

    // Score state
    ctx.fillStyle = '#ffff44';
    ctx.fillText(`Combo: ${scoreState.comboKills} (x${scoreState.multiplier})`, panelX, y); y += lineH;

    // Player positions
    for (const [entity, tag] of world.playerTag) {
      const pos = world.position.get(entity);
      const hp = world.health.get(entity);
      if (pos && hp) {
        ctx.fillStyle = PLAYER_COLORS[tag.playerId % PLAYER_COLORS.length];
        ctx.fillText(
          `P${tag.playerId + 1}: (${toFloat(pos.x).toFixed(0)},${toFloat(pos.y).toFixed(0)}) HP:${hp.current}`,
          panelX, y,
        );
        y += lineH;
      }
    }

    // Boss info
    if (bossState.entity) {
      const bossHp = world.health.get(bossState.entity);
      ctx.fillStyle = '#ff44ff';
      ctx.fillText(
        `Boss P${bossState.phase + 1}: ${bossHp?.current ?? 0}/${bossHp?.max ?? 0}`,
        panelX, y,
      );
      y += lineH;
    }

    // --- Right panel: event log ---
    const logX = GAME_WIDTH - 222;
    const logY = 72;
    const logW = 218;
    const maxLines = 22;
    const events = debugLog.recent(maxLines);
    const logH = lineH * maxLines + 18;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(logX - 2, logY - 2, logW + 4, logH);

    ctx.fillStyle = '#00ff00';
    ctx.fillText('[ EVENT LOG ]', logX, logY);

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const ly = logY + 15 + i * lineH;
      const color = CATEGORY_COLORS[ev.category] ?? '#aaaaaa';

      // Tick number
      ctx.fillStyle = '#666666';
      ctx.fillText(`${ev.tick}`, logX, ly);

      // Category tag
      ctx.fillStyle = color;
      ctx.fillText(ev.category.padEnd(5), logX + 40, ly);

      // Message (truncate)
      ctx.fillStyle = '#dddddd';
      const msg = ev.message.length > 24 ? ev.message.slice(0, 23) + '..' : ev.message;
      ctx.fillText(msg, logX + 80, ly);
    }

    ctx.restore();
  }
}
