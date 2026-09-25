export type LogSeverity = 'info' | 'warn' | 'error' | 'success';
export type SubsystemType = 'UI' | 'AUDIO_ENGINE' | 'CANVAS_RENDERER' | 'GEMINI_AI' | 'CLOUDFLARE_AI';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  subsystem: SubsystemType;
  severity: LogSeverity;
  message: string;
}
