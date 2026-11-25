// Procedural Web Audio sound & Mediterranean bistro music engine (zero external audio files).

export function createAudioEngine() {
  let ctx = null;
  let muted = false;
  let musicPlaying = false;
  let musicStep = 0;
  let musicTimer = 0;

  const ensureContext = () => {
    if (muted) return null;
    if (!ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  const playTone = (freq, endFreq, duration, type = 'triangle', gainVal = 0.14, delay = 0) => {
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  const playNoise = (duration, filterFreq, gainVal = 0.08) => {
    const c = ensureContext();
    if (!c) return;
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = c.createGain();
    gain.gain.value = gainVal;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start();
  };

  // Upbeat Mediterranean marimba & upright bass pattern (D minor / F major tarantella feel)
  const bassNotes = [146.8, 0, 220.0, 0, 174.6, 0, 220.0, 196.0, 130.8, 0, 196.0, 0, 164.8, 0, 220.0, 0];
  const melodyNotes = [587.3, 0, 659.3, 698.5, 587.3, 0, 523.3, 0, 523.3, 587.3, 659.3, 0, 440.0, 523.3, 587.3, 0];

  const updateMusic = (dt, active, isRush) => {
    musicPlaying = active && !muted;
    if (!musicPlaying || !ctx || ctx.state !== 'running') return;
    const stepInterval = isRush ? 0.19 : 0.25;
    musicTimer += dt;
    if (musicTimer >= stepInterval) {
      musicTimer -= stepInterval;
      const idx = musicStep % bassNotes.length;
      const b = bassNotes[idx];
      const m = melodyNotes[idx];
      if (b > 0) playTone(b, b * 0.98, 0.2, 'triangle', 0.042);
      if (m > 0) playTone(m, m, 0.14, 'sine', 0.032);
      musicStep += 1;
    }
  };

  return {
    unlock: ensureContext,
    updateMusic,
    isMuted: () => muted,
    toggleMute: () => {
      muted = !muted;
      return muted;
    },
    playPickup: () => playTone(360, 520, 0.08, 'triangle', 0.11),
    playDrop: () => playTone(260, 180, 0.07, 'sine', 0.1),
    playChop: () => {
      playNoise(0.06, 1500, 0.14);
      playTone(220, 110, 0.05, 'square', 0.06);
    },
    playSizzle: () => playNoise(0.18, 3200, 0.06),
    playPlateClink: () => {
      playTone(1180, 1420, 0.09, 'sine', 0.09);
      playTone(1760, 1680, 0.06, 'sine', 0.05, 0.02);
    },
    playServeBell: (combo = 1) => {
      const pitchBoost = Math.min(6, combo - 1) * 55;
      playTone(987 + pitchBoost, 987 + pitchBoost, 0.34, 'sine', 0.15);
      playTone(1480 + pitchBoost, 1480 + pitchBoost, 0.28, 'triangle', 0.09, 0.05);
      playTone(1975 + pitchBoost, 1975 + pitchBoost, 0.25, 'sine', 0.07, 0.1);
    },
    playUrgentTick: () => playTone(680, 540, 0.07, 'square', 0.06),
    playOrderExpired: () => {
      playTone(280, 170, 0.22, 'sawtooth', 0.09);
      playTone(200, 120, 0.24, 'sawtooth', 0.08, 0.14);
    },
    playDash: () => playNoise(0.09, 900, 0.08),
    playShiftComplete: () => {
      playTone(523, 523, 0.18, 'triangle', 0.13, 0);
      playTone(659, 659, 0.18, 'triangle', 0.13, 0.12);
      playTone(784, 784, 0.22, 'triangle', 0.14, 0.24);
      playTone(1046, 1046, 0.42, 'sine', 0.16, 0.38);
    },
  };
}
