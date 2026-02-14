'use client';

/**
 * MemoryHotspot.tsx — Interactive 3D hotspot for legacy room objects
 * Displays a glowing orb that opens a memory detail panel on click
 */

import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MemoryHotspotProps {
  position: [number, number, number];
  label: string;
  memoryText: string;
  color?: string;
}

export default function MemoryHotspot({
  position,
  label,
  memoryText,
  color = '#a78bfa',
}: MemoryHotspotProps) {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 2) * 0.08;
    meshRef.current.scale.setScalar(hovered ? 1.3 : 1);
  });

  return (
    <group position={position}>
      {/* Outer glow ring */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.12, 0.18, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Main orb */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => setActive(!active)}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2 : 1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Label */}
      <Billboard follow>
        <Html center distanceFactor={8}>
          <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-white/80 whitespace-nowrap pointer-events-none">
            {label}
          </span>
        </Html>
      </Billboard>

      {/* Memory popup */}
      {active && (
        <Html center distanceFactor={6}>
          <div
            className="w-72 glass-card p-4 animate-fade-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-semibold text-primary-300 mb-1">{label}</h4>
            <p className="text-xs text-white/70 leading-relaxed">{memoryText}</p>
            <button
              onClick={() => setActive(false)}
              className="mt-2 text-[10px] text-white/40 hover:text-white/70"
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
