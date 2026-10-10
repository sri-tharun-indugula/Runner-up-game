import type { CollectResult } from '@/config/CollectibleConfig';
import {
  ScoreConfig,
  type HighScoreEntry,
  type ScoreSnapshot,
} from '@/config/ScoreConfig';
import { UnlockCatalog } from '@/config/SaveConfig';
import { SaveManager } from '@/managers/SaveManager';

export class ScoreManager {
  private distance = 0;
  private coins = 0;
  private pickupPoints = 0;
  private bestScore: number;
  private runs: HighScoreEntry[];
  private finalized = false;
  private lastIsNewBest = false;
  private newlyUnlocked: string[] = [];

  constructor() {
    const save = SaveManager.get();
    this.bestScore = save.getBestScore();
    this.runs = [...save.getHighScores()];
  }

  resetRun(): void {
    this.distance = 0;
    this.coins = 0;
    this.pickupPoints = 0;
    this.finalized = false;
    this.lastIsNewBest = false;
    this.newlyUnlocked = [];
  }

  setDistance(distanceMeters: number): void {
    if (this.finalized) {
      return;
    }
    this.distance = Math.max(0, distanceMeters);
  }

  addCollectible(result: CollectResult): void {
    if (this.finalized) {
      return;
    }
    this.coins += result.coins;
    this.pickupPoints += result.points;
  }

  getDistance(): number {
    return Math.floor(this.distance);
  }

  getCoins(): number {
    return this.coins;
  }

  getPickupPoints(): number {
    return this.pickupPoints;
  }

  getTotalScore(): number {
    return this.getDistanceScore() + this.pickupPoints;
  }

  getBestScore(): number {
    return this.bestScore;
  }

  getHighScores(): readonly HighScoreEntry[] {
    return this.runs;
  }

  getNewlyUnlocked(): readonly string[] {
    return this.newlyUnlocked;
  }

  getSnapshot(includeFinalizeState = false): ScoreSnapshot {
    return {
      distance: this.getDistance(),
      coins: this.coins,
      pickupPoints: this.pickupPoints,
      totalScore: this.getTotalScore(),
      bestScore: this.bestScore,
      isNewBest: includeFinalizeState ? this.lastIsNewBest : false,
    };
  }

  finalizeRun(): ScoreSnapshot {
    if (this.finalized) {
      return this.getSnapshot(true);
    }

    this.finalized = true;
    const total = this.getTotalScore();
    const entry: HighScoreEntry = {
      score: total,
      distance: this.getDistance(),
      coins: this.coins,
      at: Date.now(),
    };

    this.lastIsNewBest = total > this.bestScore;
    if (this.lastIsNewBest) {
      this.bestScore = total;
    }

    const unlockedIds = SaveManager.get().recordRun(entry, this.bestScore);
    this.newlyUnlocked = unlockedIds.map(
      (id) => UnlockCatalog.find((item) => item.id === id)?.name ?? id,
    );
    const profile = SaveManager.get().getProfile();
    this.bestScore = profile.bestScore;
    this.runs = [...profile.runs];

    return this.getSnapshot(true);
  }

  private getDistanceScore(): number {
    return Math.floor(this.distance) * ScoreConfig.distancePointsPerMeter;
  }
}
