/**
 * Canvas 2D renderer — reads ECS state and draws.
 */

import type { World } from 'shared/ecs/types.js';
import { toFloat } from 'shared/math/fixed.js';
import { SpriteType } from 'shared/ecs/types.js';
import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scale: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.scale = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const maxH = window.innerHeight;
    const maxW = window.innerWidth;
    // Fit game area to window while maintaining aspect ratio
    const scaleX = maxW / GAME_WIDTH;
    const scaleY = maxH / GAME_HEIGHT;
    this.scale = Math.min(scaleX, scaleY);
    this.canvas.width = (GAME_WIDTH * this.scale) | 0;
    this.canvas.height = (GAME_HEIGHT * this.scale) | 0;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
  }

  clear(): void {
    this.ctx.fillStyle = '#0a0a2e';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  drawWorld(world: World): void {
    // Background is drawn by parallax before this call

    // Draw all entities with position + sprite
    for (const [entity, sprite] of world.sprite) {
      const pos = world.position.get(entity);
      if (!pos) continue;

      const x = toFloat(pos.x);
      const y = toFloat(pos.y);
      const hw = sprite.width / 2;
      const hh = sprite.height / 2;

      this.ctx.fillStyle = sprite.color;

      // Invulnerability flash for players
      const hp = world.health.get(entity);
      if (hp && hp.invulnTicks > 0 && world.playerTag.has(entity)) {
        if ((hp.invulnTicks >> 2) & 1) continue; // blink
      }

      switch (sprite.type) {
        case SpriteType.Player:
          this.drawPlayer(x, y, sprite.width, sprite.height, sprite.color);
          break;
        case SpriteType.PlayerBullet:
          this.ctx.fillRect(x - hw, y - hh, sprite.width, sprite.height);
          break;
        case SpriteType.Enemy:
          this.drawEnemy(x, y, sprite.width, sprite.height, sprite.color);
          break;
        case SpriteType.EnemyBullet:
          this.ctx.beginPath();
          this.ctx.arc(x, y, sprite.width / 2, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case SpriteType.Boss:
          this.drawBoss(x, y, sprite.width, sprite.height, sprite.color);
          break;
        case SpriteType.Drop:
          this.drawDrop(x, y, sprite.width, sprite.height, sprite.color);
          break;
        case SpriteType.Explosion:
          this.ctx.globalAlpha = Math.max(0, sprite.frame / 20);
          this.ctx.beginPath();
          this.ctx.arc(x, y, sprite.width / 2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalAlpha = 1;
          break;
        default:
          this.ctx.fillRect(x - hw, y - hh, sprite.width, sprite.height);
      }
    }
  }

  private drawPlayer(x: number, y: number, w: number, h: number, color: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    // Triangle ship shape
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);          // nose
    ctx.lineTo(x - w / 2, y + h / 2);  // left wing
    ctx.lineTo(x + w / 2, y + h / 2);  // right wing
    ctx.closePath();
    ctx.fill();
    // Engine glow
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(x - 4, y + h / 2, 8, 4);
  }

  private drawEnemy(x: number, y: number, w: number, h: number, color: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    // Inverted triangle
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h / 2);
    ctx.lineTo(x + w / 2, y - h / 2);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x - w / 2, y - h / 2);
    ctx.lineTo(x + w / 2, y - h / 2);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawBoss(x: number, y: number, w: number, h: number, color: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    // Hexagonal shape
    const hw = w / 2;
    const hh = h / 2;
    ctx.beginPath();
    ctx.moveTo(x - hw * 0.6, y - hh);
    ctx.lineTo(x + hw * 0.6, y - hh);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x + hw * 0.6, y + hh);
    ctx.lineTo(x - hw * 0.6, y + hh);
    ctx.lineTo(x - hw, y);
    ctx.closePath();
    ctx.fill();
    // Core glow
    ctx.fillStyle = '#ffffff44';
    ctx.beginPath();
    ctx.arc(x, y, hw * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawDrop(x: number, y: number, w: number, _h: number, color: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    // Diamond shape
    const s = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s, y);
    ctx.closePath();
    ctx.fill();
  }
}
