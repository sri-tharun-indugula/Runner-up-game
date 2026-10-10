import {
  PerformanceConfig,
  type QualityTier,
} from '@/config/PerformanceConfig';
import { SaveManager } from '@/managers/SaveManager';

/**
 * Tracks FPS, persists monitor preference, and drives adaptive quality.
 */
export class PerformanceManager {
  private static instance: PerformanceManager | null = null;

  private readonly fpsSamples: number[] = [];
  private quality: QualityTier = 'high';
  private lastQualityChangeMs = 0;
  private showFps: boolean;
  private listeners = new Set<() => void>();

  private constructor() {
    this.showFps = SaveManager.get().getSettings().showFps;
  }

  static get(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  update(deltaMs: number, nowMs: number): void {
    if (deltaMs <= 0) {
      return;
    }

    const fps = 1000 / deltaMs;
    this.fpsSamples.push(fps);
    if (this.fpsSamples.length > PerformanceConfig.fpsSampleWindow) {
      this.fpsSamples.shift();
    }

    if (nowMs - this.lastQualityChangeMs < PerformanceConfig.qualityHoldMs) {
      return;
    }

    const average = this.getAverageFps();
    if (average < PerformanceConfig.lowFpsThreshold && this.quality !== 'low') {
      this.setQuality(this.quality === 'high' ? 'medium' : 'low', nowMs);
    } else if (average > PerformanceConfig.highFpsThreshold && this.quality !== 'high') {
      this.setQuality(this.quality === 'low' ? 'medium' : 'high', nowMs);
    }
  }

  getAverageFps(): number {
    if (this.fpsSamples.length === 0) {
      return PerformanceConfig.targetFps;
    }
    const sum = this.fpsSamples.reduce((acc, value) => acc + value, 0);
    return sum / this.fpsSamples.length;
  }

  getQuality(): QualityTier {
    return this.quality;
  }

  getParticleScale(): number {
    return PerformanceConfig.qualityParticleScale[this.quality];
  }

  getDustIntervalScale(): number {
    return PerformanceConfig.qualityDustIntervalScale[this.quality];
  }

  isFpsVisible(): boolean {
    return this.showFps;
  }

  setShowFps(show: boolean): void {
    this.showFps = show;
    this.persist();
    this.emit();
  }

  toggleShowFps(): void {
    this.setShowFps(!this.showFps);
  }

  onChange(listener: () => void): void {
    this.listeners.add(listener);
  }

  resetRun(): void {
    this.fpsSamples.length = 0;
    this.quality = 'high';
    this.lastQualityChangeMs = 0;
  }

  private setQuality(next: QualityTier, nowMs: number): void {
    this.quality = next;
    this.lastQualityChangeMs = nowMs;
    this.emit();
  }

  private persist(): void {
    SaveManager.get().patchSettings({ showFps: this.showFps });
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
