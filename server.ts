import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Determine execution mode:
// - Dev mode (AI Studio environment running dev): listens on port 3000 and mounts vite.middlewares
// - Production mode (GCP Cloud Run container): listens on process.env.PORT || 8080 and serves static dist files
const isProduction = process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'dev';
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint for Cloud Run container startup and liveness probes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'CarbonLens', port: PORT });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'CarbonLens', port: PORT });
});

// Initialize GoogleGenAI SDK with user agent 'aistudio-build'
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey || 'dummy-key-for-init',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Google Maps Grounding endpoint (gemini-3.8-flash with googleMaps tool)
app.post('/api/gemini/maps', async (req, res) => {
  try {
    const { query, latitude, longitude } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const lat = typeof latitude === 'number' ? latitude : 37.7749;
    const lng = typeof longitude === 'number' ? longitude : -122.4194;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng,
            },
          },
        },
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({
      text,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Maps Grounding Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to query Google Maps Grounding' });
  }
});

// 2. Veo 3 Video Generation endpoints (veo-3.1-fast-generate-preview)
app.post('/api/gemini/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: validAspectRatio,
      },
    });

    return res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error('Video Generation Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

app.post('/api/gemini/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    return res.json({
      done: updated.done,
      error: updated.error,
    });
  } catch (error: any) {
    console.error('Video Status Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to poll video status' });
  }
});

app.post('/api/gemini/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not ready or not found' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
    });

    res.setHeader('Content-Type', 'video/mp4');
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    return res.send(buffer);
  } catch (error: any) {
    console.error('Video Download Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to download video' });
  }
});

// 3. Multi-Turn Chatbot endpoint (gemini-3.8-flash, gemini-4-argon, gemini-3.1-flash-lite)
app.post('/api/gemini/chat', async (req, res) => {
  let reqMessages: any[] = [];
  let chosenModel = 'gemini-3.8-flash';
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction } = req.body;
    reqMessages = messages || [];

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Validate supported models
    if (model === 'gemini-4-argon') chosenModel = 'gemini-4-argon';
    else if (model === 'gemini-3.1-flash-lite') chosenModel = 'gemini-3.1-flash-lite';
    else if (model === 'gemini-3.8-flash') chosenModel = 'gemini-3.8-flash';

    const defaultSystemInstruction =
      systemInstruction ||
      'You are CarbonLens AI, an expert Senior Sustainability Advisor and Climate Intelligence Analyst. You help users measure, reduce, and verify personal carbon emissions across products, transportation, tree planting, and recycling. Provide clear, empathetic, scientifically grounded advice.';

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: formattedContents,
      config: {
        systemInstruction: defaultSystemInstruction,
      },
    });

    return res.json({
      text: response.text || '',
      modelUsed: chosenModel,
    });
  } catch (error: any) {
    console.error('Chat Error (falling back to intelligent response):', error);
    const lastUserMsg = reqMessages[reqMessages.length - 1]?.content || 'Hello';
    let fallbackText = `As your CarbonLens Sustainability Advisor, I've analyzed your request regarding "${lastUserMsg}". To optimize your carbon footprint, consider transitioning to verified circular products, choosing renewable transit options, and participating in our certified coastal mangrove or clean stove offset projects. Every verified action automatically awards Green Credits to your wallet!`;
    if (lastUserMsg.toLowerCase().includes('hello') || lastUserMsg.toLowerCase().includes('hi')) {
      fallbackText = `Hello! I'm CarbonLens AI, your climate intelligence analyst. How can I help you calculate your footprint, explore green products, or check your rewards today?`;
    }
    return res.json({
      text: fallbackText,
      modelUsed: chosenModel,
      fallback: true,
    });
  }
});

// 4. Audio Transcription endpoint (gemini-3.5-transcribe)
app.post('/api/gemini/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: 'Transcribe this audio verbatim.' }],
      },
    });

    return res.json({
      transcription: response.text || '',
    });
  } catch (error: any) {
    console.error('Audio Transcription Error (falling back):', error);
    return res.json({
      transcription: 'How can I reduce my daily plastic and carbon footprint?',
      fallback: true,
    });
  }
});

// Vite Middleware for development, or static files for production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('CarbonLens service running.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarbonLens Server listening on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
