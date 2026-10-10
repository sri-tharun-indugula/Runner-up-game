import {
  CollectibleConfig,
  CollectibleToPowerUp,
  CollectibleType,
  type CollectibleSpawnData,
  type CollectResult,
} from '@/config/CollectibleConfig';
import { GroundTileConfig } from '@/config/GroundConfig';
import { CollectibleAnimationRegistry } from '@/managers/CollectibleAnimationRegistry';

export const COLLECTIBLE_DATA_KEY = 'collectibleRef';

export abstract class BaseCollectible {
  protected readonly sprite: Phaser.Physics.Arcade.Sprite;
  protected active = false;
  protected collecting = false;
  protected baseY = 0;
  protected hoverPhase = 0;
  private collectTween: Phaser.Tweens.Tween | null = null;

  constructor(
    protected readonly scene: Phaser.Scene,
    type: CollectibleType,
  ) {
    CollectibleAnimationRegistry.register(scene);

    const textureKey = CollectibleAnimationRegistry.getTextureKey(type);
    this.sprite = scene.physics.add.sprite(0, 0, textureKey);
    this.sprite.setDepth(CollectibleConfig.depth);
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    this.sprite.setData(COLLECTIBLE_DATA_KEY, this);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setImmovable(true);
    body.enable = false;

    const size = CollectibleConfig.sizes[type];
    this.sprite.setDisplaySize(size.width, size.height);
    body.setSize(size.width * 0.7, size.height * 0.7);
  }

  abstract getType(): CollectibleType;

  activate(data: CollectibleSpawnData): void {
    this.active = true;
    this.collecting = false;
    this.hoverPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    const height = CollectibleConfig.heights[data.heightKey];
    this.baseY = GroundTileConfig.surfaceY - height;

    this.sprite.setPosition(data.worldX, this.baseY);
    this.sprite.setVisible(true);
    this.sprite.setActive(true);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setAngle(0);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(data.worldX, this.baseY);

    this.sprite.play(CollectibleAnimationRegistry.getAnimationKey(this.getType()), true);
  }

  deactivate(): void {
    this.collectTween?.stop();
    this.collectTween = null;
    this.active = false;
    this.collecting = false;
    this.sprite.anims.stop();
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setAngle(0);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  isActive(): boolean {
    return this.active && !this.collecting;
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  getRight(): number {
    return this.sprite.x + this.sprite.displayWidth / 2;
  }

  getCollectResult(): CollectResult {
    const values = CollectibleConfig.values[this.getType()];
    return {
      type: this.getType(),
      points: values.points,
      coins: values.coins,
      powerUp: CollectibleToPowerUp[this.getType()],
    };
  }

  collect(onComplete: () => void): void {
    if (!this.active || this.collecting) {
      return;
    }

    this.collecting = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.collectTween = this.scene.tweens.add({
      targets: this.sprite,
      scale: CollectibleConfig.collectScalePop,
      alpha: 0,
      angle: 90,
      y: this.sprite.y - 40,
      duration: CollectibleConfig.collectAnimDurationMs,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.deactivate();
        onComplete();
      },
    });
  }

  update(
    deltaMs: number,
    magnetActive: boolean,
    playerX: number,
    playerY: number,
    pullRadius: number,
    pullSpeed: number,
  ): void {
    if (!this.active || this.collecting) {
      return;
    }

    if (magnetActive && this.isPullable()) {
      this.pullToward(playerX, playerY, deltaMs, pullRadius, pullSpeed);
      return;
    }

    this.hoverPhase += (CollectibleConfig.hoverSpeed * deltaMs) / 1000;
    const offsetY = Math.sin(this.hoverPhase) * CollectibleConfig.hoverAmplitude;
    this.sprite.setY(this.baseY + offsetY);
  }

  protected isPullable(): boolean {
    return (
      this.getType() === CollectibleType.Coin ||
      this.getType() === CollectibleType.Gem ||
      this.getType() === CollectibleType.ScorePickup
    );
  }

  private pullToward(
    playerX: number,
    playerY: number,
    deltaMs: number,
    pullRadius: number,
    pullSpeed: number,
  ): void {
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const distance = Math.hypot(dx, dy);

    if (distance > pullRadius || distance < 1) {
      this.hoverPhase += (CollectibleConfig.hoverSpeed * deltaMs) / 1000;
      const offsetY = Math.sin(this.hoverPhase) * CollectibleConfig.hoverAmplitude;
      this.sprite.setY(this.baseY + offsetY);
      return;
    }

    const step = (pullSpeed * deltaMs) / 1000;
    const ratio = Math.min(1, step / distance);
    this.sprite.x += dx * ratio;
    this.sprite.y += dy * ratio;
    this.baseY = this.sprite.y;
  }

  destroy(): void {
    this.collectTween?.stop();
    this.sprite.destroy();
  }
}

export class CoinCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.Coin);
  }

  getType(): CollectibleType {
    return CollectibleType.Coin;
  }
}

export class GemCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.Gem);
  }

  getType(): CollectibleType {
    return CollectibleType.Gem;
  }
}

export class MagnetCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.Magnet);
  }

  getType(): CollectibleType {
    return CollectibleType.Magnet;
  }
}

export class ScorePickupCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.ScorePickup);
  }

  getType(): CollectibleType {
    return CollectibleType.ScorePickup;
  }
}

export class ShieldCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.Shield);
  }

  getType(): CollectibleType {
    return CollectibleType.Shield;
  }
}

export class SpeedBoostCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.SpeedBoost);
  }

  getType(): CollectibleType {
    return CollectibleType.SpeedBoost;
  }
}

export class SlowMotionCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.SlowMotion);
  }

  getType(): CollectibleType {
    return CollectibleType.SlowMotion;
  }
}

export class ExtraLifeCollectible extends BaseCollectible {
  constructor(scene: Phaser.Scene) {
    super(scene, CollectibleType.ExtraLife);
  }

  getType(): CollectibleType {
    return CollectibleType.ExtraLife;
  }
}
