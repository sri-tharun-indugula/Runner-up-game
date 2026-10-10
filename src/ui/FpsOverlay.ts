import { PerformanceManager } from '@/managers/PerformanceManager';

/**
 * Lightweight FPS / quality readout for Milestone 17.
 */
export class FpsOverlay {
  private static instance: FpsOverlay | null = null;

  private readonly root: HTMLDivElement;
  private readonly valueEl: HTMLElement;
  private readonly qualityEl: HTMLElement;

  private constructor() {
    const parent = document.getElementById('game-container');
    if (!parent) {
      throw new Error('Missing #game-container for FpsOverlay');
    }

    this.root = document.createElement('div');
    this.root.id = 'fps-overlay';
    this.root.innerHTML = `
      <span data-fps="value">60</span>
      <span data-fps="quality">HIGH</span>
    `;
    parent.appendChild(this.root);

    this.valueEl = this.root.querySelector('[data-fps="value"]') as HTMLElement;
    this.qualityEl = this.root.querySelector('[data-fps="quality"]') as HTMLElement;

    PerformanceManager.get().onChange(() => this.refreshVisibility());
    this.refreshVisibility();
  }

  static get(): FpsOverlay {
    if (!FpsOverlay.instance) {
      FpsOverlay.instance = new FpsOverlay();
    }
    return FpsOverlay.instance;
  }

  update(): void {
    if (!PerformanceManager.get().isFpsVisible()) {
      return;
    }

    const perf = PerformanceManager.get();
    this.valueEl.textContent = `${Math.round(perf.getAverageFps())}`;
    this.qualityEl.textContent = perf.getQuality().toUpperCase();
  }

  private refreshVisibility(): void {
    this.root.classList.toggle('is-visible', PerformanceManager.get().isFpsVisible());
  }
}
