import {
  PowerUpConfig,
  PowerUpType,
  type PowerUpSnapshot,
  type PowerUpStatus,
} from '@/config/PowerUpConfig';

interface TimedEffect {
  endsAtMs: number;
}

/**
 * Owns power-up durations, cooldowns, lives, and derived gameplay modifiers.
 */
export class PowerUpManager {
  private readonly scene: Phaser.Scene;
  private readonly active = new Map<PowerUpType, TimedEffect>();
  private readonly cooldownUntil = new Map<PowerUpType, number>();
  private lives = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  reset(): void {
    this.active.clear();
    this.cooldownUntil.clear();
    this.lives = 0;
  }

  tryActivate(type: PowerUpType): boolean {
    if (this.isOnCooldown(type)) {
      return false;
    }

    const config = PowerUpConfig[type];
    const now = this.scene.time.now;

    if (type === PowerUpType.ExtraLife) {
      this.lives += 1;
      this.cooldownUntil.set(type, now + config.cooldownMs);
      return true;
    }

    // Speed and slow-mo cancel each other.
    if (type === PowerUpType.SpeedBoost) {
      this.active.delete(PowerUpType.SlowMotion);
    }
    if (type === PowerUpType.SlowMotion) {
      this.active.delete(PowerUpType.SpeedBoost);
    }

    if (config.durationMs > 0) {
      this.active.set(type, { endsAtMs: now + config.durationMs });
    }

    this.cooldownUntil.set(type, now + config.cooldownMs);
    return true;
  }

  update(): void {
    const now = this.scene.time.now;
    for (const [type, effect] of [...this.active.entries()]) {
      if (now >= effect.endsAtMs) {
        this.active.delete(type);
      }
    }
  }

  isActive(type: PowerUpType): boolean {
    const effect = this.active.get(type);
    return !!effect && this.scene.time.now < effect.endsAtMs;
  }

  isOnCooldown(type: PowerUpType): boolean {
    const until = this.cooldownUntil.get(type);
    return until !== undefined && this.scene.time.now < until;
  }

  getRemainingMs(type: PowerUpType): number {
    const effect = this.active.get(type);
    if (!effect) {
      return 0;
    }
    return Math.max(0, effect.endsAtMs - this.scene.time.now);
  }

  getCooldownRemainingMs(type: PowerUpType): number {
    const until = this.cooldownUntil.get(type);
    if (until === undefined) {
      return 0;
    }
    return Math.max(0, until - this.scene.time.now);
  }

  getLives(): number {
    return this.lives;
  }

  /** Returns true if a life was consumed to prevent game over. */
  tryConsumeLife(): boolean {
    if (this.lives <= 0) {
      return false;
    }
    this.lives -= 1;
    // Brief shield after revive so the same hazard doesn't immediately re-kill.
    this.active.set(PowerUpType.Shield, {
      endsAtMs: this.scene.time.now + 1500,
    });
    return true;
  }

  /** Returns true if shield absorbed the hit (and was consumed early). */
  tryAbsorbHit(): boolean {
    if (!this.isActive(PowerUpType.Shield)) {
      return false;
    }
    this.active.delete(PowerUpType.Shield);
    return true;
  }

  getSpeedMultiplier(): number {
    if (this.isActive(PowerUpType.SpeedBoost)) {
      return PowerUpConfig[PowerUpType.SpeedBoost].speedMultiplier;
    }
    if (this.isActive(PowerUpType.SlowMotion)) {
      return PowerUpConfig[PowerUpType.SlowMotion].speedMultiplier;
    }
    return 1;
  }

  isMagnetActive(): boolean {
    return this.isActive(PowerUpType.Magnet);
  }

  getMagnetPullRadius(): number {
    return PowerUpConfig[PowerUpType.Magnet].pullRadius;
  }

  getMagnetPullSpeed(): number {
    return PowerUpConfig[PowerUpType.Magnet].pullSpeed;
  }

  getSnapshot(): PowerUpSnapshot {
    const timedActive: PowerUpStatus[] = [];

    for (const type of [
      PowerUpType.Shield,
      PowerUpType.Magnet,
      PowerUpType.SpeedBoost,
      PowerUpType.SlowMotion,
    ]) {
      const remainingMs = this.getRemainingMs(type);
      if (remainingMs > 0) {
        timedActive.push({
          type,
          label: PowerUpConfig[type].label,
          remainingMs,
          active: true,
          onCooldown: this.isOnCooldown(type),
          cooldownRemainingMs: this.getCooldownRemainingMs(type),
        });
      }
    }

    return {
      active: timedActive,
      lives: this.lives,
      speedMultiplier: this.getSpeedMultiplier(),
      magnetActive: this.isMagnetActive(),
      shieldActive: this.isActive(PowerUpType.Shield),
    };
  }
}
