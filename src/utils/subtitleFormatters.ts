import { SubtitleCue, SubtitleDisplayMode, SubtitleExportOptions } from "../types";

export function formatSecondsToSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function formatSecondsToVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

export function formatSecondsToDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${pad(m)}:${pad(s)}.${ms}`;
}

function pad(num: number, size = 2): string {
  return num.toString().padStart(size, "0");
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  // Handles 00:01:23.456 or 00:01:23,456 or 01:23.456 or plain seconds
  const normalized = timeStr.trim().replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    return parseFloat(normalized) || 0;
  }
}

/**
 * Resolve the secondary language text for a cue based on preferred source
 */
export function resolveCueSecondaryText(
  cue: SubtitleCue,
  secondarySource: "auto" | "secondaryText" | "textOriginal" = "auto"
): string {
  if (secondarySource === "secondaryText") {
    return (cue.secondaryText ?? "").trim();
  }
  if (secondarySource === "textOriginal") {
    return (cue.textOriginal ?? "").trim();
  }
  // 'auto': prioritize explicit secondaryText if present, otherwise fallback to textOriginal
  const sec = cue.secondaryText?.trim();
  if (sec) return sec;
  return (cue.textOriginal ?? "").trim();
}

/**
 * Format the text of a single subtitle cue according to export mode and layout
 */
export function formatCueText(
  cue: SubtitleCue,
  modeOrOptions: SubtitleDisplayMode | SubtitleExportOptions = "vi"
): string {
  const options: SubtitleExportOptions =
    typeof modeOrOptions === "string"
      ? { mode: modeOrOptions }
      : modeOrOptions || { mode: "vi" };

  const mode = options.mode || "vi";
  const sep = options.sideBySideSeparator ?? " | ";
  const primary = (cue.textVi ?? "").trim();
  const secondary = resolveCueSecondaryText(cue, options.secondarySource);

  switch (mode) {
    case "vi":
      return primary || secondary;

    case "original":
      return (cue.textOriginal ?? "").trim() || primary;

    case "secondary":
      return secondary || primary;

    case "bilingual":
      // Stacked: Secondary/Original on top line, Primary (Vietnamese) on bottom line
      if (secondary && primary) {
        return `${secondary}\n${primary}`;
      }
      return primary || secondary;

    case "bilingual-reverse":
      // Stacked reverse: Primary (Vietnamese) on top line, Secondary/Original on bottom line
      if (primary && secondary) {
        return `${primary}\n${secondary}`;
      }
      return primary || secondary;

    case "side-by-side":
      // Side-by-side on same line: Secondary [sep] Primary
      if (secondary && primary) {
        if (sep === " [ ] ") {
          return `[${secondary}] [${primary}]`;
        }
        return `${secondary}${sep}${primary}`;
      }
      return primary || secondary;

    case "side-by-side-reverse":
      // Side-by-side on same line: Primary [sep] Secondary
      if (primary && secondary) {
        if (sep === " [ ] ") {
          return `[${primary}] [${secondary}]`;
        }
        return `${primary}${sep}${secondary}`;
      }
      return primary || secondary;

    default:
      return primary || secondary;
  }
}

/**
 * Generate SRT file content supporting multiple side-by-side and bilingual formats
 */
export function exportToSRT(
  cues: SubtitleCue[],
  modeOrOptions: SubtitleDisplayMode | SubtitleExportOptions = "vi"
): string {
  return cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatSecondsToSrtTime(cue.start);
      const end = formatSecondsToSrtTime(cue.end);
      const text = formatCueText(cue, modeOrOptions);
      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

/**
 * Generate WebVTT file content supporting multiple side-by-side and bilingual formats
 */
export function exportToVTT(
  cues: SubtitleCue[],
  modeOrOptions: SubtitleDisplayMode | SubtitleExportOptions = "vi"
): string {
  const header = "WEBVTT - Vietsub Video Studio\n\n";
  const body = cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatSecondsToVttTime(cue.start);
      const end = formatSecondsToVttTime(cue.end);
      const text = formatCueText(cue, modeOrOptions);
      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");

  return header + body;
}

/**
 * Generate TXT summary
 */
export function exportToTXT(
  cues: SubtitleCue[],
  includeTimestamps = true,
  modeOrOptions: SubtitleDisplayMode | SubtitleExportOptions = "vi"
): string {
  return cues
    .map((cue) => {
      const text = formatCueText(cue, modeOrOptions);
      if (includeTimestamps) {
        return `[${formatSecondsToDisplay(cue.start)} - ${formatSecondsToDisplay(cue.end)}] ${text}`;
      }
      return text;
    })
    .join("\n");
}

/**
 * Download a file in browser
 */
export function triggerDownload(content: string, filename: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse an uploaded .srt file into SubtitleCue[]
 */
export function parseSRT(srtContent: string): SubtitleCue[] {
  const clean = srtContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = clean.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    const lines = block.split("\n");
    if (lines.length < 2) continue;

    // Line 0 is number, or Line 0 is timestamp
    let timeLineIdx = 0;
    if (/^\d+$/.test(lines[0].trim())) {
      timeLineIdx = 1;
    }

    const timeLine = lines[timeLineIdx] || "";
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (!timeMatch) continue;

    const start = parseTimeToSeconds(timeMatch[1]);
    const end = parseTimeToSeconds(timeMatch[2]);
    const textLines = lines.slice(timeLineIdx + 1).join(" ").trim();

    cues.push({
      id: cues.length + 1,
      start,
      end,
      startTime: timeMatch[1].replace(",", "."),
      endTime: timeMatch[2].replace(",", "."),
      textOriginal: "",
      textVi: textLines,
    });
  }

  return cues;
}
