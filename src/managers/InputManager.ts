export class InputManager {
  private readonly onJump: () => void;
  private readonly onJumpRelease: () => void;
  private enabled = true;
  private canvasPointerEnabled = true;
  private pointerScene: Phaser.Scene | null = null;

  constructor(scene: Phaser.Scene, onJump: () => void, onJumpRelease: () => void) {
    this.onJump = onJump;
    this.onJumpRelease = onJumpRelease;
    this.setupKeyboard();
    this.setupPointer(scene);
  }

  /** When HTML jump button is active, disable canvas taps to avoid double-jumps. */
  setCanvasPointerEnabled(enabled: boolean): void {
    this.canvasPointerEnabled = enabled;
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);
  }

  private setupPointer(scene: Phaser.Scene): void {
    scene.input.addPointer(2);
    scene.input.on('pointerdown', this.handleJump);
    scene.input.on('pointerup', this.handleJumpRelease);
    this.pointerScene = scene;
  }

  private handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || event.repeat) {
      return;
    }

    if (event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.onJump();
    }
  };

  private handleWindowKeyUp = (event: KeyboardEvent): void => {
    if (!this.enabled) {
      return;
    }

    if (event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.onJumpRelease();
    }
  };

  private handleJump = (): void => {
    if (!this.enabled || !this.canvasPointerEnabled) {
      return;
    }
    this.onJump();
  };

  private handleJumpRelease = (): void => {
    if (!this.enabled || !this.canvasPointerEnabled) {
      return;
    }
    this.onJumpRelease();
  };

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    window.removeEventListener('keyup', this.handleWindowKeyUp);

    if (this.pointerScene) {
      this.pointerScene.input.off('pointerdown', this.handleJump);
      this.pointerScene.input.off('pointerup', this.handleJumpRelease);
      this.pointerScene = null;
    }
  }
}
