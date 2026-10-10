import { PhysicsConfig } from '@/config/PhysicsConfig';
import { WorldConfig } from '@/config/WorldConfig';

export class PhysicsManager {
  private readonly scene: Phaser.Scene;
  private readonly world: Phaser.Physics.Arcade.World;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.world = scene.physics.world;
    this.configure();
  }

  private configure(): void {
    this.world.gravity.y = PhysicsConfig.gravity;
    this.world.setBounds(0, 0, WorldConfig.width, WorldConfig.height + 200);
    this.world.drawDebug = PhysicsConfig.debug;

    // Scene restarts keep the Arcade world paused after a game-over.
    this.world.resume();
  }

  addGroundCollider(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ground: Phaser.Physics.Arcade.StaticGroup,
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(player, ground);
  }

  setDebug(enabled: boolean): void {
    this.world.drawDebug = enabled;
  }

  getWorld(): Phaser.Physics.Arcade.World {
    return this.world;
  }
}
