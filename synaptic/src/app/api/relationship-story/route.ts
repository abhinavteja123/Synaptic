import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Relationship Story Generator
 * Takes room title, description, photo captions, and theme to craft
 * a beautiful 3-paragraph emotional story about the relationship.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const { title, description, captions, theme } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Missing title or description' }, { status: 400 });
    }

    const captionList = (captions || []).filter(Boolean).join('; ');

    const prompt = `You are a poetic storyteller who writes beautiful, emotional stories about human connection.

Given a memory room titled "${title}" with the theme "${theme || 'valentine'}", write a short emotional story (exactly 3 paragraphs) about the relationship captured in these memories.

Description: "${description}"
${captionList ? `Photo captions: ${captionList}` : ''}

Guidelines:
- Write in second person ("you") to make it personal and immersive
- First paragraph: Set the scene, evoke the atmosphere of the memory
- Second paragraph: Dive into the emotions, the unspoken feelings, the meaningful moments
- Third paragraph: Reflect on how this bond has shaped who you are, end with warmth and hope
- Use sensory details — sounds, textures, light, warmth
- Keep it heartfelt but not overly dramatic
- Total length: ~150-200 words
- Do NOT use any markdown formatting, headers, or bullet points. Just plain paragraphs.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq story error:', errText);
      return NextResponse.json({ success: false, error: 'AI generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const story = data.choices?.[0]?.message?.content?.trim();

    if (!story) {
      return NextResponse.json({ success: false, error: 'No story generated' }, { status: 500 });
    }

    return NextResponse.json({ success: true, story });
  } catch (err) {
    console.error('Relationship story error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
