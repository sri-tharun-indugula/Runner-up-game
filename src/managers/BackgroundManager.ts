import { ParallaxLayer } from '@/entities/ParallaxLayer';
import { WorldConfig } from '@/config/WorldConfig';

export class BackgroundManager {
  private readonly layers: ParallaxLayer[] = [];
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createLayers();
  }

  private createLayers(): void {
    for (const config of WorldConfig.parallaxLayers) {
      const layer = new ParallaxLayer(this.scene, config, WorldConfig.viewportWidth);
      this.layers.push(layer);
    }
  }

  update(deltaMs: number, scrollSpeed: number): void {
    for (const layer of this.layers) {
      layer.update(deltaMs, scrollSpeed);
    }
  }

  destroy(): void {
    for (const layer of this.layers) {
      layer.destroy();
    }
    this.layers.length = 0;
  }
}
