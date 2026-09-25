import { AICoverConfig, AICoverSinger, SubtitleCue } from "../types";
import {
  mixVocalWithInstrumentalTrack,
  MusicArrangementStyle,
  StudioMixResult,
} from "./musicArranger";

export const AI_SINGERS: AICoverSinger[] = [
  {
    id: "vpop-male",
    name: "Sơn Tùng M-TP Style",
    avatar: "🎤",
    gender: "male",
    style: "Pop / R&B Hiện Đại",
    description: "Giọng nam trẻ trung, năng động, luyến láy R&B bắt tai theo phong cách V-Pop đỉnh cao",
    badge: "Hot Trend",
    color: "from-amber-500 to-rose-500",
  },
  {
    id: "ballad-female",
    name: "Diva Ballad (Hồ Ngọc Hà Style)",
    avatar: "🌸",
    gender: "female",
    style: "Ballad Da Diết & Trầm Ấm",
    description: "Giọng nữ nội lực, ngân rung truyền cảm, sâu lắng cho những bản tình ca da diết",
    badge: "Truyền cảm",
    color: "from-rose-500 to-purple-600",
  },
  {
    id: "indie-male",
    name: "Vũ / Hoàng Dũng Style",
    avatar: "🎸",
    gender: "male",
    style: "Indie Acoustic Tự Sự",
    description: "Giọng nam mộc mạc, ấm áp, sâu sắc như tiếng thì thầm bên cây đàn guitar acoustic",
    badge: "Acoustic",
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "lofi-female",
    name: "Lofi Chill Girl",
    avatar: "☕",
    gender: "female",
    style: "Lofi / Bedroom Pop",
    description: "Giọng nữ êm ái, thì thầm nhẹ nhàng, mang lại cảm giác thư thái và du dương",
    badge: "Thư giãn",
    color: "from-sky-500 to-indigo-600",
  },
  {
    id: "rock-male",
    name: "Rock Star (Cá Tính)",
    avatar: "⚡",
    gender: "male",
    style: "Pop-Rock & Alternative",
    description: "Giọng nam mạnh mẽ, bùng nổ, giàu năng lượng cho các bài hát cao trào",
    badge: "Bùng nổ",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "gemini-kore",
    name: "Gemini AI Vocalist",
    avatar: "✨",
    gender: "female",
    style: "Anime & Cyber Pop",
    description: "Giọng ca sĩ AI trong trẻo, giai điệu chuẩn xác và hiện đại",
    badge: "AI Pure",
    color: "from-cyan-500 to-blue-600",
  },
];

export const MUSIC_GENRES = [
  { id: "ballad", name: "Ballad Trữ Tình", icon: "🎻", desc: "Da diết, sâu lắng, nhiều cảm xúc" },
  { id: "pop", name: "V-Pop / R&B", icon: "🎹", desc: "Sôi động, bắt tai, luyến láy hiện đại" },
  { id: "acoustic", name: "Acoustic Guitar", icon: "🎸", desc: "Mộc mạc, tình cảm, tự nhiên" },
  { id: "lofi", name: "Lofi Chillout", icon: "🌌", desc: "Chậm rãi, thư thái, êm dịu" },
  { id: "rock", name: "Pop-Rock Năng Lượng", icon: "⚡", desc: "Mạnh mẽ, cá tính, bùng nổ" },
];

export const DEFAULT_COVER_CONFIG: AICoverConfig = {
  singerId: "vpop-male",
  genre: "ballad",
  pitchShift: 0,
  tempo: 1.0,
  reverbLevel: "studio",
  vocalReducerLevel: 0.7, // 70% vocal reduction on original video audio
  lyricsScope: "full",
  autoArrangement: true,
  instrumentalVolume: 0.85,
  vocalVolume: 1.0,
  humanVocalMode: true,
  humanBreathEffect: true,
  vocalEmotion: "emotional_ballad",
};

/**
 * Format subtitle cues into clean singing lyrics with line breaks
 */
export function formatCuesToSongLyrics(cues: SubtitleCue[]): string {
  if (!cues.length) return "";
  return cues
    .map((c) => (c.textVi || c.textOriginal || "").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export interface GeneratedCoverResult {
  audioUrl: string; // Active playback URL (default: masterUrl)
  blob: Blob; // Active playback Blob
  masterUrl: string;
  masterBlob: Blob;
  instrumentalUrl: string;
  instrumentalBlob: Blob;
  vocalsUrl: string;
  vocalsBlob: Blob;
  singerName: string;
  genre: string;
  isFallback: boolean;
  hasArrangement: boolean;
  duration: number;
}

/**
 * Request AI Song Cover generation from backend API or client fallback synthesizer,
 * with automatic full music arrangement (backing piano, drums, strings, bass).
 */
export async function generateAISongCover(
  lyrics: string,
  config: AICoverConfig,
  signal?: AbortSignal
): Promise<GeneratedCoverResult> {
  const selectedSinger = AI_SINGERS.find((s) => s.id === config.singerId) || AI_SINGERS[0];
  let rawVocalBlob: Blob | null = null;
  let isFallback = false;

  try {
    const res = await fetch("/api/vietsub/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lyrics,
        singerStyle: config.singerId,
        musicGenre: config.genre,
        pitchShift: config.pitchShift,
        tempo: config.tempo,
        humanVocalMode: config.humanVocalMode,
        emotionStyle: config.vocalEmotion,
      }),
      signal,
    });

    const data = await res.json();
    if (res.ok && data.audioBase64) {
      const rawBinary = atob(data.audioBase64);
      const bytes = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) {
        bytes[i] = rawBinary.charCodeAt(i);
      }
      rawVocalBlob = new Blob([bytes], { type: "audio/wav" });
    } else {
      console.warn("Cover API response warning, fallbacking to client vocal synthesizer:", data.error);
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn("Failed calling /api/vietsub/cover, synthesizing with Web Audio:", err);
  }

  // Fallback if needed
  if (!rawVocalBlob) {
    rawVocalBlob = await createFallbackMelodicAudio(lyrics, config);
    isFallback = true;
  }

  const rawVocalUrl = URL.createObjectURL(rawVocalBlob);

  // If Auto Arrangement is enabled, mix with multi-track instrumental orchestration
  if (config.autoArrangement) {
    try {
      const studioMix: StudioMixResult = await mixVocalWithInstrumentalTrack(
        rawVocalBlob,
        config.genre as MusicArrangementStyle,
        {
          genre: config.genre as MusicArrangementStyle,
          tempo: config.tempo,
          vocalVolume: config.vocalVolume,
          instrumentalVolume: config.instrumentalVolume,
          humanBreathEffect: config.humanBreathEffect,
          reverbLevel: config.reverbLevel === "hall" ? 0.8 : config.reverbLevel === "studio" ? 0.5 : 0.2,
        }
      );

      return {
        audioUrl: studioMix.masterUrl,
        blob: studioMix.masterBlob,
        masterUrl: studioMix.masterUrl,
        masterBlob: studioMix.masterBlob,
        instrumentalUrl: studioMix.instrumentalUrl,
        instrumentalBlob: studioMix.instrumentalBlob,
        vocalsUrl: studioMix.vocalsUrl,
        vocalsBlob: studioMix.vocalsBlob,
        singerName: selectedSinger.name,
        genre: config.genre,
        isFallback,
        hasArrangement: true,
        duration: studioMix.duration,
      };
    } catch (mixErr) {
      console.warn("Failed mixing instrumental track, serving pure vocal:", mixErr);
    }
  }

  // Pure vocal result
  return {
    audioUrl: rawVocalUrl,
    blob: rawVocalBlob,
    masterUrl: rawVocalUrl,
    masterBlob: rawVocalBlob,
    instrumentalUrl: rawVocalUrl,
    instrumentalBlob: rawVocalBlob,
    vocalsUrl: rawVocalUrl,
    vocalsBlob: rawVocalBlob,
    singerName: selectedSinger.name,
    genre: config.genre,
    isFallback,
    hasArrangement: false,
    duration: 10,
  };
}

/**
 * Creates melodic audio buffer using Web Audio API synthesis for singing lines
 */
async function createFallbackMelodicAudio(lyrics: string, config: AICoverConfig): Promise<Blob> {
  const lines = lyrics.split("\n").filter((l) => l.trim().length > 0);
  const totalLines = Math.max(1, lines.length);
  const sampleRate = 24000;
  const secondsPerLine = 3.2 / config.tempo;
  const totalDuration = totalLines * secondsPerLine;
  const totalSamples = Math.floor(totalDuration * sampleRate);

  // Pentatonic singing scale frequencies (C D E G A in C major / A minor)
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  const pitchFactor = Math.pow(2, config.pitchShift / 12);

  const pcm16 = new Int16Array(totalSamples);

  for (let l = 0; l < totalLines; l++) {
    const lineStartSample = Math.floor(l * secondsPerLine * sampleRate);
    const lineSamples = Math.floor(secondsPerLine * sampleRate);
    const baseFreq = scale[l % scale.length] * pitchFactor;

    for (let i = 0; i < lineSamples; i++) {
      const idx = lineStartSample + i;
      if (idx >= totalSamples) break;

      const t = i / sampleRate;
      // Vibrato (5Hz pitch modulation)
      const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 5 * t);
      const freq = baseFreq * vibrato;

      // Envelope: attack & release
      const env = Math.sin((Math.PI * i) / lineSamples);

      // Warm vocal harmonics (fundamental + 2nd harmonic + 3rd harmonic formant)
      const s1 = Math.sin(2 * Math.PI * freq * t);
      const s2 = 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
      const s3 = 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
      const sampleVal = (s1 + s2 + s3) * 0.4 * env;

      pcm16[idx] = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
    }
  }

  // Prepend 44-byte WAV header
  const dataSize = pcm16.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcm16.buffer));

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
