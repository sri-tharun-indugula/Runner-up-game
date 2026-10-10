import { AnimationKeys } from '@/config/AnimationKeys';
import { AssetKeys } from '@/config/AssetKeys';
import { CollectibleConfig, CollectibleType } from '@/config/CollectibleConfig';

const ANIM_BY_TYPE: Record<CollectibleType, string> = {
  [CollectibleType.Coin]: AnimationKeys.Collectible.Coin,
  [CollectibleType.Gem]: AnimationKeys.Collectible.Gem,
  [CollectibleType.Magnet]: AnimationKeys.Collectible.Magnet,
  [CollectibleType.ScorePickup]: AnimationKeys.Collectible.ScorePickup,
  [CollectibleType.Shield]: AnimationKeys.Collectible.Shield,
  [CollectibleType.SpeedBoost]: AnimationKeys.Collectible.SpeedBoost,
  [CollectibleType.SlowMotion]: AnimationKeys.Collectible.SlowMotion,
  [CollectibleType.ExtraLife]: AnimationKeys.Collectible.ExtraLife,
};

const TEXTURE_BY_TYPE: Record<CollectibleType, string> = {
  [CollectibleType.Coin]: AssetKeys.Sprites.Coin,
  [CollectibleType.Gem]: AssetKeys.Sprites.Gem,
  [CollectibleType.Magnet]: AssetKeys.Sprites.Magnet,
  [CollectibleType.ScorePickup]: AssetKeys.Sprites.ScorePickup,
  [CollectibleType.Shield]: AssetKeys.Sprites.Shield,
  [CollectibleType.SpeedBoost]: AssetKeys.Sprites.SpeedBoost,
  [CollectibleType.SlowMotion]: AssetKeys.Sprites.SlowMotion,
  [CollectibleType.ExtraLife]: AssetKeys.Sprites.ExtraLife,
};

export class CollectibleAnimationRegistry {
  static register(scene: Phaser.Scene): void {
    for (const type of Object.values(CollectibleType)) {
      const animKey = ANIM_BY_TYPE[type];
      if (scene.anims.exists(animKey)) {
        continue;
      }

      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(TEXTURE_BY_TYPE[type], {
          start: 0,
          end: CollectibleConfig.frameCount - 1,
        }),
        frameRate: type === CollectibleType.Magnet ? 8 : 12,
        repeat: -1,
      });
    }
  }

  static getAnimationKey(type: CollectibleType): string {
    return ANIM_BY_TYPE[type];
  }

  static getTextureKey(type: CollectibleType): string {
    return TEXTURE_BY_TYPE[type];
  }
}
