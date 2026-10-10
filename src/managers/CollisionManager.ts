import { DeathCause } from '@/config/CollisionConfig';

export type HazardHitCallback = () => void;
export type CollectibleHitCallback = (
  player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  collectible: Phaser.Types.Physics.Arcade.GameObjectWithBody,
) => void;

/**
 * Centralizes Arcade collision wiring for ground, hazards, and collectibles.
 * Collectible overlap is registered now so Milestone 8 can drop items into the group.
 */
export class CollisionManager {
  private readonly scene: Phaser.Scene;
  private readonly collectibleGroup: Phaser.Physics.Arcade.Group;
  private groundCollider: Phaser.Physics.Arcade.Collider | null = null;
  private hazardOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private collectibleOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.collectibleGroup = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
  }

  setupGroundCollision(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ground: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    this.groundCollider?.destroy();
    this.groundCollider = this.scene.physics.add.collider(player, ground);
  }

  setupHazardOverlap(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    hazards: Phaser.GameObjects.Group,
    onHit: HazardHitCallback,
  ): void {
    this.hazardOverlap?.destroy();
    this.hazardOverlap = this.scene.physics.add.overlap(
      player,
      hazards,
      () => {
        if (!this.enabled) {
          return;
        }
        onHit();
      },
      undefined,
      this,
    );
  }

  setupCollectibleOverlap(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    onCollect: CollectibleHitCallback,
  ): void {
    this.collectibleOverlap?.destroy();
    this.collectibleOverlap = this.scene.physics.add.overlap(
      player,
      this.collectibleGroup,
      (playerObj, collectibleObj) => {
        if (!this.enabled) {
          return;
        }
        onCollect(
          playerObj as Phaser.Types.Physics.Arcade.GameObjectWithBody,
          collectibleObj as Phaser.Types.Physics.Arcade.GameObjectWithBody,
        );
      },
      undefined,
      this,
    );
  }

  getCollectibleGroup(): Phaser.Physics.Arcade.Group {
    return this.collectibleGroup;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  resolveDeathCause(fromObstacle: boolean): DeathCause {
    return fromObstacle ? DeathCause.Obstacle : DeathCause.Fall;
  }

  destroy(): void {
    this.groundCollider?.destroy();
    this.hazardOverlap?.destroy();
    this.collectibleOverlap?.destroy();
    this.groundCollider = null;
    this.hazardOverlap = null;
    this.collectibleOverlap = null;

    // Group may already be mid-teardown when the scene shuts down.
    try {
      if (this.collectibleGroup?.scene) {
        this.collectibleGroup.clear(true, true);
        this.collectibleGroup.destroy(true);
      }
    } catch {
      // Ignore Phaser teardown races.
    }
  }
}
