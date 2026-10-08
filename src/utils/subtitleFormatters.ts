import { SubtitleCue, SubtitleDisplayMode } from "../types";

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
 * Generate SRT file content
 */
export function exportToSRT(cues: SubtitleCue[], mode: SubtitleDisplayMode = "vi"): string {
  return cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatSecondsToSrtTime(cue.start);
      const end = formatSecondsToSrtTime(cue.end);

      let text = cue.textVi;
      if (mode === "bilingual") {
        text = cue.textOriginal ? `${cue.textOriginal}\n${cue.textVi}` : cue.textVi;
      } else if (mode === "original") {
        text = cue.textOriginal || cue.textVi;
      }

      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

/**
 * Generate WebVTT file content
 */
export function exportToVTT(cues: SubtitleCue[], mode: SubtitleDisplayMode = "vi"): string {
  const header = "WEBVTT - Vietsub Video Studio\n\n";
  const body = cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatSecondsToVttTime(cue.start);
      const end = formatSecondsToVttTime(cue.end);

      let text = cue.textVi;
      if (mode === "bilingual") {
        text = cue.textOriginal ? `${cue.textOriginal}\n${cue.textVi}` : cue.textVi;
      } else if (mode === "original") {
        text = cue.textOriginal || cue.textVi;
      }

      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");

  return header + body;
}

/**
 * Generate TXT summary
 */
export function exportToTXT(cues: SubtitleCue[], includeTimestamps = true): string {
  return cues
    .map((cue) => {
      if (includeTimestamps) {
        return `[${formatSecondsToDisplay(cue.start)} - ${formatSecondsToDisplay(cue.end)}] ${cue.textVi}`;
      }
      return cue.textVi;
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
