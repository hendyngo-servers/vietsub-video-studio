import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cấu hình CORS đơn giản cho dev
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
  return new GoogleGenAI({ apiKey });
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "Backend OK", hasApiKey: !!process.env.GEMINI_API_KEY });
});

app.post("/api/vietsub/generate", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/wav" } = req.body;
    if (!audioBase64) return res.status(400).json({ error: "Yêu cầu audioBase64" });

    const ai = getGeminiClient();
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: "Lắng nghe âm thanh, chia đoạn phụ đề (start/end) và dịch sang Tiếng Việt." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  textVi: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, result: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});
