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
): MemoryRoom {
  return {
    id,
    userId: 'demo',
    title,
    description,
    tags,
    photos: [],
    sceneData: createDefaultScene(envType),
    isPublic: true,
    isLegacy: false,
    visitCount: Math.floor(Math.random() * 50) + 5,
    createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
    updatedAt: new Date(),
  };
}

export const DEMO_ROOMS: MemoryRoom[] = [
  makeDemo(
    'demo-cafe',
    'Morning Coffee in Paris',
    'A quiet morning at a sidewalk café near the Seine. The croissants were perfect, the coffee was strong, and the city was just waking up.',
    'cafe',
    ['travel', 'paris', 'morning'],
  ),
  makeDemo(
    'demo-kitchen',
    "Grandma's Sunday Kitchen",
    "The smell of fresh bread and herbs filling the warm kitchen. Grandma humming an old tune while stirring the pot. Sunlight through lace curtains.",
    'kitchen',
    ['family', 'grandma', 'cooking'],
  ),
  makeDemo(
    'demo-park',
    'Summer Picnic',
    'An afternoon in the park with friends. Blankets on the grass, laughter echoing, a gentle breeze through the trees. Simple happiness.',
    'park',
    ['friends', 'summer', 'outdoors'],
  ),
  makeDemo(
    'demo-bedroom',
    'Rainy Afternoon Nook',
    'Rain tapping on the window. Wrapped in a blanket with a book, hot chocolate cooling on the nightstand. Perfectly peaceful.',
    'bedroom',
    ['cozy', 'reading', 'rain'],
  ),
];
