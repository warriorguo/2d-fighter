/**
 * HUD rendering: HP bar, score, bombs, weapon level, boss HP, combo, warnings.
 */

import type { World } from 'shared/ecs/types.js';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_COLORS } from 'shared/constants.js';
import type { ScoreState } from 'shared/systems/score.js';
import type { BossState } from 'shared/systems/boss.js';
import type { WaveState } from 'shared/systems/wave.js';

export class HUD {
  draw(
    ctx: CanvasRenderingContext2D,
    world: World,
    scoreState: ScoreState,
    bossState: BossState,
    waveState: WaveState,
  ): void {
    ctx.save();
    ctx.textBaseline = 'top';

    // Collect players into array sorted by playerId
    const players: { entity: number; tag: { playerId: number; bombs: number; score: number; weaponLevel: number } }[] = [];
    for (const [entity, tag] of world.playerTag) {
      players.push({ entity, tag });
    }
    players.sort((a, b) => a.tag.playerId - b.tag.playerId);

    const totalPlayers = players.length;
    // Layout: for 1-2 players use left/right, for 3-4 use corners
    for (let i = 0; i < players.length; i++) {
      const { entity, tag } = players[i];
      const hp = world.health.get(entity);

      let x: number;
      let baseY: number;
      if (totalPlayers <= 2) {
        x = i === 0 ? 10 : GAME_WIDTH - 160;
        baseY = 8;
      } else {
        // 3-4 players: top-left stacked
        x = (i % 2 === 0) ? 10 : GAME_WIDTH - 160;
        baseY = i < 2 ? 8 : 68;
      }

      const color = PLAYER_COLORS[tag.playerId % PLAYER_COLORS.length];

      // Player label
      ctx.font = '12px monospace';
      ctx.fillStyle = color;
      ctx.fillText(`P${tag.playerId + 1}`, x, baseY);

      // HP bar
      if (hp) {
        const barW = 80;
        const barH = 8;
        const barX = x + 25;
        const barY = baseY + 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        const hpPct = Math.max(0, hp.current / hp.max);
        ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : hpPct > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barW * hpPct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barW, barH);
      }

      // Score
      ctx.font = '14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${tag.score.toLocaleString()}`, x, baseY + 16);

      // Bombs
      ctx.font = '11px monospace';
      ctx.fillStyle = '#ffaa00';
      let bombStr = '';
      for (let j = 0; j < tag.bombs; j++) bombStr += '* ';
      ctx.fillText(`B:${bombStr}`, x, baseY + 34);

      // Weapon level
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`W:${'I'.repeat(Math.min(tag.weaponLevel, 5))}`, x, baseY + 48);
    }

    // Combo / multiplier
    if (scoreState.multiplier > 1) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ffff00';
      ctx.textAlign = 'center';
      ctx.fillText(`${scoreState.multiplier}x COMBO!`, GAME_WIDTH / 2, 8);
      ctx.textAlign = 'left';
    }

    // Boss HP bar
    if (bossState.entity && !bossState.defeated) {
      const bossHP = world.health.get(bossState.entity);
      if (bossHP) {
        const barW = GAME_WIDTH - 60;
        const barX = 30;
        const barY = GAME_HEIGHT - 30;

        // Boss name
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.fillText(bossState.config.name, GAME_WIDTH / 2, barY - 16);
        ctx.textAlign = 'left';

        // HP bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, 10);

        // HP bar fill
        const pct = Math.max(0, bossState.totalHP / bossState.maxTotalHP);
        const bossHpPct = Math.max(0, bossHP.current / bossHP.max);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(barX, barY, barW * pct, 10);

        // Phase indicator
        ctx.fillStyle = '#ffffff88';
        const phaseCount = bossState.config.phases.length;
        for (let i = 1; i < phaseCount; i++) {
          const px = barX + (barW * i) / phaseCount;
          ctx.fillRect(px - 0.5, barY, 1, 10);
        }

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barW, 10);
      }
    }

    // Boss warning
    if (bossState.warningTicks > 0) {
      const alpha = Math.abs(Math.sin(bossState.warningTicks * 0.1));
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('WARNING', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
      ctx.font = '16px monospace';
      ctx.fillText(bossState.config.name, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
      ctx.textAlign = 'left';
    }

    // Level progress
    if (!bossState.entity && !bossState.defeated) {
      const progress = Math.min(1, world.tick / waveState.level.duration);
      const barW = 60;
      const barX = GAME_WIDTH / 2 - barW / 2;
      const barY = GAME_HEIGHT - 12;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(barX, barY, barW * progress, 4);
    }

    ctx.restore();
  }
}
