/**
 * Groq AI Client (Free Tier)
 * Photo analysis (vision), scene generation, narration, and sentiment
 * Uses Llama 4 Scout for vision, Llama 3.3 70B for text – via Groq's free API
 *
 * Get a free API key at: https://console.groq.com/keys
 */

import type { PhotoAnalysis, ScenePlan } from '@/types/api';
import type { MemoryRoom } from '@/types/room';
import type { Mood } from '@/types/scene';

// ============================================
//  Configuration
// ============================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Vision model – Llama 4 Scout (supports images + JSON mode) */
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

/** Text model – fast and capable */
const TEXT_MODEL = 'llama-3.3-70b-versatile';

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys');
  return key;
}

// ============================================
//  Core Groq API helper (OpenAI-compatible)
// ============================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface GroqRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_completion_tokens?: number;
  response_format?: { type: 'json_object' };
}

interface GroqResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

/** Send a chat completion request to Groq */
async function groqChat(req: GroqRequest): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error');
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as GroqResponse;
  return data.choices[0]?.message?.content || '';
}

/** Helper: retry with exponential back-off */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/** Parse a JSON code-fence from LLM text response */
function parseJsonResponse<T>(text: string): T {
  // Try raw JSON first
  try {
    return JSON.parse(text);
  } catch {
    // Extract from markdown code fence
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim());

    // Try to find first { ... } block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);

    throw new Error('Could not parse JSON from AI response');
  }
}

// ============================================
//  1. Analyze Photos (Vision – Llama 4 Scout)
// ============================================

export async function analyzePhotos(
  imageDataUrls: string[],
  description?: string,
): Promise<PhotoAnalysis> {
  // Build image content parts for the multimodal message
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `You are an expert photo analyst for a 3D memory room generator.
Analyze these ${imageDataUrls.length} photo(s)${description ? ` with the context: "${description}"` : ''} and return a JSON object with EXACTLY these fields:

{
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "detectedObjects": ["object1", "object2", "object3"],
  "environmentType": "cafe" | "kitchen" | "bedroom" | "park" | "living-room" | "workshop" | "custom",
  "mood": "joyful" | "content" | "neutral" | "melancholic" | "sad",
  "timeOfDay": "morning" | "afternoon" | "evening" | "night",
  "notableDetails": ["detail1", "detail2"],
  "sceneDescription": "A brief description of the overall scene/memory"
}

Be specific and accurate. Choose the environment type that best fits.
Return ONLY valid JSON.`,
    },
  ];

  // Add images (Groq accepts base64 data URLs directly, max 4MB each)
  for (const dataUrl of imageDataUrls.slice(0, 5)) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: dataUrl },
    });
  }

  return withRetry(async () => {
    const text = await groqChat({
      model: VISION_MODEL,
      messages: [{ role: 'user', content: contentParts }],
      temperature: 0.3,
      max_completion_tokens: 600,
      response_format: { type: 'json_object' },
    });
    return parseJsonResponse<PhotoAnalysis>(text);
  });
}

// ============================================
//  2. Generate 3D Scene Plan
// ============================================

export async function generateScenePlan(
  analysis: PhotoAnalysis,
  description: string,
): Promise<ScenePlan> {
  const prompt = `You are a 3D scene architect for an immersive memory room app. Based on photo analysis and user description, create a detailed 3D room that recreates the memory environment.

Photo Analysis:
${JSON.stringify(analysis, null, 2)}

User Description: "${description}"

Generate a JSON object with this EXACT structure:
{
  "objects": [
    {
      "name": "descriptive name",
      "type": "primitive",
      "shape": "box" | "sphere" | "cylinder" | "plane" | "cone",
      "position": [x, y, z],
      "rotation": [0, 0, 0],
      "scale": [w, h, d],
      "color": "#hexcolor",
      "memoryText": "A sentence about this object's role in the memory",
      "interactive": true
    }
  ],
  "lighting": {
    "ambientColor": "#hexcolor",
    "ambientIntensity": 0.5,
    "directionalColor": "#hexcolor",
    "directionalIntensity": 0.8,
    "directionalPosition": [5, 10, 5]
  },
  "audio": {
    "backgroundMusic": "calm" | "upbeat" | "nostalgic" | "peaceful" | "melancholic",
    "ambientSounds": ["rain", "birds", "cafe", "wind", "silence"]
  }
}

CRITICAL RULES FOR CREATING A BEAUTIFUL SCENE:
1. FLOOR: Must include a large floor plane: shape "box", position [0, -0.05, 0], scale [20, 0.1, 20], with a realistic color
2. WALLS (for indoor scenes): Add 3 walls (back + 2 sides) as thin boxes. Example back wall: position [0, 2, -8], scale [18, 4.5, 0.2]
3. FURNITURE & OBJECTS: Create 8-15 recognizable objects that match the environment:
   - For a BEACH: sand mound (flat box), water (blue plane), umbrella (cylinder+cone), towel (flat box), palm tree (cylinder trunk + sphere canopy), surfboard (scaled box), seashells (small spheres)
   - For a CAFE: tables (cylinder base + flat box top), chairs (box seat + box back), counter (long box), coffee cups (small cylinders), hanging lights (small spheres), menu board (thin box)
   - For a KITCHEN: counter (long box), stove (box), fridge (tall box), cabinets (boxes on wall), table (box + cylinder legs), sink (box with indent)
   - For a PARK: trees (cylinder trunk + sphere canopy), bench (box seat + box back), path (flat box), flowers (colored spheres), pond (blue flat box), fence (thin boxes)
   - For a BEDROOM: bed frame (box), mattress (flat box), pillows (small boxes), nightstand (small box), lamp (cylinder + sphere), wardrobe (tall box), rug (flat box)
   - For a LIVING ROOM: sofa (L-shaped boxes), coffee table (flat box), TV (thin tall box), bookshelf (box with lines), rug (flat box), plant (cylinder + sphere)
4. POSITIONING: Floor at y=0. Objects sit ON the floor (y = half their height). Keep x: -7 to 7, z: -7 to 7
5. COLORS: Use the dominant colors from analysis. Make colors realistic and varied — not all the same
6. SCALE: Make objects proportional. A table is ~[1.5, 0.8, 1], a chair is ~[0.5, 0.9, 0.5], a tree trunk is ~[0.3, 2, 0.3]
7. INTERACTIVE: At least 4 objects should be interactive with meaningful memoryText that connects to the memory description
8. ARRANGEMENT: Group related objects together. Don't stack or overlap objects. Leave walking space in the center
9. DECORATIVE: Add at least 2-3 small decorative details (flowers, cups, books, candles, etc.)
10. Leave the FRONT area (z > 2) open — the camera starts there. Main objects at center and back.

Return ONLY valid JSON.`;

  return withRetry(async () => {
    const text = await groqChat({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_completion_tokens: 3000,
      response_format: { type: 'json_object' },
    });
    return parseJsonResponse<ScenePlan>(text);
  });
}

// ============================================
//  3. Generate Memory Narration (Legacy Mode)
// ============================================

export async function generateMemoryNarration(
  roomData: Pick<MemoryRoom, 'title' | 'description' | 'legacyPersonName' | 'legacyRelationship'>,
  additionalContext?: string,
): Promise<string> {
  const prompt = `Write a heartfelt, nostalgic narration about this memory room.
Title: "${roomData.title}"
Description: "${roomData.description}"
${roomData.legacyPersonName ? `Person: ${roomData.legacyPersonName} (${roomData.legacyRelationship || 'loved one'})` : ''}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Write in first person ("I remember…"), 300-500 words, as if sharing a cherished memory with grandchildren.
Include sensory details (sights, sounds, smells).
Structure: Opening hook → vivid body → emotional closing.
Be specific and personal, avoid clichés.
Return ONLY the narration text, no titles or formatting.`;

  return withRetry(async () => {
    const text = await groqChat({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_completion_tokens: 800,
    });
    return text.trim();
  });
}

// ============================================
//  4. Analyze Chat Sentiment
// ============================================

export async function analyzeSentiment(messages: string[]): Promise<{ sentiment: number; mood: Mood }> {
  if (!messages.length) return { sentiment: 0, mood: 'neutral' };

  const prompt = `Analyze the emotional sentiment of these chat messages:

${messages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}

Return a JSON object with:
{
  "sentiment": <number from -1 (very sad) to 1 (very joyful)>,
  "mood": "joyful" | "content" | "neutral" | "melancholic" | "sad"
}

Rules:
- Score > 0.5: joyful
- Score 0.1 to 0.5: content
- Score -0.1 to 0.1: neutral
- Score -0.5 to -0.1: melancholic
- Score < -0.5: sad

Return ONLY valid JSON.`;

  return withRetry(async () => {
    const text = await groqChat({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_completion_tokens: 100,
      response_format: { type: 'json_object' },
    });
    return parseJsonResponse<{ sentiment: number; mood: Mood }>(text);
  });
}
