import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const videoQueue = new Queue('VideoProcessing', { connection });

const worker = new Worker('VideoProcessing', async job => {
    console.log(`Processing job ${job.id} for file ${job.data.fileName}`);
    // Tích hợp FFmpeg hoặc AI vào đây
}, { connection });\n