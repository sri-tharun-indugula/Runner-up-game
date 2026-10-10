import { CollectibleConfig, CollectibleType, type CollectResult } from '@/config/CollectibleConfig';
import {
  BaseCollectible,
  CoinCollectible,
  COLLECTIBLE_DATA_KEY,
  ExtraLifeCollectible,
  GemCollectible,
  MagnetCollectible,
  ScorePickupCollectible,
  ShieldCollectible,
  SlowMotionCollectible,
  SpeedBoostCollectible,
} from '@/entities/collectibles/BaseCollectible';
import { CollectibleSpawner } from '@/managers/CollectibleSpawner';
import type { PitRegistry } from '@/managers/PitRegistry';
import type { PowerUpManager } from '@/managers/PowerUpManager';
import { ObjectPool } from '@/utils/ObjectPool';

type CollectibleFactory = () => BaseCollectible;

export class CollectibleManager {
  private readonly scene: Phaser.Scene;
  private readonly pitRegistry: PitRegistry;
  private readonly collectibleGroup: Phaser.Physics.Arcade.Group;
  private readonly powerUps: PowerUpManager;
  private readonly spawner = new CollectibleSpawner();
  private readonly pools = new Map<CollectibleType, ObjectPool<BaseCollectible>>();
  private readonly onCollected: (result: CollectResult) => void;

  constructor(
    scene: Phaser.Scene,
    pitRegistry: PitRegistry,
    collectibleGroup: Phaser.Physics.Arcade.Group,
    powerUps: PowerUpManager,
    onCollected: (result: CollectResult) => void,
  ) {
    this.scene = scene;
    this.pitRegistry = pitRegistry;
    this.collectibleGroup = collectibleGroup;
    this.powerUps = powerUps;
    this.onCollected = onCollected;
    this.initializePools();
  }

  update(
    scrollX: number,
    distance: number,
    deltaMs: number,
    playerX: number,
    playerY: number,
  ): void {
    this.trySpawn(distance);
    this.updateActive(deltaMs, playerX, playerY);
    this.recycle(scrollX);
  }

  handleOverlap(
    collectibleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const sprite = collectibleObj as Phaser.Physics.Arcade.Sprite;
    const collectible = sprite.getData(COLLECTIBLE_DATA_KEY) as BaseCollectible | undefined;
    if (!collectible || !collectible.isActive()) {
      return;
    }

    const result = collectible.getCollectResult();
    if (result.powerUp) {
      this.powerUps.tryActivate(result.powerUp);
    }

    this.collectibleGroup.remove(sprite, false, false);
    collectible.collect(() => {
      const pool = this.pools.get(collectible.getType());
      pool?.release(collectible);
    });

    this.onCollected(result);
  }

  destroy(): void {
    for (const pool of this.pools.values()) {
      pool.destroy((item) => {
        // Skip group.remove during scene teardown — Physics.Group children
        // may already be cleared, and remove() throws (reading 'contains').
        item.destroy();
      });
    }
    this.pools.clear();
    this.spawner.reset();
  }

  private initializePools(): void {
    const factories: Record<CollectibleType, CollectibleFactory> = {
      [CollectibleType.Coin]: () => new CoinCollectible(this.scene),
      [CollectibleType.Gem]: () => new GemCollectible(this.scene),
      [CollectibleType.Magnet]: () => new MagnetCollectible(this.scene),
      [CollectibleType.ScorePickup]: () => new ScorePickupCollectible(this.scene),
      [CollectibleType.Shield]: () => new ShieldCollectible(this.scene),
      [CollectibleType.SpeedBoost]: () => new SpeedBoostCollectible(this.scene),
      [CollectibleType.SlowMotion]: () => new SlowMotionCollectible(this.scene),
      [CollectibleType.ExtraLife]: () => new ExtraLifeCollectible(this.scene),
    };

    for (const type of Object.values(CollectibleType)) {
      this.pools.set(
        type,
        new ObjectPool(() => factories[type](), CollectibleConfig.poolSize[type]),
      );
    }
  }

  private trySpawn(distance: number): void {
    if (!this.spawner.shouldSpawn(distance)) {
      return;
    }

    const spawnData = this.spawner.consumeSpawn(distance, this.pitRegistry);
    if (!spawnData) {
      return;
    }

    const pool = this.pools.get(spawnData.type);
    if (!pool) {
      return;
    }

    const collectible = pool.acquire();
    if (!collectible) {
      return;
    }
    collectible.activate(spawnData);
    this.collectibleGroup.add(collectible.getSprite());
  }

  private updateActive(deltaMs: number, playerX: number, playerY: number): void {
    const magnetActive = this.powerUps.isMagnetActive();
    const pullRadius = this.powerUps.getMagnetPullRadius();
    const pullSpeed = this.powerUps.getMagnetPullSpeed();

    for (const pool of this.pools.values()) {
      for (const collectible of pool.getActive()) {
        collectible.update(deltaMs, magnetActive, playerX, playerY, pullRadius, pullSpeed);
      }
    }
  }

  private recycle(scrollX: number): void {
    const threshold = scrollX - CollectibleConfig.recycleMargin;

    for (const pool of this.pools.values()) {
      for (const collectible of [...pool.getActive()]) {
        if (collectible.getRight() < threshold) {
          this.collectibleGroup.remove(collectible.getSprite(), false, false);
          collectible.deactivate();
          pool.release(collectible);
        }
      }
    }
  }
}
