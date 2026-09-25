import { VideoClip, SubtitleSegment } from '../types/editor';

export class VideoRenderer {
  static renderFrame(
    ctx: CanvasRenderingContext2D,
    currentTime: number,
    videoClips: VideoClip[],
    subtitles: SubtitleSegment[],
    width: number,
    height: number
  ) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Find active clip
    const activeClip = videoClips.find(
      (clip) => currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration
    );

    if (activeClip) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Playing: ${activeClip.name}`, width / 2, height / 2);
    }

    // Render Subtitles
    const activeSub = subtitles.find((s) => currentTime >= s.start && currentTime <= s.end);
    if (activeSub) {
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      ctx.fillText(activeSub.text, width / 2 + 2, height - 58);
      ctx.fillStyle = '#facc15';
      ctx.fillText(activeSub.text, width / 2, height - 60);
    }
  }
}
