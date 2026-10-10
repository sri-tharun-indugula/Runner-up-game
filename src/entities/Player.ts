import { AnimationConfig } from '@/config/AnimationConfig';
import { AnimationKeys, PlayerState } from '@/config/AnimationKeys';
import { AssetKeys } from '@/config/AssetKeys';
import { SfxId } from '@/config/AudioConfig';
import { CollisionConfig, DeathCause } from '@/config/CollisionConfig';
import { PhysicsConfig } from '@/config/PhysicsConfig';
import { PlayerConfig } from '@/config/PlayerConfig';
import { AudioManager } from '@/managers/AudioManager';
import { LandingDetector, type LandingEvent } from '@/managers/LandingDetector';
import { PlayerAnimationRegistry } from '@/managers/PlayerAnimationRegistry';

export interface PlayerFxHooks {
  onJump?: (x: number, y: number, isDoubleJump: boolean) => void;
  onLand?: (x: number, y: number, isHardLanding: boolean) => void;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private movementState: PlayerState = PlayerState.Running;
  private jumpsRemaining = PlayerConfig.maxJumps;
  private wasOnGround = false;
  private isPlayingLand = false;
  private isDead = false;
  private coyoteTimerMs = 0;
  private jumpBufferTimerMs = 0;
  private deathTween: Phaser.Tweens.Tween | null = null;
  private scaleTween: Phaser.Tweens.Tween | null = null;
  private readonly landingDetector: LandingDetector;
  private fxHooks: PlayerFxHooks = {};

  constructor(scene: Phaser.Scene, x: number, y: number) {
    PlayerAnimationRegistry.register(scene);
    super(scene, x, y, AssetKeys.Sprites.Player);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.landingDetector = new LandingDetector((event) => this.handleLanding(event));

    this.setDepth(PlayerConfig.depth);
    this.setupBody();
    this.setMovementState(PlayerState.Running);
  }

  setFxHooks(hooks: PlayerFxHooks): void {
    this.fxHooks = hooks;
  }

  private setupBody(): void {
    this.setCollideWorldBounds(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PlayerConfig.bodyWidth, PlayerConfig.bodyHeight);
    body.setOffset(PlayerConfig.bodyOffsetX, PlayerConfig.bodyOffsetY);
    body.setMaxVelocity(0, PhysicsConfig.maxFallVelocity);
    body.setDrag(0, 0);
    body.setBounce(0, 0);
  }

  update(deltaMs: number, scrollX: number): void {
    if (this.isDead) {
      return;
    }

    this.x = scrollX + PlayerConfig.screenOffsetX;
    this.tickTimers(deltaMs);
    this.applyAirPhysics(deltaMs);
    this.tryBufferedJump();

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.landingDetector.update(body);
    this.updateState();
  }

  jump(): void {
    if (this.isDead) {
      return;
    }

    if (this.canJump()) {
      this.performJump();
    } else {
      this.jumpBufferTimerMs = PhysicsConfig.jumpBufferTimeMs;
    }
  }

  releaseJump(): void {
    if (this.isDead) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PhysicsConfig.jumpCutMultiplier);
    }
  }

  die(cause: DeathCause = DeathCause.Fall): void {
    if (this.isDead) {
      return;
    }

    this.isDead = true;
    this.isPlayingLand = false;
    this.deathTween?.stop();

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.enable = false;

    this.setTint(0xff4444);
    this.setMovementState(PlayerState.Dead);
    this.playDeathAnimation(cause);
  }

  isAlive(): boolean {
    return !this.isDead;
  }

  getBottomY(): number {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.bottom;
  }

  isOnGround(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  getCurrentState(): PlayerState {
    return this.movementState;
  }

  resetAt(x: number, y: number): void {
    this.isDead = false;
    this.deathTween?.stop();
    this.deathTween = null;
    this.scaleTween?.stop();
    this.scaleTween = null;
    const baseTint = this.getData('baseTint') as number | undefined;
    if (baseTint !== undefined) {
      this.setTint(baseTint);
    } else {
      this.clearTint();
    }
    this.setAlpha(1);
    this.setAngle(0);
    this.setScale(1);
    this.jumpsRemaining = PlayerConfig.maxJumps;
    this.coyoteTimerMs = 0;
    this.jumpBufferTimerMs = 0;
    this.wasOnGround = false;
    this.isPlayingLand = false;
    this.landingDetector.reset();

    this.setPosition(x, y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.enable = true;
    body.setVelocity(0, 0);
    this.setMovementState(PlayerState.Running);
  }

  private canJump(): boolean {
    // Allow ground jump + mid-air double jump while jumps remain.
    return this.jumpsRemaining > 0;
  }

  private performJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isDoubleJump = this.jumpsRemaining < PlayerConfig.maxJumps;
    const velocity = isDoubleJump
      ? PhysicsConfig.doubleJumpVelocity
      : PhysicsConfig.jumpVelocity;

    body.setVelocityY(velocity);
    this.jumpsRemaining--;
    this.coyoteTimerMs = 0;
    this.jumpBufferTimerMs = 0;
    this.isPlayingLand = false;
    this.setMovementState(PlayerState.Jumping);
    this.playJumpStretch();
    this.fxHooks.onJump?.(this.x, this.y, isDoubleJump);
    AudioManager.get().play(SfxId.Jump);
  }

  private playJumpStretch(): void {
    this.scaleTween?.stop();
    this.setScale(1);
    this.scaleTween = this.scene.tweens.add({
      targets: this,
      scaleX: AnimationConfig.player.jumpStretchScaleX,
      scaleY: AnimationConfig.player.jumpStretchScaleY,
      duration: AnimationConfig.player.jumpStretchMs,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private playLandSquash(hard: boolean): void {
    this.scaleTween?.stop();
    const intensity = hard ? 1 : 0.7;
    this.scaleTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1 + (AnimationConfig.player.landSquashScaleX - 1) * intensity,
      scaleY: 1 - (1 - AnimationConfig.player.landSquashScaleY) * intensity,
      duration: AnimationConfig.player.landSquashMs,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.isDead) {
          this.setScale(1);
        }
      },
    });
  }

  private tryBufferedJump(): void {
    if (this.jumpBufferTimerMs <= 0 || !this.isOnGround()) {
      return;
    }
    this.performJump();
  }

  private tickTimers(deltaMs: number): void {
    if (this.coyoteTimerMs > 0) {
      this.coyoteTimerMs = Math.max(0, this.coyoteTimerMs - deltaMs);
    }
    if (this.jumpBufferTimerMs > 0) {
      this.jumpBufferTimerMs = Math.max(0, this.jumpBufferTimerMs - deltaMs);
    }
  }

  private applyAirPhysics(deltaMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body.velocity.y > 0) {
      const extraGravity =
        PhysicsConfig.gravity * (PhysicsConfig.fallGravityMultiplier - 1) * (deltaMs / 1000);
      body.setVelocityY(Math.min(body.velocity.y + extraGravity, PhysicsConfig.maxFallVelocity));
    }

    if (body.velocity.y < -PhysicsConfig.maxUpwardVelocity) {
      body.setVelocityY(-PhysicsConfig.maxUpwardVelocity);
    }
  }

  private updateState(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      // Only refill jumps once settled on ground (not during jump takeoff).
      if (body.velocity.y >= 0) {
        this.jumpsRemaining = PlayerConfig.maxJumps;
        this.coyoteTimerMs = 0;
      }

      if (!this.wasOnGround && body.velocity.y >= 0 && !this.isPlayingLand) {
        this.setMovementState(PlayerState.Running);
      } else if (!this.isPlayingLand && body.velocity.y >= 0) {
        this.setMovementState(PlayerState.Running);
      }
    } else {
      this.coyoteTimerMs = this.wasOnGround ? PhysicsConfig.coyoteTimeMs : this.coyoteTimerMs;

      if (body.velocity.y < 0) {
        this.setMovementState(PlayerState.Jumping);
      } else {
        this.setMovementState(PlayerState.Falling);
      }
    }

    this.wasOnGround = onGround;
  }

  private handleLanding(event: LandingEvent): void {
    if (this.isPlayingLand || this.isDead) {
      return;
    }

    this.isPlayingLand = true;
    this.setMovementState(PlayerState.Landing);
    this.fxHooks.onLand?.(this.x, this.y, event.isHardLanding);
    this.playLandSquash(event.isHardLanding);

    this.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (animation: Phaser.Animations.Animation) => {
        if (animation.key === AnimationKeys.Player.Land) {
          this.isPlayingLand = false;
          if (!this.isDead) {
            this.setMovementState(PlayerState.Running);
          }
        }
      },
    );
  }

  private playDeathAnimation(cause: DeathCause): void {
    const knockbackX =
      cause === DeathCause.Obstacle ? CollisionConfig.deathKnockbackX : 0;
    const knockbackY =
      cause === DeathCause.Obstacle
        ? CollisionConfig.deathKnockbackY
        : CollisionConfig.deathKnockbackY * 0.35;

    this.deathTween = this.scene.tweens.add({
      targets: this,
      x: this.x + knockbackX,
      y: this.y + knockbackY,
      angle: CollisionConfig.deathSpinDegrees,
      alpha: 0.35,
      duration: CollisionConfig.deathFadeDurationMs,
      ease: 'Quad.easeOut',
    });
  }

  private setMovementState(newState: PlayerState): void {
    if (this.movementState === newState && this.anims.isPlaying) {
      return;
    }

    this.movementState = newState;

    switch (newState) {
      case PlayerState.Idle:
        this.play(AnimationKeys.Player.Idle, true);
        break;
      case PlayerState.Running:
        this.play(AnimationKeys.Player.Run, true);
        break;
      case PlayerState.Jumping:
        this.play(AnimationKeys.Player.Jump, true);
        break;
      case PlayerState.Falling:
        this.play(AnimationKeys.Player.Fall, true);
        break;
      case PlayerState.Landing:
        this.play(AnimationKeys.Player.Land, true);
        break;
      case PlayerState.Dead:
        this.play(AnimationKeys.Player.Fall, true);
        this.anims.pause();
        break;
    }
  }
}
