/**
 * Game Sound Effects (SFX) Engine powered by Web Audio API.
 * Provides synthesized sound effects for actions: correct answers,
 * mistakes, combo milestones, and victory fanfares.
 */

let audioCtx: AudioContext | null = null;
let sfxMasterGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();

    sfxMasterGain = audioCtx.createGain();
    sfxMasterGain.gain.setValueAtTime(0.65, audioCtx.currentTime);
    sfxMasterGain.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Auto unlock audio context on first user gesture
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

/**
 * Play an uplifting chime arpeggio when answering correctly.
 * Base frequency and overtone richness scales smoothly with combo streak!
 */
export function playCorrectSound(combo = 1) {
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
