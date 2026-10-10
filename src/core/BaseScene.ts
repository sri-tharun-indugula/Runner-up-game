import { AnimationConfig } from '@/config/AnimationConfig';
import { SceneKeys, type SceneKey } from '@/config/SceneKeys';

export abstract class BaseScene extends Phaser.Scene {
  constructor(key: SceneKey) {
    super(key);
  }

  protected get centerX(): number {
    return this.cameras.main.centerX;
  }

  protected get centerY(): number {
    return this.cameras.main.centerY;
  }

  protected get gameWidth(): number {
    return this.cameras.main.width;
  }

  protected get gameHeight(): number {
    return this.cameras.main.height;
  }

  protected startScene(key: SceneKey, data?: object): void {
    this.scene.start(key, data);
  }

  protected launchOverlay(key: SceneKey, data?: object): void {
    this.scene.launch(key, data);
  }

  protected stopScene(key: SceneKey): void {
    this.scene.stop(key);
  }

  protected transitionTo(key: SceneKey, data?: object): void {
    const camera = this.cameras.main;
    camera.resetFX();

    let finished = false;
    const finish = (): void => {
      if (finished) {
        return;
      }
      finished = true;
      this.startScene(key, data);
    };

    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, finish);
    camera.fadeOut(AnimationConfig.scene.fadeMs, 0, 0, 0);

    // DOM-driven clicks can leave camera fades hanging; always recover.
    window.setTimeout(finish, AnimationConfig.scene.fadeMs + 120);
  }

  /** Queue a scene change outside the current DOM/input stack. */
  protected queueSceneStart(key: SceneKey, data?: object): void {
    window.setTimeout(() => {
      this.cameras.main.resetFX();
      this.cameras.main.setAlpha(1);
      this.startScene(key, data);
    }, 0);
  }
}

export { SceneKeys };
