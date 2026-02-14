'use client';

/**
 * Room.tsx – Immersive 3D gallery with photo frames, glow effects, and floating title
 * Supports: primitives, text labels, photo frames with glow auras, glass architecture
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Text, MeshReflectorMaterial, Float, Billboard, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneData, SceneObject } from '@/types/room';
import { ROOM_THEMES } from '@/lib/constants';

interface RoomProps {
  sceneData: SceneData;
  onObjectClick?: (objectId: string, memoryText?: string, textureUrl?: string) => void;
  roomTitle?: string;
  theme?: string;
}

export default function Room({ sceneData, onObjectClick, roomTitle, theme = 'midnight' }: RoomProps) {
  // Check if we have photos
  const hasPhotos = sceneData.objects.some((o) => o.type === 'photo');
  const t = ROOM_THEMES[theme] || ROOM_THEMES.midnight;

  return (
    <group>
      {/* Gallery floor — dark polished concrete with subtle reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          mirror={0.15}
          blur={[400, 200]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.4}
          roughness={0.85}
          depthScale={0.8}
          color={t.floor}
          metalness={0.15}
        />
      </mesh>

      {/* Floor glow ring — matches circle of photos */}
      {hasPhotos && <GalleryFloorGlow accent={t.accent} />}

      {/* Ambient light beams from ceiling — spread around circle */}
      {hasPhotos && <LightBeams glow={t.glow} />}

      {/* Gallery pedestals around the circle */}
      {hasPhotos && <GalleryPedestals accent={t.accent} />}

      {/* Circular gallery wall — wraps behind all photos */}
      {hasPhotos && (
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[8.5, 8.5, 6, 64, 1, true]} />
          <meshStandardMaterial
            color={t.wall}
            roughness={0.95}
            metalness={0.02}
            side={THREE.BackSide}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Circular ceiling — slightly transparent for sky bleed */}
      {hasPhotos && (
        <mesh position={[0, 5.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8.5, 64]} />
          <meshStandardMaterial
            color={t.wall}
            roughness={1}
            metalness={0}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating 3D Room Title — billboard so it always faces camera */}
      {hasPhotos && roomTitle && (
        <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.3}>
          <Billboard position={[0, 5.0, 0]}>
            <Text
              fontSize={0.55}
              color={t.accentLight}
              anchorX="center"
              anchorY="middle"
              font={undefined}
              maxWidth={12}
              outlineColor="#000000"
              outlineWidth={0.02}
            >
              {roomTitle}
            </Text>
            {/* Subtle underline glow */}
            <mesh position={[0, -0.4, 0]}>
              <planeGeometry args={[Math.min(roomTitle.length * 0.35, 8), 0.04]} />
              <meshBasicMaterial color={t.accent} transparent opacity={0.6} />
            </mesh>
          </Billboard>
        </Float>
      )}

      {/* Render scene objects — when photos exist, only show photos + text (clean gallery) */}
      {sceneData.objects
        .filter((obj) => {
          if (obj.type === 'photo' || obj.type === 'text') return true;
          if (hasPhotos) return false;
          return true;
        })
        .map((obj) => (
          <SceneObjectMesh
            key={obj.id}
            obj={obj}
            onClick={onObjectClick}
          />
        ))}
    </group>
  );
}

// ============================================
//  Gallery Floor Glow Ring
// ============================================

function GalleryFloorGlow({ accent }: { accent: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[6.8, 7.0, 64]} />
      <meshBasicMaterial color={accent} transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ============================================
//  Light Beams — Volumetric vertical beams from ceiling
// ============================================

function LightBeams({ glow }: { glow: string }) {
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);

  // 6 beams spread around the circle (behind photo radius)
  const beamPositions: [number, number, number][] = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      return [Math.sin(angle) * 8.2, 2.5, Math.cos(angle) * 8.2] as [number, number, number];
    }), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    beamRefs.current.forEach((beam, i) => {
      if (!beam) return;
      const mat = beam.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.04 + Math.sin(time * 0.5 + i * 1.5) * 0.02;
    });
  });

  return (
    <group>
      {beamPositions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { beamRefs.current[i] = el; }}
          position={pos}
        >
          <cylinderGeometry args={[0.15, 0.6, 5, 16, 1, true]} />
          <meshBasicMaterial
            color={glow}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
//  Gallery Pedestals — Ambient decor for atmosphere
// ============================================

function GalleryPedestals({ accent }: { accent: string }) {
  // 6 pedestals spread around inner circle
  const pedestalPositions: [number, number, number][] = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6; // Offset from beams
      return [Math.sin(angle) * 4.5, 0.4, Math.cos(angle) * 4.5] as [number, number, number];
    }), []);

  return (
    <group>
      {pedestalPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Pedestal base */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.4, 0.8, 16]} />
            <meshStandardMaterial color="#151520" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Glowing orb on top */}
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
          {/* Pedestal glow */}
          <pointLight
            position={[0, 0.8, 0]}
            color={accent}
            intensity={0.3}
            distance={3}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}

// ============================================
//  Photo Frame – Immersive gallery-style with glow aura
// ============================================

function PhotoFrame({
  obj,
  onClick,
}: {
  obj: SceneObject;
  onClick?: (objectId: string, memoryText?: string, textureUrl?: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Load texture using HTMLImageElement — works reliably with base64 data URLs
  useEffect(() => {
    if (!obj.textureUrl) return;
    let disposed = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (disposed) return;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.onerror = () => {
      console.warn(`[PhotoFrame] Failed to load texture for ${obj.name}`);
    };
    img.src = obj.textureUrl;

    return () => {
      disposed = true;
      texture?.dispose();
    };
  }, [obj.textureUrl]);

  // Animate glow aura
  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.12 + Math.sin(state.clock.elapsedTime * 1.5 + (obj.position[0] || 0)) * 0.06;
      mat.opacity = hovered ? 0.35 : pulse;
    }
    // Subtle hover lift
    if (groupRef.current) {
      const targetZ = hovered ? 0.15 : 0;
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  const handleClick = () => {
    if (onClick) onClick(obj.id, obj.memoryText, obj.textureUrl);
  };

  // Photo dimensions
  const frameW = obj.scale?.[0] ?? 2.4;
  const frameH = obj.scale?.[1] ?? 1.8;
  const frameDepth = 0.12;
  const borderWidth = 0.14;
  const matWidth = 0.06;

  return (
    <group position={obj.position} rotation={obj.rotation}>
      <group ref={groupRef}>
        {/* Glow aura behind the frame — animated */}
        <mesh ref={glowRef} position={[0, 0, -0.15]}>
          <planeGeometry args={[frameW + 1.0, frameH + 1.0]} />
          <meshBasicMaterial
            color="#6366f1"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Outer frame (metallic dark) */}
        <mesh
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[frameW + borderWidth * 2, frameH + borderWidth * 2, frameDepth]} />
          <meshStandardMaterial
            color={hovered ? '#4a3a6a' : '#1a1525'}
            roughness={0.3}
            metalness={0.6}
            emissive={hovered ? '#6366f1' : '#1a1030'}
            emissiveIntensity={hovered ? 0.5 : 0.15}
          />
        </mesh>

        {/* Inner mat (subtle off-white) */}
        <mesh position={[0, 0, frameDepth / 2 - 0.01]}>
          <boxGeometry args={[frameW + matWidth, frameH + matWidth, 0.02]} />
          <meshStandardMaterial color="#e8e0d8" roughness={0.9} metalness={0} />
        </mesh>

        {/* Photo surface */}
        <mesh position={[0, 0, frameDepth / 2 + 0.002]}>
          <planeGeometry args={[frameW - 0.08, frameH - 0.08]} />
          {texture ? (
            <meshBasicMaterial map={texture} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#333340" roughness={0.9} />
          )}
        </mesh>

        {/* Gallery spotlight from above — warm, focused */}
        <spotLight
          position={[0, 2.5, 1.5]}
          angle={0.45}
          penumbra={0.9}
          intensity={hovered ? 3.0 : 1.5}
          color={hovered ? '#e0d0ff' : '#fff5e6'}
          distance={6}
          castShadow={false}
          decay={2}
        />

        {/* Accent point light for photo glow */}
        <pointLight
          position={[0, 0, 0.5]}
          color="#8b5cf6"
          intensity={hovered ? 0.6 : 0.15}
          distance={3}
          decay={2}
        />

        {/* Caption below frame */}
        <Text
          position={[0, -(frameH / 2 + borderWidth + 0.28), 0.05]}
          fontSize={0.1}
          color={hovered ? '#c4b5fd' : '#666666'}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {obj.name || 'Memory Photo'}
        </Text>

        {/* Hover label */}
        {hovered && (
          <Float speed={2} rotationIntensity={0} floatIntensity={0.15}>
            <Text
              position={[0, frameH / 2 + borderWidth + 0.35, 0.1]}
              fontSize={0.13}
              color="#c4b5fd"
              anchorX="center"
              anchorY="middle"
              outlineColor="#000000"
              outlineWidth={0.02}
            >
              ✦ Click to explore ✦
            </Text>
          </Float>
        )}
      </group>
    </group>
  );
}

// ============================================
//  Individual Scene Object
// ============================================

function SceneObjectMesh({
  obj,
  onClick,
}: {
  obj: SceneObject;
  onClick?: (objectId: string, memoryText?: string, textureUrl?: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = obj.color || '#cccccc';

  const handlePointerOver = () => {
    if (obj.interactive) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = () => {
    if (obj.interactive && onClick) {
      onClick(obj.id, obj.memoryText);
    }
  };

  // Photo frame object
  if (obj.type === 'photo' && obj.textureUrl) {
    return <PhotoFrame obj={obj} onClick={onClick} />;
  }

  // Text object
  if (obj.type === 'text' && obj.text) {
    return (
      <Text
        position={obj.position}
        rotation={obj.rotation.map((r) => r) as [number, number, number]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {obj.text}
      </Text>
    );
  }

  // Primitive object with improved PBR materials
  const isFloor = obj.name?.toLowerCase().includes('floor') || (obj.position[1] <= 0 && (obj.scale?.[1] ?? 1) <= 0.2);
  const isWall = obj.name?.toLowerCase().includes('wall');

  return (
    <group>
      <mesh
        position={obj.position}
        rotation={obj.rotation}
        scale={obj.scale}
        castShadow={obj.castShadow && !isFloor}
        receiveShadow={obj.receiveShadow}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <PrimitiveGeometry shape={obj.shape || 'box'} />
        <meshStandardMaterial
          color={hovered ? '#a78bfa' : color}
          roughness={isFloor ? 0.85 : isWall ? 0.9 : 0.5}
          metalness={isFloor ? 0.15 : isWall ? 0.05 : 0.15}
          emissive={hovered ? '#6366f1' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          transparent={obj.opacity !== undefined && obj.opacity < 1}
          opacity={obj.opacity ?? 1}
          envMapIntensity={0.5}
        />

        {/* Hover label */}
        {hovered && obj.interactive && (
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.13}
            color="#c4b5fd"
            anchorX="center"
            anchorY="middle"
            outlineColor="#000000"
            outlineWidth={0.02}
          >
            {obj.name}
            {'\n'}Click to explore
          </Text>
        )}
      </mesh>

      {/* Subtle edge outline for interactive objects */}
      {obj.interactive && !isFloor && !isWall && (
        <mesh
          position={obj.position}
          rotation={obj.rotation}
          scale={obj.scale?.map((s) => s * 1.02) as [number, number, number]}
        >
          <PrimitiveGeometry shape={obj.shape || 'box'} />
          <meshBasicMaterial
            color="#6366f1"
            transparent
            opacity={hovered ? 0.15 : 0.04}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ============================================
//  Primitive Geometry Helper
// ============================================

function PrimitiveGeometry({ shape }: { shape: string }) {
  switch (shape) {
    case 'sphere':
      return <sphereGeometry args={[0.5, 32, 32]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'plane':
      return <planeGeometry args={[1, 1]} />;
    case 'cone':
      return <coneGeometry args={[0.5, 1, 32]} />;
    case 'torus':
      return <torusGeometry args={[0.5, 0.15, 16, 48]} />;
    case 'box':
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}
