'use client';

/**
 * Controls.tsx – Cinematic orbit camera with auto-intro animation
 * Uses OrbitControls for smooth zoom, pan, rotate — no pointer lock needed.
 */

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ControlsProps {
  enabled?: boolean;
  onMove?: (position: [number, number, number], rotation: number) => void;
  introAnimation?: boolean;
  /** Target for auto-tour — camera smoothly flies to this position */
  tourTarget?: { position: [number, number, number]; lookAt: [number, number, number] } | null;
}

export default function Controls({ enabled = true, onMove, introAnimation = true, tourTarget }: ControlsProps) {
  const controlsRef = useRef<any>(null);
  const lastSentPosition = useRef(new THREE.Vector3());
  const lastSendTime = useRef(0);
  const introProgress = useRef(0);
  const introComplete = useRef(!introAnimation);

  const { camera } = useThree();

  // Cinematic intro: dramatic descent from above into the center of the room
  useEffect(() => {
    if (!introAnimation) return;
    // Start high above — bird's eye view looking straight down at the room
    camera.position.set(0, 18, 0.1);
    camera.lookAt(0, 0, 0);
    introProgress.current = 0;
    introComplete.current = false;
  }, [introAnimation, camera]);

  useFrame((_, delta) => {
    // Cinematic intro animation — 3-phase descent
    if (!introComplete.current) {
      introProgress.current += delta * 0.25; // ~4 second total
      const t = Math.min(introProgress.current, 1);

      // Smooth ease-in-out (sine curve)
      const ease = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // Phase 1 (0–0.4): Descend from sky, slight spiral rotation
      // Phase 2 (0.4–0.8): Arrive at eye level, sweep outward
      // Phase 3 (0.8–1.0): Settle into final orbit position
      let px: number, py: number, pz: number;
      let lx: number, ly: number, lz: number;

      if (t < 0.4) {
        // Descending from above with a gentle spiral
        const p = t / 0.4; // 0→1
        const spiralAngle = p * Math.PI * 0.6;
        px = Math.sin(spiralAngle) * (1 - p) * 3;
        py = THREE.MathUtils.lerp(18, 4, p * p); // Accelerate down
        pz = Math.cos(spiralAngle) * (1 - p) * 3 + p * 4;
        lx = 0; ly = THREE.MathUtils.lerp(0, 2, p); lz = 0;
      } else if (t < 0.8) {
        // Sweep out to viewing position
        const p = (t - 0.4) / 0.4;
        const smoothP = p * p * (3 - 2 * p); // smoothstep
        px = THREE.MathUtils.lerp(0, 0, smoothP);
        py = THREE.MathUtils.lerp(4, 2.8, smoothP);
        pz = THREE.MathUtils.lerp(4, 7, smoothP);
        lx = 0;
        ly = THREE.MathUtils.lerp(2, 2, smoothP);
        lz = THREE.MathUtils.lerp(0, -1, smoothP);
      } else {
        // Final settle
        const p = (t - 0.8) / 0.2;
        const smoothP = p * p * (3 - 2 * p);
        px = 0;
        py = THREE.MathUtils.lerp(2.8, 2.5, smoothP);
        pz = THREE.MathUtils.lerp(7, 8, smoothP);
        lx = 0;
        ly = THREE.MathUtils.lerp(2, 2, smoothP);
        lz = THREE.MathUtils.lerp(-1, 0, smoothP);
      }

      camera.position.set(px, py, pz);

      if (controlsRef.current) {
        controlsRef.current.target.set(lx, ly, lz);
        controlsRef.current.update();
      }

      if (t >= 1) {
        introComplete.current = true;
      }
      return; // Skip position broadcasts during intro
    }

    // Auto-tour — smoothly fly camera to tour target
    if (tourTarget) {
      const targetPos = new THREE.Vector3(...tourTarget.position);
      const targetLookAt = new THREE.Vector3(...tourTarget.lookAt);

      camera.position.lerp(targetPos, delta * 1.5);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt, delta * 1.5);
        controlsRef.current.update();
      }
      return;
    }

    // Send position updates for multiplayer (throttled to 10/sec)
    const now = performance.now();
    if (onMove && now - lastSendTime.current > 100) {
      const pos = camera.position;
      const dist = pos.distanceTo(lastSentPosition.current);
      if (dist > 0.01) {
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        onMove([pos.x, pos.y, pos.z], euler.y);
        lastSentPosition.current.copy(pos);
        lastSendTime.current = now;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={enabled && introComplete.current && !tourTarget}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
      minDistance={1.5}
      maxDistance={20}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={0.1}
      target={[0, 2, 0]}
    />
  );
}
