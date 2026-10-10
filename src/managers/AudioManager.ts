import {
  AudioConfig,
  SfxId,
} from '@/config/AudioConfig';
import { CollectibleType } from '@/config/CollectibleConfig';
import { SaveManager } from '@/managers/SaveManager';

interface ToneStep {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
  volume?: number;
  delayMs?: number;
}

const SFX_PATTERNS: Record<SfxId, ToneStep[]> = {
  [SfxId.Jump]: [{ frequency: 420, durationMs: 70, type: 'triangle', volume: 0.09 }],
  [SfxId.CollectCoin]: [
    { frequency: 880, durationMs: 60, volume: 0.08 },
    { frequency: 1175, durationMs: 70, volume: 0.06, delayMs: 40 },
  ],
  [SfxId.CollectGem]: [
    { frequency: 988, durationMs: 70, volume: 0.08 },
    { frequency: 1319, durationMs: 90, volume: 0.07, delayMs: 45 },
  ],
  [SfxId.CollectMagnet]: [
    { frequency: 320, durationMs: 90, type: 'square', volume: 0.05 },
    { frequency: 540, durationMs: 110, type: 'sawtooth', volume: 0.04, delayMs: 50 },
  ],
  [SfxId.CollectScore]: [
    { frequency: 660, durationMs: 70, volume: 0.08 },
    { frequency: 880, durationMs: 70, volume: 0.07, delayMs: 50 },
    { frequency: 1320, durationMs: 90, volume: 0.06, delayMs: 100 },
  ],
  [SfxId.CollectPower]: [
    { frequency: 480, durationMs: 80, type: 'triangle', volume: 0.07 },
    { frequency: 720, durationMs: 100, type: 'sine', volume: 0.06, delayMs: 60 },
  ],
  [SfxId.Hit]: [
    { frequency: 170, durationMs: 100, type: 'sawtooth', volume: 0.07 },
    { frequency: 95, durationMs: 140, type: 'triangle', volume: 0.06, delayMs: 35 },
  ],
  [SfxId.GameOver]: [
    { frequency: 392, durationMs: 180, type: 'triangle', volume: 0.08 },
    { frequency: 311, durationMs: 220, type: 'triangle', volume: 0.07, delayMs: 160 },
    { frequency: 247, durationMs: 320, type: 'sine', volume: 0.07, delayMs: 340 },
  ],
  [SfxId.UiClick]: [{ frequency: 700, durationMs: 40, type: 'square', volume: 0.04 }],
  [SfxId.UiStart]: [
    { frequency: 523, durationMs: 80, volume: 0.07 },
    { frequency: 784, durationMs: 120, volume: 0.06, delayMs: 70 },
  ],
};

const COLLECTIBLE_SFX: Record<CollectibleType, SfxId> = {
  [CollectibleType.Coin]: SfxId.CollectCoin,
  [CollectibleType.Gem]: SfxId.CollectGem,
  [CollectibleType.Magnet]: SfxId.CollectMagnet,
  [CollectibleType.ScorePickup]: SfxId.CollectScore,
  [CollectibleType.Shield]: SfxId.CollectPower,
  [CollectibleType.SpeedBoost]: SfxId.CollectPower,
  [CollectibleType.SlowMotion]: SfxId.CollectPower,
  [CollectibleType.ExtraLife]: SfxId.CollectPower,
};

const BGM_NOTES = [196, 247, 294, 370, 330, 294, 247, 220];

/**
 * Central audio bus for Milestone 11.
 * Uses synthesized WebAudio cues until real asset files are added later.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private muted: boolean;
  private masterVolume: number;
  private bgmTimer: number | null = null;
  private bgmNoteIndex = 0;
  private bgmPlaying = false;
  private bgmDesired = false;
  private listeners = new Set<() => void>();

  private constructor() {
    const saved = SaveManager.get().getSettings();
    this.muted = saved.muted;
    this.masterVolume = this.clampVolume(saved.masterVolume);
  }

  static get(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx?.state === 'suspended') {
      void ctx.resume();
    }
  }

  play(sfx: SfxId): void {
    if (this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const sfxGain = this.sfxGain;
    if (!ctx || !sfxGain) {
      return;
    }

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    for (const step of SFX_PATTERNS[sfx]) {
      this.playTone(ctx, sfxGain, step);
    }
  }

  playCollect(type: CollectibleType): void {
    this.play(COLLECTIBLE_SFX[type]);
  }

  startBgm(): void {
    this.bgmDesired = true;
    this.unlock();
    if (this.muted || this.bgmPlaying) {
      return;
    }

    this.bgmPlaying = true;
    this.bgmNoteIndex = 0;
    this.scheduleNextBgmNote();
  }

  stopBgm(): void {
    this.bgmDesired = false;
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGains();
    this.persist();
    this.notify();

    if (muted) {
      this.bgmPlaying = false;
      if (this.bgmTimer !== null) {
        window.clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
      return;
    }

    if (this.bgmDesired) {
      this.startBgm();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = this.clampVolume(volume);
    this.applyGains();
    this.persist();
    this.notify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private scheduleNextBgmNote(): void {
    if (!this.bgmPlaying || this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const bgmGain = this.bgmGain;
    if (!ctx || !bgmGain) {
      return;
    }

    const frequency = BGM_NOTES[this.bgmNoteIndex % BGM_NOTES.length];
    this.bgmNoteIndex += 1;

    this.playTone(ctx, bgmGain, {
      frequency,
      durationMs: 280,
      type: 'sine',
      volume: 0.45,
    });
    this.playTone(ctx, bgmGain, {
      frequency: frequency * 1.5,
      durationMs: 220,
      type: 'triangle',
      volume: 0.18,
      delayMs: 20,
    });

    this.bgmTimer = window.setTimeout(() => this.scheduleNextBgmNote(), 420);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.context) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }

      this.context = new AudioCtx();
      this.masterGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.bgmGain = this.context.createGain();

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.applyGains();
    }

    return this.context;
  }

  private applyGains(): void {
    if (!this.masterGain || !this.sfxGain || !this.bgmGain) {
      return;
    }

    const master = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.value = master;
    this.sfxGain.gain.value = AudioConfig.sfxVolume;
    this.bgmGain.gain.value = AudioConfig.bgmVolume;
  }

  private playTone(ctx: AudioContext, output: GainNode, step: ToneStep): void {
    const startAt = ctx.currentTime + (step.delayMs ?? 0) / 1000;
    const endAt = startAt + step.durationMs / 1000;
    const volume = Math.max(0.0001, (step.volume ?? 0.08) * (this.muted ? 0 : 1));

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = step.type ?? 'sine';
    oscillator.frequency.setValueAtTime(step.frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.03);
  }

  private clampVolume(volume: number): number {
    return Math.min(1, Math.max(0, volume));
  }

  private persist(): void {
    SaveManager.get().patchSettings({
      muted: this.muted,
      masterVolume: this.masterVolume,
    });
  }
}
