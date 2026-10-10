import { BaseScene, SceneKeys } from '@/core/BaseScene';
import { AssetManager } from '@/managers/AssetManager';
import { TextureAtlasBuilder } from '@/managers/TextureAtlasBuilder';
import { TextStyles } from '@/utils/TextStyles';

const LOADING_DURATION_MS = 800;

export class PreloadScene extends BaseScene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    this.createLoadingUI();
    AssetManager.createPlaceholderAssets(this);
    TextureAtlasBuilder.packGameplayAtlases(this);
    // File-based loading via AssetManager.loadAll() activates when
    // real assets are placed in public/assets/
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.animateLoadingProgress();
  }

  private createLoadingUI(): void {
    const barWidth = 400;
    const barHeight = 24;
    const barX = this.centerX - barWidth / 2;
    const barY = this.centerY;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add
      .text(this.centerX, this.centerY - 50, 'Loading...', TextStyles.subtitle)
      .setOrigin(0.5);

    this.percentText = this.add
      .text(this.centerX, this.centerY + 40, '0%', TextStyles.hint)
      .setOrigin(0.5);
  }

  private animateLoadingProgress(): void {
    const progress = { value: 0 };

    this.tweens.add({
      targets: progress,
      value: 1,
      duration: LOADING_DURATION_MS,
      ease: 'Linear',
      onUpdate: () => {
        this.updateProgressBar(progress.value);
      },
      onComplete: () => {
        this.loadingText.setText('Complete!');
        this.transitionTo(SceneKeys.MainMenu);
      },
    });
  }

  private updateProgressBar(value: number): void {
    const barWidth = 400;
    const barHeight = 24;
    const barX = this.centerX - barWidth / 2;
    const barY = this.centerY;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x4ecdc4, 1);
    this.progressBar.fillRect(barX, barY, barWidth * value, barHeight);
    this.percentText.setText(`${Math.round(value * 100)}%`);
  }
}
