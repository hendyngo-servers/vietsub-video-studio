import { GoogleGenAI, Type } from "@google/genai": "0.1.1"

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

    // Health check endpoint
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'online', message: 'Vietsub Video Studio AI Server is running!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY environment variable' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    try {
      // 1. POST /api/gemini/create-video (Tạo kịch bản Storyboard)
      if (url.pathname === '/api/gemini/create-video' && request.method === 'POST') {
        const body: any = await request.json();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Tạo kịch bản chia phân cảnh dựa trên: "${body.prompt}"`,
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
                    properties: { visual: { type: Type.STRING }, audio: { type: Type.STRING } },
                  },
                },
              },
            },
          },
        });
        return jsonResponse({ success: true, script: JSON.parse(response.text || '{}') }, corsHeaders);
      }

      // 2. POST /api/gemini/subtitles (Dịch & Tạo phụ đề Vietsub)
      if (url.pathname === '/api/gemini/subtitles' && request.method === 'POST') {
        const body: any = await request.json();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Tạo/Dịch danh sách phụ đề chuẩn điện ảnh cho đoạn thoại/kịch bản: "${body.text}". Định dạng trả về JSON dạng mảng chứa start, end, text.`,
          config: { responseMimeType: 'application/json' },
        });
        return jsonResponse({ success: true, subtitles: JSON.parse(response.text || '[]') }, corsHeaders);
      }

      // 3. POST /api/gemini/transcribe (Speech-to-Text tự động)
      if (url.pathname === '/api/gemini/transcribe' && request.method === 'POST') {
        const body: any = await request.json(); // Nhận audio base64 hoặc mimeType
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { inlineData: { mimeType: body.mimeType || 'audio/mp3', data: body.audioBase64 } },
            { text: 'Chuyển đổi âm thanh này thành văn bản phụ đề kèm mốc thời gian chi tiết.' },
          ],
        });
        return jsonResponse({ success: true, transcript: response.text }, corsHeaders);
      }

      // 4. POST /api/gemini/enhance-vietnamese (Sửa dấu & Chuẩn hóa văn phong điện ảnh)
      if (url.pathname === '/api/gemini/enhance-vietnamese' && request.method === 'POST') {
        const body: any = await request.json();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Khôi phục dấu tiếng Việt, sửa lỗi chính tả và tinh chỉnh văn phong ngắt câu chuẩn phim điện ảnh cho đoạn sau:\n"${body.text}"`,
        });
        return jsonResponse({ success: true, enhancedText: response.text }, corsHeaders);
      }

      // 5. POST /api/gemini/audio-mix (Tối ưu hóa âm lượng & Auto-Ducking)
      if (url.pathname === '/api/gemini/audio-mix' && request.method === 'POST') {
        const body: any = await request.json();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Phân tích ma trận 4 kênh âm thanh và đề xuất thông số cân bằng Gain/Ducking cho các track: ${JSON.stringify(body.tracks)}`,
          config: { responseMimeType: 'application/json' },
        });
        return jsonResponse({ success: true, config: JSON.parse(response.text || '{}') }, corsHeaders);
      }

      // 6. POST /api/gemini/tts (Đọc văn bản qua Gemini Voice Models)
      if (url.pathname === '/api/gemini/tts' && request.method === 'POST') {
        const body: any = await request.json();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Đọc văn bản sau bằng giọng đọc tự nhiên: "${body.text}"`,
        });
        return jsonResponse({ success: true, audioData: response.text }, corsHeaders);
      }

      // 7. POST /api/cloudflare/tts (Chạy MeloTTS qua Cloudflare Workers AI)
      if (url.pathname === '/api/cloudflare/tts' && request.method === 'POST') {
        const body: any = await request.json();
        if (!env.AI) {
          return jsonResponse({ error: 'Cloudflare Workers AI binding is not configured' }, corsHeaders, 500);
        }
        const audioStream = await env.AI.run('@cf/melotts-v1', { prompt: body.text });
        return new Response(audioStream, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/wav' },
        });
      }

      return jsonResponse({ error: 'Endpoint Not Found' }, corsHeaders, 404);
    } catch (error: any) {
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  },
};

function jsonResponse(data: any, headers: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
