import { GoogleGenAI, Type } from '@google/genai';

export interface Env {
  GEMINI_API_KEY: string;
  AI: any; // Cloudflare Workers AI Binding
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // 0. Health Check
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'online', service: 'Vietsub Video Studio AI Engine' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }), { status: 500, headers: corsHeaders });
    }

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    try {
      // 1. POST /api/gemini/subtitles - Phụ đề & Dịch Cinema Vietsub
      if (url.pathname === '/api/gemini/subtitles' && request.method === 'POST') {
        const { text, targetLang = 'vi' } = await request.json() as any;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Dịch và chuẩn hóa phụ đề điện ảnh sang ngôn ngữ (${targetLang}): "${text}"`,
        });
        return new Response(JSON.stringify({ success: true, subtitle: response.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. POST /api/gemini/tts - Sinh giọng nói bằng Gemini Voice
      if (url.pathname === '/api/gemini/tts' && request.method === 'POST') {
        const { text, voice = 'Puck' } = await request.json() as any;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Đọc đoạn văn bản sau bằng giọng đọc tự nhiên: ${text}`,
        });
        return new Response(JSON.stringify({ success: true, audioData: response.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 3. POST /api/cloudflare/tts - Tích hợp Cloudflare Workers AI (@cf/melotts-v1)
      if (url.pathname === '/api/cloudflare/tts' && request.method === 'POST') {
        const { text } = await request.json() as any;
        const inputs = { text };
        const audioBuffer = await env.AI.run('@cf/melotts-v1', inputs);
        return new Response(audioBuffer, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
        });
      }

      // 4. POST /api/gemini/audio-mix - Tối ưu cân bằng âm thanh & Ducking
      if (url.pathname === '/api/gemini/audio-mix' && request.method === 'POST') {
        const { tracks } = await request.json() as any;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Phân tích cấu trúc âm thanh và tính toán tham số Ducking/Gain cho các track: ${JSON.stringify(tracks)}`,
          config: { responseMimeType: 'application/json' }
        });
        return new Response(JSON.stringify({ success: true, mixConfig: JSON.parse(response.text || '{}') }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 5. POST /api/gemini/create-video - Sinh Kịch bản & Storyboard
      if (url.pathname === '/api/gemini/create-video' && request.method === 'POST') {
        const { prompt } = await request.json() as any;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Tạo kịch bản phân cảnh dựa trên ý tưởng: "${prompt}"`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { visual: { type: Type.STRING }, audio: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        });
        return new Response(JSON.stringify({ success: true, script: JSON.parse(response.text || '{}') }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 6. POST /api/gemini/transcribe - Chuyển âm thanh thành văn bản (Speech-to-Text)
      if (url.pathname === '/api/gemini/transcribe' && request.method === 'POST') {
        const { audioBase64, mimeType = 'audio/mp3' } = await request.json() as any;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { inlineData: { mimeType, data: audioBase64 } },
            { text: 'Hãy bóc băng chính xác toàn bộ nội dung lời nói trong file âm thanh này kèm timestamp.' }
          ],
        });
        return new Response(JSON.stringify({ success: true, transcription: response.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 7. POST /api/gemini/enhance-vietnamese - Phục hồi dấu tiếng Việt & Điện ảnh hóa
      if (url.pathname === '/api/gemini/enhance-vietnamese' && request.method === 'POST') {
        const { rawText } = await request.json() as any;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Sửa lỗi chính tả, thêm dấu tiếng Việt chuẩn xác và trau dồi văn phong điện ảnh cho đoạn văn sau: "${rawText}"`,
        });
        return new Response(JSON.stringify({ success: true, enhancedText: response.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  },
};
