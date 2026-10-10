export type QualityTier = 'high' | 'medium' | 'low';

export const PerformanceConfig = {
  targetFps: 60,
  fpsSampleWindow: 30,
  /** Drop below this → step quality down. */
  lowFpsThreshold: 50,
  /** Recover above this → step quality up. */
  highFpsThreshold: 57,
  qualityHoldMs: 1500,
  storageKey: 'infinite-runner:performance-settings',
  storageVersion: 1,
  defaultShowFps: false,
  poolMaxMultiplier: 2.5,
  qualityParticleScale: {
    high: 1,
    medium: 0.65,
    low: 0.4,
  },
  qualityDustIntervalScale: {
    high: 1,
    medium: 1.35,
    low: 1.8,
  },
} as const;

export interface PerformanceSettings {
  version: number;
  showFps: boolean;
}
