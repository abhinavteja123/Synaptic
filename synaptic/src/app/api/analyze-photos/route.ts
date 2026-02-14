/**
 * API Route: /api/analyze-photos
 * Accepts uploaded images + description, runs Groq vision analysis (Llama 4 Scout)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzePhotos } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('photos') as File[];
    const description = formData.get('description') as string | null;

    // Validation
    if (!files.length) {
      return NextResponse.json({ success: false, error: 'No photos provided' }, { status: 400 });
    }
    if (files.length > 5) {
      return NextResponse.json({ success: false, error: 'Maximum 5 photos allowed' }, { status: 400 });
    }

    // Convert files to base64 data URLs (sent to Groq vision, max 4MB per image)
    const imageDataUrls: string[] = [];
    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds 4 MB limit (Groq vision limit)` },
          { status: 400 },
        );
      }
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = file.type || 'image/jpeg';
      imageDataUrls.push(`data:${mimeType};base64,${base64}`);
    }

    const analysis = await analyzePhotos(imageDataUrls, description || undefined);
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('[analyze-photos] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
