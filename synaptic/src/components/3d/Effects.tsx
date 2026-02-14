'use client';

/**
 * Effects.tsx – Particle systems for mood-reactive weather + ambient atmosphere
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
//  Rain Effect
// ============================================

interface RainEffectProps {
  intensity?: number;
  color?: string;
  enabled?: boolean;
}

export function RainEffect({ intensity = 0.5, color = '#93c5fd', enabled = true }: RainEffectProps) {
  const count = Math.floor(800 * intensity);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = 4 + Math.random() * 6;
    return arr;
  }, [count]);

  const positions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * 30,
      });
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current || !enabled) return;
    for (let i = 0; i < count; i++) {
      positions[i].y -= speeds[i] * delta;
      if (positions[i].y < 0) {
        positions[i].y = 15 + Math.random() * 5;
        positions[i].x = (Math.random() - 0.5) * 30;
        positions[i].z = (Math.random() - 0.5) * 30;
      }
      dummy.position.set(positions[i].x, positions[i].y, positions[i].z);
      dummy.scale.set(0.02, 0.15, 0.02);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.5, 0.5, 1, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </instancedMesh>
  );
}

// ============================================
//  Sparkle Effect
// ============================================

interface SparkleEffectProps {
  intensity?: number;
  color?: string;
  enabled?: boolean;
}

export function SparkleEffect({ intensity = 0.5, color = '#fbbf24', enabled = true }: SparkleEffectProps) {
  const count = Math.floor(100 * intensity);
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 20;
      arr[i + 1] = Math.random() * 8;
      arr[i + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || !enabled) return;
    const t = state.clock.elapsedTime;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count * 3; i += 3) {
      posArr[i + 1] += Math.sin(t + i) * 0.002;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.08} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

// ============================================
//  Dust / Fog Particles
// ============================================

interface DustEffectProps {
  intensity?: number;
  color?: string;
  enabled?: boolean;
}

export function DustEffect({ intensity = 0.3, color = '#cbd5e1', enabled = true }: DustEffectProps) {
  const count = Math.floor(200 * intensity);
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 20;
      arr[i + 1] = Math.random() * 5;
      arr[i + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || !enabled) return;
    const t = state.clock.elapsedTime;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count * 3; i += 3) {
      posArr[i] += Math.sin(t * 0.2 + i) * 0.001;
      posArr[i + 1] += Math.cos(t * 0.15 + i) * 0.0005;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ============================================
//  Firefly / Ambient Glow Particles (always-on atmosphere)
// ============================================

interface FireflyEffectProps {
  intensity?: number;
  enabled?: boolean;
}

export function FireflyEffect({ intensity = 0.5, enabled = true }: FireflyEffectProps) {
  const count = Math.floor(60 * intensity);
  const pointsRef = useRef<THREE.Points>(null);

  // Each firefly has position + phase offset + speed
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const colorChoices = [
      [0.98, 0.85, 0.37],  // warm gold
      [0.73, 0.56, 0.98],  // soft purple
      [0.37, 0.78, 0.98],  // ice blue
      [0.98, 0.56, 0.73],  // pink
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 18;
      positions[i3 + 1] = 0.5 + Math.random() * 4;
      positions[i3 + 2] = (Math.random() - 0.5) * 18;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 0.7;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i3] = c[0];
      colors[i3 + 1] = c[1];
      colors[i3 + 2] = c[2];
    }
    return { positions, colors, phases, speeds };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || !enabled) return;
    const t = state.clock.elapsedTime;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = data.phases[i];
      const speed = data.speeds[i];
      // Gentle floating orbit
      posArr[i3] += Math.sin(t * speed * 0.4 + phase) * 0.003;
      posArr[i3 + 1] += Math.cos(t * speed * 0.3 + phase * 1.3) * 0.002;
      posArr[i3 + 2] += Math.sin(t * speed * 0.35 + phase * 0.7) * 0.003;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    // Pulse the material opacity for a breathing glow
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.5 + Math.sin(t * 1.5) * 0.25;
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={data.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={data.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        transparent
        opacity={0.7}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
