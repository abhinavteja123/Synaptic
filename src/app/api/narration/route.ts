/**
 * Narration API route – Generate first-person narration for a memory room
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMemoryNarration } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, photoAnalysis, mood } = body;

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Missing description' },
        { status: 400 },
      );
    }

    const narration = await generateMemoryNarration(
      { title: title || 'Untitled Memory', description },
      photoAnalysis || mood || undefined,
    );

    return NextResponse.json({ success: true, narration });
  } catch (err) {
    console.error('Narration generation error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate narration' },
      { status: 500 },
    );
  }
}
