export const ScoreConfig = {
  distancePointsPerMeter: 1,
  storageKey: 'infinite-runner:score-data',
  storageVersion: 2,
  maxHighScores: 5,
} as const;

export interface ScoreSnapshot {
  distance: number;
  coins: number;
  pickupPoints: number;
  totalScore: number;
  bestScore: number;
  isNewBest: boolean;
}

export interface HighScoreEntry {
  score: number;
  distance: number;
  coins: number;
  at: number;
}

export interface PersistedScoreData {
  version: number;
  bestScore: number;
  runs: HighScoreEntry[];
}
