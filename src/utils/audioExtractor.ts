/**
 * Browser-side Audio Extraction utility
 * Takes a video File or Blob, extracts its audio track, downsamples to 16kHz mono WAV,
 * and outputs base64 for fast and lightweight transmission to Gemini API.
 */

export async function extractAudioFromVideo(
  videoBlobOrFile: Blob | File,
  onProgress?: (percent: number, message: string) => void
): Promise<{ base64: string; mimeType: string; duration: number }> {
  onProgress?.(10, "Đang đọc tệp video...");
  const arrayBuffer = await videoBlobOrFile.arrayBuffer();

  onProgress?.(30, "Đang giải mã âm thanh từ video...");
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000,
  });

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch (err) {
    console.warn("AudioContext decodeAudioData failed, fallback to direct base64 transfer:", err);
    // Fallback: if audio extraction fails, return video slice base64
    const base64 = await blobToBase64(videoBlobOrFile);
    return {
      base64,
      mimeType: videoBlobOrFile.type || "video/mp4",
      duration: 0,
    };
  }

  onProgress?.(60, "Đang tối ưu hóa âm thanh 16kHz mono...");
  const duration = audioBuffer.duration;
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = 16000;
  
  // Downmix to Mono 16kHz
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  await audioCtx.close();

  onProgress?.(80, "Đang mã hóa định dạng WAV...");
  const wavBlob = audioBufferToWavBlob(renderedBuffer);

  onProgress?.(95, "Hoàn tất trích xuất âm thanh!");
  const base64 = await blobToBase64(wavBlob);

  return {
    base64,
    mimeType: "audio/wav",
    duration,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < data.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
