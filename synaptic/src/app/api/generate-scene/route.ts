/**
 * API Route: /api/generate-scene
 * Takes photo analysis + description → returns full SceneData with panorama
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateScenePlan } from '@/lib/ai/gemini';
import { generatePanorama } from '@/lib/ai/pollinations';
import type { SceneData, SceneObject } from '@/types/room';
import type { GenerateSceneRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateSceneRequest;
    const { analysis, description } = body;

    if (!analysis || !description) {
      return NextResponse.json(
        { success: false, error: 'analysis and description are required' },
        { status: 400 },
      );
    }

    // 1. Generate scene plan from Gemini
    const scenePlan = await generateScenePlan(analysis, description);

    // 2. Generate panorama URL from Pollinations
    const panoramaUrl = generatePanorama(analysis, description);

    // 3. Assemble SceneData
    const objects: SceneObject[] = scenePlan.objects.map((obj, idx) => ({
      id: `obj-${idx}`,
      type: obj.type || 'primitive',
      name: obj.name,
      position: obj.position,
      rotation: obj.rotation || [0, 0, 0],
      scale: obj.scale || [1, 1, 1],
      shape: (obj.shape as SceneObject['shape']) || 'box',
      color: obj.color || '#cccccc',
      memoryText: obj.memoryText,
      interactive: obj.interactive ?? false,
      castShadow: true,
      receiveShadow: true,
    }));

    // Ensure there's always a floor
    const hasFloor = objects.some(
      (o) => o.name?.toLowerCase().includes('floor') || (o.position[1] <= 0 && o.scale[1] <= 0.2),
    );
    if (!hasFloor) {
      objects.unshift({
        id: 'floor-auto',
        type: 'primitive',
        name: 'Floor',
        position: [0, -0.05, 0],
        rotation: [0, 0, 0],
        scale: [20, 0.1, 20],
        shape: 'box',
        color: analysis.dominantColors?.[0] || '#4a4a4a',
        interactive: false,
        castShadow: false,
        receiveShadow: true,
      });
    }

    const sceneData: SceneData = {
      environmentType: analysis.environmentType,
      panoramaUrl,
      objects,
      lighting: {
        ambientColor: scenePlan.lighting?.ambientColor || '#ffffff',
        ambientIntensity: scenePlan.lighting?.ambientIntensity ?? 0.6,
        directionalColor: scenePlan.lighting?.directionalColor || '#ffffff',
        directionalIntensity: scenePlan.lighting?.directionalIntensity ?? 1.0,
        directionalPosition: scenePlan.lighting?.directionalPosition || [5, 10, 5],
        shadowsEnabled: true,
      },
      audio: {
        backgroundMusic: scenePlan.audio?.backgroundMusic || 'calm',
        ambientSounds: scenePlan.audio?.ambientSounds || ['silence'],
        volume: 0.4,
      },
      dominantColors: analysis.dominantColors,
    };

    return NextResponse.json({ success: true, sceneData, panoramaUrl });
  } catch (error) {
    console.error('[generate-scene] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Scene generation failed' },
      { status: 500 },
    );
  }
}
