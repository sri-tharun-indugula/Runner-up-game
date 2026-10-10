import type { DifficultySnapshot } from '@/config/DifficultyConfig';
import { DifficultyConfig } from '@/config/DifficultyConfig';
import { ObstacleConfig, ObstacleType, type ObstacleSpawnData } from '@/config/ObstacleConfig';

export class ObstacleSpawner {
  private nextSpawnDistance: number = ObstacleConfig.safeZoneDistance;

  reset(): void {
    this.nextSpawnDistance = ObstacleConfig.safeZoneDistance;
  }

  shouldSpawn(distance: number): boolean {
    return distance >= this.nextSpawnDistance;
  }

  consumeSpawn(distance: number, difficulty: DifficultySnapshot): ObstacleSpawnData[] {
    const primary = this.buildSpawn(distance, difficulty, 0);
    const spawns: ObstacleSpawnData[] = [primary];

    if (Math.random() < difficulty.doubleSpawnChance) {
      const gap = Phaser.Math.Between(
        DifficultyConfig.complexity.doubleSpawnGap.min,
        DifficultyConfig.complexity.doubleSpawnGap.max,
      );
      const secondary = this.buildSpawn(distance, difficulty, gap);
      // Avoid stacking a pit on another pit / tight hazard clusters over gaps.
      if (
        !(primary.type === ObstacleType.Pit && secondary.type === ObstacleType.Pit)
      ) {
        spawns.push(secondary);
      }
    }

    this.nextSpawnDistance = distance + this.getSpawnInterval(difficulty);
    return spawns;
  }

  private buildSpawn(
    distance: number,
    difficulty: DifficultySnapshot,
    extraAhead: number,
  ): ObstacleSpawnData {
    const type = this.pickObstacleType(difficulty);
    const worldX =
      distance +
      Phaser.Math.Between(ObstacleConfig.spawnAheadMin, ObstacleConfig.spawnAheadMax) +
      extraAhead;

    const spawnData: ObstacleSpawnData = {
      type,
      worldX,
      difficulty: 1 + difficulty.progress,
    };

    if (type === ObstacleType.Pit) {
      const maxWidth = ObstacleConfig.pitWidth.max + difficulty.pitWidthBonus;
      spawnData.pitWidth = Phaser.Math.Between(ObstacleConfig.pitWidth.min, maxWidth);
    }

    return spawnData;
  }

  private getSpawnInterval(difficulty: DifficultySnapshot): number {
    const base = Phaser.Math.Between(
      ObstacleConfig.minSpawnInterval,
      ObstacleConfig.maxSpawnInterval,
    );
    const scaled = base / difficulty.spawnFrequencyMultiplier;
    const minInterval =
      ObstacleConfig.minSpawnInterval * DifficultyConfig.spawn.minIntervalFactor;
    return Math.max(minInterval, scaled);
  }

  private pickObstacleType(difficulty: DifficultySnapshot): ObstacleType {
    const weights: Record<ObstacleType, number> = {
      [ObstacleType.Spike]:
        ObstacleConfig.weights[ObstacleType.Spike] + difficulty.weightBonuses[ObstacleType.Spike],
      [ObstacleType.Rock]:
        ObstacleConfig.weights[ObstacleType.Rock] + difficulty.weightBonuses[ObstacleType.Rock],
      [ObstacleType.Moving]:
        ObstacleConfig.weights[ObstacleType.Moving] +
        difficulty.weightBonuses[ObstacleType.Moving],
      [ObstacleType.Pit]:
        ObstacleConfig.weights[ObstacleType.Pit] + difficulty.weightBonuses[ObstacleType.Pit],
    };

    const entries = Object.entries(weights) as [ObstacleType, number][];
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Phaser.Math.Between(1, total);

    for (const [type, weight] of entries) {
      roll -= weight;
      if (roll <= 0) {
        return type;
      }
    }

    return ObstacleType.Spike;
  }
}
