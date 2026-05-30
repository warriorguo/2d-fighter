/**
 * Shop config — currency-driven shop persisted to localStorage. Single-player only.
 * Credits are banked from previous runs' total score; upgrades cost credits.
 */

import type { GameSimulation } from 'shared/simulation.js';
import { PLAYER_START_HP } from 'shared/constants.js';

const STORAGE_KEY = '2d-fighter:shop';

export interface ShopConfig {
  credits: number;             // banked from previous runs
  startingBombs: number;
  startingWeaponLevel: number;
  bonusMaxHP: number;
  scoreMultiplier: number;
  bulletDamageBonus: number;
  speedBoost: number;
  explosiveBullets: number;
}

export function defaultShopConfig(): ShopConfig {
  return {
    credits: 0,
    startingBombs: 3,
    startingWeaponLevel: 1,
    bonusMaxHP: 0,
    scoreMultiplier: 1,
    bulletDamageBonus: 0,
    speedBoost: 1,
    explosiveBullets: 0,
  };
}

export function loadShopConfig(): ShopConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultShopConfig();
    const parsed = JSON.parse(raw);
    return { ...defaultShopConfig(), ...parsed };
  } catch {
    return defaultShopConfig();
  }
}

export function saveShopConfig(cfg: ShopConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export interface ShopTier {
  value: number;
  cost: number; // cost to step UP from previous tier
}

export interface ShopItem {
  key: Exclude<keyof ShopConfig, 'credits'>;
  label: string;
  tiers: ShopTier[];
  format: (v: number) => string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    key: 'startingBombs', label: 'Starting Bombs',
    tiers: [
      { value: 3, cost: 0 },
      { value: 5, cost: 2000 },
      { value: 7, cost: 5000 },
      { value: 9, cost: 12000 },
    ],
    format: (v) => `${v}`,
  },
  {
    key: 'startingWeaponLevel', label: 'Weapon Level',
    tiers: [
      { value: 1, cost: 0 },
      { value: 2, cost: 1000 },
      { value: 3, cost: 3000 },
      { value: 4, cost: 8000 },
      { value: 5, cost: 20000 },
    ],
    format: (v) => `${v}`,
  },
  {
    key: 'bonusMaxHP', label: 'Bonus Max HP',
    tiers: [
      { value: 0, cost: 0 },
      { value: 2, cost: 1500 },
      { value: 5, cost: 5000 },
      { value: 10, cost: 15000 },
    ],
    format: (v) => v === 0 ? 'off' : `+${v}`,
  },
  {
    key: 'bulletDamageBonus', label: 'Bigger Bullets',
    tiers: [
      { value: 0, cost: 0 },
      { value: 1, cost: 3000 },
      { value: 2, cost: 8000 },
      { value: 5, cost: 20000 },
    ],
    format: (v) => v === 0 ? 'off' : `+${v} dmg`,
  },
  {
    key: 'speedBoost', label: 'Speed Boost',
    tiers: [
      { value: 1, cost: 0 },
      { value: 1.25, cost: 3500 },
      { value: 1.5, cost: 8000 },
      { value: 2, cost: 18000 },
    ],
    format: (v) => v === 1 ? 'off' : `${v}x`,
  },
  {
    key: 'scoreMultiplier', label: 'Score Multiplier',
    tiers: [
      { value: 1, cost: 0 },
      { value: 2, cost: 6000 },
      { value: 3, cost: 15000 },
      { value: 5, cost: 40000 },
    ],
    format: (v) => `${v}x`,
  },
  {
    key: 'explosiveBullets', label: 'Explosive Bullets',
    tiers: [
      { value: 0, cost: 0 },
      { value: 1, cost: 10000 },
    ],
    format: (v) => v === 0 ? 'off' : 'RED BOOM',
  },
];

function currentTierIndex(cfg: ShopConfig, item: ShopItem): number {
  const cur = cfg[item.key];
  const idx = item.tiers.findIndex((t) => t.value === cur);
  return idx >= 0 ? idx : 0;
}

export function nextTier(cfg: ShopConfig, item: ShopItem): ShopTier | null {
  const idx = currentTierIndex(cfg, item);
  return idx < item.tiers.length - 1 ? item.tiers[idx + 1] : null;
}

export type BuyResult = 'ok' | 'maxed' | 'nofunds';

export function buyNext(cfg: ShopConfig, item: ShopItem): BuyResult {
  const next = nextTier(cfg, item);
  if (!next) return 'maxed';
  if (cfg.credits < next.cost) return 'nofunds';
  cfg.credits -= next.cost;
  cfg[item.key] = next.value;
  return 'ok';
}

/** Cumulative credits sunk into the current value of this item — used for refunds on reset. */
function cumulativeCostOfItem(item: ShopItem, value: number): number {
  let sum = 0;
  for (const tier of item.tiers) {
    sum += tier.cost;
    if (tier.value === value) return sum;
  }
  return sum;
}

export function resetShopConfig(cfg: ShopConfig): ShopConfig {
  // Refund credits sunk into upgrades, then reset values
  for (const item of SHOP_ITEMS) {
    cfg.credits += cumulativeCostOfItem(item, cfg[item.key]);
    cfg[item.key] = item.tiers[0].value;
  }
  saveShopConfig(cfg);
  return cfg;
}

/** Add scores from a completed run to the credit bank. */
export function bankScores(cfg: ShopConfig, scores: number[]): number {
  const total = scores.reduce((s, n) => s + Math.max(0, n | 0), 0);
  cfg.credits += total;
  saveShopConfig(cfg);
  return total;
}

/** Apply shop config to the simulation's player entities. Call right after createPlayer. */
export function applyShopConfig(sim: GameSimulation, cfg: ShopConfig): void {
  for (const [entity, tag] of sim.world.playerTag) {
    tag.bombs = cfg.startingBombs;
    tag.weaponLevel = cfg.startingWeaponLevel;
    tag.bulletDamageBonus = cfg.bulletDamageBonus;
    tag.speedMultiplier = cfg.speedBoost;
    tag.scoreMultiplier = cfg.scoreMultiplier;
    tag.explosiveBullets = cfg.explosiveBullets === 1;

    const hp = sim.world.health.get(entity);
    if (hp && cfg.bonusMaxHP > 0) {
      hp.max = PLAYER_START_HP + cfg.bonusMaxHP;
      hp.current = hp.max;
    }
  }
}
