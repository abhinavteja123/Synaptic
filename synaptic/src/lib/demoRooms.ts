/**
 * demoRooms.ts – Pre-built demo rooms for showcasing
 */

import type { MemoryRoom } from '@/types/room';
import { createDefaultScene } from '@/lib/utils/sceneGeneration';

function makeDemo(
  id: string,
  title: string,
  description: string,
  envType: 'cafe' | 'kitchen' | 'bedroom' | 'park' | 'living-room' | 'workshop',
  tags: string[],
  previewPrompt: string,
  daysAgo: number,
  visits: number,
  location?: string,
): MemoryRoom {
  const scene = createDefaultScene(envType);
  scene.panoramaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(previewPrompt)}?width=800&height=450&nologo=true&seed=${id.length}`;
  const created = new Date('2026-01-15');
  created.setDate(created.getDate() - daysAgo);
  return {
    id,
    userId: 'demo',
    title,
    description,
    tags,
    photos: [],
    sceneData: scene,
    isPublic: true,
    isLegacy: false,
    visitCount: visits,
    createdAt: created,
    updatedAt: created,
    location,
  };
}

export const DEMO_ROOMS: MemoryRoom[] = [
  makeDemo(
    'demo-cafe',
    'Morning Coffee in Paris',
    'A quiet morning at a sidewalk café near the Seine. The croissants were perfect, the coffee was strong, and the city was just waking up.',
    'cafe',
    ['travel', 'paris', 'morning'],
    'cozy sidewalk cafe in paris morning, golden sunlight, croissants and coffee on table, seine river in background, aesthetic warm tones, cinematic',
    19, 42,
    'Paris',
  ),
  makeDemo(
    'demo-kitchen',
    "Grandma's Sunday Kitchen",
    "The smell of fresh bread and herbs filling the warm kitchen. Grandma humming an old tune while stirring the pot. Sunlight through lace curtains.",
    'kitchen',
    ['family', 'grandma', 'cooking'],
    'warm cozy kitchen, fresh bread on counter, herbs hanging, sunlight through lace curtains, vintage homely kitchen, nostalgic aesthetic',
    5, 27,
  ),
  makeDemo(
    'demo-park',
    'Summer Picnic',
    'An afternoon in the park with friends. Blankets on the grass, laughter echoing, a gentle breeze through the trees. Simple happiness.',
    'park',
    ['friends', 'summer', 'outdoors'],
    'beautiful summer park picnic, blanket on green grass, trees with sunlight filtering through, warm golden afternoon, aesthetic peaceful outdoor scene',
    23, 35,
  ),
  makeDemo(
    'demo-bedroom',
    'Rainy Afternoon Nook',
    'Rain tapping on the window. Wrapped in a blanket with a book, hot chocolate cooling on the nightstand. Perfectly peaceful.',
    'bedroom',
    ['cozy', 'reading', 'rain'],
    'cozy bedroom rainy day, rain on window, warm blankets, book and hot chocolate on nightstand, moody peaceful atmosphere, aesthetic dark tones',
    12, 18,
  ),
];
