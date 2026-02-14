/**
 * Scene Generation Utilities
 * Assemble, validate, optimise, and create fallback scenes
 */

import type { SceneData, SceneObject, LightingConfig, AudioConfig, EnvironmentType } from '@/types/room';

// ============================================
//  Validate Scene Data
// ============================================

export function validateSceneData(sceneData: SceneData): boolean {
  if (!sceneData.panoramaUrl) throw new Error('Missing panoramaUrl');
  if (!sceneData.objects || !Array.isArray(sceneData.objects)) throw new Error('Invalid objects array');
  if (!sceneData.lighting) throw new Error('Missing lighting config');

  for (const obj of sceneData.objects) {
    if (!Array.isArray(obj.position) || obj.position.length !== 3) {
      throw new Error(`Object "${obj.name}" has invalid position`);
    }
    if (!Array.isArray(obj.scale) || obj.scale.length !== 3) {
      throw new Error(`Object "${obj.name}" has invalid scale`);
    }
  }

  return true;
}

// ============================================
//  Optimise for Performance
// ============================================

export function optimizeSceneForPerformance(sceneData: SceneData): SceneData {
  return {
    ...sceneData,
    objects: sceneData.objects.slice(0, 15), // cap at 15 objects
  };
}

// ============================================
//  Default / Fallback Scenes
// ============================================

const defaultLighting: LightingConfig = {
  ambientColor: '#f1f5f9',
  ambientIntensity: 0.5,
  directionalColor: '#ffffff',
  directionalIntensity: 0.8,
  directionalPosition: [5, 10, 5],
  shadowsEnabled: true,
};

const defaultAudio: AudioConfig = {
  ambientSounds: [],
  volume: 0.35,
};

export function createDefaultScene(environmentType: EnvironmentType): SceneData {
  const templates: Record<EnvironmentType, SceneObject[]> = {
    cafe: [
      { id: 'floor', type: 'primitive', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [16, 0.1, 16], shape: 'box', color: '#8B7355', receiveShadow: true },
      { id: 'table1', type: 'primitive', name: 'Café Table', position: [0, 0.4, 0], rotation: [0, 0, 0], scale: [1.2, 0.8, 1.2], shape: 'cylinder', color: '#a0522d', castShadow: true, interactive: true, memoryText: 'The table where it all happened…' },
      { id: 'chair1', type: 'primitive', name: 'Chair', position: [1.2, 0.35, 0], rotation: [0, 0, 0], scale: [0.5, 0.7, 0.5], shape: 'box', color: '#654321', castShadow: true },
      { id: 'cup', type: 'primitive', name: 'Coffee Cup', position: [0.2, 0.85, 0.2], rotation: [0, 0, 0], scale: [0.15, 0.2, 0.15], shape: 'cylinder', color: '#f5f5dc', interactive: true, memoryText: 'Still warm…' },
      { id: 'wall-back', type: 'primitive', name: 'Back Wall', position: [0, 1.5, -8], rotation: [0, 0, 0], scale: [16, 3, 0.2], shape: 'box', color: '#d2b48c' },
    ],
    kitchen: [
      { id: 'floor', type: 'primitive', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [12, 0.1, 12], shape: 'box', color: '#d2b48c', receiveShadow: true },
      { id: 'counter', type: 'primitive', name: 'Kitchen Counter', position: [-3, 0.45, -3], rotation: [0, 0, 0], scale: [6, 0.9, 0.8], shape: 'box', color: '#f5f5dc', castShadow: true, interactive: true, memoryText: 'Where the magic happened every Sunday morning.' },
      { id: 'table', type: 'primitive', name: 'Kitchen Table', position: [0, 0.4, 2], rotation: [0, 0, 0], scale: [2, 0.8, 1.5], shape: 'box', color: '#a0522d', castShadow: true },
      { id: 'stove', type: 'primitive', name: 'Stove', position: [-3, 0.5, -1], rotation: [0, 0, 0], scale: [1, 1, 0.7], shape: 'box', color: '#c0c0c0', interactive: true, memoryText: 'The old stove that never let us down.' },
    ],
    bedroom: [
      { id: 'floor', type: 'primitive', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [10, 0.1, 10], shape: 'box', color: '#c4a882', receiveShadow: true },
      { id: 'bed', type: 'primitive', name: 'Bed', position: [0, 0.3, -2], rotation: [0, 0, 0], scale: [3, 0.6, 2], shape: 'box', color: '#d1c4e9', castShadow: true, interactive: true, memoryText: 'Where stories were told before sleep.' },
      { id: 'nightstand', type: 'primitive', name: 'Nightstand', position: [2, 0.3, -2], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6], shape: 'box', color: '#8d6e63', castShadow: true },
    ],
    park: [
      { id: 'ground', type: 'primitive', name: 'Grass', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [30, 0.1, 30], shape: 'box', color: '#4caf50', receiveShadow: true },
      { id: 'bench', type: 'primitive', name: 'Park Bench', position: [0, 0.3, 0], rotation: [0, 0, 0], scale: [2, 0.6, 0.6], shape: 'box', color: '#795548', castShadow: true, interactive: true, memoryText: 'Our favourite bench under the old oak.' },
      { id: 'tree', type: 'primitive', name: 'Tree trunk', position: [-3, 1.5, -4], rotation: [0, 0, 0], scale: [0.5, 3, 0.5], shape: 'cylinder', color: '#5d4037', castShadow: true },
      { id: 'treecrown', type: 'primitive', name: 'Tree foliage', position: [-3, 3.5, -4], rotation: [0, 0, 0], scale: [3, 2, 3], shape: 'sphere', color: '#388e3c' },
    ],
    'living-room': [
      { id: 'floor', type: 'primitive', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [12, 0.1, 12], shape: 'box', color: '#c4a882', receiveShadow: true },
      { id: 'couch', type: 'primitive', name: 'Couch', position: [0, 0.4, -2], rotation: [0, 0, 0], scale: [3, 0.8, 1], shape: 'box', color: '#5c4033', castShadow: true, interactive: true, memoryText: 'Where movie nights happened every Friday.' },
      { id: 'tv', type: 'primitive', name: 'TV', position: [0, 1, -5.5], rotation: [0, 0, 0], scale: [2, 1.2, 0.1], shape: 'box', color: '#1a1a2e', interactive: true, memoryText: 'The old TV that brought the family together.' },
    ],
    workshop: [
      { id: 'floor', type: 'primitive', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [12, 0.1, 12], shape: 'box', color: '#9e9e9e', receiveShadow: true },
      { id: 'workbench', type: 'primitive', name: 'Workbench', position: [0, 0.45, -3], rotation: [0, 0, 0], scale: [4, 0.9, 1], shape: 'box', color: '#6d4c41', castShadow: true, interactive: true, memoryText: 'Hours of building and creating.' },
    ],
    custom: [
      { id: 'floor', type: 'primitive', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [16, 0.1, 16], shape: 'box', color: '#ccc', receiveShadow: true },
    ],
  };

  const objects = templates[environmentType] || templates.custom;

  return {
    environmentType,
    panoramaUrl: '',
    objects,
    lighting: defaultLighting,
    audio: defaultAudio,
  };
}
