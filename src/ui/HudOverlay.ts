import type { PowerUpStatus } from '@/config/PowerUpConfig';

export interface HudStats {
  score: number;
  distance: number;
  coins: number;
  best: number;
  lives?: number;
  level?: number;
  powerUps?: PowerUpStatus[];
}

/**
 * Responsive HTML HUD for in-run stats and power-up timers.
 */
export class HudOverlay {
  private static instance: HudOverlay | null = null;

  private readonly root: HTMLDivElement;
  private readonly scoreEl: HTMLElement;
  private readonly distanceEl: HTMLElement;
  private readonly coinsEl: HTMLElement;
  private readonly bestEl: HTMLElement;
  private readonly livesEl: HTMLElement;
  private readonly metaEl: HTMLElement;
  private readonly powerEl: HTMLElement;

  private constructor() {
    const parent = document.getElementById('game-container');
    if (!parent) {
      throw new Error('Missing #game-container for HudOverlay');
    }

    this.root = document.createElement('div');
    this.root.id = 'hud-overlay';
    this.root.innerHTML = `
      <div class="hud-card">
        <div class="hud-row"><span>Score</span><strong data-hud="score">0</strong></div>
        <div class="hud-row"><span>Distance</span><strong data-hud="distance">0m</strong></div>
        <div class="hud-row"><span>Coins</span><strong data-hud="coins">0</strong></div>
        <div class="hud-row hud-row-muted"><span>Best</span><strong data-hud="best">0</strong></div>
        <div class="hud-row"><span>Lives</span><strong data-hud="lives">0</strong></div>
        <div class="hud-meta" data-hud="meta"></div>
        <div class="hud-powers" data-hud="powers"></div>
      </div>
      <div class="hud-hint">JUMP · P Pause · F FPS</div>
    `;
    parent.appendChild(this.root);

    this.scoreEl = this.root.querySelector('[data-hud="score"]') as HTMLElement;
    this.distanceEl = this.root.querySelector('[data-hud="distance"]') as HTMLElement;
    this.coinsEl = this.root.querySelector('[data-hud="coins"]') as HTMLElement;
    this.bestEl = this.root.querySelector('[data-hud="best"]') as HTMLElement;
    this.livesEl = this.root.querySelector('[data-hud="lives"]') as HTMLElement;
    this.metaEl = this.root.querySelector('[data-hud="meta"]') as HTMLElement;
    this.powerEl = this.root.querySelector('[data-hud="powers"]') as HTMLElement;
    this.hide();
  }

  static get(): HudOverlay {
    if (!HudOverlay.instance) {
      HudOverlay.instance = new HudOverlay();
    }
    return HudOverlay.instance;
  }

  show(): void {
    this.root.classList.add('is-visible');
  }

  hide(): void {
    this.root.classList.remove('is-visible');
  }

  update(stats: HudStats): void {
    this.scoreEl.textContent = String(stats.score);
    this.distanceEl.textContent = `${stats.distance}m`;
    this.coinsEl.textContent = String(stats.coins);
    this.bestEl.textContent = String(stats.best);
    this.livesEl.textContent = String(stats.lives ?? 0);

    const parts: string[] = [];
    if (stats.level !== undefined) {
      parts.push(`Lv ${stats.level}`);
    }
    this.metaEl.textContent = parts.join(' · ');

    const powers = stats.powerUps ?? [];
    this.powerEl.innerHTML = powers
      .map(
        (power) =>
          `<div class="hud-power"><span>${power.label}</span><strong>${(power.remainingMs / 1000).toFixed(1)}s</strong></div>`,
      )
      .join('');
  }
}
