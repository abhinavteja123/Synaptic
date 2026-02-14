/**
 * API Route: /api/caption-photo
 * Takes a single image (base64) and returns a short, poetic AI-generated caption.
 * Uses Groq Vision (Llama 4 Scout) for image understanding.
 */

import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Look at this photo and write a short, emotional, poetic caption (max 12 words) that captures the moment. 
Do NOT describe what you see literally. Instead, capture the FEELING — the warmth, the joy, the love, the nostalgia.
Examples of good captions:
- "Where time stood still and hearts spoke louder"
- "Golden hour, golden memories"
- "Two souls dancing through life together"
- "The laughter that echoed through the years"
- "Home is wherever you are"

Return ONLY the caption text, nothing else. No quotes, no explanation.`,
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
        temperature: 0.8,
        max_completion_tokens: 50,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error('[caption-photo] Groq error:', errText);
      return NextResponse.json({ success: false, error: 'Caption generation failed' }, { status: 500 });
    }

    const data = await res.json();
    let caption = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean up: remove surrounding quotes if present
    caption = caption.replace(/^["'""]|["'""]$/g, '').trim();

    return NextResponse.json({ success: true, caption });
  } catch (error) {
    console.error('[caption-photo] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Caption failed' },
      { status: 500 },
    );
  }
}
