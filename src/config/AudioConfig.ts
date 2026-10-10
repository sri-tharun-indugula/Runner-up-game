export enum SfxId {
  Jump = 'jump',
  CollectCoin = 'collect-coin',
  CollectGem = 'collect-gem',
  CollectMagnet = 'collect-magnet',
  CollectScore = 'collect-score',
  CollectPower = 'collect-power',
  Hit = 'hit',
  GameOver = 'game-over',
  UiClick = 'ui-click',
  UiStart = 'ui-start',
}

export const AudioConfig = {
  storageKey: 'infinite-runner:audio-settings',
  storageVersion: 1,
  defaultMasterVolume: 0.75,
  defaultMuted: false,
  bgmVolume: 0.14,
  sfxVolume: 0.9,
} as const;

export interface AudioSettings {
  version: number;
  muted: boolean;
  masterVolume: number;
}
