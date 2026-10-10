import { BaseScene, SceneKeys } from '@/core/BaseScene';
import { CollisionConfig, DeathCause } from '@/config/CollisionConfig';
import type { CollectResult } from '@/config/CollectibleConfig';
import { PlayerConfig } from '@/config/PlayerConfig';
import { SfxId } from '@/config/AudioConfig';
import { Player } from '@/entities/Player';
import { PowerUpVisuals } from '@/entities/PowerUpVisuals';
import { AudioManager } from '@/managers/AudioManager';
import { BackgroundManager } from '@/managers/BackgroundManager';
import { CameraManager } from '@/managers/CameraManager';
import { CollectibleManager } from '@/managers/CollectibleManager';
import { CollisionManager } from '@/managers/CollisionManager';
import { DeathDetector } from '@/managers/DeathDetector';
import { DifficultyManager } from '@/managers/DifficultyManager';
import { GroundManager } from '@/managers/GroundManager';
import { InputManager } from '@/managers/InputManager';
import { ObstacleManager } from '@/managers/ObstacleManager';
import { ParticleManager } from '@/managers/ParticleManager';
import { PhysicsManager } from '@/managers/PhysicsManager';
import { PowerUpManager } from '@/managers/PowerUpManager';
import { ScoreManager } from '@/managers/ScoreManager';
import { DomOverlay } from '@/ui/DomOverlay';
import { HudOverlay } from '@/ui/HudOverlay';
import { TouchControls } from '@/ui/TouchControls';
import { shouldUseMobileUx } from '@/config/MobileConfig';
import { SaveManager } from '@/managers/SaveManager';
import { PerformanceManager } from '@/managers/PerformanceManager';
import { FpsOverlay } from '@/ui/FpsOverlay';

const INVULN_MS = 1200;

export class GameScene extends BaseScene {
  private cameraManager!: CameraManager;
  private backgroundManager!: BackgroundManager;
  private physicsManager!: PhysicsManager;
  private collisionManager!: CollisionManager;
  private groundManager!: GroundManager;
  private obstacleManager!: ObstacleManager;
  private collectibleManager!: CollectibleManager;
  private particleManager!: ParticleManager;
  private powerUpManager!: PowerUpManager;
  private powerUpVisuals!: PowerUpVisuals;
  private scoreManager!: ScoreManager;
  private difficultyManager = new DifficultyManager();
  private inputManager!: InputManager;
  private deathDetector = new DeathDetector();
  private player!: Player;
  private isGameOver = false;
  private isPaused = false;
  private invulnerableUntilMs = 0;
  private lastDeathCause: DeathCause = DeathCause.Fall;
  private runId = 0;
  private windowKeyHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.runId += 1;
    this.ensurePhysicsRunning();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.isGameOver = false;
    this.isPaused = false;
    this.invulnerableUntilMs = 0;
    DomOverlay.get().hide();
    this.scoreManager = new ScoreManager();
    this.scoreManager.resetRun();
    this.difficultyManager.reset();
    this.powerUpManager = new PowerUpManager(this);
    this.powerUpManager.reset();
    PerformanceManager.get().resetRun();
    FpsOverlay.get();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.initWorld();
    this.createPlayer();
    this.setupCollisions();
    this.registerInput();
    HudOverlay.get().show();
    this.setupTouchControls();
    this.cameraManager.startScrolling();
    AudioManager.get().unlock();
    if (!AudioManager.get().isMuted()) {
      AudioManager.get().startBgm();
    }
  }

  update(time: number, delta: number): void {
    PerformanceManager.get().update(delta, time);
    FpsOverlay.get().update();

    if (this.isGameOver || this.isPaused) {
      return;
    }

    // Arcade world can stay paused across scene restart after game-over.
    this.ensurePhysicsRunning();

    this.cameraManager.update(delta);

    const scrollX = this.cameraManager.getScrollX();
    const distance = this.cameraManager.getDistanceTraveled();
    const difficulty = this.difficultyManager.update(distance);
    this.powerUpManager.update();

    const scrollSpeed = difficulty.scrollSpeed * this.powerUpManager.getSpeedMultiplier();
    this.cameraManager.setScrollSpeed(scrollSpeed);
    this.scoreManager.setDistance(distance);

    this.backgroundManager.update(delta, this.cameraManager.getScrollSpeed());
    this.obstacleManager.update(scrollX, distance, delta, difficulty);
    this.collectibleManager.update(scrollX, distance, delta, this.player.x, this.player.y);
    this.groundManager.update(scrollX);
    this.player.update(delta, scrollX);
    this.particleManager.update(
      delta,
      this.player.x,
      this.player.y,
      this.player.isOnGround() && this.player.isAlive(),
    );
    this.powerUpVisuals.update(delta, this.powerUpManager);
    this.checkFallDeath();
    this.updateHUD();
  }

  private initWorld(): void {
    this.physicsManager = new PhysicsManager(this);
    this.collisionManager = new CollisionManager(this);
    this.cameraManager = new CameraManager(this);
    this.backgroundManager = new BackgroundManager(this);
    this.particleManager = new ParticleManager(this);

    this.obstacleManager = new ObstacleManager(this, () => {
      this.groundManager.refreshAllSegments();
    });

    this.groundManager = new GroundManager(
      this,
      this.obstacleManager.getPitRegistry(),
    );

    this.collectibleManager = new CollectibleManager(
      this,
      this.obstacleManager.getPitRegistry(),
      this.collisionManager.getCollectibleGroup(),
      this.powerUpManager,
      (result) => this.onCollectibleCollected(result),
    );
  }

  private createPlayer(): void {
    const spawnX = PlayerConfig.screenOffsetX;
    const spawnY = this.groundManager.getSurfaceY() - PlayerConfig.frameHeight / 2;
    this.player = new Player(this, spawnX, spawnY);
    const skinTint = SaveManager.get().getSelectedSkin().tint;
    this.player.setData('baseTint', skinTint);
    this.player.setTint(skinTint);
    this.powerUpVisuals = new PowerUpVisuals(this, this.player);
    this.player.setFxHooks({
      onJump: (x, y, isDouble) => this.particleManager.emitJump(x, y, isDouble),
      onLand: (x, y, hard) => this.particleManager.emitLanding(x, y, hard),
    });
  }

  private setupCollisions(): void {
    this.collisionManager.setupGroundCollision(
      this.player as Phaser.Types.Physics.Arcade.GameObjectWithBody,
      this.groundManager.getGroup(),
    );

    this.collisionManager.setupHazardOverlap(
      this.player as Phaser.Types.Physics.Arcade.GameObjectWithBody,
      this.obstacleManager.getHazardGroup(),
      () => this.handleDeath(DeathCause.Obstacle),
    );

    this.collisionManager.setupCollectibleOverlap(
      this.player as Phaser.Types.Physics.Arcade.GameObjectWithBody,
      (_player, collectible) => {
        this.collectibleManager.handleOverlap(collectible);
      },
    );
  }

  private onCollectibleCollected(result: CollectResult): void {
    this.scoreManager.addCollectible(result);
    AudioManager.get().playCollect(result.type);
    this.particleManager.emitSparkle(this.player.x + 8, this.player.y - 8, result.type);
  }

  private updateHUD(): void {
    const snapshot = this.scoreManager.getSnapshot();
    const difficulty = this.difficultyManager.getSnapshot();
    const powerUps = this.powerUpManager.getSnapshot();

    HudOverlay.get().update({
      score: snapshot.totalScore,
      distance: snapshot.distance,
      coins: snapshot.coins,
      best: snapshot.bestScore,
      lives: powerUps.lives,
      level: difficulty.displayLevel,
      powerUps: powerUps.active,
    });
  }

  private checkFallDeath(): void {
    if (!this.player.isAlive()) {
      return;
    }

    if (this.deathDetector.check(this.player.y, this.player.getBottomY())) {
      this.handleDeath(DeathCause.Fall);
    }
  }

  private isInvulnerable(): boolean {
    return this.time.now < this.invulnerableUntilMs;
  }

  private grantInvulnerability(durationMs = INVULN_MS): void {
    this.invulnerableUntilMs = this.time.now + durationMs;
  }

  private handleDeath(cause: DeathCause): void {
    if (this.isGameOver || !this.player.isAlive() || this.isInvulnerable()) {
      return;
    }

    // Shield only absorbs obstacle hits, not pit falls.
    if (cause === DeathCause.Obstacle && this.powerUpManager.tryAbsorbHit()) {
      this.powerUpVisuals.flashShieldBreak();
      this.particleManager.emitShieldBreak(this.player.x, this.player.y);
      this.grantInvulnerability();
      AudioManager.get().play(SfxId.Hit);
      this.cameras.main.shake(
        CollisionConfig.cameraShakeDurationMs * 0.5,
        CollisionConfig.cameraShakeIntensity * 0.6,
      );
      return;
    }

    if (this.powerUpManager.tryConsumeLife()) {
      this.particleManager.emitExplosion(this.player.x, this.player.y);
      this.revivePlayer(cause);
      return;
    }

    this.isGameOver = true;
    this.isPaused = false;
    this.lastDeathCause = cause;
    this.collisionManager.setEnabled(false);
    this.cameraManager.stopScrolling();
    this.inputManager.setEnabled(false);
    // Do NOT pause Arcade physics here — a paused world survives scene
    // recycle and freezes Restart / Menu after the overlay is dismissed.
    this.particleManager.setPaused(true);
    TouchControls.get().hide();
    this.particleManager.emitExplosion(this.player.x, this.player.y);
    AudioManager.get().stopBgm();
    AudioManager.get().play(SfxId.Hit);
    AudioManager.get().play(SfxId.GameOver);

    this.cameras.main.shake(
      CollisionConfig.cameraShakeDurationMs,
      CollisionConfig.cameraShakeIntensity,
    );

    this.player.die(cause);
    const snapshot = this.scoreManager.finalizeRun();
    if (snapshot.isNewBest) {
      this.cameras.main.flash(220, 45, 226, 230, false);
    }
    this.updateHUD();

    const runId = this.runId;
    this.time.delayedCall(CollisionConfig.deathFreezeDelayMs, () => {
      if (this.runId !== runId || !this.isGameOver) {
        return;
      }
      this.showGameOverScreen(snapshot);
    });
  }

  private revivePlayer(cause: DeathCause): void {
    const scrollX = this.cameraManager.getScrollX();
    const x = scrollX + PlayerConfig.screenOffsetX;
    const y =
      cause === DeathCause.Fall
        ? this.groundManager.getSurfaceY() - PlayerConfig.frameHeight / 2
        : this.player.y;

    this.player.resetAt(x, Math.min(y, this.groundManager.getSurfaceY() - PlayerConfig.frameHeight / 2));
    this.grantInvulnerability();
    AudioManager.get().play(SfxId.Hit);
    this.cameras.main.shake(
      CollisionConfig.cameraShakeDurationMs * 0.45,
      CollisionConfig.cameraShakeIntensity * 0.5,
    );
    this.updateHUD();
  }

  private showGameOverScreen(
    snapshot: ReturnType<ScoreManager['getSnapshot']>,
  ): void {
    DomOverlay.get().showGameOver(
      this.lastDeathCause,
      snapshot,
      () => this.restartGame(),
      () => this.returnToMenu(),
      () => {
        DomOverlay.get().showHighScores(
          this.scoreManager.getBestScore(),
          this.scoreManager.getHighScores(),
          () => this.showGameOverScreen(snapshot),
        );
      },
      this.scoreManager.getNewlyUnlocked(),
    );
  }

  private setupTouchControls(): void {
    const touch = TouchControls.get();
    touch.bind({
      onJumpDown: () => {
        if (!this.isPaused && !this.isGameOver) {
          this.player.jump();
        }
      },
      onJumpUp: () => {
        if (!this.isPaused && !this.isGameOver) {
          this.player.releaseJump();
        }
      },
      onPause: () => {
        if (!this.isGameOver) {
          this.pauseGame();
        }
      },
    });
    touch.show();
    this.inputManager.setCanvasPointerEnabled(!shouldUseMobileUx());
  }

  private registerInput(): void {
    this.inputManager = new InputManager(
      this,
      () => {
        if (!this.isPaused && !this.isGameOver) {
          this.player.jump();
        }
      },
      () => {
        if (!this.isPaused && !this.isGameOver) {
          this.player.releaseJump();
        }
      },
    );

    this.windowKeyHandler = (event: KeyboardEvent): void => {
      if (event.repeat || this.isGameOver) {
        return;
      }

      if (event.key === 'f' || event.key === 'F') {
        PerformanceManager.get().toggleShowFps();
        return;
      }

      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (this.isPaused) {
          // Pause overlay owns resume keys while open.
          return;
        }
        this.pauseGame();
      }
    };

    window.addEventListener('keydown', this.windowKeyHandler);
  }

  private pauseGame(): void {
    if (this.isGameOver) {
      return;
    }

    if (!this.isPaused) {
      this.isPaused = true;
      this.cameraManager.stopScrolling();
      this.inputManager.setEnabled(false);
      // Freeze gameplay via flags only — avoid world.pause() (breaks resume/restart).
      this.particleManager.setPaused(true);
      TouchControls.get().hide();
      AudioManager.get().play(SfxId.UiClick);
    }

    this.showPauseMenu();
  }

  private showPauseMenu(): void {
    DomOverlay.get().showPause({
      onResume: () => this.resumeGame(),
      onSettings: () => {
        DomOverlay.get().showSettings(() => this.showPauseMenu());
      },
      onMenu: () => this.returnToMenu(),
    });
  }

  private resumeGame(): void {
    if (!this.isPaused || this.isGameOver) {
      return;
    }

    this.isPaused = false;
    DomOverlay.get().hide();
    this.ensurePhysicsRunning();
    this.particleManager.setPaused(false);
    TouchControls.get().show();
    this.inputManager.setEnabled(true);
    this.cameraManager.startScrolling();
    if (!AudioManager.get().isMuted()) {
      AudioManager.get().startBgm();
    }
  }

  private restartGame(): void {
    DomOverlay.get().hide();
    HudOverlay.get().hide();
    TouchControls.get().hide();
    AudioManager.get().stopBgm();
    this.ensurePhysicsRunning();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.queueSceneStart(SceneKeys.Game);
  }

  private returnToMenu(): void {
    DomOverlay.get().hide();
    HudOverlay.get().hide();
    TouchControls.get().hide();
    AudioManager.get().stopBgm();
    this.ensurePhysicsRunning();
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.queueSceneStart(SceneKeys.MainMenu);
  }

  private ensurePhysicsRunning(): void {
    const world = this.physicsManager?.getWorld() ?? this.physics?.world;
    if (world?.isPaused) {
      world.resume();
    }
  }

  private handleShutdown = (): void => {
    this.ensurePhysicsRunning();
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.windowKeyHandler) {
      window.removeEventListener('keydown', this.windowKeyHandler);
      this.windowKeyHandler = null;
    }
    AudioManager.get().stopBgm();
    DomOverlay.get().hide();
    HudOverlay.get().hide();
    TouchControls.get().hide();

    const safe = (label: string, fn: () => void): void => {
      try {
        fn();
      } catch (error) {
        console.warn(`[GameScene] shutdown ${label}`, error);
      }
    };

    safe('input', () => this.inputManager?.destroy());
    safe('powerFx', () => this.powerUpVisuals?.destroy());
    safe('particles', () => this.particleManager?.destroy());
    safe('collectibles', () => this.collectibleManager?.destroy());
    safe('collisions', () => this.collisionManager?.destroy());
    safe('obstacles', () => this.obstacleManager?.destroy());
    safe('background', () => this.backgroundManager?.destroy());
    safe('ground', () => this.groundManager?.destroy());
    safe('camera', () => this.cameraManager?.reset());
    safe('player', () => this.player?.destroy());
  };
}
