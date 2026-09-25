export type SpeakerGender = 'male' | 'female' | 'unknown';
export type SpeakerAge = 'child' | 'young' | 'adult' | 'elderly';
export type SpeakerVoicePersona =
  | 'male_young'     // Nam trẻ / thanh niên
  | 'male_adult'     // Nam trung niên / trưởng thành
  | 'male_elderly'   // Nam già / ông lão / bác lớn tuổi
  | 'female_young'   // Nữ trẻ / cô gái / ngọt ngào
  | 'female_adult'   // Nữ trung niên / phụ nữ chững chạc
  | 'female_elderly' // Nữ già / bà lão / cụ bà
  | 'child';         // Trẻ em / bé trai bé gái

export interface SubtitleCue {
  id: number;
  start: number; // in seconds, e.g. 1.50
  end: number;   // in seconds, e.g. 4.20
  startTime: string; // "00:00:01.500"
  endTime: string;   // "00:00:04.200"
  textOriginal: string; // Original spoken text (English, Japanese, etc.)
  textVi: string;       // Vietnamese translated subtitle
  secondaryText?: string; // Secondary language text for multi-language / dual-language export (e.g., English, Romaji, Pinyin, or second target language)
  // Tự động nhận diện giọng nói Nam/Nữ/Già/Trẻ
  speakerGender?: SpeakerGender;
  speakerAge?: SpeakerAge;
  speakerRole?: string; // Tên nhân vật hoặc nhãn (vd: "Nam trẻ", "Nữ thanh niên", "Ông lão", "Bé gái")
  voicePersona?: SpeakerVoicePersona; // Persona giọng lồng tiếng
  emotion?: 'neutral' | 'cheerful' | 'sad' | 'angry' | 'tender' | 'dramatic';
  ttsAudioUrl?: string; // Cache giọng đọc riêng cho câu này
}

export type SubtitleDisplayMode =
  | 'vi'
  | 'bilingual'
  | 'original'
  | 'side-by-side'
  | 'secondary'
  | 'bilingual-reverse'
  | 'side-by-side-reverse';

export interface SubtitleExportOptions {
  mode?: SubtitleDisplayMode;
  sideBySideSeparator?: string; // e.g. " | ", " // ", " — ", " • ", " [ ] "
  secondarySource?: 'auto' | 'secondaryText' | 'textOriginal';
  primaryField?: 'textVi' | 'textOriginal' | 'secondaryText';
}

export type SubtitlePosition = 'bottom' | 'top' | 'middle';

export type CapCutAnimation = 'none' | 'karaoke-glow' | 'bounce' | 'fade' | 'typewriter' | 'zoom-in';

export type CapCutPreset = 'default' | 'tiktok-bold' | 'karaoke-glow' | 'cinema-yellow' | 'cyberpunk-neon' | 'box-highlight';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export interface SubtitleStyle {
  fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  textColor: string;
  backgroundColor: 'none' | 'translucent-black' | 'solid-black' | 'shadow-only';
  fontFamily: 'sans' | 'serif' | 'bebas';
  position: SubtitlePosition;
  displayMode: SubtitleDisplayMode;
  textShadow: boolean;
  // CapCut Pro Features
  capcutPreset?: CapCutPreset;
  animation?: CapCutAnimation;
  strokeColor?: string;
  strokeWidth?: number; // 0, 1, 2, 3
  glowColor?: string;
  bold?: boolean;
  italic?: boolean;
  uppercase?: boolean;
  aspectRatio?: AspectRatio;
  showTikTokSafeZone?: boolean;
}

export interface AudioEditConfig {
  volumeMultiplier: number; // 0.0 - 2.5 (1.0 = 100%, 2.0 = 200% boost)
  vocalEnhance: boolean; // Tăng độ trong trẻo và rõ nét lời thoại
  bassBoost: boolean; // Tăng cường dải âm trầm
  noiseReduction: boolean; // Lọc tạp âm nền
  audioDucking: boolean; // Tự động giảm nhỏ nhạc nền khi có phụ đề thoại
  playbackSpeed: number; // 0.5 - 2.0
  reverb: 'none' | 'studio' | 'room' | 'hall';
}

export interface WebDramaImportResult {
  sourceUrl: string;
  videoUrl: string;
  title: string;
  isDirectStream: boolean;
  isShortDrama: boolean;
  platform?: 'tiktok' | 'shortdrama' | 'web_movie' | 'youtube' | 'direct';
  description?: string;
  initialCues?: SubtitleCue[];
}

export type VietsubStyle = 'natural' | 'bilingual' | 'catchy' | 'literal';

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "Tiếng Việt (Vietnamese)", flag: "🇻🇳" },
  { code: "en", label: "Tiếng Anh (English)", flag: "🇬🇧" },
  { code: "ja", label: "Tiếng Nhật (日本語)", flag: "🇯🇵" },
  { code: "ko", label: "Tiếng Hàn (한국어)", flag: "🇰🇷" },
  { code: "zh", label: "Tiếng Trung (中文)", flag: "🇨🇳" },
  { code: "fr", label: "Tiếng Pháp (Français)", flag: "🇫🇷" },
  { code: "de", label: "Tiếng Đức (Deutsch)", flag: "🇩🇪" },
  { code: "es", label: "Tiếng Tây Ban Nha (Español)", flag: "🇪🇸" },
  { code: "ru", label: "Tiếng Nga (Русский)", flag: "🇷🇺" },
  { code: "th", label: "Tiếng Thái (ไทย)", flag: "🇹🇭" },
];

export interface GenerationConfig {
  sourceLang: string;
  targetLang: string; // e.g. 'vi', 'en', 'ja', 'ko', 'zh', etc.
  style: VietsubStyle;
  maxCharsPerLine: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: "female" | "male" | "neutral";
  engine: "gemini" | "webspeech";
  description: string;
  badge?: string;
  lang?: string;
}

export interface VoiceoverConfig {
  enabled: boolean;
  voiceId: string;
  autoMultiVoice: boolean; // Tự động đổi giọng Nam/Nữ/Già/Trẻ theo phân vai từng câu
  roleVoiceMap?: Record<string, string>; // Tùy chỉnh giọng cho từng nhóm nhân vật
  speechRate: number; // 0.8 - 1.3
  voiceVolume: number; // 0 - 1
  originalVolumeDucking: number; // 0 - 1 (e.g. 0.25 when voiceover speaks)
  readMode: SubtitleDisplayMode; // 'vi' | 'bilingual' | 'original'
}

export interface AICoverSinger {
  id: string;
  name: string;
  avatar: string;
  gender: "male" | "female";
  style: string;
  description: string;
  badge: string;
  color: string;
}

export interface AICoverConfig {
  singerId: string;
  genre: "ballad" | "pop" | "acoustic" | "lofi" | "rock";
  pitchShift: number; // -4 to +4 semitones
  tempo: number; // 0.85 to 1.25
  reverbLevel: "none" | "room" | "studio" | "hall";
  vocalReducerLevel: number; // 0 to 1 (reduce original vocal volume)
  lyricsScope: "full" | "chorus" | "custom";
  // Tự động phối nhạc & Hát như người thật
  autoArrangement: boolean;
  instrumentalVolume: number; // 0 - 1.5
  vocalVolume: number; // 0 - 1.5
  humanVocalMode: boolean; // Lấy hơi, rung ngân, luyến láy
  humanBreathEffect: boolean; // Tiếng thở tự nhiên
  vocalEmotion: "passionate" | "emotional_ballad" | "gentle_acoustic" | "rnb_flow";
}

export interface VideoExportProgress {
  isExporting: boolean;
  step: string;
  percent: number;
  currentSeconds: number;
  totalSeconds: number;
}

export interface SampleVideo {
  id: string;
  title: string;
  author: string;
  duration: string;
  videoUrl: string;
  language: string;
  description: string;
  initialCues?: SubtitleCue[];
}
