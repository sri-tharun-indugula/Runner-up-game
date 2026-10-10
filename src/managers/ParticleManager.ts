import { AssetKeys } from '@/config/AssetKeys';
import { CollectibleType } from '@/config/CollectibleConfig';
import { getParticleScale } from '@/config/MobileConfig';
import { ParticleConfig } from '@/config/ParticleConfig';
import { PerformanceManager } from '@/managers/PerformanceManager';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

const COLLECT_TINTS: Record<CollectibleType, number> = {
  [CollectibleType.Coin]: 0xffd166,
  [CollectibleType.Gem]: 0x9b5de5,
  [CollectibleType.Magnet]: 0xe63946,
  [CollectibleType.ScorePickup]: 0x06d6a0,
  [CollectibleType.Shield]: 0x4cc9f0,
  [CollectibleType.SpeedBoost]: 0xf77f00,
  [CollectibleType.SlowMotion]: 0x90e0ef,
  [CollectibleType.ExtraLife]: 0x06d6a0,
};

/**
 * Reuses a small set of Phaser emitters for all VFX bursts (Milestone 14).
 * Burst-only (`emitting: false`) keeps continuous cost near zero.
 */
export class ParticleManager {
  private readonly scene: Phaser.Scene;
  private readonly dust: Emitter;
  private readonly jump: Emitter;
  private readonly landing: Emitter;
  private readonly sparkle: Emitter;
  private readonly explosion: Emitter;
  private dustCooldownMs = 0;
  private paused = false;
  private readonly quantityScale = getParticleScale();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.dust = this.createEmitter(AssetKeys.Atlases.Particles, AssetKeys.Frames.ParticleDust, {
      lifespan: ParticleConfig.dust.lifespanMs,
      speed: { min: ParticleConfig.dust.speedMin, max: ParticleConfig.dust.speedMax },
      scale: { start: ParticleConfig.dust.scaleStart, end: ParticleConfig.dust.scaleEnd },
      alpha: { start: 0.7, end: 0 },
      gravityY: ParticleConfig.dust.gravityY,
      tint: ParticleConfig.dust.tint,
      angle: { min: 200, max: 340 },
      quantity: ParticleConfig.dust.quantity,
      frequency: -1,
      maxAliveParticles: 24,
    });

    this.jump = this.createEmitter(AssetKeys.Atlases.Particles, AssetKeys.Frames.ParticleSoft, {
      lifespan: ParticleConfig.jump.lifespanMs,
      speed: { min: ParticleConfig.jump.speedMin, max: ParticleConfig.jump.speedMax },
      scale: { start: ParticleConfig.jump.scaleStart, end: ParticleConfig.jump.scaleEnd },
      alpha: { start: 0.85, end: 0 },
      gravityY: ParticleConfig.jump.gravityY,
      tint: ParticleConfig.jump.tint,
      angle: { min: 200, max: 340 },
      quantity: ParticleConfig.jump.quantity,
      frequency: -1,
      maxAliveParticles: 30,
    });

    this.landing = this.createEmitter(AssetKeys.Atlases.Particles, AssetKeys.Frames.ParticleDust, {
      lifespan: ParticleConfig.landing.lifespanMs,
      speed: { min: ParticleConfig.landing.speedMin, max: ParticleConfig.landing.speedMax },
      scale: { start: ParticleConfig.landing.scaleStart, end: ParticleConfig.landing.scaleEnd },
      alpha: { start: 0.8, end: 0 },
      gravityY: ParticleConfig.landing.gravityY,
      tint: ParticleConfig.landing.tint,
      angle: { min: 190, max: 350 },
      quantity: ParticleConfig.landing.quantity,
      frequency: -1,
      maxAliveParticles: 36,
    });

    this.sparkle = this.createEmitter(AssetKeys.Atlases.Particles, AssetKeys.Frames.ParticleSpark, {
      lifespan: ParticleConfig.sparkle.lifespanMs,
      speed: { min: ParticleConfig.sparkle.speedMin, max: ParticleConfig.sparkle.speedMax },
      scale: { start: ParticleConfig.sparkle.scaleStart, end: ParticleConfig.sparkle.scaleEnd },
      alpha: { start: 1, end: 0 },
      gravityY: ParticleConfig.sparkle.gravityY,
      rotate: { min: 0, max: 360 },
      quantity: ParticleConfig.sparkle.quantity,
      frequency: -1,
      maxAliveParticles: 40,
      blendMode: 'ADD',
    });

    this.explosion = this.createEmitter(AssetKeys.Atlases.Particles, AssetKeys.Frames.ParticleSoft, {
      lifespan: ParticleConfig.explosion.lifespanMs,
      speed: {
        min: ParticleConfig.explosion.speedMin,
        max: ParticleConfig.explosion.speedMax,
      },
      scale: {
        start: ParticleConfig.explosion.scaleStart,
        end: ParticleConfig.explosion.scaleEnd,
      },
      alpha: { start: 1, end: 0 },
      gravityY: ParticleConfig.explosion.gravityY,
      tint: ParticleConfig.explosion.tint,
      quantity: ParticleConfig.explosion.quantity,
      frequency: -1,
      maxAliveParticles: 48,
    });
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    const timescale = paused ? 0 : 1;
    this.dust.timeScale = timescale;
    this.jump.timeScale = timescale;
    this.landing.timeScale = timescale;
    this.sparkle.timeScale = timescale;
    this.explosion.timeScale = timescale;
  }

  update(deltaMs: number, playerX: number, playerY: number, onGround: boolean): void {
    if (this.paused || !onGround) {
      this.dustCooldownMs = 0;
      return;
    }

    this.dustCooldownMs -= deltaMs;
    if (this.dustCooldownMs > 0) {
      return;
    }

    this.dustCooldownMs = ParticleConfig.dust.intervalMs * PerformanceManager.get().getDustIntervalScale();
    this.dust.explode(this.scaled(ParticleConfig.dust.quantity), playerX - 10, playerY + 18);
  }

  emitJump(x: number, y: number, isDoubleJump: boolean): void {
    if (this.paused) {
      return;
    }

    if (isDoubleJump) {
      this.jump.setParticleTint(ParticleConfig.doubleJump.tint);
      this.jump.explode(this.scaled(ParticleConfig.doubleJump.quantity), x, y + 10);
    } else {
      this.jump.setParticleTint(ParticleConfig.jump.tint);
      this.jump.explode(this.scaled(ParticleConfig.jump.quantity), x, y + 16);
    }
  }

  emitLanding(x: number, y: number, hard: boolean): void {
    if (this.paused) {
      return;
    }

    const count = hard
      ? ParticleConfig.landing.hardQuantity
      : ParticleConfig.landing.quantity;
    this.landing.explode(count, x, y + 18);
  }

  emitSparkle(x: number, y: number, type: CollectibleType): void {
    if (this.paused) {
      return;
    }

    this.sparkle.setParticleTint(COLLECT_TINTS[type]);
    this.sparkle.explode(this.scaled(ParticleConfig.sparkle.quantity), x, y);
  }

  emitExplosion(x: number, y: number): void {
    this.explosion.setParticleTint(ParticleConfig.explosion.tint);
    this.explosion.explode(this.scaled(ParticleConfig.explosion.quantity), x, y);
  }

  emitShieldBreak(x: number, y: number): void {
    this.explosion.setParticleTint(ParticleConfig.shieldBreak.tint);
    this.explosion.explode(this.scaled(ParticleConfig.shieldBreak.quantity), x, y);
  }

  destroy(): void {
    this.dust.destroy();
    this.jump.destroy();
    this.landing.destroy();
    this.sparkle.destroy();
    this.explosion.destroy();
  }

  private scaled(quantity: number): number {
    return Math.max(1, Math.round(quantity * this.quantityScale * PerformanceManager.get().getParticleScale()));
  }

  private createEmitter(
    texture: string,
    frame: string,
    config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
  ): Emitter {
    const emitter = this.scene.add.particles(0, 0, texture, {
      ...config,
      frame,
      emitting: false,
    });
    emitter.setDepth(ParticleConfig.depth);
    return emitter;
  }
}
