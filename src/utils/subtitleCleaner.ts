import { SubtitleCue } from "../types";
import { formatSecondsToSrtTime } from "./subtitleFormatters";

export interface AutoMergeConfig {
  minDuration: number; // e.g. 0.8s (cues shorter than this are merged)
  mergeOverlaps: boolean; // whether to merge overlapping cues
  maxGapToMerge: number; // max seconds gap between cues to allow merging (e.g. 0.4s)
  fixNegativeDurations: boolean; // fix cues where end <= start
  preserveSecondaryText: boolean;
}

export const DEFAULT_CLEANER_CONFIG: AutoMergeConfig = {
  minDuration: 0.8,
  mergeOverlaps: true,
  maxGapToMerge: 0.4,
  fixNegativeDurations: true,
  preserveSecondaryText: true,
};

export interface CueIssueReport {
  shortCuesCount: number;
  overlappingCount: number;
  negativeDurationCount: number;
  totalIssues: number;
  details: Array<{
    cueId: number;
    issueType: "short" | "overlap" | "invalid_duration";
    description: string;
  }>;
}

/**
 * Analyze an array of cues and report messy import issues
 */
export function analyzeCueIssues(
  cues: SubtitleCue[],
  config: Partial<AutoMergeConfig> = {}
): CueIssueReport {
  const cfg = { ...DEFAULT_CLEANER_CONFIG, ...config };
  let shortCuesCount = 0;
  let overlappingCount = 0;
  let negativeDurationCount = 0;
  const details: CueIssueReport["details"] = [];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const duration = cue.end - cue.start;

    if (duration <= 0.05) {
      negativeDurationCount++;
      details.push({
        cueId: cue.id,
        issueType: "invalid_duration",
        description: `Câu #${cue.id} có thời lượng không hợp lệ (${duration.toFixed(2)}s)`,
      });
    } else if (duration < cfg.minDuration) {
      shortCuesCount++;
      details.push({
        cueId: cue.id,
        issueType: "short",
        description: `Câu #${cue.id} quá ngắn (${duration.toFixed(2)}s < ${cfg.minDuration}s): "${cue.textVi.slice(0, 24)}..."`,
      });
    }

    if (i < cues.length - 1) {
      const nextCue = cues[i + 1];
      if (cue.end > nextCue.start + 0.05) {
        overlappingCount++;
        const overlap = (cue.end - nextCue.start).toFixed(2);
        details.push({
          cueId: cue.id,
          issueType: "overlap",
          description: `Câu #${cue.id} và #${nextCue.id} bị đè thời gian lồng nhau (${overlap}s)`,
        });
      }
    }
  }

  return {
    shortCuesCount,
    overlappingCount,
    negativeDurationCount,
    totalIssues: shortCuesCount + overlappingCount + negativeDurationCount,
    details,
  };
}

/**
 * Join text fragments without duplicating spaces or awkward punctuation
 */
function joinText(a?: string, b?: string): string {
  const first = (a ?? "").trim();
  const second = (b ?? "").trim();
  if (!first) return second;
  if (!second) return first;
  return `${first} ${second}`;
}

/**
 * Automatically merge cues with very short durations or overlapping time segments
 */
export function autoMergeAndCleanCues(
  inputCues: SubtitleCue[],
  config: Partial<AutoMergeConfig> = {}
): {
  cleanedCues: SubtitleCue[];
  mergedCount: number;
  originalCount: number;
  report: CueIssueReport;
} {
  if (!inputCues || inputCues.length === 0) {
    return {
      cleanedCues: [],
      mergedCount: 0,
      originalCount: 0,
      report: { shortCuesCount: 0, overlappingCount: 0, negativeDurationCount: 0, totalIssues: 0, details: [] },
    };
  }

  const cfg = { ...DEFAULT_CLEANER_CONFIG, ...config };
  const initialReport = analyzeCueIssues(inputCues, cfg);

  // 1. Sort copy by start time
  const sorted: SubtitleCue[] = [...inputCues].sort((a, b) => a.start - b.start);

  // 2. Fix negative or zero durations
  const sanitized = sorted.map((cue) => {
    let start = Math.max(0, Number(cue.start.toFixed(2)));
    let end = Number(cue.end.toFixed(2));
    if (end <= start) {
      end = Number((start + 0.5).toFixed(2));
    }
    return {
      ...cue,
      start,
      end,
    };
  });

  // 3. Iterative pass to merge overlaps and short cues
  const result: SubtitleCue[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const current = { ...sanitized[i] };

    if (result.length === 0) {
      result.push(current);
      continue;
    }

    const prev = result[result.length - 1];
    const isOverlapping = cfg.mergeOverlaps && prev.end > current.start - 0.05;
    const isPrevShort = (prev.end - prev.start) < cfg.minDuration;
    const isCurrentShort = (current.end - current.start) < cfg.minDuration;
    const gap = current.start - prev.end;
    const isVeryClose = gap <= cfg.maxGapToMerge;

    // Conditions to merge with previous cue:
    // A) Overlapping segments (prev.end >= current.start)
    // B) Either cue is too short AND the gap is smaller than maxGapToMerge
    const shouldMerge = isOverlapping || ((isPrevShort || isCurrentShort) && isVeryClose);

    if (shouldMerge) {
      // Merge current into prev
      const newStart = Math.min(prev.start, current.start);
      const newEnd = Math.max(prev.end, current.end, Number((newStart + cfg.minDuration).toFixed(2)));

      prev.start = Number(newStart.toFixed(2));
      prev.end = Number(newEnd.toFixed(2));
      prev.startTime = formatSecondsToSrtTime(prev.start).replace(",", ".");
      prev.endTime = formatSecondsToSrtTime(prev.end).replace(",", ".");

      prev.textVi = joinText(prev.textVi, current.textVi);
      prev.textOriginal = joinText(prev.textOriginal, current.textOriginal);

      if (cfg.preserveSecondaryText) {
        prev.secondaryText = joinText(prev.secondaryText, current.secondaryText);
      }

      // Preserve speaker/persona if not specified on prev
      if (!prev.speakerRole && current.speakerRole) {
        prev.speakerRole = current.speakerRole;
      }
      if (!prev.voicePersona && current.voicePersona) {
        prev.voicePersona = current.voicePersona;
      }
      if (!prev.speakerGender && current.speakerGender) {
        prev.speakerGender = current.speakerGender;
      }
    } else {
      result.push(current);
    }
  }

  // 4. Secondary pass: ensure all final cues have at least minDuration
  // and no overlapping boundaries remain
  for (let i = 0; i < result.length; i++) {
    const cue = result[i];
    const duration = cue.end - cue.start;
    if (duration < 0.5) {
      const nextStart = i < result.length - 1 ? result[i + 1].start : Infinity;
      const targetEnd = cue.start + 0.5;
      cue.end = Number(Math.min(targetEnd, nextStart).toFixed(2));
    }
    // Re-format time strings cleanly
    cue.startTime = formatSecondsToSrtTime(cue.start).replace(",", ".");
    cue.endTime = formatSecondsToSrtTime(cue.end).replace(",", ".");
  }

  // Re-number IDs cleanly 1, 2, 3...
  const cleanedCues = result.map((c, idx) => ({
    ...c,
    id: idx + 1,
  }));

  const mergedCount = inputCues.length - cleanedCues.length;

  return {
    cleanedCues,
    mergedCount,
    originalCount: inputCues.length,
    report: initialReport,
  };
}
