import {
  SubtitleCue,
  SubtitleStyle,
  VideoExportProgress,
  VoiceoverConfig,
} from "../types";
import { getCueSpeechText, findBestWebSpeechVoice } from "./voiceoverEngine";

export interface ExportVideoParams {
  videoUrl: string;
  cues: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  voiceover: VoiceoverConfig;
  videoTitle: string;
  onProgress: (progress: VideoExportProgress) => void;
  signal?: AbortSignal;
}

/**
 * Pre-fetches or synthesizes voiceover audio clips for each cue
 */
async function prepareVoiceoverAudioBuffers(
  cues: SubtitleCue[],
  voiceover: VoiceoverConfig,
  audioContext: AudioContext,
  onProgressStep: (msg: string, pct: number) => void,
  signal?: AbortSignal
): Promise<Map<number, AudioBuffer>> {
  const cueAudioMap = new Map<number, AudioBuffer>();
  if (!voiceover.enabled || cues.length === 0) return cueAudioMap;

  onProgressStep("Đang chuẩn bị giọng đọc thuyết minh AI...", 5);

  const isGemini = voiceover.voiceId.startsWith("gemini-") || voiceover.autoMultiVoice;
  const geminiVoice = voiceover.voiceId.startsWith("gemini-")
    ? voiceover.voiceId.replace("gemini-", "").charAt(0).toUpperCase() + voiceover.voiceId.replace("gemini-", "").slice(1)
    : "Puck";

  // If Gemini or Auto Multi-Voice is enabled, fetch audio clips per cue with detected persona
  if (isGemini || voiceover.autoMultiVoice) {
    for (let i = 0; i < cues.length; i++) {
      if (signal?.aborted) throw new Error("Xuất video đã bị hủy.");
      const cue = cues[i];
      const text = getCueSpeechText(cue, voiceover.readMode);
      if (!text) continue;

      const persona = cue.voicePersona || (cue.speakerGender === "male" ? "male_young" : "female_young");

      onProgressStep(
        `Đang tạo thuyết minh [${cue.speakerRole || persona}] câu ${i + 1}/${cues.length}: "${text.slice(0, 25)}..."`,
        5 + Math.round((i / cues.length) * 20)
      );

      try {
        const res = await fetch("/api/vietsub/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voiceName: geminiVoice,
            voicePersona: cue.voicePersona || (voiceover.autoMultiVoice ? persona : undefined),
          }),
          signal,
        });

        const data = await res.json();
        if (res.ok && data.audioBase64) {
          const rawBinary = atob(data.audioBase64);
          const bytes = new Uint8Array(rawBinary.length);
          for (let b = 0; b < rawBinary.length; b++) {
            bytes[b] = rawBinary.charCodeAt(b);
          }
          const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
          cueAudioMap.set(cue.id, audioBuffer);
        }
      } catch (err: any) {
        if (signal?.aborted) throw err;
        console.warn(`Could not synthesize cue ${cue.id} via Gemini TTS, will use speech fallback`, err);
      }
    }
  }

  return cueAudioMap;
}

/**
 * Draws styled subtitles directly onto the HTML5 2D canvas context
 */
function drawSubtitlesOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cues: SubtitleCue[],
  currentTime: number,
  style: SubtitleStyle
) {
  const activeCue = cues.find((c) => currentTime >= c.start && currentTime <= c.end);
  if (!activeCue) return;

  const textVi = activeCue.textVi?.trim() || "";
  const textOrig = activeCue.textOriginal?.trim() || "";
  const textSec = (activeCue.secondaryText?.trim()) || textOrig;

  let primaryText = textVi;
  let secondaryText = "";

  if (style.displayMode === "bilingual") {
    primaryText = textVi;
    secondaryText = textSec;
  } else if (style.displayMode === "bilingual-reverse") {
    primaryText = textSec;
    secondaryText = textVi;
  } else if (style.displayMode === "side-by-side") {
    primaryText = textSec && textVi ? `${textSec} | ${textVi}` : (textVi || textSec);
    secondaryText = "";
  } else if (style.displayMode === "side-by-side-reverse") {
    primaryText = textVi && textSec ? `${textVi} | ${textSec}` : (textVi || textSec);
    secondaryText = "";
  } else if (style.displayMode === "secondary") {
    primaryText = textSec || textVi;
  } else if (style.displayMode === "original") {
    primaryText = textOrig || textVi;
  }

  if (!primaryText && !secondaryText) return;

  ctx.save();

  // Font size relative to canvas width
  const baseFontSize =
    style.fontSize === "sm"
      ? width * 0.024
      : style.fontSize === "base"
      ? width * 0.03
      : style.fontSize === "lg"
      ? width * 0.036
      : style.fontSize === "xl"
      ? width * 0.042
      : width * 0.048;

  const fontFamily =
    style.fontFamily === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : style.fontFamily === "bebas"
      ? "Impact, 'Arial Black', sans-serif"
      : "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  ctx.font = `bold ${baseFontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const centerX = width / 2;
  const posY =
    style.position === "top"
      ? height * 0.12
      : style.position === "middle"
      ? height * 0.5
      : height * 0.86;

  // Measure text
  const primaryMetrics = ctx.measureText(primaryText);
  let secondaryMetrics = null;
  if (secondaryText) {
    ctx.font = `${baseFontSize * 0.75}px ${fontFamily}`;
    secondaryMetrics = ctx.measureText(secondaryText);
  }

  const boxWidth = Math.min(
    width * 0.92,
    Math.max(primaryMetrics.width, secondaryMetrics?.width || 0) + baseFontSize * 2
  );
  const boxHeight = secondaryText ? baseFontSize * 2.8 : baseFontSize * 1.8;

  // Background Box
  if (style.backgroundColor !== "none") {
    ctx.beginPath();
    const cornerRadius = 10;
    const rx = centerX - boxWidth / 2;
    const ry = posY - boxHeight / 2;

    ctx.fillStyle =
      style.backgroundColor === "solid-black"
        ? "rgba(10, 10, 10, 0.95)"
        : style.backgroundColor === "translucent-black"
        ? "rgba(15, 23, 42, 0.85)"
        : "rgba(0, 0, 0, 0.55)";

    if (ctx.roundRect) {
      ctx.roundRect(rx, ry, boxWidth, boxHeight, cornerRadius);
    } else {
      ctx.rect(rx, ry, boxWidth, boxHeight);
    }
    ctx.fill();
  }

  // Draw Primary Text
  ctx.font = `bold ${baseFontSize}px ${fontFamily}`;
  ctx.fillStyle = style.textColor || "#FFFFFF";

  if (style.textShadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    // Outline for ultimate readability
    ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
    ctx.lineWidth = Math.max(2, baseFontSize * 0.08);
    ctx.strokeText(primaryText, centerX, secondaryText ? posY - baseFontSize * 0.45 : posY);
  }

  ctx.fillText(primaryText, centerX, secondaryText ? posY - baseFontSize * 0.45 : posY);

  // Draw Secondary (Original) Text if Bilingual
  if (secondaryText) {
    ctx.font = `${baseFontSize * 0.72}px ${fontFamily}`;
    ctx.fillStyle = "#E2E8F0";
    if (style.textShadow) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.lineWidth = Math.max(1.5, baseFontSize * 0.06);
      ctx.strokeText(secondaryText, centerX, posY + baseFontSize * 0.65);
    }
    ctx.fillText(secondaryText, centerX, posY + baseFontSize * 0.65);
  }

  ctx.restore();
}

/**
 * Main function: Export Video with burned subtitles and AI Voiceover narration
 */
export async function exportVideoWithVietsubAndVoiceover({
  videoUrl,
  cues,
  subtitleStyle,
  voiceover,
  videoTitle,
  onProgress,
  signal,
}: ExportVideoParams): Promise<void> {
  onProgress({
    isExporting: true,
    step: "Đang nạp video nguồn...",
    percent: 3,
    currentSeconds: 0,
    totalSeconds: 0,
  });

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.src = videoUrl;
  video.muted = false;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = (e) => reject(new Error("Không thể tải video nguồn để xử lý."));
    if (signal) {
      signal.addEventListener("abort", () => reject(new Error("Xuất video đã bị hủy.")));
    }
  });

  const duration = video.duration || 10;
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;

  // Setup Audio Context & Destination
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const audioDestination = audioContext.createMediaStreamDestination();

  // Connect video audio to gain node
  let videoSourceNode: MediaElementAudioSourceNode | null = null;
  try {
    videoSourceNode = audioContext.createMediaElementSource(video);
  } catch (err) {
    console.warn("MediaElementAudioSourceNode might already be hooked:", err);
  }

  const videoGainNode = audioContext.createGain();
  videoGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);

  if (videoSourceNode) {
    videoSourceNode.connect(videoGainNode);
  }
  videoGainNode.connect(audioDestination);

  // Setup Voiceover Audio Gain Node
  const voiceoverGainNode = audioContext.createGain();
  voiceoverGainNode.gain.setValueAtTime(voiceover.voiceVolume || 1.0, audioContext.currentTime);
  voiceoverGainNode.connect(audioDestination);

  // Pre-generate Gemini TTS audio buffers if Gemini voice is chosen
  const pregeneratedAudioMap = await prepareVoiceoverAudioBuffers(
    cues,
    voiceover,
    audioContext,
    (msg, pct) => {
      onProgress({
        isExporting: true,
        step: msg,
        percent: pct,
        currentSeconds: 0,
        totalSeconds: duration,
      });
    },
    signal
  );

  // Canvas setup
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Không thể khởi tạo môi trường vẽ Canvas 2D.");

  // Prepare MediaRecorder
  const canvasStream = canvas.captureStream(30); // 30 FPS
  const tracks: MediaStreamTrack[] = [
    ...canvasStream.getVideoTracks(),
    ...audioDestination.stream.getAudioTracks(),
  ];
  const combinedStream = new MediaStream(tracks);

  // Pick best supported MIME type
  const mimeTypes = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: supportedMime,
    videoBitsPerSecond: 4_500_000, // 4.5 Mbps high fidelity
  });

  const recordedChunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const playedCueIds = new Set<number>();
  let activeDuckingTimeout: any = null;

  // Helper: Play voiceover for a cue during render
  const triggerVoiceoverForCue = (cue: SubtitleCue) => {
    if (playedCueIds.has(cue.id) || !voiceover.enabled) return;
    playedCueIds.add(cue.id);

    const speechText = getCueSpeechText(cue, voiceover.readMode);
    if (!speechText) return;

    // Duck background video volume
    const duckingVolume = Math.max(0.1, voiceover.originalVolumeDucking ?? 0.25);
    const now = audioContext.currentTime;
    videoGainNode.gain.cancelScheduledValues(now);
    videoGainNode.gain.linearRampToValueAtTime(duckingVolume, now + 0.15);

    // If pre-generated buffer exists (from Gemini TTS), play it
    const preBuffer = pregeneratedAudioMap.get(cue.id);
    if (preBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = preBuffer;
      source.playbackRate.setValueAtTime(voiceover.speechRate || 1.0, now);
      source.connect(voiceoverGainNode);
      source.start();

      const clipDuration = preBuffer.duration / (voiceover.speechRate || 1.0);
      if (activeDuckingTimeout) clearTimeout(activeDuckingTimeout);
      activeDuckingTimeout = setTimeout(() => {
        const restoreTime = audioContext.currentTime;
        videoGainNode.gain.cancelScheduledValues(restoreTime);
        videoGainNode.gain.linearRampToValueAtTime(1.0, restoreTime + 0.3);
      }, clipDuration * 1000 + 200);
      return;
    }

    // Fallback: Web Speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = "vi-VN";
      utterance.rate = voiceover.speechRate || 1.0;
      const bestVoice = findBestWebSpeechVoice(
        voiceover.voiceId.includes("male") ? "male" : "female"
      );
      if (bestVoice) utterance.voice = bestVoice;

      utterance.onend = () => {
        const restoreTime = audioContext.currentTime;
        videoGainNode.gain.cancelScheduledValues(restoreTime);
        videoGainNode.gain.linearRampToValueAtTime(1.0, restoreTime + 0.3);
      };
      utterance.onerror = () => {
        const restoreTime = audioContext.currentTime;
        videoGainNode.gain.linearRampToValueAtTime(1.0, restoreTime + 0.2);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Start recording
  mediaRecorder.start(100);
  video.currentTime = 0;
  await video.play();

  onProgress({
    isExporting: true,
    step: voiceover.enabled
      ? "Đang xuất video & lồng thuyết minh Vietsub..."
      : "Đang xuất video có phụ đề...",
    percent: 25,
    currentSeconds: 0,
    totalSeconds: duration,
  });

  // Render loop
  await new Promise<void>((resolve, reject) => {
    let animationFrameId: number;

    const renderLoop = () => {
      if (signal?.aborted) {
        cancelAnimationFrame(animationFrameId);
        video.pause();
        mediaRecorder.stop();
        reject(new Error("Xuất video đã bị hủy."));
        return;
      }

      const cur = video.currentTime;
      const pct = 25 + Math.min(70, Math.round((cur / duration) * 70));

      onProgress({
        isExporting: true,
        step: voiceover.enabled
          ? `Đang lồng tiếng & phụ đề (${Math.round(cur)}s / ${Math.round(duration)}s)`
          : `Đang render phụ đề (${Math.round(cur)}s / ${Math.round(duration)}s)`,
        percent: pct,
        currentSeconds: Math.round(cur),
        totalSeconds: Math.round(duration),
      });

      // Draw current video frame
      ctx.drawImage(video, 0, 0, width, height);

      // Draw active subtitle cue
      drawSubtitlesOnCanvas(ctx, width, height, cues, cur, subtitleStyle);

      // Check voiceover trigger
      if (voiceover.enabled) {
        const matchingCue = cues.find(
          (c) => cur >= c.start && cur <= c.start + 0.4 && !playedCueIds.has(c.id)
        );
        if (matchingCue) {
          triggerVoiceoverForCue(matchingCue);
        }
      }

      if (video.ended || cur >= duration - 0.1) {
        cancelAnimationFrame(animationFrameId);
        resolve();
      } else {
        animationFrameId = requestAnimationFrame(renderLoop);
      }
    };

    video.onended = () => {
      cancelAnimationFrame(animationFrameId);
      resolve();
    };

    renderLoop();
  });

  // Wait 600ms for trailing audio to finish cleanly
  await new Promise((r) => setTimeout(r, 600));

  onProgress({
    isExporting: true,
    step: "Đang đóng gói tệp video hoàn chỉnh...",
    percent: 96,
    currentSeconds: Math.round(duration),
    totalSeconds: Math.round(duration),
  });

  mediaRecorder.stop();

  await new Promise<void>((resolve) => {
    mediaRecorder.onstop = () => resolve();
  });

  const extension = supportedMime.includes("mp4") ? "mp4" : "webm";
  const finalBlob = new Blob(recordedChunks, { type: supportedMime });

  const safeTitle =
    videoTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 30) || "video";
  const voiceTag = voiceover.enabled ? "_thuyetminh" : "";
  const downloadFilename = `${safeTitle}_vietsub${voiceTag}.${extension}`;

  const downloadUrl = URL.createObjectURL(finalBlob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = downloadFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  onProgress({
    isExporting: false,
    step: "Xuất video thành công!",
    percent: 100,
    currentSeconds: Math.round(duration),
    totalSeconds: Math.round(duration),
  });

  // Cleanup
  audioContext.close();
}
