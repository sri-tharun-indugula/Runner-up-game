import { shouldUseMobileUx } from '@/config/MobileConfig';

export interface TouchControlActions {
  onJumpDown: () => void;
  onJumpUp: () => void;
  onPause: () => void;
}

/**
 * On-screen arcade controls for phones / tablets (Milestone 16).
 */
export class TouchControls {
  private static instance: TouchControls | null = null;

  private readonly root: HTMLDivElement;
  private readonly jumpBtn: HTMLButtonElement;
  private readonly pauseBtn: HTMLButtonElement;
  private actions: TouchControlActions | null = null;

  private constructor() {
    const parent = document.getElementById('game-container');
    if (!parent) {
      throw new Error('Missing #game-container for TouchControls');
    }

    this.root = document.createElement('div');
    this.root.id = 'touch-controls';
    this.root.innerHTML = `
      <button type="button" class="touch-btn touch-pause" data-action="pause" aria-label="Pause">II</button>
      <button type="button" class="touch-btn touch-jump" data-action="jump" aria-label="Jump">JUMP</button>
    `;
    parent.appendChild(this.root);

    this.jumpBtn = this.root.querySelector('[data-action="jump"]') as HTMLButtonElement;
    this.pauseBtn = this.root.querySelector('[data-action="pause"]') as HTMLButtonElement;

    this.wireJump(this.jumpBtn);
    this.pauseBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.actions?.onPause();
    });

    this.hide();
  }

  static get(): TouchControls {
    if (!TouchControls.instance) {
      TouchControls.instance = new TouchControls();
    }
    return TouchControls.instance;
  }

  bind(actions: TouchControlActions): void {
    this.actions = actions;
  }

  show(): void {
    if (!shouldUseMobileUx()) {
      this.hide();
      return;
    }
    this.root.classList.add('is-visible');
  }

  hide(): void {
    this.root.classList.remove('is-visible');
  }

  private wireJump(button: HTMLButtonElement): void {
    const down = (event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
      button.classList.add('is-pressed');
      this.actions?.onJumpDown();
    };
    const up = (event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
      button.classList.remove('is-pressed');
      this.actions?.onJumpUp();
    };

    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('pointerleave', up);
  }
}
