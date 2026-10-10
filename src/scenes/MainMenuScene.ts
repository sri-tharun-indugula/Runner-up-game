import { BaseScene, SceneKeys } from '@/core/BaseScene';
import { AnimationConfig } from '@/config/AnimationConfig';
import { BrandConfig } from '@/config/BrandConfig';
import { AssetKeys } from '@/config/AssetKeys';
import { UnlockId } from '@/config/SaveConfig';
import { SaveManager } from '@/managers/SaveManager';
import { ScoreManager } from '@/managers/ScoreManager';
import { DomOverlay } from '@/ui/DomOverlay';
import { GuidePreviewFactory } from '@/ui/GuidePreviewFactory';
import { HudOverlay } from '@/ui/HudOverlay';

export class MainMenuScene extends BaseScene {
  private readonly scores = new ScoreManager();
  private logo!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.MainMenu);
  }

  create(): void {
    this.cameras.main.fadeIn(AnimationConfig.scene.fadeMs, 0, 0, 0);
    HudOverlay.get().hide();
    SaveManager.get();
    this.createBackground();
    this.showRootMenu();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      DomOverlay.get().hide();
    });
  }

  private createBackground(): void {
    this.add
      .image(this.centerX, this.centerY, AssetKeys.Images.Background)
      .setDisplaySize(this.gameWidth, this.gameHeight);

    this.logo = this.add
      .text(this.centerX, this.centerY - 180, BrandConfig.title, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '42px',
        color: '#2de2e6',
        stroke: '#ff2e97',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(this.centerX, this.centerY - 132, BrandConfig.name, {
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '18px',
        color: '#ffe66d',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.logo,
      y: this.logo.y - AnimationConfig.ui.menuLogoFloatPx,
      duration: AnimationConfig.ui.menuLogoFloatMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private showRootMenu(): void {
    const save = SaveManager.get();
    DomOverlay.get().showMainMenu(save.getBestScore(), save.getTotalCoins(), {
      onStart: () => this.openHowToPlay(),
      onSettings: () => this.openSettings(),
      onHighScores: () => this.openHighScores(),
      onUnlocks: () => this.openUnlocks(),
    });
  }

  private openHowToPlay(): void {
    const visuals = GuidePreviewFactory.build(this);
    DomOverlay.get().showHowToPlay(
      visuals,
      () => this.startGame(),
      () => this.showRootMenu(),
    );
  }

  private openSettings(): void {
    DomOverlay.get().showSettings(() => this.showRootMenu());
  }

  private openHighScores(): void {
    DomOverlay.get().showHighScores(
      this.scores.getBestScore(),
      this.scores.getHighScores(),
      () => this.showRootMenu(),
    );
  }

  private openUnlocks(): void {
    const save = SaveManager.get();
    DomOverlay.get().showUnlocks(
      save.getUnlockStates().map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        unlocked: row.unlocked,
        selected: row.selected,
      })),
      (id) => {
        save.setSelectedSkin(id as UnlockId);
        this.openUnlocks();
      },
      () => this.showRootMenu(),
    );
  }

  private startGame(): void {
    DomOverlay.get().hide();
    this.transitionTo(SceneKeys.Game);
  }
}
