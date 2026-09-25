/**
 * Cloudflare Workers ES Module Entry Point
 * Fixes: "Unexpected external import of assert, child_process... Your worker has no default export"
 * This worker conforms strictly to Cloudflare Workers ES Module standard: export default { fetch }
 */
import { GoogleGenAI } from "@google/genai";

export interface Env {
  GEMINI_API_KEY?: string;
  AI?: any;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

function getGeminiClient(env: Env): GoogleGenAI | null {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "vietsub-cloudflare-worker",
      },
    },
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-cf-account-id, x-cf-api-token",
};

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Health check
    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          platform: "cloudflare-worker",
          hasApiKey: !!env.GEMINI_API_KEY,
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Cloudflare Workers AI Status Check
    if (url.pathname === "/api/cloudflare/status") {
      return new Response(
        JSON.stringify({
          status: "ok",
          isConfigured: !!env.AI || !!env.GEMINI_API_KEY,
          mode: env.AI ? "workers_ai" : "gemini_proxy",
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // AI Subtitle Generation Proxy
    if (url.pathname === "/api/generate-subtitles" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const ai = getGeminiClient(env);
        if (!ai) {
          return new Response(
            JSON.stringify({ error: "GEMINI_API_KEY chưa được thiết lập trên Cloudflare Workers." }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        const prompt = `Bạn là chuyên gia phiên dịch và tạo phụ đề video chuyên nghiệp.
Hãy trích xuất lời thoại thành các câu phụ đề ngắn gọn, dễ đọc, khớp nhịp nói.
${body.prompt || ""}
Trả về mảng JSON các câu: [{ "id": 1, "start": 0.0, "end": 2.5, "textVi": "...", "textOriginal": "..." }]`;

        const contents: any[] = [{ text: prompt }];
        if (body.audioBase64 && body.mimeType) {
          contents.push({
            inlineData: {
              data: body.audioBase64,
              mimeType: body.mimeType,
            },
          });
        }

        const res = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            responseMimeType: "application/json",
          },
        });

        return new Response(res.text || "[]", {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Lỗi xử lý tạo phụ đề trên Cloudflare Worker" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // AI Refine Subtitles Proxy
    if (url.pathname === "/api/refine-subtitles" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const ai = getGeminiClient(env);
        if (!ai) {
          return new Response(
            JSON.stringify({ error: "GEMINI_API_KEY chưa được thiết lập." }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        const prompt = `Hãy tối ưu phụ đề tiếng Việt sau cho tự nhiên, mượt mà và chuẩn văn phong:
${JSON.stringify(body.cues || [])}
Trả về mảng JSON kết quả đã sửa.`;

        const res = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        return new Response(res.text || "[]", {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Lỗi tối ưu phụ đề" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: Serve static assets built into ./dist via Cloudflare Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
