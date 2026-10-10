import { BrandConfig } from '@/config/BrandConfig';
import { GuideConfig } from '@/config/GuideConfig';
import { DeathCause, DeathCauseLabels } from '@/config/CollisionConfig';
import { SfxId } from '@/config/AudioConfig';
import type { HighScoreEntry, ScoreSnapshot } from '@/config/ScoreConfig';
import { AudioManager } from '@/managers/AudioManager';
import { PerformanceManager } from '@/managers/PerformanceManager';
import type { GuideVisuals } from '@/ui/GuidePreviewFactory';

type CleanupFn = () => void;

export interface PauseActions {
  onResume: () => void;
  onSettings: () => void;
  onMenu: () => void;
}

export interface MainMenuActions {
  onStart: () => void;
  onSettings: () => void;
  onHighScores: () => void;
  onUnlocks: () => void;
}

export interface UnlockRow {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  selected: boolean;
}

/**
 * HTML UI layered above the Phaser canvas for all milestone-12 screens.
 */
export class DomOverlay {
  private static instance: DomOverlay | null = null;

  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly audioBar: HTMLDivElement;
  private keyCleanup: CleanupFn | null = null;

  private constructor() {
    const parent = document.getElementById('game-container');
    if (!parent) {
      throw new Error('Missing #game-container for DomOverlay');
    }

    parent.classList.add('has-dom-overlay');

    this.root = document.createElement('div');
    this.root.id = 'dom-overlay';
    this.root.setAttribute('aria-hidden', 'true');

    this.panel = document.createElement('div');
    this.panel.className = 'dom-overlay-panel';
    this.root.appendChild(this.panel);
    parent.appendChild(this.root);

    this.audioBar = document.createElement('div');
    this.audioBar.id = 'audio-bar';
    this.audioBar.innerHTML = `
      <button type="button" class="audio-mute-btn" data-action="mute" aria-label="Toggle mute">Mute</button>
      <input class="audio-volume" data-action="volume" type="range" min="0" max="100" value="75" aria-label="Volume" />
    `;
    parent.appendChild(this.audioBar);

    this.wireAudioBar();
    AudioManager.get().onChange(() => this.refreshAudioBar());
    this.refreshAudioBar();
  }

  static get(): DomOverlay {
    if (!DomOverlay.instance) {
      DomOverlay.instance = new DomOverlay();
    }
    return DomOverlay.instance;
  }

  showMainMenu(bestScore: number, totalCoins: number, actions: MainMenuActions): void {
    this.clearKeyboard();
    this.panel.innerHTML = `
      <div class="dom-menu">
        <p class="dom-kicker">${BrandConfig.kicker}</p>
        <h1 class="dom-title">${BrandConfig.title}</h1>
        <p class="dom-hint" style="margin-top:-6px">${BrandConfig.tagline}</p>
        <p class="dom-best">Best Score: <strong>${bestScore}</strong></p>
        <p class="dom-best">Banked Coins: <strong>${totalCoins}</strong></p>
        <div class="dom-btn-row">
          <button type="button" class="dom-btn dom-btn-primary" data-action="start">Start Game</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="highscores">High Scores</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="unlocks">Unlocks</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="settings">Settings</button>
        </div>
        <p class="dom-hint">Space / Enter to start</p>
      </div>
    `;

    this.bindClick('start', () => {
      AudioManager.get().unlock();
      AudioManager.get().play(SfxId.UiClick);
      actions.onStart();
    });
    this.bindClick('highscores', () => {
      AudioManager.get().play(SfxId.UiClick);
      actions.onHighScores();
    });
    this.bindClick('unlocks', () => {
      AudioManager.get().play(SfxId.UiClick);
      actions.onUnlocks();
    });
    this.bindClick('settings', () => {
      AudioManager.get().play(SfxId.UiClick);
      actions.onSettings();
    });

    this.bindKeys((key) => {
      if (key === ' ' || key === 'Enter' || key === 'Spacebar') {
        AudioManager.get().unlock();
        AudioManager.get().play(SfxId.UiClick);
        actions.onStart();
      }
    });

    this.setActive(true);
  }

  showHowToPlay(visuals: GuideVisuals, onPlay: () => void, onBack: () => void): void {
    this.clearKeyboard();

    const controls = GuideConfig.controls
      .map(
        (row) =>
          `<li><strong>${row.label}</strong><span>${row.detail}</span></li>`,
      )
      .join('');

    const renderIcon = (
      icon: GuideVisuals['obstacles'][number]['icon'],
      box = 48,
    ): string => {
      if (!icon.src) {
        return `<span class="guide-icon guide-icon-fallback" aria-hidden="true"></span>`;
      }
      const scale = Math.min(1, (box - 8) / Math.max(icon.frameWidth, icon.frameHeight));
      const displayW = Math.max(1, Math.round(icon.frameWidth * scale));
      const displayH = Math.max(1, Math.round(icon.frameHeight * scale));
      const sheetDisplayW = Math.round(icon.frameWidth * icon.frameCount * scale);
      const boxClass = box > 56 ? 'guide-icon guide-icon-lg' : 'guide-icon';

      if (icon.frameCount > 1) {
        return `<span class="${boxClass} guide-motion-${icon.motion}" role="img"><span class="guide-icon-sheet" style="--guide-fw:${displayW}px;--guide-fh:${displayH}px;--guide-sheet:${sheetDisplayW}px;--guide-frames:${icon.frameCount};background-image:url('${icon.src}')"></span></span>`;
      }

      return `<span class="${boxClass} guide-motion-${icon.motion}" role="img"><img class="guide-icon-still" src="${icon.src}" width="${displayW}" height="${displayH}" alt="" /></span>`;
    };

    const rowHtml = (rows: GuideVisuals['obstacles']): string =>
      rows
        .map(
          (row) =>
            `<li>${renderIcon(row.icon)}<div><strong>${row.name}</strong><span>${row.detail}</span></div></li>`,
        )
        .join('');

    const tips = GuideConfig.tips.map((tip) => `<li>${tip}</li>`).join('');
    const runner = visuals.runner;

    this.panel.classList.add('is-wide');
    this.panel.innerHTML = `
      <div class="dom-menu dom-guide">
        <p class="dom-kicker">${BrandConfig.shortName}</p>
        <h1 class="dom-title dom-title-sm">${GuideConfig.title}</h1>
        <section class="guide-section guide-runner">
          ${renderIcon(runner.icon, 72)}
          <div>
            <h2>${runner.name}</h2>
            <p>${runner.detail}</p>
          </div>
        </section>
        <div class="guide-grid">
          <section class="guide-section">
            <h2>Moves</h2>
            <ul class="guide-list guide-icons">${rowHtml(visuals.actions)}</ul>
          </section>
          <section class="guide-section">
            <h2>Controls</h2>
            <ul class="guide-list guide-controls">${controls}</ul>
          </section>
          <section class="guide-section">
            <h2>Obstacles</h2>
            <ul class="guide-list guide-icons">${rowHtml(visuals.obstacles)}</ul>
          </section>
          <section class="guide-section">
            <h2>Power-Ups</h2>
            <ul class="guide-list guide-icons">${rowHtml(visuals.powers)}</ul>
          </section>
          <section class="guide-section">
            <h2>Pickups</h2>
            <ul class="guide-list guide-icons">${rowHtml(visuals.pickups)}</ul>
          </section>
        </div>
        <section class="guide-section guide-tips">
          <h2>Tips</h2>
          <ul class="guide-tips-list">${tips}</ul>
        </section>
        <div class="dom-btn-row">
          <button type="button" class="dom-btn dom-btn-primary" data-action="play">Let's Run!</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="back">Back</button>
        </div>
        <p class="dom-hint">Space / Enter to run</p>
      </div>
    `;

    this.bindClick('play', () => {
      AudioManager.get().unlock();
      AudioManager.get().play(SfxId.UiStart);
      this.panel.classList.remove('is-wide');
      this.hide();
      onPlay();
    });
    this.bindClick('back', () => {
      AudioManager.get().play(SfxId.UiClick);
      this.panel.classList.remove('is-wide');
      onBack();
    });
    this.bindKeys((key) => {
      if (key === ' ' || key === 'Enter' || key === 'Spacebar') {
        AudioManager.get().unlock();
        AudioManager.get().play(SfxId.UiStart);
        this.panel.classList.remove('is-wide');
        this.hide();
        onPlay();
      }
      if (key === 'Escape') {
        AudioManager.get().play(SfxId.UiClick);
        this.panel.classList.remove('is-wide');
        onBack();
      }
    });
    this.setActive(true);
  }

  showUnlocks(
    rows: UnlockRow[],
    onSelect: (id: string) => void,
    onBack: () => void,
  ): void {
    this.clearKeyboard();
    const list = rows
      .map((row) => {
        const state = row.selected ? 'Equipped' : row.unlocked ? 'Select' : 'Locked';
        const disabled = row.unlocked ? '' : 'disabled';
        return `<li class="dom-unlock-row ${row.unlocked ? 'is-unlocked' : 'is-locked'}">
          <div>
            <strong>${row.name}</strong>
            <span>${row.description}</span>
          </div>
          <button type="button" class="dom-btn dom-btn-secondary dom-btn-compact" data-unlock="${row.id}" ${disabled}>${state}</button>
        </li>`;
      })
      .join('');

    this.panel.innerHTML = `
      <div class="dom-menu">
        <h1 class="dom-title dom-title-sm">Unlocks</h1>
        <ul class="dom-unlock-list">${list}</ul>
        <button type="button" class="dom-btn dom-btn-primary" data-action="back">Back</button>
      </div>
    `;

    this.panel.querySelectorAll('[data-unlock]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const id = (event.currentTarget as HTMLElement).getAttribute('data-unlock');
        if (!id) {
          return;
        }
        AudioManager.get().play(SfxId.UiClick);
        onSelect(id);
      });
    });

    this.bindClick('back', () => {
      AudioManager.get().play(SfxId.UiClick);
      onBack();
    });
    this.bindKeys((key) => {
      if (key === 'Escape') {
        onBack();
      }
    });
    this.setActive(true);
  }

  showPause(actions: PauseActions): void {
    this.clearKeyboard();
    this.panel.innerHTML = `
      <div class="dom-menu">
        <h1 class="dom-title dom-title-sm">Paused</h1>
        <p class="dom-stats">Take a breath, then jump back in.</p>
        <div class="dom-btn-row">
          <button type="button" class="dom-btn dom-btn-primary" data-action="resume">Resume</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="settings">Settings</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="menu">Main Menu</button>
        </div>
        <p class="dom-hint">P / Esc to resume</p>
      </div>
    `;

    this.bindClick('resume', () => {
      AudioManager.get().play(SfxId.UiClick);
      this.hide();
      actions.onResume();
    });
    this.bindClick('settings', () => {
      AudioManager.get().play(SfxId.UiClick);
      actions.onSettings();
    });
    this.bindClick('menu', () => {
      AudioManager.get().play(SfxId.UiClick);
      this.hide();
      actions.onMenu();
    });

    this.bindKeys((key) => {
      if (key === 'p' || key === 'P' || key === 'Escape') {
        AudioManager.get().play(SfxId.UiClick);
        this.hide();
        actions.onResume();
      }
    });

    this.setActive(true);
  }

  showSettings(onBack: () => void): void {
    this.clearKeyboard();
    const audio = AudioManager.get();
    const muted = audio.isMuted();
    const volume = Math.round(audio.getMasterVolume() * 100);
    const showFps = PerformanceManager.get().isFpsVisible();

    this.panel.innerHTML = `
      <div class="dom-menu">
        <h1 class="dom-title dom-title-sm">Settings</h1>
        <div class="dom-settings">
          <label class="dom-setting-row">
            <span>Sound</span>
            <button type="button" class="dom-btn dom-btn-secondary dom-btn-compact" data-action="toggle-mute">
              ${muted ? 'Unmute' : 'Mute'}
            </button>
          </label>
          <label class="dom-setting-row">
            <span>Volume</span>
            <input class="dom-settings-volume" data-action="settings-volume" type="range" min="0" max="100" value="${volume}" />
          </label>
          <label class="dom-setting-row">
            <span>FPS Monitor</span>
            <button type="button" class="dom-btn dom-btn-secondary dom-btn-compact" data-action="toggle-fps">
              ${showFps ? 'On' : 'Off'}
            </button>
          </label>
        </div>
        <button type="button" class="dom-btn dom-btn-primary" data-action="back">Back</button>
        <p class="dom-hint">Changes save automatically · F toggles FPS</p>
      </div>
    `;

    this.bindClick('toggle-mute', () => {
      audio.unlock();
      audio.toggleMute();
      if (!audio.isMuted()) {
        audio.play(SfxId.UiClick);
      }
      this.showSettings(onBack);
    });

    this.bindClick('toggle-fps', () => {
      audio.play(SfxId.UiClick);
      PerformanceManager.get().toggleShowFps();
      this.showSettings(onBack);
    });

    const volumeInput = this.panel.querySelector('[data-action="settings-volume"]');
    volumeInput?.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      audio.unlock();
      audio.setMasterVolume(Number(target.value) / 100);
      if (audio.isMuted() && Number(target.value) > 0) {
        audio.setMuted(false);
      }
    });

    this.bindClick('back', () => {
      audio.play(SfxId.UiClick);
      onBack();
    });

    this.bindKeys((key) => {
      if (key === 'Escape') {
        audio.play(SfxId.UiClick);
        onBack();
      }
    });

    this.setActive(true);
  }

  showHighScores(
    bestScore: number,
    runs: readonly HighScoreEntry[],
    onBack: () => void,
  ): void {
    this.clearKeyboard();
    const rows =
      runs.length === 0
        ? `<p class="dom-stats">No runs yet. Start playing to fill the board.</p>`
        : `<ol class="dom-score-list">${runs
            .map(
              (run, index) => `
            <li>
              <span class="dom-score-rank">#${index + 1}</span>
              <span class="dom-score-value">${run.score}</span>
              <span class="dom-score-meta">${run.distance}m · ${run.coins} coins</span>
            </li>`,
            )
            .join('')}</ol>`;

    this.panel.innerHTML = `
      <div class="dom-menu">
        <h1 class="dom-title dom-title-sm">High Scores</h1>
        <p class="dom-best">Best: <strong>${bestScore}</strong></p>
        ${rows}
        <button type="button" class="dom-btn dom-btn-primary" data-action="back">Back</button>
      </div>
    `;

    this.bindClick('back', () => {
      AudioManager.get().play(SfxId.UiClick);
      onBack();
    });

    this.bindKeys((key) => {
      if (key === 'Escape') {
        AudioManager.get().play(SfxId.UiClick);
        onBack();
      }
    });

    this.setActive(true);
  }

  showGameOver(
    cause: DeathCause,
    snapshot: ScoreSnapshot,
    onRestart: () => void,
    onMenu: () => void,
    onHighScores: () => void,
    newlyUnlocked: readonly string[] = [],
  ): void {
    this.clearKeyboard();
    const bestLabel = snapshot.isNewBest
      ? `New Best: ${snapshot.bestScore}`
      : `Best: ${snapshot.bestScore}`;
    const unlockLine = newlyUnlocked.length
      ? `<p class="dom-reason">New unlock${newlyUnlocked.length > 1 ? 's' : ''} ready in Unlocks!</p>`
      : '';

    this.panel.innerHTML = `
      <div class="dom-menu dom-menu-gameover">
        <h1 class="dom-title dom-title-sm">Game Over</h1>
        <p class="dom-reason">${DeathCauseLabels[cause]}</p>
        <p class="dom-score">Score: <strong>${snapshot.totalScore}</strong></p>
        <p class="dom-stats">Distance ${snapshot.distance}m · Coins ${snapshot.coins} · Pickups ${snapshot.pickupPoints}</p>
        <p class="dom-best">${bestLabel}</p>
        ${unlockLine}
        <div class="dom-btn-row">
          <button type="button" class="dom-btn dom-btn-primary" data-action="restart">Restart</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="highscores">High Scores</button>
          <button type="button" class="dom-btn dom-btn-secondary" data-action="menu">Main Menu</button>
        </div>
        <p class="dom-hint">R Restart · Esc / M Menu</p>
      </div>
    `;

    this.bindClick('restart', () => {
      try {
        AudioManager.get().play(SfxId.UiClick);
        this.hide();
        onRestart();
      } catch (error) {
        console.error('[GameOver] restart failed', error);
        this.hide();
        onRestart();
      }
    });
    this.bindClick('highscores', () => {
      try {
        AudioManager.get().play(SfxId.UiClick);
        onHighScores();
      } catch (error) {
        console.error('[GameOver] highscores failed', error);
      }
    });
    this.bindClick('menu', () => {
      try {
        AudioManager.get().play(SfxId.UiClick);
        this.hide();
        onMenu();
      } catch (error) {
        console.error('[GameOver] menu failed', error);
        this.hide();
        onMenu();
      }
    });

    this.bindKeys((key) => {
      if (key === 'r' || key === 'R') {
        AudioManager.get().play(SfxId.UiClick);
        this.hide();
        onRestart();
        return;
      }
      if (key === 'Escape' || key === 'm' || key === 'M') {
        AudioManager.get().play(SfxId.UiClick);
        this.hide();
        onMenu();
      }
    });

    this.setActive(true);
  }

  hide(): void {
    this.clearKeyboard();
    this.panel.classList.remove('is-wide');
    this.panel.innerHTML = '';
    this.setActive(false);
  }

  isActive(): boolean {
    return this.root.classList.contains('is-active');
  }

  private wireAudioBar(): void {
    const muteBtn = this.audioBar.querySelector('[data-action="mute"]');
    const volume = this.audioBar.querySelector('[data-action="volume"]');

    muteBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const audio = AudioManager.get();
      audio.unlock();
      audio.toggleMute();
      if (!audio.isMuted()) {
        audio.play(SfxId.UiClick);
      }
    });

    volume?.addEventListener('input', (event) => {
      event.stopPropagation();
      const target = event.target as HTMLInputElement;
      const audio = AudioManager.get();
      audio.unlock();
      audio.setMasterVolume(Number(target.value) / 100);
      if (audio.isMuted() && Number(target.value) > 0) {
        audio.setMuted(false);
      }
    });
  }

  private refreshAudioBar(): void {
    const audio = AudioManager.get();
    const muteBtn = this.audioBar.querySelector('[data-action="mute"]');
    const volume = this.audioBar.querySelector('[data-action="volume"]');

    if (muteBtn instanceof HTMLButtonElement) {
      muteBtn.textContent = audio.isMuted() ? 'Unmute' : 'Mute';
      muteBtn.classList.toggle('is-muted', audio.isMuted());
    }

    if (volume instanceof HTMLInputElement) {
      volume.value = String(Math.round(audio.getMasterVolume() * 100));
    }
  }

  private setActive(active: boolean): void {
    this.root.classList.toggle('is-active', active);
    this.root.setAttribute('aria-hidden', active ? 'false' : 'true');
    this.panel.classList.toggle('is-entering', active);
  }

  private bindClick(action: string, handler: () => void): void {
    const button = this.panel.querySelector(`[data-action="${action}"]`);
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
  }

  private bindKeys(handler: (key: string) => void): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat) {
        return;
      }
      handler(event.key);
    };

    window.addEventListener('keydown', onKeyDown);
    this.keyCleanup = () => window.removeEventListener('keydown', onKeyDown);
  }

  private clearKeyboard(): void {
    this.keyCleanup?.();
    this.keyCleanup = null;
  }
}
