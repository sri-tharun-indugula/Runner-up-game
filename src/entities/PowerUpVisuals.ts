import { PowerUpConfig, PowerUpType } from '@/config/PowerUpConfig';
import type { PowerUpManager } from '@/managers/PowerUpManager';

/**
 * Player-attached VFX for active power-ups.
 * Keeps the runner's skin tint intact; glow comes from rings/auras.
 */
export class PowerUpVisuals {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.GameObjects.Sprite;
  private readonly shieldRing: Phaser.GameObjects.Arc;
  private readonly aura: Phaser.GameObjects.Arc;
  private pulse = 0;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.player = player;

    const radius = Math.max(player.displayWidth, player.displayHeight) * 0.55;
    this.shieldRing = scene.add.circle(player.x, player.y, radius, 0x4cc9f0, 0);
    this.shieldRing.setStrokeStyle(3, PowerUpConfig[PowerUpType.Shield].tint, 0.95);
    this.shieldRing.setDepth(player.depth + 1);
    this.shieldRing.setVisible(false);

    this.aura = scene.add.circle(player.x, player.y, radius * 0.85, 0xffffff, 0.14);
    this.aura.setDepth(player.depth - 1);
    this.aura.setVisible(false);
  }

  update(deltaMs: number, powerUps: PowerUpManager): void {
    this.pulse += deltaMs / 200;
    this.shieldRing.setPosition(this.player.x, this.player.y);
    this.aura.setPosition(this.player.x, this.player.y);

    const shieldActive = powerUps.isActive(PowerUpType.Shield);
    this.shieldRing.setVisible(shieldActive);
    if (shieldActive) {
      const scale = 1 + Math.sin(this.pulse) * 0.06;
      this.shieldRing.setScale(scale);
      this.shieldRing.setAlpha(0.65 + Math.sin(this.pulse) * 0.2);
    }

    let auraColor: number | null = null;
    if (powerUps.isActive(PowerUpType.SpeedBoost)) {
      auraColor = PowerUpConfig[PowerUpType.SpeedBoost].tint;
    } else if (powerUps.isActive(PowerUpType.SlowMotion)) {
      auraColor = PowerUpConfig[PowerUpType.SlowMotion].tint;
    } else if (powerUps.isActive(PowerUpType.Magnet)) {
      auraColor = PowerUpConfig[PowerUpType.Magnet].tint;
    }

    if (auraColor !== null) {
      this.aura.setVisible(true);
      this.aura.setFillStyle(auraColor, 0.18 + Math.sin(this.pulse) * 0.05);
      this.aura.setScale(1 + Math.sin(this.pulse) * 0.05);
    } else {
      this.aura.setVisible(false);
      this.aura.setScale(1);
    }

    // Always restore equipped skin — power FX are rings/auras, not full recolors.
    this.restoreBaseTint();
  }

  flashShieldBreak(): void {
    this.scene.tweens.add({
      targets: this.shieldRing,
      alpha: 0,
      scale: 1.55,
      duration: 220,
      onComplete: () => {
        this.shieldRing.setScale(1);
        this.shieldRing.setVisible(false);
      },
    });
  }

  destroy(): void {
    this.shieldRing.destroy();
    this.aura.destroy();
    this.restoreBaseTint();
  }

  private restoreBaseTint(): void {
    const baseTint = this.player.getData('baseTint') as number | undefined;
    if (baseTint !== undefined) {
      this.player.setTint(baseTint);
    } else {
      this.player.clearTint();
    }
  }
}
