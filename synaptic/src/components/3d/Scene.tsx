'use client';

/**
 * Scene.tsx – Main 3D Canvas wrapper
 * Renders the complete 3D memory room with skybox, objects, lighting, and avatars
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneData } from '@/types/room';
import type { Player } from '@/types/player';
import type { Mood } from '@/types/scene';
import Room from './Room';
import SkyboxPanorama from './SkyboxPanorama';
import EnvironmentController from './EnvironmentController';
import Controls from './Controls';
import Avatar from './Avatar';
import { RainEffect, SparkleEffect, DustEffect, FireflyEffect } from './Effects';
import { CAMERA_SETTINGS, MOOD_CONFIGS } from '@/lib/constants';

interface SceneProps {
  sceneData: SceneData;
  players?: Map<string, Player>;
  localPlayerId?: string;
  mood?: Mood;
  onPlayerMove?: (position: [number, number, number], rotation: number) => void;
  onObjectClick?: (objectId: string, memoryText?: string, textureUrl?: string) => void;
  controlsEnabled?: boolean;
  showStats?: boolean;
  roomTitle?: string;
  tourTarget?: { position: [number, number, number]; lookAt: [number, number, number] } | null;
  theme?: string;
}

function SceneLoading() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

export default function Scene({
  sceneData,
  players,
  localPlayerId,
  mood = 'neutral',
  onPlayerMove,
  onObjectClick,
  controlsEnabled = true,
  showStats = false,
  roomTitle,
  tourTarget,
  theme,
}: SceneProps) {
  return (
    <div className="fixed inset-0 canvas-3d">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          fov: CAMERA_SETTINGS.fov,
          near: CAMERA_SETTINGS.near,
          far: CAMERA_SETTINGS.far,
          position: CAMERA_SETTINGS.initialPosition,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Suspense fallback={<SceneLoading />}>
          {/* Skybox panorama background */}
          {sceneData.panoramaUrl && (
            <SkyboxPanorama panoramaUrl={sceneData.panoramaUrl} />
          )}

          {/* Ambient environment lighting — low intensity for gallery feel */}
          <Environment preset="night" background={false} environmentIntensity={0.3} />

          {/* Dynamic lighting based on mood */}
          <EnvironmentController mood={mood} sceneData={sceneData} />

          {/* Room objects */}
          <Room sceneData={sceneData} onObjectClick={onObjectClick} roomTitle={roomTitle} theme={theme} />

          {/* Mood-reactive weather particles */}
          {(() => {
            const mc = MOOD_CONFIGS[mood] || MOOD_CONFIGS.neutral;
            const pt = mc.particles?.type;
            const pi = mc.particles?.intensity ?? 0.3;
            const pc = mc.particles?.color;
            return (
              <>
                <RainEffect enabled={pt === 'rain'} intensity={pi} color={pc} />
                <SparkleEffect enabled={pt === 'sparkles'} intensity={pi} color={pc} />
                <DustEffect enabled={pt === 'dust' || pt === 'fog'} intensity={pi} color={pc} />
              </>
            );
          })()}

          {/* Always-on ambient fireflies for atmosphere */}
          <FireflyEffect enabled intensity={0.6} />

          {/* Multiplayer avatars */}
          {players &&
            Array.from(players.entries()).map(([id, player]) => {
              if (id === localPlayerId) return null;
              return <Avatar key={id} player={player} isLocal={false} />;
            })}

          {/* First-person camera controls */}
          <Controls
            enabled={controlsEnabled}
            onMove={onPlayerMove}
            tourTarget={tourTarget}
          />
        </Suspense>

        {showStats && <Stats />}
      </Canvas>
    </div>
  );
}
