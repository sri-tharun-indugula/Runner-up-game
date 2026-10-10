import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { GameScene } from '@/scenes/GameScene';

export class Game extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      width: GameConfig.width,
      height: GameConfig.height,
      backgroundColor: GameConfig.backgroundColor,
      parent: GameConfig.parent,
      scale: GameConfig.scale,
      physics: GameConfig.physics,
      render: GameConfig.render,
      input: GameConfig.input,
      scene: [BootScene, PreloadScene, MainMenuScene, GameScene],
      banner: false,
    });

    // Expose for debug tooling / smoke tests.
    (window as Window & { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__ = this;
  }
}
