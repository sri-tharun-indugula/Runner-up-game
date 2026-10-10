import {
  DifficultyConfig,
  type DifficultySnapshot,
} from '@/config/DifficultyConfig';
import { ObstacleType } from '@/config/ObstacleConfig';

export class DifficultyManager {
  private snapshot: DifficultySnapshot = DifficultyManager.createBaseline();

  update(distance: number): DifficultySnapshot {
    const progress = DifficultyManager.computeProgress(distance);
    const speedMultiplier =
      1 + (DifficultyConfig.speed.maxMultiplier - 1) * progress;
    const spawnFrequencyMultiplier =
      1 + (DifficultyConfig.spawn.frequencyMultiplierAtMax - 1) * progress;

    this.snapshot = {
      progress,
      speedMultiplier,
      scrollSpeed: DifficultyConfig.speed.base * speedMultiplier,
      spawnFrequencyMultiplier,
      weightBonuses: {
        [ObstacleType.Spike]: 0,
        [ObstacleType.Rock]: Math.floor(
          DifficultyConfig.complexity.rockWeightBonus * progress,
        ),
        [ObstacleType.Moving]: Math.floor(
          DifficultyConfig.complexity.movingWeightBonus * progress,
        ),
        [ObstacleType.Pit]: Math.floor(
          DifficultyConfig.complexity.pitWeightBonus * progress,
        ),
      },
      pitWidthBonus: Math.floor(DifficultyConfig.complexity.pitWidthBonusMax * progress),
      movingSpeedBonus: DifficultyConfig.complexity.movingSpeedBonus * progress,
      doubleSpawnChance: DifficultyConfig.complexity.doubleSpawnChanceAtMax * progress,
      displayLevel: Math.max(
        1,
        Math.ceil(progress * DifficultyConfig.display.maxDisplayLevel),
      ),
    };

    return this.snapshot;
  }

  getSnapshot(): DifficultySnapshot {
    return this.snapshot;
  }

  reset(): void {
    this.snapshot = DifficultyManager.createBaseline();
  }

  /** Smoothstep to rampDistance, then asymptotic ease toward soft cap. */
  static computeProgress(distance: number): number {
    const clamped = Math.max(0, distance);
    const { rampDistance, softCapDistance } = DifficultyConfig;

    if (clamped <= rampDistance) {
      const t = clamped / rampDistance;
      return t * t * (3 - 2 * t);
    }

    const extra = clamped - rampDistance;
    const softRange = Math.max(1, softCapDistance - rampDistance);
    const softT = 1 - Math.exp(-extra / softRange);
    return Math.min(1, 0.85 + softT * 0.15);
  }

  private static createBaseline(): DifficultySnapshot {
    return {
      progress: 0,
      speedMultiplier: 1,
      scrollSpeed: DifficultyConfig.speed.base,
      spawnFrequencyMultiplier: 1,
      weightBonuses: {
        [ObstacleType.Spike]: 0,
        [ObstacleType.Rock]: 0,
        [ObstacleType.Moving]: 0,
        [ObstacleType.Pit]: 0,
      },
      pitWidthBonus: 0,
      movingSpeedBonus: 0,
      doubleSpawnChance: 0,
      displayLevel: 1,
    };
  }
}
