import {
  CollectibleConfig,
  CollectibleType,
  type CollectibleSpawnData,
} from '@/config/CollectibleConfig';
import type { PitRegistry } from '@/managers/PitRegistry';

export class CollectibleSpawner {
  private nextSpawnDistance: number = CollectibleConfig.safeZoneDistance;

  reset(): void {
    this.nextSpawnDistance = CollectibleConfig.safeZoneDistance;
  }

  shouldSpawn(distance: number): boolean {
    return distance >= this.nextSpawnDistance;
  }

  consumeSpawn(distance: number, pitRegistry: PitRegistry): CollectibleSpawnData | null {
    const type = this.pickType();
    const worldX =
      distance +
      Phaser.Math.Between(CollectibleConfig.spawnAheadMin, CollectibleConfig.spawnAheadMax);

    const size = CollectibleConfig.sizes[type];
    const halfWidth = size.width / 2;
    if (pitRegistry.overlaps(worldX - halfWidth, worldX + halfWidth)) {
      this.nextSpawnDistance = distance + this.getSpawnInterval() * 0.5;
      return null;
    }

    const heightKey = this.pickHeight();
    this.nextSpawnDistance = distance + this.getSpawnInterval();

    return { type, worldX, heightKey };
  }

  private getSpawnInterval(): number {
    return Phaser.Math.Between(
      CollectibleConfig.minSpawnInterval,
      CollectibleConfig.maxSpawnInterval,
    );
  }

  private pickType(): CollectibleType {
    const entries = Object.entries(CollectibleConfig.weights) as [CollectibleType, number][];
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Phaser.Math.Between(1, total);

    for (const [type, weight] of entries) {
      roll -= weight;
      if (roll <= 0) {
        return type;
      }
    }

    return CollectibleType.Coin;
  }

  private pickHeight(): keyof typeof CollectibleConfig.heights {
    const roll = Phaser.Math.Between(1, 100);
    if (roll <= 45) {
      return 'low';
    }
    if (roll <= 80) {
      return 'mid';
    }
    return 'high';
  }
}
