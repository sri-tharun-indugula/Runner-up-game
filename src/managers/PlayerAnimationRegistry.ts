import { AnimationKeys } from '@/config/AnimationKeys';
import { AssetKeys } from '@/config/AssetKeys';
import { PlayerFrameRanges } from '@/config/PlayerConfig';

export class PlayerAnimationRegistry {
  static register(scene: Phaser.Scene): void {
    const textureKey = AssetKeys.Sprites.Player;
    const animKeys = [
      AnimationKeys.Player.Idle,
      AnimationKeys.Player.Run,
      AnimationKeys.Player.Jump,
      AnimationKeys.Player.Fall,
      AnimationKeys.Player.Land,
    ];

    for (const key of animKeys) {
      if (scene.anims.exists(key)) {
        scene.anims.remove(key);
      }
    }

    scene.anims.create({
      key: AnimationKeys.Player.Idle,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: PlayerFrameRanges.idle.start,
        end: PlayerFrameRanges.idle.end,
      }),
      frameRate: 7,
      repeat: -1,
    });

    scene.anims.create({
      key: AnimationKeys.Player.Run,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: PlayerFrameRanges.run.start,
        end: PlayerFrameRanges.run.end,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: AnimationKeys.Player.Jump,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: PlayerFrameRanges.jump.start,
        end: PlayerFrameRanges.jump.end,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: AnimationKeys.Player.Fall,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: PlayerFrameRanges.fall.start,
        end: PlayerFrameRanges.fall.end,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: AnimationKeys.Player.Land,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: PlayerFrameRanges.land.start,
        end: PlayerFrameRanges.land.end,
      }),
      frameRate: 14,
      repeat: 0,
    });
  }
}
