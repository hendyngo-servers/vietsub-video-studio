import { SubtitleCue, SubtitleDisplayMode, VoiceOption, VoiceoverConfig, SpeakerVoicePersona } from "../types";

export interface PersonaMetadata {
  id: SpeakerVoicePersona;
  label: string;
  shortLabel: string;
  icon: string;
  gender: "male" | "female" | "neutral";
  age: "child" | "young" | "adult" | "elderly";
  description: string;
  badge: string;
  geminiVoice: string; // Puck, Charon, Fenrir, Aoede, Kore
  pitch: number; // 0.5 - 1.8
  rate: number;  // 0.8 - 1.3
  color: string;
  bgBadge: string;
}

export const SPEAKER_PERSONAS: Record<SpeakerVoicePersona, PersonaMetadata> = {
  male_young: {
    id: "male_young",
    label: "Nam trẻ / Thanh niên",
    shortLabel: "Nam trẻ",
    icon: "👨",
    gender: "male",
    age: "young",
    description: "Giọng nam trẻ trung, tươi sáng, nhanh nhẹn, tự nhiên",
    badge: "Nam trẻ",
    geminiVoice: "Puck",
    pitch: 1.05,
    rate: 1.05,
    color: "text-blue-400 border-blue-500/40 bg-blue-950/40",
    bgBadge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
  male_adult: {
    id: "male_adult",
    label: "Nam trung niên / Trưởng thành",
    shortLabel: "Nam trung niên",
    icon: "👔",
    gender: "male",
    age: "adult",
    description: "Giọng nam trưởng thành, đĩnh đạc, trầm ấm và uy quyền",
    badge: "Nam trung niên",
    geminiVoice: "Fenrir",
    pitch: 0.92,
    rate: 0.98,
    color: "text-indigo-400 border-indigo-500/40 bg-indigo-950/40",
    bgBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  },
  male_elderly: {
    id: "male_elderly",
    label: "Nam già / Ông lão / Cụ ông",
    shortLabel: "Ông lão",
    icon: "👴",
    gender: "male",
    age: "elderly",
    description: "Giọng ông cụ trầm khàn, từng trải, nói chậm rãi, truyền cảm",
    badge: "Ông lão (Già)",
    geminiVoice: "Charon",
    pitch: 0.72,
    rate: 0.86,
    color: "text-amber-400 border-amber-600/40 bg-amber-950/40",
    bgBadge: "bg-amber-600/20 text-amber-300 border-amber-500/40",
  },
  female_young: {
    id: "female_young",
    label: "Nữ trẻ / Thiếu nữ / Cô gái",
    shortLabel: "Nữ trẻ",
    icon: "👩",
    gender: "female",
    age: "young",
    description: "Giọng nữ thanh xuân, ngọt ngào, trong trẻo, sinh động",
    badge: "Nữ trẻ",
    geminiVoice: "Kore",
    pitch: 1.15,
    rate: 1.02,
    color: "text-rose-400 border-rose-500/40 bg-rose-950/40",
    bgBadge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
  female_adult: {
    id: "female_adult",
    label: "Nữ trung niên / Phụ nữ chín chắn",
    shortLabel: "Nữ trung niên",
    icon: "👗",
    gender: "female",
    age: "adult",
    description: "Giọng nữ ấm áp, đĩnh đạc, sâu lắng, cảm xúc",
    badge: "Nữ trung niên",
    geminiVoice: "Aoede",
    pitch: 0.96,
    rate: 0.97,
    color: "text-purple-400 border-purple-500/40 bg-purple-950/40",
    bgBadge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  female_elderly: {
    id: "female_elderly",
    label: "Nữ già / Bà lão / Cụ bà",
    shortLabel: "Bà lão",
    icon: "👵",
    gender: "female",
    age: "elderly",
    description: "Giọng bà cụ hiền từ, phúc hậu, chậm rãi, gần gũi",
    badge: "Bà cụ (Già)",
    geminiVoice: "Aoede",
    pitch: 0.82,
    rate: 0.87,
    color: "text-yellow-400 border-yellow-600/40 bg-yellow-950/40",
    bgBadge: "bg-yellow-600/20 text-yellow-300 border-yellow-500/40",
  },
  child: {
    id: "child",
    label: "Trẻ em / Bé trai, bé gái",
    shortLabel: "Trẻ em",
    icon: "🧒",
    gender: "neutral",
    age: "child",
    description: "Giọng trẻ thơ lanh lợi, hồn nhiên, cao vút, đáng yêu",
    badge: "Trẻ em (Bé)",
    geminiVoice: "Puck",
    pitch: 1.5,
    rate: 1.1,
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
    bgBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
};

export function getPersonaInfo(persona?: SpeakerVoicePersona): PersonaMetadata {
  if (persona && SPEAKER_PERSONAS[persona]) {
    return SPEAKER_PERSONAS[persona];
  }
  return SPEAKER_PERSONAS.female_young;
}

/**
 * Intelligent heuristic fallback to guess speaker demographic from dialogue pronouns
 */
export function inferSpeakerPersona(text: string): SpeakerVoicePersona {
  const lower = text.toLowerCase();

  // Elderly female (Bà / cụ bà)
  if (
    lower.includes("bà ơi") ||
    lower.includes("bà nội") ||
    lower.includes("bà ngoại") ||
    lower.includes("cụ bà") ||
    lower.includes("bà già") ||
    lower.includes("bà đây")
  ) {
    return "female_elderly";
  }

  // Elderly male (Ông / cụ ông / bác trưởng thôn)
  if (
    lower.includes("ông ơi") ||
    lower.includes("ông nội") ||
    lower.includes("ông ngoại") ||
    lower.includes("cụ ông") ||
    lower.includes("ông già") ||
    lower.includes("lão già") ||
    lower.includes("thầy già") ||
    lower.includes("bác già") ||
    lower.includes("ông đây")
  ) {
    return "male_elderly";
  }

  // Child (Trẻ con / bé)
  if (
    lower.includes("mẹ ơi") ||
    lower.includes("ba ơi") ||
    lower.includes("bố ơi") ||
    lower.includes("con nít") ||
    lower.includes("bé ngoan") ||
    lower.includes("cháu bé") ||
    lower.includes("em bé") ||
    lower.includes("con muốn ăn") ||
    lower.includes("con sợ")
  ) {
    return "child";
  }

  // Male adult or young
  if (
    lower.includes("anh yêu") ||
    lower.includes("anh bảo") ||
    lower.includes("chàng trai") ||
    lower.includes("thằng này") ||
    lower.includes("tôi là đàn ông")
  ) {
    return "male_young";
  }

  // Female
  if (
    lower.includes("em yêu") ||
    lower.includes("cô gái") ||
    lower.includes("cô bé") ||
    lower.includes("nữ thần") ||
    lower.includes("tiểu thư")
  ) {
    return "female_young";
  }

  return "male_young";
}

export const DEFAULT_VOICEOVER_CONFIG: VoiceoverConfig = {
  enabled: true,
  voiceId: "vi-female",
  autoMultiVoice: true, // Tự động nhận diện Nam/Nữ/Già/Trẻ theo phân vai
  speechRate: 1.0,
  voiceVolume: 1.0,
  originalVolumeDucking: 0.25, // Duck background video audio to 25% while voiceover speaks
  readMode: "vi",
};

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: "vi-female",
    name: "Nữ Tiếng Việt (Hoài My / Tự nhiên)",
    gender: "female",
    engine: "webspeech",
    description: "Giọng đọc nữ tiếng Việt chuẩn, mượt mà, không giới hạn lượt dùng",
    badge: "Khuyên dùng",
    lang: "vi-VN",
  },
  {
    id: "vi-male",
    name: "Nam Tiếng Việt (Nam Minh / Trầm ấm)",
    gender: "male",
    engine: "webspeech",
    description: "Giọng đọc nam tiếng Việt trầm ấm, truyền cảm cho phim tài liệu & tin tức",
    badge: "Tiếng Việt",
    lang: "vi-VN",
  },
  {
    id: "gemini-kore",
    name: "Gemini AI: Kore (Nữ thanh thoát)",
    gender: "female",
    engine: "gemini",
    description: "Giọng đọc AI thế hệ mới từ Google Gemini, trong trẻo và chuyên nghiệp",
    badge: "Gemini AI",
  },
  {
    id: "gemini-aoede",
    name: "Gemini AI: Aoede (Nữ nhẹ nhàng)",
    gender: "female",
    engine: "gemini",
    description: "Giọng đọc AI nhẹ nhàng, truyền cảm cho video nghệ thuật và cảm xúc",
    badge: "Gemini AI",
  },
  {
    id: "gemini-puck",
    name: "Gemini AI: Puck (Nam tự nhiên)",
    gender: "male",
    engine: "gemini",
    description: "Giọng đọc AI nam năng động, tự nhiên cho review phim, vlog và TikTok",
    badge: "Gemini AI",
  },
];

let activeAudioPreview: HTMLAudioElement | null = null;

/**
 * Stop any active audio voice preview
 */
export function stopVoicePreview() {
  if (activeAudioPreview) {
    activeAudioPreview.pause();
    activeAudioPreview.currentTime = 0;
    activeAudioPreview = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Find the best matching browser SpeechSynthesisVoice for Vietnamese
 */
export function findBestWebSpeechVoice(gender: "female" | "male" | "neutral" = "female"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const viVoices = voices.filter((v) => v.lang.toLowerCase().includes("vi") || v.lang.toLowerCase().includes("vie"));

  if (viVoices.length > 0) {
    if (gender === "male") {
      const maleVoice = viVoices.find((v) =>
        v.name.toLowerCase().includes("nam") ||
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("minh")
      );
      if (maleVoice) return maleVoice;
    } else {
      const femaleVoice = viVoices.find((v) =>
        v.name.toLowerCase().includes("hoai") ||
        v.name.toLowerCase().includes("my") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("nu") ||
        v.name.toLowerCase().includes("linh")
      );
      if (femaleVoice) return femaleVoice;
    }
    return viVoices[0];
  }

  // Fallback to default voice
  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Preview audio for a given voice
 */
export async function previewVoice(
  voiceId: string,
  sampleText = "Xin chào! Đây là bản thuyết minh tiếng Việt tự động cho video của bạn.",
  rate = 1.0,
  onEnd?: () => void
): Promise<void> {
  stopVoicePreview();

  const voice = AVAILABLE_VOICES.find((v) => v.id === voiceId) || AVAILABLE_VOICES[0];

  if (voice.engine === "gemini") {
    const geminiVoiceName = voiceId.replace("gemini-", "").charAt(0).toUpperCase() + voiceId.replace("gemini-", "").slice(1);
    try {
      const res = await fetch("/api/vietsub/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          voiceName: geminiVoiceName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.playbackRate = rate;
        activeAudioPreview = audio;
        audio.onended = () => {
          activeAudioPreview = null;
          if (onEnd) onEnd();
        };
        await audio.play();
        return;
      }
      console.warn("Gemini TTS limit or error, falling back to Web Speech:", data.error);
    } catch (err) {
      console.warn("Gemini TTS request failed, falling back to Web Speech preview:", err);
    }
  }

  // Fallback to Web Speech API
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = "vi-VN";
    utterance.rate = rate;
    const bestVoice = findBestWebSpeechVoice(voice.gender);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  } else if (onEnd) {
    onEnd();
  }
}

/**
 * Preview audio for a specific Speaker Persona (Nam trẻ, Nữ trẻ, Ông lão, Bà lão, Trẻ em,...)
 */
export async function previewSpeakerPersona(
  persona: SpeakerVoicePersona,
  text: string,
  onEnd?: () => void
): Promise<void> {
  stopVoicePreview();

  const meta = getPersonaInfo(persona);
  const sampleText = (text || `Xin chào! Tôi là giọng đọc ${meta.label} cho phim của bạn.`).trim();

  try {
    const res = await fetch("/api/vietsub/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sampleText,
        voicePersona: persona,
        voiceName: meta.geminiVoice,
        pitch: meta.pitch,
        rate: meta.rate,
      }),
    });

    const data = await res.json();
    if (res.ok && data.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      audio.playbackRate = meta.rate;
      activeAudioPreview = audio;
      audio.onended = () => {
        activeAudioPreview = null;
        if (onEnd) onEnd();
      };
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn("Gemini Persona TTS error, falling back to Web Speech:", err);
  }

  // Fallback to Web Speech with customized pitch and rate for Persona
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = "vi-VN";
    utterance.rate = meta.rate;
    utterance.pitch = meta.pitch;
    const bestVoice = findBestWebSpeechVoice(meta.gender === "male" ? "male" : "female");
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  } else if (onEnd) {
    onEnd();
  }
}

/**
 * Get the text to speak for a subtitle cue based on readMode
 */
export function getCueSpeechText(cue: SubtitleCue, mode: SubtitleDisplayMode = "vi"): string {
  if (mode === "original") {
    return (cue.textOriginal || cue.textVi).trim();
  }
  if (mode === "bilingual") {
    if (cue.textVi && cue.textOriginal) {
      return `${cue.textVi}. ${cue.textOriginal}`;
    }
    return (cue.textVi || cue.textOriginal).trim();
  }
  return (cue.textVi || cue.textOriginal || "").trim();
}
