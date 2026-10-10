import Phaser from 'phaser';

const FONT_FAMILY = 'Arial, sans-serif';

export class TextStyles {
  static readonly title: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT_FAMILY,
    fontSize: '64px',
    color: '#ffffff',
    fontStyle: 'bold',
  };

  static readonly subtitle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT_FAMILY,
    fontSize: '24px',
    color: '#cccccc',
  };

  static readonly hint: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
    color: '#888888',
  };

  static readonly sceneLabel: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT_FAMILY,
    fontSize: '32px',
    color: '#4ecdc4',
    fontStyle: 'bold',
  };

  static readonly hud: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT_FAMILY,
    fontSize: '20px',
    color: '#ffffff',
    fontStyle: 'bold',
  };
}
