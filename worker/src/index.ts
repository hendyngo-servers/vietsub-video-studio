import { GoogleGenAI, Type } from '@google/genai';

export interface Env { GEMINI_API_KEY: string; }

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // Route kiểm tra trạng thái khi truy cập trang chủ trên trình duyệt
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'online', message: 'Vietsub Video Studio API is ready' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500, headers: corsHeaders });

    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    try {
      if (url.pathname === '/api/gemini/create-video' && request.method === 'POST') {
        const body: any = await request.json();

        if (!body?.prompt) {
          return new Response(JSON.stringify({ error: 'Missing prompt in request body' }), { status: 400, headers: corsHeaders });
        }

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
                    properties: { visual: { type: Type.STRING }, audio: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        });
        return new Response(JSON.stringify({ success: true, script: JSON.parse(response.text || '{}') }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
  },
};
