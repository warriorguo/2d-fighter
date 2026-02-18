/**
 * Parallax multi-layer background scrolling with star field.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

interface ParallaxLayer {
  color: string;
  speed: number;
  offset: number;
  stars: Star[];
}

export class ParallaxBackground {
  private layers: ParallaxLayer[] = [];

  init(layerConfigs: Array<{ color: string; speed: number; stars?: number }>): void {
    this.layers = layerConfigs.map(cfg => {
      const stars: Star[] = [];
      const starCount = cfg.stars || 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * GAME_WIDTH,
          y: Math.random() * GAME_HEIGHT,
          size: 0.5 + Math.random() * 1.5,
          brightness: 0.3 + Math.random() * 0.7,
        });
      }
      return {
        color: cfg.color,
        speed: cfg.speed,
        offset: 0,
        stars,
      };
    });
  }

  update(): void {
    for (const layer of this.layers) {
      layer.offset = (layer.offset + layer.speed) % GAME_HEIGHT;
      // Move stars
      for (const star of layer.stars) {
        star.y = (star.y + layer.speed) % GAME_HEIGHT;
        if (star.y < 0) star.y += GAME_HEIGHT;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw base background
    if (this.layers.length > 0) {
      ctx.fillStyle = this.layers[0].color;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Draw stars per layer
    for (const layer of this.layers) {
      for (const star of layer.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    }
  }
}
