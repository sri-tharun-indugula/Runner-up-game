import { BaseScene, SceneKeys } from '@/core/BaseScene';

export class BootScene extends BaseScene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.startScene(SceneKeys.Preload);
  }
}
