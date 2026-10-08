import { FFmpeg } from '@ffmpeg/ffmpeg';
// Khởi tạo FFmpeg Wasm Core chạy ngầm trên trình duyệt
export const initFFmpeg = async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    return ffmpeg;
};
