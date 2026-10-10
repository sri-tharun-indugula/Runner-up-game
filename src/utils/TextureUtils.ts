export function createPlaceholderTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  color: number,
): void {
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(color, 1);
  graphics.fillRect(0, 0, width, height);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

/** Soft circular particle sprite for Phaser emitters. */
export function createSoftCircleTexture(
  scene: Phaser.Scene,
  key: string,
  size: number,
  color: number,
): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  const radius = size / 2;
  graphics.fillStyle(color, 1);
  graphics.fillCircle(radius, radius, radius);
  graphics.fillStyle(0xffffff, 0.35);
  graphics.fillCircle(radius * 0.7, radius * 0.65, radius * 0.35);
  graphics.generateTexture(key, size, size);
  graphics.destroy();
}

/** Diamond-ish spark for collectible bursts. */
export function createSparkTexture(scene: Phaser.Scene, key: string, size: number): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  const mid = size / 2;
  graphics.fillStyle(0xffffff, 1);
  graphics.fillTriangle(mid, 0, mid + mid * 0.45, mid, mid, size);
  graphics.fillTriangle(mid, 0, mid - mid * 0.45, mid, mid, size);
  graphics.fillTriangle(0, mid, mid, mid - mid * 0.45, size, mid);
  graphics.fillTriangle(0, mid, mid, mid + mid * 0.45, size, mid);
  graphics.generateTexture(key, size, size);
  graphics.destroy();
}

export function createStripedTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  baseColor: number,
  stripeColor: number,
  stripeWidth = 32,
): void {
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let x = 0; x < width; x += stripeWidth) {
    const color = Math.floor(x / stripeWidth) % 2 === 0 ? baseColor : stripeColor;
    graphics.fillStyle(color, 1);
    graphics.fillRect(x, 0, stripeWidth, height);
  }

  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

export function createSpritesheetTexture(
  scene: Phaser.Scene,
  key: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  drawFrame: (graphics: Phaser.GameObjects.Graphics, frameIndex: number, offsetX: number) => void,
): void {
  const sheetWidth = frameWidth * frameCount;
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let i = 0; i < frameCount; i++) {
    drawFrame(graphics, i, i * frameWidth);
  }

  graphics.generateTexture(key, sheetWidth, frameHeight);
  graphics.destroy();

  const texture = scene.textures.get(key);
  for (let i = 0; i < frameCount; i++) {
    texture.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
  }
}
