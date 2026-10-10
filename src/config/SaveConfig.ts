import type { HighScoreEntry } from '@/config/ScoreConfig';

export const SaveConfig = {
  storageKey: 'infinite-runner:save-v1',
  storageVersion: 1,
  /** Legacy keys migrated once into the unified save. */
  legacyKeys: {
    score: 'infinite-runner:score-data',
    audio: 'infinite-runner:audio-settings',
    performance: 'infinite-runner:performance-settings',
  },
} as const;

export enum UnlockId {
  SkinCyan = 'skin-cyan',
  SkinMagenta = 'skin-magenta',
  SkinGold = 'skin-gold',
  SkinLime = 'skin-lime',
}

export type UnlockRequirement =
  | { type: 'default' }
  | { type: 'coins'; amount: number }
  | { type: 'bestScore'; amount: number };

export interface UnlockDefinition {
  id: UnlockId;
  name: string;
  description: string;
  tint: number;
  requirement: UnlockRequirement;
}

export const UnlockCatalog: readonly UnlockDefinition[] = [
  {
    id: UnlockId.SkinCyan,
    name: 'Cyan Runner',
    description: 'Default neon kit',
    tint: 0x2de2e6,
    requirement: { type: 'default' },
  },
  {
    id: UnlockId.SkinMagenta,
    name: 'Magenta Rush',
    description: 'Bank 50 coins',
    tint: 0xff2e97,
    requirement: { type: 'coins', amount: 50 },
  },
  {
    id: UnlockId.SkinGold,
    name: 'Gold Rush',
    description: 'Bank 200 coins',
    tint: 0xffe66d,
    requirement: { type: 'coins', amount: 200 },
  },
  {
    id: UnlockId.SkinLime,
    name: 'Toxic Speed',
    description: 'Best score 800+',
    tint: 0x7cff6b,
    requirement: { type: 'bestScore', amount: 800 },
  },
] as const;

export interface SaveProfile {
  bestScore: number;
  totalCoins: number;
  runs: HighScoreEntry[];
  unlocked: UnlockId[];
  selectedSkin: UnlockId;
}

export interface SaveSettings {
  muted: boolean;
  masterVolume: number;
  showFps: boolean;
}

export interface GameSaveData {
  version: number;
  profile: SaveProfile;
  settings: SaveSettings;
}

export const DefaultSaveData = (): GameSaveData => ({
  version: SaveConfig.storageVersion,
  profile: {
    bestScore: 0,
    totalCoins: 0,
    runs: [],
    unlocked: [UnlockId.SkinCyan],
    selectedSkin: UnlockId.SkinCyan,
  },
  settings: {
    muted: false,
    masterVolume: 0.75,
    showFps: false,
  },
});
