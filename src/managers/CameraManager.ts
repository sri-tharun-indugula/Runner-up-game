import { WorldConfig } from '@/config/WorldConfig';

export class CameraManager {
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private scrollSpeed: number;
  private distanceTraveled = 0;
  private isScrolling = false;

  constructor(scene: Phaser.Scene) {
    this.camera = scene.cameras.main;
    this.scrollSpeed = WorldConfig.scrollSpeed;
    this.setup();
  }

  private setup(): void {
    this.camera.setBounds(0, 0, WorldConfig.width, WorldConfig.height);
    this.camera.setScroll(0, 0);
  }

  startScrolling(): void {
    this.isScrolling = true;
  }

  stopScrolling(): void {
    this.isScrolling = false;
  }

  update(deltaMs: number): void {
    if (!this.isScrolling) {
      return;
    }

    const scrollAmount = (this.scrollSpeed * deltaMs) / 1000;
    this.distanceTraveled += scrollAmount;
    this.camera.scrollX += scrollAmount;
  }

  getScrollX(): number {
    return this.camera.scrollX;
  }

  getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  getScrollSpeed(): number {
    return this.scrollSpeed;
  }

  isActive(): boolean {
    return this.isScrolling;
  }

  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  reset(): void {
    this.camera.setScroll(0, 0);
    this.distanceTraveled = 0;
    this.isScrolling = false;
  }
}
