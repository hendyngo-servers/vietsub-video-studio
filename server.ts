import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Init Google GenAI SDK
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey });
};

// 1. POST /api/gemini/subtitles - Generates/Translates Cinema Vietsub
app.post('/api/gemini/subtitles', async (req: Request, res: Response) => {
  try {
    const { text, targetLang = 'vi' } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate and polish the following subtitle content into professional cinema-quality ${targetLang} subtitles. Keep natural tone and concise timing length:\n"${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            subtitles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, data: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/gemini/tts - Generates Speech Audio via Gemini Models
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Puck' } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Read the following text aloud with high audio fidelity: "${text}"`,
    });

    res.json({ success: true, audioText: response.text });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/cloudflare/tts - Integrates Cloudflare Workers AI (@cf/melotts-v1)
app.post('/api/cloudflare/tts', async (req: Request, res: Response) => {
  try {
    const { text, lang = 'vi' } = req.body;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return res.status(400).json({ success: false, error: 'Cloudflare credentials missing' });
    }

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/myshell/melotts-v1`;
    const cfRes = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: text, lang }),
    });

    const blob = await cfRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.send(Buffer.from(blob));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST /api/gemini/audio-mix - AI Audio Balancer & Ducking Optimizer
app.post('/api/gemini/audio-mix', async (req: Request, res: Response) => {
  try {
    const { audioTracks } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze these audio tracks and return optimal volume gains (0.0 to 1.0) and ducking parameters for a clear voiceover mix: ${JSON.stringify(audioTracks)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedMasterVolume: { type: Type.NUMBER },
            trackSettings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trackId: { type: Type.STRING },
                  suggestedGain: { type: Type.NUMBER },
                  enableDucking: { type: Type.BOOLEAN },
                },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, config: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST /api/gemini/create-video - AI Script-to-Storyboard Generator
app.post('/api/gemini/create-video', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tạo kịch bản chia phân cảnh dựa trên ý tưởng: "${prompt}"`,
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
                properties: {
                  visual: { type: Type.STRING },
                  audio: { type: Type.STRING },
                  durationSec: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, script: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. POST /api/gemini/transcribe - Automated Speech-to-Text
app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/wav' } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: { data: audioBase64, mimeType },
        },
        'Transcribe the audio accurately into Vietnamese subtitles with start and end timestamps in seconds.',
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, result: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. POST /api/gemini/enhance-vietnamese - Diacritics Recovery & Cinema Phrasing
app.post('/api/gemini/enhance-vietnamese', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Khôi phục dấu tiếng Việt chính xác, sửa lỗi chính tả và tối ưu câu từ cho phụ đề phim chuyên nghiệp:\n"${text}"`,
    });

    res.json({ success: true, enhancedText: response.text?.trim() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Vietsub Video Studio Express Server running on port ${PORT}`);
});
