import { isPortraitOrientation, shouldUseMobileUx } from '@/config/MobileConfig';

/**
 * Portrait rotate prompt + helper for mobile UX detection (Milestone 16).
 */
export class OrientationGuard {
  private static instance: OrientationGuard | null = null;
  private readonly root: HTMLDivElement;

  private constructor() {
    const parent = document.getElementById('game-container');
    if (!parent) {
      throw new Error('Missing #game-container for OrientationGuard');
    }

    this.root = document.createElement('div');
    this.root.id = 'orientation-guard';
    this.root.innerHTML = `
      <div class="orientation-card">
        <div class="orientation-icon" aria-hidden="true">↻</div>
        <h2>Rotate to play</h2>
        <p>This arcade runner plays best in landscape.</p>
      </div>
    `;
    parent.appendChild(this.root);

    window.addEventListener('resize', this.refresh);
    window.addEventListener('orientationchange', this.refresh);
    this.refresh();
  }

  static get(): OrientationGuard {
    if (!OrientationGuard.instance) {
      OrientationGuard.instance = new OrientationGuard();
    }
    return OrientationGuard.instance;
  }

  private refresh = (): void => {
    const block = shouldUseMobileUx() && isPortraitOrientation();
    this.root.classList.toggle('is-visible', block);
  };
}
