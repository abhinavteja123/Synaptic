/**
 * Pollinations.ai – Free AI Image Generation
 * Generates equirectangular panorama images for room skyboxes
 */

import type { PhotoAnalysis } from '@/types/api';

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

/**
 * Build an optimised prompt for a 360° equirectangular panorama
 */
export function createPanoramaPrompt(analysis: PhotoAnalysis, description: string): string {
  const envLabels: Record<string, string> = {
    cafe: 'cozy cafe interior with warm lighting, small wooden tables, coffee cups',
    kitchen: 'a warm home kitchen with wooden cabinets, counter tops, family kitchen',
    bedroom: 'a cozy bedroom with soft lighting, bed, personal items',
    park: 'a beautiful park with green trees, flowers, sunny sky, bench',
    'living-room': 'a comfortable living room with couch, family photos, warm lamps',
    workshop: 'a workshop with workbench, tools, projects, focused task lighting',
    custom: 'an immersive indoor space',
  };

  const env = envLabels[analysis.environmentType] || envLabels.custom;
  const moodDescriptors: Record<string, string> = {
    joyful: 'bright, warm, golden hour sunlight, cheerful',
    content: 'peaceful, soft natural light, serene',
    neutral: 'balanced lighting, calm, everyday',
    melancholic: 'dim, blue tones, nostalgic, slightly overcast',
    sad: 'dark, cool blue tones, rainy, somber',
  };
  const mood = moodDescriptors[analysis.mood] || moodDescriptors.neutral;
  const colors = analysis.dominantColors.slice(0, 3).join(', ');

  return `360 degree equirectangular panorama of ${env}, ${description}, ${mood} atmosphere, color palette ${colors}, photorealistic, immersive, ultra detailed, 8k, no text, no watermark`;
}

/**
 * Generate a panorama URL via Pollinations.ai
 * The URL itself serves the image — no API key needed.
 */
export function generatePanoramaUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `${POLLINATIONS_BASE}/${encoded}?width=2048&height=1024&model=flux&enhance=true&nologo=true`;
}

/**
 * Generate a panorama: builds the prompt, returns the URL
 */
export function generatePanorama(analysis: PhotoAnalysis, description: string): string {
  const prompt = createPanoramaPrompt(analysis, description);
  return generatePanoramaUrl(prompt);
}

/**
 * Preload an image and resolve once it's cached by the browser
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
}
