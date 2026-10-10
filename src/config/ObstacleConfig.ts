export enum ObstacleType {
  Spike = 'spike',
  Rock = 'rock',
  Moving = 'moving',
  Pit = 'pit',
}

export const ObstacleConfig = {
  safeZoneDistance: 1600,
  minSpawnInterval: 560,
  maxSpawnInterval: 920,
  spawnAheadMin: 750,
  spawnAheadMax: 1200,
  recycleMargin: 200,
  depth: 6,
  poolSize: {
    [ObstacleType.Spike]: 14,
    [ObstacleType.Rock]: 10,
    [ObstacleType.Moving]: 8,
    [ObstacleType.Pit]: 6,
  },
  pitWidth: { min: 200, max: 300 },
  moving: {
    amplitude: 55,
    speed: 2.1,
    width: 48,
    height: 48,
  },
  /** Ground spike block — taller so jumps read clearly. */
  spike: { width: 44, height: 52 },
  /** Solid crate / rock block. */
  rock: { width: 56, height: 56 },
  difficulty: {
    /** @deprecated Prefer DifficultyConfig — kept for MovingObstacle fallback. */
    movingSpeedBonus: 1.4,
  },
  weights: {
    [ObstacleType.Spike]: 35,
    [ObstacleType.Rock]: 30,
    [ObstacleType.Moving]: 20,
    [ObstacleType.Pit]: 15,
  },
} as const;

export interface ObstacleSpawnData {
  type: ObstacleType;
  worldX: number;
  pitWidth?: number;
  difficulty: number;
}
