import { AudioConfig, type AudioSettings } from '@/config/AudioConfig';
import {
  DefaultSaveData,
  SaveConfig,
  UnlockCatalog,
  UnlockId,
  type GameSaveData,
  type SaveProfile,
  type SaveSettings,
  type UnlockDefinition,
} from '@/config/SaveConfig';
import type { HighScoreEntry, PersistedScoreData } from '@/config/ScoreConfig';
import { ScoreConfig } from '@/config/ScoreConfig';
import type { PerformanceSettings } from '@/config/PerformanceConfig';
import { PerformanceConfig } from '@/config/PerformanceConfig';
import { LocalStorage } from '@/utils/LocalStorage';

/**
 * Unified localStorage save hub (Milestone 18).
 * Owns profile progress, unlocks, and settings with legacy migration.
 */
export class SaveManager {
  private static instance: SaveManager | null = null;

  private data: GameSaveData;
  private readonly listeners = new Set<() => void>();

  private constructor() {
    this.data = this.loadOrMigrate();
    this.evaluateUnlocks();
    this.persist();
  }

  static get(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  getProfile(): Readonly<SaveProfile> {
    return this.data.profile;
  }

  getSettings(): Readonly<SaveSettings> {
    return this.data.settings;
  }

  getBestScore(): number {
    return this.data.profile.bestScore;
  }

  getTotalCoins(): number {
    return this.data.profile.totalCoins;
  }

  getHighScores(): readonly HighScoreEntry[] {
    return this.data.profile.runs;
  }

  getSelectedSkin(): UnlockDefinition {
    return (
      UnlockCatalog.find((item) => item.id === this.data.profile.selectedSkin) ??
      UnlockCatalog[0]
    );
  }

  getUnlockStates(): Array<UnlockDefinition & { unlocked: boolean; selected: boolean }> {
    const unlocked = new Set(this.data.profile.unlocked);
    return UnlockCatalog.map((item) => ({
      ...item,
      unlocked: unlocked.has(item.id),
      selected: item.id === this.data.profile.selectedSkin,
    }));
  }

  patchSettings(partial: Partial<SaveSettings>): void {
    this.data.settings = { ...this.data.settings, ...partial };
    this.persist();
    this.emit();
  }

  setSelectedSkin(id: UnlockId): boolean {
    if (!this.data.profile.unlocked.includes(id)) {
      return false;
    }
    this.data.profile.selectedSkin = id;
    this.persist();
    this.emit();
    return true;
  }

  /** Called by ScoreManager after a finished run. */
  recordRun(entry: HighScoreEntry, bestScore: number): UnlockId[] {
    this.data.profile.runs = [...this.data.profile.runs, entry]
      .sort((a, b) => b.score - a.score || b.at - a.at)
      .slice(0, ScoreConfig.maxHighScores);

    this.data.profile.bestScore = Math.max(this.data.profile.bestScore, bestScore, entry.score);
    this.data.profile.totalCoins += Math.max(0, entry.coins);

    const newlyUnlocked = this.evaluateUnlocks();
    this.persist();
    this.emit();
    return newlyUnlocked;
  }

  /** Sync score list/best from ScoreManager without double-counting coins. */
  syncScoreboard(bestScore: number, runs: HighScoreEntry[]): void {
    this.data.profile.bestScore = Math.max(0, bestScore);
    this.data.profile.runs = runs.slice(0, ScoreConfig.maxHighScores);
    this.evaluateUnlocks();
    this.persist();
    this.emit();
  }

  onChange(listener: () => void): void {
    this.listeners.add(listener);
  }

  private evaluateUnlocks(): UnlockId[] {
    const newly: UnlockId[] = [];
    const unlocked = new Set(this.data.profile.unlocked);
    const { totalCoins, bestScore } = this.data.profile;

    for (const item of UnlockCatalog) {
      if (unlocked.has(item.id)) {
        continue;
      }

      let ok = false;
      if (item.requirement.type === 'default') {
        ok = true;
      } else if (item.requirement.type === 'coins') {
        ok = totalCoins >= item.requirement.amount;
      } else if (item.requirement.type === 'bestScore') {
        ok = bestScore >= item.requirement.amount;
      }

      if (ok) {
        unlocked.add(item.id);
        newly.push(item.id);
      }
    }

    this.data.profile.unlocked = [...unlocked];
    if (!unlocked.has(this.data.profile.selectedSkin)) {
      this.data.profile.selectedSkin = UnlockId.SkinCyan;
    }
    return newly;
  }

  private loadOrMigrate(): GameSaveData {
    const existing = LocalStorage.read<GameSaveData>(SaveConfig.storageKey);
    if (existing?.version === SaveConfig.storageVersion && existing.profile && existing.settings) {
      return this.sanitize(existing);
    }

    const migrated = DefaultSaveData();

    const legacyScore = LocalStorage.read<PersistedScoreData>(SaveConfig.legacyKeys.score);
    if (legacyScore) {
      migrated.profile.bestScore = Math.max(0, Math.floor(legacyScore.bestScore || 0));
      migrated.profile.runs = Array.isArray(legacyScore.runs) ? legacyScore.runs.slice(0, 5) : [];
      // Approximate banked coins from historical runs.
      migrated.profile.totalCoins = migrated.profile.runs.reduce(
        (sum, run) => sum + Math.max(0, run.coins || 0),
        0,
      );
    }

    const legacyAudio = LocalStorage.read<AudioSettings>(SaveConfig.legacyKeys.audio);
    if (legacyAudio) {
      migrated.settings.muted = !!legacyAudio.muted;
      migrated.settings.masterVolume =
        typeof legacyAudio.masterVolume === 'number'
          ? legacyAudio.masterVolume
          : AudioConfig.defaultMasterVolume;
    }

    const legacyPerf = LocalStorage.read<PerformanceSettings>(SaveConfig.legacyKeys.performance);
    if (legacyPerf) {
      migrated.settings.showFps = !!legacyPerf.showFps;
    }

    return this.sanitize(migrated);
  }

  private sanitize(data: GameSaveData): GameSaveData {
    const defaults = DefaultSaveData();
    const unlocked = Array.isArray(data.profile?.unlocked)
      ? data.profile.unlocked.filter((id): id is UnlockId =>
          UnlockCatalog.some((item) => item.id === id),
        )
      : defaults.profile.unlocked;

    if (!unlocked.includes(UnlockId.SkinCyan)) {
      unlocked.unshift(UnlockId.SkinCyan);
    }

    const selected =
      unlocked.find((id) => id === data.profile?.selectedSkin) ?? UnlockId.SkinCyan;

    return {
      version: SaveConfig.storageVersion,
      profile: {
        bestScore: Math.max(0, Math.floor(data.profile?.bestScore ?? 0)),
        totalCoins: Math.max(0, Math.floor(data.profile?.totalCoins ?? 0)),
        runs: Array.isArray(data.profile?.runs) ? data.profile.runs.slice(0, 5) : [],
        unlocked,
        selectedSkin: selected,
      },
      settings: {
        muted: !!data.settings?.muted,
        masterVolume:
          typeof data.settings?.masterVolume === 'number'
            ? Math.min(1, Math.max(0, data.settings.masterVolume))
            : defaults.settings.masterVolume,
        showFps: !!data.settings?.showFps,
      },
    };
  }

  private persist(): void {
    LocalStorage.write(SaveConfig.storageKey, this.data);
    // Keep legacy mirrors so older code paths stay coherent during transition.
    LocalStorage.write(ScoreConfig.storageKey, {
      version: ScoreConfig.storageVersion,
      bestScore: this.data.profile.bestScore,
      runs: this.data.profile.runs,
    } satisfies PersistedScoreData);
    LocalStorage.write(AudioConfig.storageKey, {
      version: AudioConfig.storageVersion,
      muted: this.data.settings.muted,
      masterVolume: this.data.settings.masterVolume,
    } satisfies AudioSettings);
    LocalStorage.write(PerformanceConfig.storageKey, {
      version: PerformanceConfig.storageVersion,
      showFps: this.data.settings.showFps,
    } satisfies PerformanceSettings);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
