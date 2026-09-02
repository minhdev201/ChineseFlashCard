/**
 * Game Audio & Sound Effects Engine powered by Web Audio API.
 * Provides real-time synthesized BGM, adaptive combo pitch scaling,
 * celebratory fanfares, and persistent volume settings.
 */

type AudioSettings = {
  bgmMuted: boolean;
  sfxMuted: boolean;
  bgmVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
};

const STORAGE_KEY = 'chinese_flashcard_audio_settings';

const defaultSettings: AudioSettings = {
  bgmMuted: false,
  sfxMuted: false,
  bgmVolume: 0.28,
  sfxVolume: 0.65,
};

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // fallback
  }
  return defaultSettings;
}

function saveSettings(settings: AudioSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Global state
import {
  getYouTubeSettings,
  playYouTubeAudio,
  pauseYouTubeAudio,
  setYouTubeAudioVolume,
} from './youtubePlayer';

let currentSettings: AudioSettings = loadSettings();
const listeners = new Set<(s: AudioSettings) => void>();

export function getAudioSettings(): AudioSettings {
  return { ...currentSettings };
}

export function updateAudioSettings(partial: Partial<AudioSettings>) {
  currentSettings = { ...currentSettings, ...partial };
  saveSettings(currentSettings);
  updateAudioNodesGain();
  listeners.forEach((fn) => fn(currentSettings));
}

export function subscribeAudioSettings(fn: (s: AudioSettings) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ─────────────────────────────────────────────
// AUDIO CONTEXT & GAIN NODES
// ─────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let sfxMasterGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();

    bgmMasterGain = audioCtx.createGain();
    sfxMasterGain = audioCtx.createGain();

    bgmMasterGain.connect(audioCtx.destination);
    sfxMasterGain.connect(audioCtx.destination);

    updateAudioNodesGain();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

function updateAudioNodesGain() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (bgmMasterGain) {
    const targetBgm = currentSettings.bgmMuted ? 0 : currentSettings.bgmVolume;
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
    bgmMasterGain.gain.linearRampToValueAtTime(targetBgm, now + 0.1);
  }

  // Update YouTube audio volume as well
  const ytVol = currentSettings.bgmMuted ? 0 : (currentSettings.bgmVolume / 0.8) * 100;
  setYouTubeAudioVolume(ytVol);

  if (sfxMasterGain) {
    const targetSfx = currentSettings.sfxMuted ? 0 : currentSettings.sfxVolume;
    sfxMasterGain.gain.setValueAtTime(sfxMasterGain.gain.value, now);
    sfxMasterGain.gain.linearRampToValueAtTime(targetSfx, now + 0.1);
  }
}


// Auto unlock on first user gesture
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

// ─────────────────────────────────────────────
// PROCEDURAL BACKGROUND MUSIC (BGM)
// ─────────────────────────────────────────────

interface BGMController {
  isPlaying: boolean;
  timerId: number | null;
  step: number;
  mode: 'relaxed' | 'energetic';
}

const bgmState: BGMController = {
  isPlaying: false,
  timerId: null,
  step: 0,
  mode: 'relaxed',
};

// Pentatonic scales in Hz (F major pentatonic / Asian game aesthetic)
const PENTATONIC_MELODY = [
  349.23, // F4
  392.0,  // G4
  440.0,  // A4
  523.25, // C5
  587.33, // D5
  698.46, // F5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
];

const BASS_NOTES = [
  87.31,  // F2
  110.0,  // A2
  130.81, // C3
  98.0,   // G2
  116.54, // Bb2
  146.83, // D3
];

// Melodic patterns (indices into PENTATONIC_MELODY)
const MELODY_PATTERNS = [
  [0, 2, 3, 5, 4, 3, 2, 0, 1, 3, 4, 6, 5, 4, 3, 1],
  [3, 5, 6, 7, 6, 5, 3, 4, 2, 3, 5, 4, 3, 2, 0, 2],
  [5, 4, 3, 2, 3, 5, 6, 8, 7, 5, 4, 3, 2, 0, 2, 3],
  [0, 3, 4, 5, 7, 6, 5, 3, 2, 4, 3, 1, 0, 2, 3, 5],
];

function playBGMStep() {
  if (!bgmState.isPlaying) return;

  try {
    const ctx = getAudioContext();
    if (!bgmMasterGain) return;

    const step = bgmState.step % 16;
    const bar = Math.floor((bgmState.step / 16) % MELODY_PATTERNS.length);
    const pattern = MELODY_PATTERNS[bar];
    const now = ctx.currentTime;

    // 1. Bass note on downbeats (steps 0, 8)
    if (step === 0 || step === 8) {
      const bassFreq = BASS_NOTES[(bar * 2 + (step === 8 ? 1 : 0)) % BASS_NOTES.length];
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      bassOsc.connect(bassGain);
      bassGain.connect(bgmMasterGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.66);
    }

    // 2. Melodic chime / marimba note (steps with variation)
    // Play on most 8th notes, with some rhythmic skips for pleasant groove
    const shouldPlayMelody = step % 2 === 0 || (step % 4 === 3 && Math.random() > 0.4);
    if (shouldPlayMelody) {
      const noteIdx = pattern[step];
      const freq = PENTATONIC_MELODY[noteIdx % PENTATONIC_MELODY.length];

      // Primary sine tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator(); // harmonic chime
      const noteGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // octave chime

      const noteDuration = bgmState.mode === 'energetic' ? 0.22 : 0.35;

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.12, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(bgmMasterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + noteDuration + 0.01);
      osc2.stop(now + noteDuration + 0.01);
    }

    // 3. Subtle soft percussion / shaker tick (every 2 steps)
    if (step % 2 === 0) {
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tickOsc.type = 'sine';
      tickOsc.frequency.setValueAtTime(step % 4 === 0 ? 1200 : 2400, now);

      tickGain.gain.setValueAtTime(0.001, now);
      tickGain.gain.linearRampToValueAtTime(step % 4 === 0 ? 0.02 : 0.012, now + 0.005);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      tickOsc.connect(tickGain);
      tickGain.connect(bgmMasterGain);

      tickOsc.start(now);
      tickOsc.stop(now + 0.045);
    }

    bgmState.step++;
  } catch {
    // ignore audio processing error
  }
}

export function startBGM(mode: 'relaxed' | 'energetic' = 'relaxed') {
  const ytSettings = getYouTubeSettings();

  if (ytSettings.bgmSource === 'youtube') {
    // Stop synth BGM if it was playing
    if (bgmState.isPlaying) {
      bgmState.isPlaying = false;
      if (bgmState.timerId !== null) {
        clearInterval(bgmState.timerId);
        bgmState.timerId = null;
      }
    }
    const ytVol = currentSettings.bgmMuted ? 0 : (currentSettings.bgmVolume / 0.8) * 100;
    setYouTubeAudioVolume(ytVol);
    playYouTubeAudio();
    return;
  }

  // Otherwise, use synthesized BGM
  pauseYouTubeAudio();

  if (bgmState.isPlaying) {
    bgmState.mode = mode;
    return;
  }

  bgmState.isPlaying = true;
  bgmState.mode = mode;
  bgmState.step = 0;

  const intervalMs = mode === 'energetic' ? 220 : 280;
  bgmState.timerId = window.setInterval(playBGMStep, intervalMs);
}

export function stopBGM(forceAll = false) {
  // Stop synth BGM
  if (bgmState.isPlaying) {
    bgmState.isPlaying = false;
    if (bgmState.timerId !== null) {
      clearInterval(bgmState.timerId);
      bgmState.timerId = null;
    }
    bgmState.step = 0;
  }

  // Only pause YouTube if explicitly forced (e.g. user toggled off)
  if (forceAll) {
    pauseYouTubeAudio();
  }
}



// ─────────────────────────────────────────────
// SOUND EFFECTS (SFX)
// ─────────────────────────────────────────────

/**
 * Play an uplifting chime arpeggio when answering correctly.
 * Base frequency and overtone richness scales smoothly with combo streak!
 */
export function playCorrectSound(combo = 1) {
  if (currentSettings.sfxMuted) return;

  try {
    const ctx = getAudioContext();
    if (!sfxMasterGain) return;

    const now = ctx.currentTime;

    // Pitch scales with combo (capped smoothly)
    const comboFactor = Math.min((combo - 1) * 0.04, 0.45); // up to ~45% pitch shift
    const baseRoot = 523.25 * (1 + comboFactor); // C5 base

    // Arpeggio notes: Root, Major 3rd (E5), Perfect 5th (G5), Octave (C6)
    const intervals = [1, 1.2599, 1.4983, 2.0];
    if (combo >= 5) {
      intervals.push(2.5198); // High E6
    }
    if (combo >= 10) {
      intervals.push(2.9966); // High G6
    }

    intervals.forEach((ratio, idx) => {
      const freq = baseRoot * ratio;
      const noteStart = now + idx * 0.045;
      const duration = 0.28 + idx * 0.04;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Use sparkling sine + slight triangle for chime warmth
      osc.type = combo >= 4 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

      osc.connect(gain);
      gain.connect(sfxMasterGain!);

      osc.start(noteStart);
      osc.stop(noteStart + duration + 0.02);
    });
  } catch {
    // ignore
  }
}

/**
 * Play a friendly, gentle descending tone when choosing incorrectly.
 */
export function playWrongSound() {
  if (currentSettings.sfxMuted) return;

  try {
    const ctx = getAudioContext();
    if (!sfxMasterGain) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxMasterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // ignore
  }
}

/**
 * Play a celebratory fanfare when hitting combo milestones (3, 5, 7, 10, 15, 20...).
 */
export function playComboMilestoneSound(combo: number) {
  if (currentSettings.sfxMuted) return;

  try {
    const ctx = getAudioContext();
    if (!sfxMasterGain) return;

    const now = ctx.currentTime;

    // Power-up ascending chord fanfare
    const chords = [
      [523.25, 659.25, 783.99],          // C5, E5, G5
      [587.33, 739.99, 880.0],           // D5, F#5, A5
      [659.25, 830.61, 987.77],          // E5, G#5, B5
      [783.99, 987.77, 1174.66, 1567.98] // G5, B5, D6, G6
    ];

    chords.forEach((chord, chordIdx) => {
      const chordStart = now + chordIdx * 0.08;
      const isLast = chordIdx === chords.length - 1;
      const duration = isLast ? 0.65 : 0.22;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isLast ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, chordStart);

        gain.gain.setValueAtTime(0.001, chordStart);
        gain.gain.linearRampToValueAtTime(0.16, chordStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, chordStart + duration);

        osc.connect(gain);
        gain.connect(sfxMasterGain!);

        osc.start(chordStart);
        osc.stop(chordStart + duration + 0.02);
      });
    });

    // Shimmer laser whoosh for extra high combos (>= 10)
    if (combo >= 10) {
      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.setValueAtTime(800, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(3200, now + 0.4);

      whooshGain.gain.setValueAtTime(0.001, now);
      whooshGain.gain.linearRampToValueAtTime(0.1, now + 0.2);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      whooshOsc.connect(whooshGain);
      whooshGain.connect(sfxMasterGain);

      whooshOsc.start(now);
      whooshOsc.stop(now + 0.46);
    }
  } catch {
    // ignore
  }
}

/**
 * Play a grand victory fanfare upon game completion.
 */
export function playVictorySound() {
  if (currentSettings.sfxMuted) return;

  try {
    const ctx = getAudioContext();
    if (!sfxMasterGain) return;

    const now = ctx.currentTime;

    // Grand victory motif: C5 - E5 - G5 - C6 - G5 - C6 (sustained arpeggio)
    const melody = [
      { freq: 523.25, time: 0.0, dur: 0.16 }, // C5
      { freq: 659.25, time: 0.14, dur: 0.16 }, // E5
      { freq: 783.99, time: 0.28, dur: 0.16 }, // G5
      { freq: 1046.5, time: 0.42, dur: 0.28 }, // C6
      { freq: 880.0,  time: 0.65, dur: 0.18 }, // A5
      { freq: 1046.5, time: 0.82, dur: 0.20 }, // C6
      { freq: 1318.5, time: 1.02, dur: 1.1 },  // E6 (Grand Finale)
    ];

    melody.forEach((note) => {
      const noteStart = now + note.time;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(note.freq, noteStart);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note.freq * 0.5, noteStart); // sub warmth

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.24, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(sfxMasterGain!);

      osc1.start(noteStart);
      osc2.start(noteStart);
      osc1.stop(noteStart + note.dur + 0.02);
      osc2.stop(noteStart + note.dur + 0.02);
    });
  } catch {
    // ignore
  }
}

/**
 * Play a light tactile tap sound for card flips or option selection.
 */
export function playCardClickSound() {
  if (currentSettings.sfxMuted) return;

  try {
    const ctx = getAudioContext();
    if (!sfxMasterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(sfxMasterGain);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // ignore
  }
}
