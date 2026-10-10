import type { DifficultySnapshot } from '@/config/DifficultyConfig';
import { ObstacleConfig, ObstacleType } from '@/config/ObstacleConfig';
import {
  BaseObstacle,
  MovingObstacle,
  PitObstacle,
  RockObstacle,
  SpikeObstacle,
} from '@/entities/obstacles/BaseObstacle';
import { ObstacleSpawner } from '@/managers/ObstacleSpawner';
import { PitRegistry } from '@/managers/PitRegistry';
import { ObjectPool } from '@/utils/ObjectPool';

type ObstacleFactory = () => BaseObstacle;

export class ObstacleManager {
  private readonly scene: Phaser.Scene;
  private readonly pitRegistry = new PitRegistry();
  private readonly spawner = new ObstacleSpawner();
  private readonly pools = new Map<ObstacleType, ObjectPool<BaseObstacle>>();
  private readonly hazardGroup: Phaser.GameObjects.Group;
  private readonly onPitChanged: () => void;
  private currentDifficulty = 1;

  constructor(scene: Phaser.Scene, onPitChanged: () => void) {
    this.scene = scene;
    this.onPitChanged = onPitChanged;
    this.hazardGroup = scene.add.group();
    this.initializePools();
  }

  update(
    scrollX: number,
    distance: number,
    deltaMs: number,
    difficulty: DifficultySnapshot,
  ): void {
    this.currentDifficulty = 1 + difficulty.progress;
    this.trySpawn(distance, difficulty);
    this.updateActive(deltaMs);
    this.recycle(scrollX);
  }

  getPitRegistry(): PitRegistry {
    return this.pitRegistry;
  }

  getHazardGroup(): Phaser.GameObjects.Group {
    return this.hazardGroup;
  }

  destroy(): void {
    for (const pool of this.pools.values()) {
      pool.destroy((obstacle) => obstacle.destroy());
    }
    this.pools.clear();
    this.hazardGroup.clear(false, false);
    this.hazardGroup.destroy(true);
    this.pitRegistry.clear();
    this.spawner.reset();
  }

  private initializePools(): void {
    const factories: Record<ObstacleType, ObstacleFactory> = {
      [ObstacleType.Spike]: () => new SpikeObstacle(this.scene, this.pitRegistry),
      [ObstacleType.Rock]: () => new RockObstacle(this.scene, this.pitRegistry),
      [ObstacleType.Moving]: () => new MovingObstacle(this.scene, this.pitRegistry),
      [ObstacleType.Pit]: () => new PitObstacle(this.scene, this.pitRegistry),
    };

    for (const type of Object.values(ObstacleType)) {
      const poolSize = ObstacleConfig.poolSize[type];
      this.pools.set(
        type,
        new ObjectPool(() => factories[type](), poolSize),
      );
    }
  }

  private trySpawn(distance: number, difficulty: DifficultySnapshot): void {
    if (!this.spawner.shouldSpawn(distance)) {
      return;
    }

    const spawnBatch = this.spawner.consumeSpawn(distance, difficulty);
    for (const spawnData of spawnBatch) {
      const pool = this.pools.get(spawnData.type);
      if (!pool) {
        continue;
      }

      const obstacle = pool.acquire();
      if (!obstacle) {
        continue;
      }
      obstacle.activate(spawnData);

      if (spawnData.type !== ObstacleType.Pit) {
        this.hazardGroup.add(obstacle.getSprite());
      }

      if (spawnData.type === ObstacleType.Pit) {
        this.onPitChanged();
      }
    }
  }

  private updateActive(deltaMs: number): void {
    for (const pool of this.pools.values()) {
      for (const obstacle of pool.getActive()) {
        obstacle.update(deltaMs, this.currentDifficulty);
      }
    }
  }

  private recycle(scrollX: number): void {
    const threshold = scrollX - ObstacleConfig.recycleMargin;

    for (const pool of this.pools.values()) {
      for (const obstacle of [...pool.getActive()]) {
        if (obstacle.getRight() < threshold) {
          const wasPit = obstacle.getType() === ObstacleType.Pit;
          if (!wasPit) {
            this.hazardGroup.remove(obstacle.getSprite(), false, false);
          }
          obstacle.deactivate();
          pool.release(obstacle);

          if (wasPit) {
            this.onPitChanged();
          }
        }
      }
    }
  }
}
