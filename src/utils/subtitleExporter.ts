import { SubtitleSegment } from '../types/editor';

function formatSRTTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

export class SubtitleExporter {
  static toSRT(segments: SubtitleSegment[]): string {
    return segments
      .map((seg, idx) => `${idx + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${seg.text}\n`)
      .join('\n');
  }

  static downloadFile(content: string, filename: string, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
