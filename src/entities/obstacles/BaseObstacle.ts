import { AnimationConfig } from '@/config/AnimationConfig';
import { GroundTileConfig } from '@/config/GroundConfig';
import { ObstacleConfig, ObstacleType, type ObstacleSpawnData } from '@/config/ObstacleConfig';
import { AssetKeys } from '@/config/AssetKeys';
import { PitRegistry } from '@/managers/PitRegistry';

export abstract class BaseObstacle {
  protected readonly sprite: Phaser.Physics.Arcade.Sprite;
  protected active = false;
  protected worldX = 0;
  protected motionTween: Phaser.Tweens.Tween | null = null;

  constructor(
    protected readonly scene: Phaser.Scene,
    protected readonly pitRegistry: PitRegistry,
    textureKey: string,
    isStatic: boolean,
  ) {
    this.sprite = isStatic
      ? (scene.physics.add.staticSprite(0, 0, textureKey) as Phaser.Physics.Arcade.Sprite)
      : (scene.physics.add.sprite(0, 0, textureKey) as Phaser.Physics.Arcade.Sprite);

    this.sprite.setDepth(ObstacleConfig.depth);
    this.sprite.setVisible(false);
    this.sprite.setActive(false);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
  }

  abstract getType(): ObstacleType;

  activate(data: ObstacleSpawnData): void {
    this.active = true;
    this.worldX = data.worldX;
    this.sprite.setVisible(true);
    this.sprite.setActive(true);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
    body.enable = true;
    this.onActivate(data);
  }

  deactivate(): void {
    this.stopMotionTween();
    this.onDeactivate();
    this.active = false;
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    this.sprite.setAngle(0);
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
  }

  isActive(): boolean {
    return this.active;
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  getWorldX(): number {
    return this.worldX;
  }

  getRight(): number {
    return this.sprite.x + this.sprite.displayWidth / 2;
  }

  update(_deltaMs: number, _difficulty: number): void {
    // Override in subclasses that need per-frame updates
  }

  protected getGroundY(): number {
    return GroundTileConfig.surfaceY;
  }

  protected stopMotionTween(): void {
    this.motionTween?.stop();
    this.motionTween = null;
  }

  protected abstract onActivate(data: ObstacleSpawnData): void;
  protected abstract onDeactivate(): void;

  destroy(): void {
    this.deactivate();
    this.sprite.destroy();
  }
}

export class SpikeObstacle extends BaseObstacle {
  constructor(scene: Phaser.Scene, pitRegistry: PitRegistry) {
    super(scene, pitRegistry, AssetKeys.Atlases.Obstacles, true);
    this.sprite.setFrame(AssetKeys.Frames.ObstacleSpike);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(ObstacleConfig.spike.width, ObstacleConfig.spike.height);
  }

  getType(): ObstacleType {
    return ObstacleType.Spike;
  }

  protected onActivate(data: ObstacleSpawnData): void {
    // Origin at feet keeps pulse planted on the ground.
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setPosition(data.worldX, this.getGroundY());
    this.sprite.setScale(1);
    this.sprite.refreshBody();
    this.motionTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: AnimationConfig.obstacle.spikePulseScale,
      duration: AnimationConfig.obstacle.spikePulseMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  protected onDeactivate(): void {
    this.sprite.setScale(1);
  }
}

export class RockObstacle extends BaseObstacle {
  constructor(scene: Phaser.Scene, pitRegistry: PitRegistry) {
    super(scene, pitRegistry, AssetKeys.Atlases.Obstacles, true);
    this.sprite.setFrame(AssetKeys.Frames.ObstacleRock);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(ObstacleConfig.rock.width, ObstacleConfig.rock.height);
  }

  getType(): ObstacleType {
    return ObstacleType.Rock;
  }

  protected onActivate(data: ObstacleSpawnData): void {
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setPosition(data.worldX, this.getGroundY());
    this.sprite.setAngle(0);
    this.sprite.setScale(1);
    this.sprite.refreshBody();
    this.motionTween = this.scene.tweens.add({
      targets: this.sprite,
      angle: {
        from: -AnimationConfig.obstacle.rockWobbleDegrees,
        to: AnimationConfig.obstacle.rockWobbleDegrees,
      },
      duration: AnimationConfig.obstacle.rockWobbleMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  protected onDeactivate(): void {
    this.sprite.setAngle(0);
  }
}

export class MovingObstacle extends BaseObstacle {
  private baseY = 0;
  private movePhase = 0;
  private moveSpeed: number = ObstacleConfig.moving.speed;

  constructor(scene: Phaser.Scene, pitRegistry: PitRegistry) {
    super(scene, pitRegistry, AssetKeys.Atlases.Obstacles, false);
    this.sprite.setFrame(AssetKeys.Frames.ObstacleMoving);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDisplaySize(ObstacleConfig.moving.width, ObstacleConfig.moving.height);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
  }

  getType(): ObstacleType {
    return ObstacleType.Moving;
  }

  protected onActivate(data: ObstacleSpawnData): void {
    this.baseY = this.getGroundY() - ObstacleConfig.moving.height / 2 - 40;
    this.movePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.moveSpeed =
      ObstacleConfig.moving.speed +
      (data.difficulty - 1) * ObstacleConfig.difficulty.movingSpeedBonus;
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setPosition(data.worldX, this.baseY);
    this.sprite.setAngle(0);
    this.sprite.setScale(1);
    this.motionTween = this.scene.tweens.add({
      targets: this.sprite,
      scale: AnimationConfig.obstacle.movingPulseScale,
      alpha: { from: 1, to: 0.82 },
      duration: AnimationConfig.obstacle.movingPulseMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(deltaMs: number, _difficulty: number): void {
    if (!this.active) {
      return;
    }

    this.movePhase += (this.moveSpeed * deltaMs) / 1000;
    const offsetY = Math.sin(this.movePhase) * ObstacleConfig.moving.amplitude;
    this.sprite.setY(this.baseY + offsetY);
  }

  protected onDeactivate(): void {
    this.movePhase = 0;
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
  }
}

export class PitObstacle extends BaseObstacle {
  private pitStartX = 0;
  private pitWidth = 0;
  private leftMarker!: Phaser.GameObjects.Image;
  private rightMarker!: Phaser.GameObjects.Image;
  private markerTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, pitRegistry: PitRegistry) {
    super(scene, pitRegistry, AssetKeys.Atlases.Obstacles, true);
    this.sprite.setFrame(AssetKeys.Frames.ObstacleSpike);
    this.sprite.setVisible(false);

    this.leftMarker = scene.add.image(
      0,
      0,
      AssetKeys.Atlases.Obstacles,
      AssetKeys.Frames.ObstaclePitMarker,
    );
    this.rightMarker = scene.add.image(
      0,
      0,
      AssetKeys.Atlases.Obstacles,
      AssetKeys.Frames.ObstaclePitMarker,
    );
    this.leftMarker.setOrigin(0.5, 1);
    this.rightMarker.setOrigin(0.5, 1);
    this.leftMarker.setDepth(ObstacleConfig.depth);
    this.rightMarker.setDepth(ObstacleConfig.depth);
    this.leftMarker.setVisible(false);
    this.rightMarker.setVisible(false);
  }

  getType(): ObstacleType {
    return ObstacleType.Pit;
  }

  protected onActivate(data: ObstacleSpawnData): void {
    this.pitWidth = data.pitWidth ?? ObstacleConfig.pitWidth.min;
    this.pitStartX = data.worldX - this.pitWidth / 2;

    this.pitRegistry.register(this.pitStartX, this.pitWidth);

    const markerY = this.getGroundY();
    this.leftMarker.setPosition(this.pitStartX, markerY);
    this.rightMarker.setPosition(this.pitStartX + this.pitWidth, markerY);
    this.leftMarker.setVisible(true);
    this.rightMarker.setVisible(true);
    this.leftMarker.setAlpha(1);
    this.rightMarker.setAlpha(1);

    this.markerTween?.stop();
    this.markerTween = this.scene.tweens.add({
      targets: [this.leftMarker, this.rightMarker],
      alpha: 0.4,
      duration: AnimationConfig.obstacle.pitBlinkMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    this.sprite.setVisible(false);
  }

  protected onDeactivate(): void {
    this.markerTween?.stop();
    this.markerTween = null;
    this.pitRegistry.unregister(this.pitStartX);
    this.leftMarker.setVisible(false);
    this.rightMarker.setVisible(false);
  }

  getPitWidth(): number {
    return this.pitWidth;
  }

  destroy(): void {
    this.markerTween?.stop();
    this.leftMarker.destroy();
    this.rightMarker.destroy();
    super.destroy();
  }
}
