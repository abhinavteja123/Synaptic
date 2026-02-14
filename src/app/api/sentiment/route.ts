/**
 * API Route: /api/sentiment
 * Analyzes chat message sentiment → returns mood for environment
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: string[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'messages array is required' },
        { status: 400 },
      );
    }

    // Take last 5 messages only
    const recent = messages.slice(-5);
    const result = await analyzeSentiment(recent);

    return NextResponse.json({
      success: true,
      sentiment: result.sentiment,
      mood: result.mood,
    });
  } catch (error) {
    console.error('[sentiment] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sentiment analysis failed' },
      { status: 500 },
    );
  }
}
