import { GoogleGenAI } from '@google/genai';

export interface Env {
  GEMINI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/generate') {
      try {
        const body = await request.json() as { prompt?: string };
        const prompt = body.prompt || 'Hello';

        // Khởi tạo Google GenAI SDK chuẩn v0.1.1+
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        return new Response(JSON.stringify({ success: true, result: response.text }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Vietsub Video Studio Worker is running!', { status: 200 });
  },
};
