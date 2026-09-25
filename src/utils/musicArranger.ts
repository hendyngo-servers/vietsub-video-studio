/**
 * Automatic Music Arranger & Studio Multi-Track Mixer
 * Generates full instrumental backing tracks (piano, strings, drums, bass)
 * and blends them with AI singing for realistic human-like music covers.
 */

export type MusicArrangementStyle = "ballad" | "pop" | "acoustic" | "lofi" | "rock";

export interface ArrangementConfig {
  genre: MusicArrangementStyle;
  tempo: number; // BPM multiplier (e.g. 1.0 = 100%, 0.85 = slower ballad, 1.15 = upbeat)
  vocalVolume: number; // 0 - 1.5
  instrumentalVolume: number; // 0 - 1.5
  humanBreathEffect: boolean; // Add natural breathing & vocal warmth
  reverbLevel: number; // 0 - 1
}

export interface StudioMixResult {
  masterBlob: Blob;
  masterUrl: string;
  instrumentalBlob: Blob;
  instrumentalUrl: string;
  vocalsBlob: Blob;
  vocalsUrl: string;
  duration: number;
}

// Chord progression: [RootFreq, ChordNotes] in Hz
// Standard romantic / pop cycle: C - G - Am - F
const CHORD_CYCLES: Record<MusicArrangementStyle, number[][]> = {
  ballad: [
    [130.81, 196.0, 261.63, 329.63], // C major (C3, G3, C4, E4)
    [98.0, 146.83, 196.0, 246.94],  // G major (G2, D3, G3, B3)
    [110.0, 164.81, 220.0, 261.63], // A minor (A2, E3, A3, C4)
    [87.31, 130.81, 174.61, 220.0],  // F major (F2, C3, F3, A3)
  ],
  pop: [
    [110.0, 164.81, 220.0, 261.63], // Am
    [87.31, 130.81, 174.61, 220.0],  // F
    [130.81, 196.0, 261.63, 329.63], // C
    [98.0, 146.83, 196.0, 246.94],  // G
  ],
  acoustic: [
    [98.0, 146.83, 196.0, 246.94],  // G
    [73.42, 110.0, 146.83, 185.0],  // D
    [82.41, 123.47, 164.81, 196.0], // Em
    [130.81, 164.81, 196.0, 261.63], // C
  ],
  lofi: [
    [110.0, 164.81, 196.0, 246.94], // Am7
    [73.42, 110.0, 146.83, 174.61], // Dm7
    [98.0, 146.83, 174.61, 220.0],  // G7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
  ],
  rock: [
    [82.41, 123.47, 164.81], // E5 Power chord
    [110.0, 164.81, 220.0],  // A5
    [130.81, 196.0, 261.63], // C5
    [73.42, 110.0, 146.83],  // D5
  ],
};

/**
 * Synthesizes an instrumental backing track for a specific duration and genre
 */
export function generateInstrumentalAudioBuffer(
  duration: number,
  genre: MusicArrangementStyle,
  tempoMultiplier: number = 1.0,
  sampleRate: number = 24000
): Float32Array {
  const totalSamples = Math.max(sampleRate * 2, Math.floor(duration * sampleRate));
  const buffer = new Float32Array(totalSamples);

  // Determine BPM
  let baseBpm = 80;
  if (genre === "pop") baseBpm = 110;
  if (genre === "acoustic") baseBpm = 88;
  if (genre === "lofi") baseBpm = 72;
  if (genre === "rock") baseBpm = 125;

  const actualBpm = baseBpm * tempoMultiplier;
  const beatSamples = Math.floor(sampleRate * (60 / actualBpm));
  const barSamples = beatSamples * 4;

  const chordList = CHORD_CYCLES[genre] || CHORD_CYCLES.ballad;

  // Render bars of music
  const totalBars = Math.ceil(totalSamples / barSamples);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * barSamples;
    const currentChord = chordList[bar % chordList.length];
    const rootFreq = currentChord[0];

    // 1. DRUMS / PERCUSSION
    for (let beat = 0; beat < 4; beat++) {
      const beatStart = barStart + beat * beatSamples;
      if (beatStart >= totalSamples) break;

      // Kick on beat 1 and 3 (and syncopation for pop)
      if (beat === 0 || beat === 2 || (genre === "pop" && beat === 2.5)) {
        renderKick(buffer, beatStart, sampleRate, genre === "rock" ? 0.6 : 0.45);
      }

      // Snare on beat 2 and 4
      if (beat === 1 || beat === 3) {
        renderSnare(buffer, beatStart, sampleRate, genre === "lofi" ? 0.25 : 0.35);
      }

      // Hi-Hats on every eighth note
      const eighth1 = beatStart;
      const eighth2 = beatStart + Math.floor(beatSamples / 2);
      renderHiHat(buffer, eighth1, sampleRate, 0.12);
      renderHiHat(buffer, eighth2, sampleRate, 0.09);
    }

    // 2. BASSLINE
    for (let beat = 0; beat < 4; beat++) {
      const bassStart = barStart + beat * beatSamples;
      const bassDur = (beatSamples * 0.8) / sampleRate;
      const freq = beat === 3 ? rootFreq * 1.25 : rootFreq;
      renderBass(buffer, bassStart, freq, bassDur, sampleRate, genre === "pop" || genre === "rock" ? 0.38 : 0.28);
    }

    // 3. CHORD HARMONY & ARPEGGIOS
    if (genre === "ballad" || genre === "acoustic") {
      // Arpeggiated notes (piano / acoustic guitar fingerpicking)
      for (let noteIdx = 0; noteIdx < 8; noteIdx++) {
        const noteStart = barStart + Math.floor((noteIdx * barSamples) / 8);
        const pitch = currentChord[noteIdx % currentChord.length];
        const noteDur = (barSamples / 8 / sampleRate) * 1.8;
        renderPianoNote(buffer, noteStart, pitch, noteDur, sampleRate, 0.25);
      }
      // Warm string ensemble pad
      renderStringPad(buffer, barStart, currentChord, (barSamples / sampleRate), sampleRate, 0.18);
    } else if (genre === "lofi") {
      // Warm Rhodes electric piano chords on downbeats
      renderRhodesChord(buffer, barStart, currentChord, (barSamples * 0.9) / sampleRate, sampleRate, 0.22);
      // Soft vinyl crackle texture
      renderVinylCrackle(buffer, barStart, barSamples, 0.04);
    } else if (genre === "pop") {
      // Bouncy synth chords on offbeats
      for (let b = 0; b < 4; b++) {
        const chordStart = barStart + b * beatSamples + Math.floor(beatSamples / 2);
        renderRhodesChord(buffer, chordStart, currentChord, (beatSamples * 0.4) / sampleRate, sampleRate, 0.25);
      }
    } else if (genre === "rock") {
      // Driving electric power chords
      for (let b = 0; b < 4; b++) {
        const chordStart = barStart + b * beatSamples;
        renderRockPowerChord(buffer, chordStart, currentChord, (beatSamples * 0.8) / sampleRate, sampleRate, 0.35);
      }
    }
  }

  return buffer;
}

// Kick drum synthesizer (pitch sweep + punch)
function renderKick(buffer: Float32Array, start: number, sampleRate: number, vol: number) {
  const dur = Math.floor(sampleRate * 0.25);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const freq = 120 * Math.exp(-t * 30) + 45;
    const env = Math.exp(-t * 12);
    buffer[idx] += Math.sin(2 * Math.PI * freq * t) * env * vol;
  }
}

// Snare drum synthesizer (tone + white noise body)
function renderSnare(buffer: Float32Array, start: number, sampleRate: number, vol: number) {
  const dur = Math.floor(sampleRate * 0.2);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 25);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18);
    buffer[idx] += (tone * 0.4 + noise * 0.6) * vol;
  }
}

// Hi-Hat synthesizer (filtered high frequency noise)
function renderHiHat(buffer: Float32Array, start: number, sampleRate: number, vol: number) {
  const dur = Math.floor(sampleRate * 0.05);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 70);
    buffer[idx] += noise * vol;
  }
}

// Warm Bass Note (Fundamental + 2nd harmonic)
function renderBass(
  buffer: Float32Array,
  start: number,
  freq: number,
  durSec: number,
  sampleRate: number,
  vol: number
) {
  const dur = Math.floor(sampleRate * durSec);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const env = Math.exp(-t * 4) * Math.sin(Math.min(1, t * 40));
    const s1 = Math.sin(2 * Math.PI * freq * t);
    const s2 = 0.4 * Math.sin(2 * Math.PI * freq * 2 * t);
    buffer[idx] += (s1 + s2) * env * vol;
  }
}

// Grand Piano note with harmonic overtones
function renderPianoNote(
  buffer: Float32Array,
  start: number,
  freq: number,
  durSec: number,
  sampleRate: number,
  vol: number
) {
  const dur = Math.floor(sampleRate * durSec);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const env = Math.exp(-t * 2.8) * Math.min(1, t * 80);
    const s1 = Math.sin(2 * Math.PI * freq * t);
    const s2 = 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
    const s3 = 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
    const s4 = 0.1 * Math.sin(2 * Math.PI * freq * 4 * t);
    buffer[idx] += (s1 + s2 + s3 + s4) * env * vol;
  }
}

// Lush string ensemble pad (warm slow attack & chorus)
function renderStringPad(
  buffer: Float32Array,
  start: number,
  chord: number[],
  durSec: number,
  sampleRate: number,
  vol: number
) {
  const dur = Math.floor(sampleRate * durSec);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    // Slow swell envelope
    const env = Math.sin((Math.PI * i) / dur);
    let sampleSum = 0;
    for (const note of chord) {
      // Dual detuned oscillators for string ensemble warmth
      const o1 = Math.sin(2 * Math.PI * (note * 2) * t);
      const o2 = Math.sin(2 * Math.PI * (note * 2 * 1.004) * t);
      sampleSum += (o1 + o2) * 0.5;
    }
    buffer[idx] += (sampleSum / chord.length) * env * vol;
  }
}

// Rhodes / Electric Piano with warm chorus
function renderRhodesChord(
  buffer: Float32Array,
  start: number,
  chord: number[],
  durSec: number,
  sampleRate: number,
  vol: number
) {
  const dur = Math.floor(sampleRate * durSec);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const env = Math.exp(-t * 2.2) * Math.min(1, t * 50);
    let chordSum = 0;
    for (const freq of chord) {
      const bell = Math.sin(2 * Math.PI * freq * 4 * t) * Math.exp(-t * 10) * 0.3;
      const body = Math.sin(2 * Math.PI * freq * t);
      chordSum += body + bell;
    }
    buffer[idx] += (chordSum / chord.length) * env * vol;
  }
}

// Rock Power Chord with harmonic distortion
function renderRockPowerChord(
  buffer: Float32Array,
  start: number,
  chord: number[],
  durSec: number,
  sampleRate: number,
  vol: number
) {
  const dur = Math.floor(sampleRate * durSec);
  for (let i = 0; i < dur; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    const t = i / sampleRate;
    const env = Math.exp(-t * 3.5) * Math.min(1, t * 100);
    let sum = 0;
    for (const note of chord.slice(0, 2)) {
      sum += Math.sin(2 * Math.PI * note * t);
    }
    // Soft overdrive / distortion clipping
    const overdrive = Math.tanh(sum * 2.5);
    buffer[idx] += overdrive * env * vol;
  }
}

// Soft vinyl crackle texture
function renderVinylCrackle(buffer: Float32Array, start: number, count: number, vol: number) {
  for (let i = 0; i < count; i++) {
    const idx = start + i;
    if (idx >= buffer.length) break;
    if (Math.random() < 0.003) {
      buffer[idx] += (Math.random() * 2 - 1) * vol * 2;
    }
  }
}

/**
 * Mix vocal audio blob with the synthesized instrumental arrangement
 */
export async function mixVocalWithInstrumentalTrack(
  vocalBlob: Blob,
  genre: MusicArrangementStyle,
  config: ArrangementConfig
): Promise<StudioMixResult> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await vocalBlob.arrayBuffer();
  const vocalAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const duration = Math.max(3, vocalAudioBuffer.duration);
  const sampleRate = 24000;
  const totalSamples = Math.floor(duration * sampleRate);

  // 1. Generate Instrumental Track
  const instFloat32 = generateInstrumentalAudioBuffer(duration, genre, config.tempo, sampleRate);

  // 2. Extract Vocal Track to 24kHz
  const vocalChannel = vocalAudioBuffer.getChannelData(0);
  const vocalStep = vocalAudioBuffer.sampleRate / sampleRate;

  // 3. Mix into Master Buffer with studio warmth & limiter
  const masterFloat32 = new Float32Array(totalSamples);
  const vocalOnlyFloat32 = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const srcIdx = Math.floor(i * vocalStep);
    let vVal = 0;
    if (srcIdx < vocalChannel.length) {
      vVal = vocalChannel[srcIdx] * config.vocalVolume;
    }

    // Natural human breath noise in quiet pauses if enabled
    if (config.humanBreathEffect && Math.abs(vVal) < 0.02 && Math.random() < 0.005) {
      vVal += (Math.random() * 0.03 - 0.015);
    }

    const instVal = (i < instFloat32.length ? instFloat32[i] : 0) * config.instrumentalVolume;

    vocalOnlyFloat32[i] = vVal;

    // Soft master compression / limiter
    const rawMix = vVal + instVal;
    masterFloat32[i] = Math.tanh(rawMix * 1.15) * 0.88;
  }

  audioCtx.close().catch(console.warn);

  // Create WAV blobs
  const masterBlob = float32ToWavBlob(masterFloat32, sampleRate);
  const instrumentalBlob = float32ToWavBlob(instFloat32, sampleRate);
  const vocalsBlob = float32ToWavBlob(vocalOnlyFloat32, sampleRate);

  return {
    masterBlob,
    masterUrl: URL.createObjectURL(masterBlob),
    instrumentalBlob,
    instrumentalUrl: URL.createObjectURL(instrumentalBlob),
    vocalsBlob,
    vocalsUrl: URL.createObjectURL(vocalsBlob),
    duration,
  };
}

/**
 * Converts Float32Array to valid RIFF WAV Blob
 */
export function float32ToWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const pcm16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const dataSize = pcm16.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcm16.buffer));
  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
