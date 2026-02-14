'use client';

/**
 * Avatar.tsx – Multiplayer player avatar rendered in 3D
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Player } from '@/types/player';

interface AvatarProps {
  player: Player;
  isLocal: boolean;
}

export default function Avatar({ player, isLocal }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(...player.position));
  const targetRotation = useRef(player.rotation);

  // Update targets
  targetPosition.current.set(...player.position);
  targetRotation.current = player.rotation;

  // Smooth interpolation
  useFrame(() => {
    if (!groupRef.current || isLocal) return;

    // Lerp position
    groupRef.current.position.lerp(targetPosition.current, 0.15);

    // Lerp rotation (Y axis)
    const currentY = groupRef.current.rotation.y;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(currentY, targetRotation.current, 0.15);
  });

  if (isLocal) return null;

  const avatarColor = player.avatarColor || '#6366f1';

  return (
    <group ref={groupRef} position={player.position}>
      {/* Body – capsule shape */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color={avatarColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={avatarColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.07, 1.18, 0.17]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.07, 1.18, 0.17]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Pupils */}
      <mesh position={[-0.07, 1.18, 0.2]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.07, 1.18, 0.2]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Name tag (billboard – always faces camera) */}
      <Billboard position={[0, 1.6, 0]}>
        <Text
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.015}
        >
          {player.name}
        </Text>
      </Billboard>
    </group>
  );
}
