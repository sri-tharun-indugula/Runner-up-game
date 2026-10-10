import { PowerUpType } from '@/config/PowerUpConfig';

export enum CollectibleType {
  Coin = 'coin',
  Gem = 'gem',
  Magnet = 'magnet',
  ScorePickup = 'score',
  Shield = 'shield',
  SpeedBoost = 'speed',
  SlowMotion = 'slow',
  ExtraLife = 'life',
}

export const CollectibleToPowerUp: Partial<Record<CollectibleType, PowerUpType>> = {
  [CollectibleType.Magnet]: PowerUpType.Magnet,
  [CollectibleType.Shield]: PowerUpType.Shield,
  [CollectibleType.SpeedBoost]: PowerUpType.SpeedBoost,
  [CollectibleType.SlowMotion]: PowerUpType.SlowMotion,
  [CollectibleType.ExtraLife]: PowerUpType.ExtraLife,
};

export const CollectibleConfig = {
  safeZoneDistance: 420,
  minSpawnInterval: 160,
  maxSpawnInterval: 380,
  spawnAheadMin: 480,
  spawnAheadMax: 920,
  recycleMargin: 200,
  depth: 8,
  hoverAmplitude: 10,
  hoverSpeed: 3.2,
  collectScalePop: 1.45,
  collectAnimDurationMs: 180,
  heights: {
    low: 70,
    mid: 130,
    high: 200,
  },
  poolSize: {
    [CollectibleType.Coin]: 24,
    [CollectibleType.Gem]: 10,
    [CollectibleType.Magnet]: 4,
    [CollectibleType.ScorePickup]: 8,
    [CollectibleType.Shield]: 4,
    [CollectibleType.SpeedBoost]: 4,
    [CollectibleType.SlowMotion]: 4,
    [CollectibleType.ExtraLife]: 3,
  },
  weights: {
    [CollectibleType.Coin]: 48,
    [CollectibleType.Gem]: 16,
    [CollectibleType.Magnet]: 7,
    [CollectibleType.ScorePickup]: 12,
    [CollectibleType.Shield]: 9,
    [CollectibleType.SpeedBoost]: 6,
    [CollectibleType.SlowMotion]: 5,
    [CollectibleType.ExtraLife]: 5,
  },
  values: {
    [CollectibleType.Coin]: { points: 10, coins: 1 },
    [CollectibleType.Gem]: { points: 50, coins: 5 },
    [CollectibleType.Magnet]: { points: 0, coins: 0 },
    [CollectibleType.ScorePickup]: { points: 100, coins: 0 },
    [CollectibleType.Shield]: { points: 0, coins: 0 },
    [CollectibleType.SpeedBoost]: { points: 0, coins: 0 },
    [CollectibleType.SlowMotion]: { points: 0, coins: 0 },
    [CollectibleType.ExtraLife]: { points: 0, coins: 0 },
  },
  sizes: {
    [CollectibleType.Coin]: { width: 28, height: 28 },
    [CollectibleType.Gem]: { width: 32, height: 32 },
    [CollectibleType.Magnet]: { width: 36, height: 36 },
    [CollectibleType.ScorePickup]: { width: 34, height: 34 },
    [CollectibleType.Shield]: { width: 34, height: 34 },
    [CollectibleType.SpeedBoost]: { width: 34, height: 34 },
    [CollectibleType.SlowMotion]: { width: 34, height: 34 },
    [CollectibleType.ExtraLife]: { width: 34, height: 34 },
  },
  frameCount: 6,
} as const;

export interface CollectibleSpawnData {
  type: CollectibleType;
  worldX: number;
  heightKey: keyof typeof CollectibleConfig.heights;
}

export interface CollectResult {
  type: CollectibleType;
  points: number;
  coins: number;
  powerUp?: PowerUpType;
}
