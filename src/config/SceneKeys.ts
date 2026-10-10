export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  MainMenu: 'MainMenuScene',
  Game: 'GameScene',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
