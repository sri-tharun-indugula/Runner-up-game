import { SCROLL_SPEED } from '@/config/WorldConfig';
import { ObstacleType } from '@/config/ObstacleConfig';

export const DifficultyConfig = {
  /** Distance (m) at which difficulty reaches near-max. Higher = slower ramp. */
  rampDistance: 11000,
  /** Soft ceiling past rampDistance using asymptotic approach. */
  softCapDistance: 22000,

  speed: {
    base: SCROLL_SPEED,
    maxMultiplier: 1.55,
  },

  spawn: {
    minIntervalFactor: 0.55,
    frequencyMultiplierAtMax: 1.65,
  },

  complexity: {
    movingWeightBonus: 16,
    pitWeightBonus: 12,
    rockWeightBonus: 6,
    pitWidthBonusMax: 90,
    movingSpeedBonus: 1.4,
    doubleSpawnChanceAtMax: 0.14,
    doubleSpawnGap: { min: 180, max: 280 },
  },

  display: {
    /** Shown as Level 1..N in HUD. */
    maxDisplayLevel: 10,
  },
} as const;

export interface DifficultySnapshot {
  /** Smooth 0..1 progress used for all scaling curves. */
  progress: number;
  /** 1..max multiplier for scroll speed. */
  speedMultiplier: number;
  scrollSpeed: number;
  /** 1..max multiplier for spawn frequency. */
  spawnFrequencyMultiplier: number;
  /** Weight bonuses applied when picking obstacle types. */
  weightBonuses: Record<ObstacleType, number>;
  pitWidthBonus: number;
  movingSpeedBonus: number;
  doubleSpawnChance: number;
  /** Human-friendly 1..maxDisplayLevel. */
  displayLevel: number;
}
