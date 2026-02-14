'use client';

/**
 * SkyboxPanorama.tsx – 360° equirectangular panorama skybox
 * Pre-fetches the Pollinations image, shows gradient fallback on error/timeout.
 */

import { useRef, useState, useEffect, Component, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface SkyboxPanoramaProps {
  panoramaUrl: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/** Timeout (ms) – Pollinations can be slow on first generation */
const LOAD_TIMEOUT = 45_000;

// ─── Gradient Fallback ──────────────────────────────────────
function GradientSky() {
  return (
    <mesh>
      <sphereGeometry args={[500, 32, 32]} />
      <meshBasicMaterial color="#1a1a3e" side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Error Boundary (catches useLoader throws) ──────────────
class SkyboxErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn('[SkyboxPanorama] Texture load failed, using gradient fallback:', err.message);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── Main Component ─────────────────────────────────────────
export default function SkyboxPanorama({ panoramaUrl, onLoad, onError }: SkyboxPanoramaProps) {
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Pre-fetch the image outside of Three.js to handle errors & timeout gracefully
  useEffect(() => {
    if (!panoramaUrl) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[SkyboxPanorama] Panorama load timed out after', LOAD_TIMEOUT, 'ms');
        controller.abort();
        setFailed(true);
        onError?.(new Error('Panorama load timed out'));
      }
    }, LOAD_TIMEOUT);

    // Use fetch to validate the image is accessible, then hand the blob URL to Three.js
    fetch(panoramaUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        clearTimeout(timer);
        const blobUrl = URL.createObjectURL(blob);
        setValidatedUrl(blobUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timer);
        console.warn('[SkyboxPanorama] Failed to fetch panorama:', err.message);
        setFailed(true);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [panoramaUrl, onError]);

  if (failed || !panoramaUrl) return <GradientSky />;
  if (!validatedUrl) return <GradientSky />; // Still loading → show fallback

  return (
    <SkyboxErrorBoundary fallback={<GradientSky />}>
      <PanoramaSphere url={validatedUrl} onLoad={onLoad} />
    </SkyboxErrorBoundary>
  );
}

// ─── Inner Sphere (only mounted once URL is validated) ──────
function PanoramaSphere({ url, onLoad }: { url: string; onLoad?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useLoader(THREE.TextureLoader, url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;

  useEffect(() => {
    onLoad?.();
  }, [texture, onLoad]);

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}
