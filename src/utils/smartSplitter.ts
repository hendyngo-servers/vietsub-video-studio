import { SubtitleCue } from "../types";
import { formatSecondsToSrtTime } from "./subtitleFormatters";

export interface SmartSplitConfig {
  maxCharsPerLine: number;       // Default ~38-42 chars (optimal subtitle readability)
  maxDuration: number;           // Default ~3.8s (max recommended reading time per block)
  minSegmentDuration: number;    // Default 0.8s (avoids flash-on-screen segments)
  breathPauseGap: number;        // Default 0.06s (natural pause gap between spoken phrases)
  splitByPunctuation: boolean;   // Prioritize punctuation marks (. , ? ! ; : — …)
  splitByConjunctions: boolean;  // Prioritize speech conjunctions (và, nhưng, bởi vì, and, but...)
  splitOriginalText: boolean;    // Simultaneously split textOriginal if present
}

export const DEFAULT_SMART_SPLIT_CONFIG: SmartSplitConfig = {
  maxCharsPerLine: 42,
  maxDuration: 4.0,
  minSegmentDuration: 0.8,
  breathPauseGap: 0.06,
  splitByPunctuation: true,
  splitByConjunctions: true,
  splitOriginalText: true,
};

// Preset configurations for different platform needs
export const SMART_SPLIT_PRESETS: Record<string, { label: string; desc: string; config: SmartSplitConfig }> = {
  tiktok: {
    label: "TikTok / Reels / Shorts",
    desc: "Cực kỳ ngắn gọn, hiển thị nhanh từng nhịp câu (Max 32 ký tự, 2.8s)",
    config: {
      ...DEFAULT_SMART_SPLIT_CONFIG,
      maxCharsPerLine: 32,
      maxDuration: 2.8,
      minSegmentDuration: 0.7,
      breathPauseGap: 0.05,
    },
  },
  standard: {
    label: "YouTube / Vlog Chuẩn",
    desc: "Cân bằng đọc lướt và nghe thoại tự nhiên (Max 42 ký tự, 4.0s)",
    config: {
      ...DEFAULT_SMART_SPLIT_CONFIG,
      maxCharsPerLine: 42,
      maxDuration: 4.0,
      minSegmentDuration: 0.8,
      breathPauseGap: 0.06,
    },
  },
  cinema: {
    label: "Điện ảnh / Phim dài tập",
    desc: "Chứa nhiều ngữ nghĩa hơn, nhịp nghỉ rộng (Max 52 ký tự, 5.0s)",
    config: {
      ...DEFAULT_SMART_SPLIT_CONFIG,
      maxCharsPerLine: 52,
      maxDuration: 5.0,
      minSegmentDuration: 1.0,
      breathPauseGap: 0.08,
    },
  },
};

export interface SplitPointCandidate {
  index: number;              // Character index in text where split occurs
  pauseType: "sentence_end" | "clause_pause" | "conjunction" | "rhythmic_space";
  matchedMarker: string;      // e.g. ".", ",", "nhưng", "và"
  score: number;              // Higher score = more natural speech pause
  description: string;
}

export interface SplitPreviewItem {
  originalCue: SubtitleCue;
  needsSplit: boolean;
  reason: string;
  splitSegments: SubtitleCue[];
  pausePoints: SplitPointCandidate[];
}

export interface SmartSplitAnalysisReport {
  totalCues: number;
  longCuesCount: number;
  estimatedNewCuesCount: number;
  maxCharCount: number;
  items: SplitPreviewItem[];
}

// Natural speech conjunctions in Vietnamese and English indicating natural speech rhythm
const VN_SPEECH_CONJUNCTIONS = [
  "tuy nhiên",
  "bởi vì",
  "cho nên",
  "vì vậy",
  "do đó",
  "thế nhưng",
  "mặc dù",
  "đồng thời",
  "bên cạnh đó",
  "sau đó",
  "và",
  "nhưng",
  "hoặc",
  "hay là",
  "để",
  "khi",
  "nếu",
  "mà",
  "thì",
  "rồi",
];

const EN_SPEECH_CONJUNCTIONS = [
  "however",
  "because",
  "although",
  "therefore",
  "furthermore",
  "as well as",
  "and",
  "but",
  "so",
  "or",
  "when",
  "while",
  "which",
  "that",
  "then",
  "since",
];

/**
 * Checks whether a cue is considered "long" based on character count or duration
 */
export function isCueLong(cue: SubtitleCue, config: SmartSplitConfig = DEFAULT_SMART_SPLIT_CONFIG): boolean {
  const text = (cue.textVi || cue.textOriginal || "").trim();
  const duration = cue.end - cue.start;
  return text.length > config.maxCharsPerLine || duration > config.maxDuration;
}

/**
 * Finds natural speech pause split candidates within a text string.
 */
export function findSpeechPauseCandidates(
  text: string,
  config: SmartSplitConfig = DEFAULT_SMART_SPLIT_CONFIG
): SplitPointCandidate[] {
  const candidates: SplitPointCandidate[] = [];
  const clean = text.trim();
  const len = clean.length;
  if (len < 10) return [];

  const centerIndex = len / 2;

  // 1. Sentence terminators: . ? ! ... … (Strongest speech pause)
  if (config.splitByPunctuation) {
    const sentenceRegex = /([.?!…]+|(\.{3}))\s+/g;
    let match: RegExpExecArray | null;
    while ((match = sentenceRegex.exec(clean)) !== null) {
      const splitIdx = match.index + match[1].length;
      if (splitIdx > 6 && splitIdx < len - 6) {
        // Distance penalty from center
        const distRatio = Math.abs(splitIdx - centerIndex) / centerIndex;
        const score = 100 - distRatio * 35;
        candidates.push({
          index: splitIdx,
          pauseType: "sentence_end",
          matchedMarker: match[1],
          score,
          description: `Ngắt hết câu ("${match[1]}")`,
        });
      }
    }

    // 2. Clause boundaries: , ; : — – - (Medium speech pause)
    const clauseRegex = /([,;:—–]|\s-\s)\s*/g;
    while ((match = clauseRegex.exec(clean)) !== null) {
      const splitIdx = match.index + match[1].length;
      if (splitIdx > 6 && splitIdx < len - 6) {
        const distRatio = Math.abs(splitIdx - centerIndex) / centerIndex;
        const score = 75 - distRatio * 30;
        candidates.push({
          index: splitIdx,
          pauseType: "clause_pause",
          matchedMarker: match[1].trim(),
          score,
          description: `Ngắt vế câu ("${match[1].trim()}")`,
        });
      }
    }
  }

  // 3. Discourse markers & Conjunctions (Natural speech rhythm breath)
  if (config.splitByConjunctions) {
    const conjunctions = [...VN_SPEECH_CONJUNCTIONS, ...EN_SPEECH_CONJUNCTIONS];
    for (const conj of conjunctions) {
      const regex = new RegExp(`\\s+(${conj})\\s+`, "gi");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(clean)) !== null) {
        const splitIdx = match.index; // Split right before conjunction or before word
        if (splitIdx > 8 && splitIdx < len - 8) {
          const distRatio = Math.abs(splitIdx - centerIndex) / centerIndex;
          const score = 55 - distRatio * 25;
          candidates.push({
            index: splitIdx,
            pauseType: "conjunction",
            matchedMarker: match[1],
            score,
            description: `Ngắt nhịp từ nối ("${match[1]}")`,
          });
        }
      }
    }
  }

  // 4. Fallback: Word spaces near the center for balanced reading
  const spaceRegex = /\s+/g;
  let match: RegExpExecArray | null;
  while ((match = spaceRegex.exec(clean)) !== null) {
    const splitIdx = match.index;
    if (splitIdx > 8 && splitIdx < len - 8) {
      const distRatio = Math.abs(splitIdx - centerIndex) / centerIndex;
      // High score if near center, low if at extremes
      const score = Math.max(10, 40 - distRatio * 38);
      candidates.push({
        index: splitIdx,
        pauseType: "rhythmic_space",
        matchedMarker: " ",
        score,
        description: "Ngắt khoảng trắng cân bằng",
      });
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  // Filter out redundant candidates that are within 3 characters of each other
  const filtered: SplitPointCandidate[] = [];
  for (const c of candidates) {
    if (!filtered.some((existing) => Math.abs(existing.index - c.index) <= 3)) {
      filtered.push(c);
    }
  }

  return filtered;
}

/**
 * Calculates speech weight (characters + words + punctuation pause) for proportional timing
 */
function calculateSpeechWeight(text: string): number {
  const clean = text.trim();
  const charLen = clean.length;
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  // Extra pause hold weight for sentence-ending punctuation
  const endsWithPunct = /[.?!…]$/.test(clean) ? 4 : /[,;:]$/.test(clean) ? 2 : 0;
  return Math.max(1, charLen * 0.7 + wordCount * 2 + endsWithPunct);
}

/**
 * Intelligently splits a single SubtitleCue into 2 or more shorter cues
 * using natural speech pauses and proportional time allocation.
 */
export function smartSplitSingleCue(
  cue: SubtitleCue,
  config: SmartSplitConfig = DEFAULT_SMART_SPLIT_CONFIG,
  idGenerator?: () => number
): SubtitleCue[] {
  const textVi = (cue.textVi || "").trim();
  const textOrig = (cue.textOriginal || "").trim();
  const totalDuration = cue.end - cue.start;

  // Determine primary text to evaluate
  const primaryText = textVi || textOrig;
  if (!primaryText || primaryText.length <= 15) {
    return [cue];
  }

  // Calculate target number of segments
  const byChars = Math.ceil(primaryText.length / config.maxCharsPerLine);
  const byDuration = Math.ceil(totalDuration / config.maxDuration);
  let targetSegments = Math.max(2, Math.max(byChars, byDuration));

  // Cap target segments so each piece gets at least minSegmentDuration
  const maxPossibleSegments = Math.max(1, Math.floor(totalDuration / config.minSegmentDuration));
  targetSegments = Math.min(targetSegments, Math.max(2, maxPossibleSegments));

  if (targetSegments <= 1 || totalDuration < config.minSegmentDuration * 1.5) {
    return [cue];
  }

  // Determine split points
  const candidates = findSpeechPauseCandidates(primaryText, config);
  if (candidates.length === 0) {
    return [cue];
  }

  // Choose the best split point(s)
  const chosenIndices: number[] = [];

  if (targetSegments === 2) {
    // Pick the highest scoring candidate
    chosenIndices.push(candidates[0].index);
  } else {
    // Pick (targetSegments - 1) distributed split points
    const step = primaryText.length / targetSegments;
    for (let s = 1; s < targetSegments; s++) {
      const idealPos = s * step;
      // Find candidate closest to idealPos with good score
      let bestCand: SplitPointCandidate | null = null;
      let bestDist = Infinity;
      for (const cand of candidates) {
        if (chosenIndices.includes(cand.index)) continue;
        const dist = Math.abs(cand.index - idealPos);
        const weightedDist = dist / (cand.score / 50);
        if (weightedDist < bestDist) {
          bestDist = weightedDist;
          bestCand = cand;
        }
      }
      if (bestCand && !chosenIndices.includes(bestCand.index)) {
        chosenIndices.push(bestCand.index);
      }
    }
  }

  chosenIndices.sort((a, b) => a - b);

  // Divide primaryText into chunks
  const textViChunks: string[] = [];
  let lastIdx = 0;
  for (const idx of chosenIndices) {
    const chunk = primaryText.slice(lastIdx, idx).trim();
    if (chunk) textViChunks.push(chunk);
    lastIdx = idx;
  }
  const lastChunk = primaryText.slice(lastIdx).trim();
  if (lastChunk) textViChunks.push(lastChunk);

  if (textViChunks.length <= 1) {
    return [cue];
  }

  // Divide original text proportionally or at matching pause if available
  const textOrigChunks: string[] = [];
  if (textOrig && config.splitOriginalText) {
    const origCandidates = findSpeechPauseCandidates(textOrig, config);
    if (origCandidates.length >= textViChunks.length - 1) {
      let lastOrigIdx = 0;
      const step = textOrig.length / textViChunks.length;
      for (let i = 1; i < textViChunks.length; i++) {
        const ideal = i * step;
        let best = origCandidates[0];
        let bestDist = Infinity;
        for (const c of origCandidates) {
          const d = Math.abs(c.index - ideal);
          if (d < bestDist) {
            bestDist = d;
            best = c;
          }
        }
        textOrigChunks.push(textOrig.slice(lastOrigIdx, best.index).trim());
        lastOrigIdx = best.index;
      }
      textOrigChunks.push(textOrig.slice(lastOrigIdx).trim());
    } else {
      // Proportional word split for original text
      const origWords = textOrig.split(/\s+/);
      const totalWords = origWords.length;
      let usedWords = 0;
      for (let i = 0; i < textViChunks.length; i++) {
        if (i === textViChunks.length - 1) {
          textOrigChunks.push(origWords.slice(usedWords).join(" "));
        } else {
          const ratio = textViChunks[i].length / primaryText.length;
          const count = Math.max(1, Math.round(totalWords * ratio));
          textOrigChunks.push(origWords.slice(usedWords, usedWords + count).join(" "));
          usedWords += count;
        }
      }
    }
  }

  // Calculate proportional durations based on speech weights
  const weights = textViChunks.map(calculateSpeechWeight);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const numSplits = textViChunks.length;
  const gap = config.breathPauseGap;
  const totalGapTime = Math.max(0, (numSplits - 1) * gap);
  const usableDuration = Math.max(0.5, totalDuration - totalGapTime);

  const splitCues: SubtitleCue[] = [];
  let currentStart = cue.start;

  let nextIdCounter = cue.id * 1000 + 1;
  const getId = () => {
    if (idGenerator) return idGenerator();
    return nextIdCounter++;
  };

  for (let i = 0; i < numSplits; i++) {
    const rawDur = (weights[i] / totalWeight) * usableDuration;
    const dur = Math.max(config.minSegmentDuration * 0.75, Number(rawDur.toFixed(2)));
    const segEnd = Number((i === numSplits - 1 ? cue.end : currentStart + dur).toFixed(2));

    const finalStart = Number(currentStart.toFixed(2));
    const finalEnd = Math.max(finalStart + 0.3, segEnd);

    splitCues.push({
      ...cue,
      id: i === 0 ? cue.id : getId(),
      start: finalStart,
      end: finalEnd,
      startTime: formatSecondsToSrtTime(finalStart).replace(",", "."),
      endTime: formatSecondsToSrtTime(finalEnd).replace(",", "."),
      textVi: textViChunks[i] || "",
      textOriginal: textOrigChunks[i] || (i === 0 ? cue.textOriginal : ""),
      secondaryText: cue.secondaryText ? `[${i + 1}/${numSplits}] ${cue.secondaryText}` : undefined,
    });

    currentStart = finalEnd + gap;
  }

  return splitCues;
}

/**
 * Analyzes an entire cues list and prepares a comprehensive Smart Split preview report
 */
export function analyzeSmartSplit(
  cues: SubtitleCue[],
  config: SmartSplitConfig = DEFAULT_SMART_SPLIT_CONFIG
): SmartSplitAnalysisReport {
  let longCuesCount = 0;
  let estimatedNewCuesCount = 0;
  let maxCharCount = 0;
  const items: SplitPreviewItem[] = [];

  for (const cue of cues) {
    const text = (cue.textVi || cue.textOriginal || "").trim();
    if (text.length > maxCharCount) {
      maxCharCount = text.length;
    }

    const isLong = isCueLong(cue, config);
    if (isLong) {
      longCuesCount++;
      const pausePoints = findSpeechPauseCandidates(text, config);
      const splitSegments = smartSplitSingleCue(cue, config);
      estimatedNewCuesCount += splitSegments.length;

      const reasons: string[] = [];
      if (text.length > config.maxCharsPerLine) {
        reasons.push(`${text.length} ký tự (> ${config.maxCharsPerLine})`);
      }
      const duration = cue.end - cue.start;
      if (duration > config.maxDuration) {
        reasons.push(`${duration.toFixed(1)}s (> ${config.maxDuration}s)`);
      }

      items.push({
        originalCue: cue,
        needsSplit: true,
        reason: reasons.join(", "),
        splitSegments,
        pausePoints,
      });
    } else {
      estimatedNewCuesCount += 1;
      items.push({
        originalCue: cue,
        needsSplit: false,
        reason: "Độ dài đạt chuẩn đọc",
        splitSegments: [cue],
        pausePoints: [],
      });
    }
  }

  return {
    totalCues: cues.length,
    longCuesCount,
    estimatedNewCuesCount,
    maxCharCount,
    items,
  };
}

/**
 * Executes batch Smart Split on all eligible long cues, re-indexing smoothly
 */
export function executeBatchSmartSplit(
  cues: SubtitleCue[],
  config: SmartSplitConfig = DEFAULT_SMART_SPLIT_CONFIG,
  selectedCueIdsToSplit?: number[]
): {
  newCues: SubtitleCue[];
  splitCount: number;
  addedCount: number;
} {
  let splitCount = 0;
  let currentMaxId = cues.reduce((max, c) => Math.max(max, c.id), 0);
  const idGen = () => ++currentMaxId;

  const resultCues: SubtitleCue[] = [];

  for (const cue of cues) {
    const shouldSplit = selectedCueIdsToSplit
      ? selectedCueIdsToSplit.includes(cue.id)
      : isCueLong(cue, config);

    if (shouldSplit) {
      const splitSegments = smartSplitSingleCue(cue, config, idGen);
      if (splitSegments.length > 1) {
        splitCount++;
        resultCues.push(...splitSegments);
      } else {
        resultCues.push(cue);
      }
    } else {
      resultCues.push(cue);
    }
  }

  // Sort chronologically by start time and re-assign clean sequential IDs
  resultCues.sort((a, b) => a.start - b.start);
  const finalized = resultCues.map((c, index) => ({
    ...c,
    id: index + 1,
  }));

  return {
    newCues: finalized,
    splitCount,
    addedCount: finalized.length - cues.length,
  };
}
