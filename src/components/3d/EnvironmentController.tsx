'use client';

/**
 * EnvironmentController.tsx – Mood-reactive lighting system
 * Smoothly transitions lighting, fog, and atmosphere based on sentiment
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Mood } from '@/types/scene';
import type { SceneData } from '@/types/room';
import { MOOD_CONFIGS } from '@/lib/constants';

interface EnvironmentControllerProps {
  mood: Mood;
  sceneData: SceneData;
  transitionDuration?: number;
}

export default function EnvironmentController({
  mood,
  sceneData,
  transitionDuration = 2500,
}: EnvironmentControllerProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);

  const targetAmbientColor = useRef(new THREE.Color());
  const targetDirectionalColor = useRef(new THREE.Color());
  const targetAmbientIntensity = useRef(0.5);
  const targetDirectionalIntensity = useRef(0.8);

  // Lerp speed derived from transition duration
  const lerpSpeed = 1 / (transitionDuration / 16.67); // ~60fps frames

  // Update targets when mood changes
  const moodConfig = MOOD_CONFIGS[mood] || MOOD_CONFIGS.neutral;
  targetAmbientColor.current.set(moodConfig.lighting.ambientColor);
  targetDirectionalColor.current.set(moodConfig.lighting.directionalColor);
  targetAmbientIntensity.current = moodConfig.lighting.ambientIntensity;
  targetDirectionalIntensity.current = moodConfig.lighting.directionalIntensity;

  // Smooth interpolation every frame
  useFrame(() => {
    if (ambientRef.current) {
      ambientRef.current.color.lerp(targetAmbientColor.current, lerpSpeed);
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        targetAmbientIntensity.current,
        lerpSpeed,
      );
    }
    if (directionalRef.current) {
      directionalRef.current.color.lerp(targetDirectionalColor.current, lerpSpeed);
      directionalRef.current.intensity = THREE.MathUtils.lerp(
        directionalRef.current.intensity,
        targetDirectionalIntensity.current,
        lerpSpeed,
      );
    }
  });

  const lightPos = sceneData.lighting?.directionalPosition || [5, 10, 5];

  return (
    <>
      {/* Ambient fill light */}
      <ambientLight
        ref={ambientRef}
        color={moodConfig.lighting.ambientColor}
        intensity={moodConfig.lighting.ambientIntensity}
      />

      {/* Main directional (sun/moon) light */}
      <directionalLight
        ref={directionalRef}
        color={moodConfig.lighting.directionalColor}
        intensity={moodConfig.lighting.directionalIntensity}
        position={lightPos}
        castShadow={sceneData.lighting?.shadowsEnabled ?? true}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* Optional fog — density from mood config */}
      <fog
        attach="fog"
        color={moodConfig.lighting.fogColor}
        near={moodConfig.lighting.fogDensity ? 1 / (moodConfig.lighting.fogDensity * 50) : 10}
        far={moodConfig.lighting.fogDensity ? 1 / (moodConfig.lighting.fogDensity * 5) : 80}
      />

      {/* Scene-specific point lights */}
      {sceneData.lighting?.pointLights?.map((pl, i) => (
        <pointLight
          key={i}
          position={pl.position}
          color={pl.color}
          intensity={pl.intensity}
          distance={pl.distance}
        />
      ))}
    </>
  );
}
