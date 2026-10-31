import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '5mb' }));

// Rate limiter for /api/coach: 10 requests per IP per 10 minutes
const coachLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI Coach requests from this IP. Please wait 10 minutes before trying again.',
  },
});

// Initialize GoogleGenAI server-side with telemetry header
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// AI Coach endpoint protected with rate limiting and 500 char cap
app.post('/api/coach', coachLimiter, async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be text' });
    }

    if (message.length > 500) {
      return res.status(400).json({
        error: `Message exceeds the 500 character limit (${message.length}/500 chars). Please shorten your prompt.`,
      });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please check Settings > Secrets.',
      });
    }

    const systemInstruction = `
You are CodeWave Daily AI Coach, an intelligent and empathetic schedule & routine optimization engine for students and developers.
The user wants you to manage or adjust their schedule blocks, categories, tasks, or day routines.
Current reference date is ${context?.date || 'today'}.
The user's current schedule context:
- Schedule Blocks for today (${context?.date}): ${JSON.stringify(context?.blocks || [])}
- Available Categories: ${JSON.stringify(context?.categories || [])}
- Preferences: ${JSON.stringify(context?.preferences || {})}
- Inbox Tasks: ${JSON.stringify(context?.inbox || [])}

RULES:
1. ALWAYS respond in valid JSON matching the exact schema below.
2. You can propose adding new blocks, updating existing block times/details, deleting blocks, moving blocks, adding checklist tasks to blocks, auto-fixing overlaps, or creating new categories.
3. Be respectful of their wakeUpTime (${context?.preferences?.wakeUpTime || '07:00'}) and targetBedtime (${context?.preferences?.targetBedtime || '23:00'}).
4. Times must always be 24-hour "HH:mm" format (e.g. "08:00", "14:30").
5. When the user asks to add or move something, calculate realistic start and end times that do not needlessly collide or offer to shift blocks appropriately.
6. Provide a concise, clear rationale explanation so the user knows WHY this plan was shaped.

Output JSON Structure:
{
  "thought": "Brief reasoning about what the user requested and how it fits their day",
  "summary": "Clear, friendly summary of the proposed changes (1-2 sentences)",
  "actions": [
    {
      "type": "ADD_BLOCK" | "UPDATE_BLOCK" | "DELETE_BLOCK" | "MOVE_BLOCK" | "ADD_TASK" | "CREATE_CATEGORY" | "AUTO_FIX_OVERLAPS",
      "targetBlockId": "string (required for UPDATE_BLOCK, DELETE_BLOCK, MOVE_BLOCK, ADD_TASK if targeting existing block)",
      "blockData": {
        "title": "string",
        "categoryId": "string (use an existing categoryId or refer to a newly created category name)",
        "startTime": "HH:mm",
        "endTime": "HH:mm",
        "note": "string (optional)",
        "icon": "emoji string like 📚, 💻, 🏀, 🎮, 🥪, 🛌, 🏛️",
        "priority": "high" | "medium" | "low",
        "repeatRule": "today" | "daily" | "weekdays" | "weekends",
        "tasks": ["checklist item 1", "checklist item 2"]
      },
      "categoryData": {
        "name": "string",
        "color": "string (hex or tailwind class e.g. #38bdf8)",
        "icon": "emoji"
      },
      "taskData": {
        "title": "string",
        "blockId": "string"
      },
      "explanation": "Human-readable description of what this single action does"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error('CodeWave Daily Coach error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process AI schedule command',
    });
  }
});

// Dev vs Prod Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeWave Daily server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
