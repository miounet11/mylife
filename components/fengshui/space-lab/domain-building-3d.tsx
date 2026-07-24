'use client';

/**
 * Domain-specific procedural Three.js massing + AI material textures.
 */

import { useLayoutEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceActiveDomain } from '@/lib/fengshui/space/types';
import { DOMAIN_MODEL_META } from '@/lib/fengshui/space/domain-models';
import {
  DOMAIN_TEXTURE_KITS,
  TEXTURE_URLS,
  type DomainTextureKit,
  type TextureKey,
} from '@/lib/fengshui/space/texture-catalog';

type Props = {
  domain: SpaceActiveDomain;
  widthM: number;
  depthM: number;
  heightM: number;
};

function usePreparedTexture(key: TextureKey, repeat: [number, number] = [3, 3]) {
  const tex = useTexture(TEXTURE_URLS[key]);
  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
  }, [tex, repeat[0], repeat[1]]);
  return tex;
}

function TexMat({
  mapKey,
  repeat = [3, 3],
  opacity = 1,
  metalness = 0.08,
  roughness = 0.78,
  color = '#ffffff',
}: {
  mapKey: TextureKey;
  repeat?: [number, number];
  opacity?: number;
  metalness?: number;
  roughness?: number;
  color?: string;
}) {
  const map = usePreparedTexture(mapKey, repeat);
  return (
    <meshStandardMaterial
      map={map}
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

function ResidentialModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const hw = widthM / 2;
  const hd = depthM / 2;
  const r = kit.repeat;
  return (
    <group>
      <mesh position={[0, heightM / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[widthM * 0.96, heightM, depthM * 0.92]} />
        <TexMat mapKey={kit.primary} repeat={r} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[widthM * 0.9, depthM * 0.86]} />
        <TexMat mapKey={kit.secondary} repeat={[r[0] * 1.2, r[1] * 1.2]} />
      </mesh>
      <mesh position={[0, heightM * 0.35, hd * 0.55]} castShadow>
        <boxGeometry args={[widthM * 0.55, 0.12, depthM * 0.22]} />
        <TexMat mapKey={kit.accent || 'metal_panel'} repeat={[2, 1]} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, heightM * 0.55, hd * 0.62]}>
        <boxGeometry args={[widthM * 0.5, heightM * 0.35, 0.06]} />
        <TexMat mapKey="glass_facade" repeat={[2, 1]} opacity={0.55} metalness={0.45} roughness={0.15} />
      </mesh>
      <mesh position={[-hw * 0.15, heightM * 0.45, 0]}>
        <boxGeometry args={[0.08, heightM * 0.85, depthM * 0.5]} />
        <TexMat mapKey={kit.primary} repeat={[1, 2]} opacity={0.85} />
      </mesh>
    </group>
  );
}

function VillaModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const h1 = heightM;
  const h2 = heightM * 0.85;
  const r = kit.repeat;
  return (
    <group>
      <mesh position={[0, 0.05, depthM * 0.15]} receiveShadow>
        <boxGeometry args={[widthM * 1.15, 0.1, depthM * 1.2]} />
        <TexMat mapKey={kit.ground} repeat={[6, 6]} roughness={0.95} />
      </mesh>
      <mesh position={[0, h1 / 2, -depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.9, h1, depthM * 0.75]} />
        <TexMat mapKey={kit.primary} repeat={r} />
      </mesh>
      <mesh position={[0, h1 + h2 / 2, -depthM * 0.08]} castShadow>
        <boxGeometry args={[widthM * 0.72, h2, depthM * 0.55]} />
        <TexMat mapKey={kit.primary} repeat={r} color="#f8f4ec" />
      </mesh>
      <mesh position={[0, h1 + h2 + 0.35, -depthM * 0.08]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[widthM * 0.55, 0.12, depthM * 0.6]} />
        <TexMat mapKey={kit.roof || 'roof_terracotta'} repeat={[3, 2]} roughness={0.7} />
      </mesh>
      <mesh position={[0, h1 + h2 + 0.35, -depthM * 0.08]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[widthM * 0.55, 0.12, depthM * 0.6]} />
        <TexMat mapKey={kit.roof || 'roof_terracotta'} repeat={[3, 2]} roughness={0.7} />
      </mesh>
      {[-0.28, 0.28].map((fx) => (
        <mesh key={fx} position={[widthM * fx, h1 * 0.4, depthM * 0.28]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, h1 * 0.8, 10]} />
          <TexMat mapKey="stone_limestone" repeat={[1, 2]} />
        </mesh>
      ))}
    </group>
  );
}

function RuralModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const wallH = heightM * 0.55;
  const r = kit.repeat;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[widthM * 1.05, 0.06, depthM * 1.05]} />
        <TexMat mapKey={kit.ground} repeat={[7, 7]} roughness={1} />
      </mesh>
      <mesh position={[0, heightM / 2, -depthM * 0.32]} castShadow>
        <boxGeometry args={[widthM * 0.72, heightM, depthM * 0.28]} />
        <TexMat mapKey={kit.primary} repeat={r} />
      </mesh>
      <mesh position={[-widthM * 0.38, wallH / 2, depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.2, wallH, depthM * 0.55]} />
        <TexMat mapKey={kit.primary} repeat={r} color="#efe6d4" />
      </mesh>
      <mesh position={[widthM * 0.38, wallH / 2, depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.2, wallH, depthM * 0.55]} />
        <TexMat mapKey={kit.primary} repeat={r} color="#efe6d4" />
      </mesh>
      <mesh position={[0, wallH * 0.4, depthM * 0.42]} castShadow>
        <boxGeometry args={[widthM * 0.55, wallH * 0.75, 0.12]} />
        <TexMat mapKey={kit.accent || 'stone_limestone'} repeat={[3, 2]} />
      </mesh>
      <mesh position={[0, heightM + 0.08, -depthM * 0.32]} castShadow>
        <boxGeometry args={[widthM * 0.78, 0.1, depthM * 0.32]} />
        <TexMat mapKey={kit.secondary} repeat={[4, 2]} />
      </mesh>
    </group>
  );
}

function ApartmentModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const floors = 6;
  const fh = heightM * 0.95;
  const r = kit.repeat;
  return (
    <group>
      {Array.from({ length: floors }, (_, i) => (
        <group key={i} position={[0, i * fh + fh / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[widthM * 0.95, fh * 0.92, depthM * 0.7]} />
            <TexMat mapKey={kit.primary} repeat={r} color={i % 2 === 0 ? '#ffffff' : '#f1f5f9'} />
          </mesh>
          <mesh position={[0, 0, depthM * 0.36]}>
            <boxGeometry args={[widthM * 0.85, fh * 0.35, 0.04]} />
            <TexMat mapKey={kit.secondary} repeat={[4, 1]} opacity={0.65} metalness={0.5} roughness={0.15} />
          </mesh>
        </group>
      ))}
      <mesh position={[widthM * 0.35, (floors * fh) / 2, -depthM * 0.15]} castShadow>
        <boxGeometry args={[widthM * 0.18, floors * fh, depthM * 0.25]} />
        <TexMat mapKey={kit.accent || 'metal_panel'} repeat={[1, 6]} metalness={0.4} />
      </mesh>
    </group>
  );
}

function OfficeModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const podiumH = heightM * 1.1;
  const towerH = heightM * 5.5;
  const r = kit.repeat;
  return (
    <group>
      <mesh position={[0, podiumH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[widthM, podiumH, depthM]} />
        <TexMat mapKey="stone_limestone" repeat={[4, 2]} metalness={0.15} />
      </mesh>
      <mesh position={[0, podiumH + towerH / 2, -depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.55, towerH, depthM * 0.55]} />
        <TexMat mapKey={kit.primary} repeat={[2, 8]} opacity={0.78} metalness={0.55} roughness={0.18} />
      </mesh>
      {[-0.2, 0, 0.2].map((fx) => (
        <mesh key={fx} position={[widthM * fx * 0.55, podiumH + towerH / 2, depthM * 0.22]}>
          <boxGeometry args={[0.06, towerH * 0.98, 0.06]} />
          <TexMat mapKey={kit.secondary} repeat={[1, 8]} metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[widthM * 1.3, 0.04, depthM * 1.3]} />
        <TexMat mapKey={kit.ground} repeat={[6, 6]} roughness={0.95} />
      </mesh>
    </group>
  );
}

function ShopModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const r = kit.repeat;
  return (
    <group>
      <mesh position={[0, 0.02, depthM * 0.42]} receiveShadow>
        <boxGeometry args={[widthM * 1.2, 0.05, depthM * 0.25]} />
        <TexMat mapKey={kit.ground} repeat={[5, 2]} roughness={0.95} />
      </mesh>
      <mesh position={[0, heightM / 2, -depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.95, heightM, depthM * 0.85]} />
        <TexMat mapKey={kit.primary} repeat={r} />
      </mesh>
      <mesh position={[0, 0.04, -depthM * 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[widthM * 0.9, depthM * 0.8]} />
        <TexMat mapKey={kit.secondary} repeat={[4, 5]} />
      </mesh>
      <mesh position={[0, heightM * 0.45, depthM * 0.38]} castShadow>
        <boxGeometry args={[widthM * 0.88, heightM * 0.75, 0.08]} />
        <TexMat mapKey={kit.accent || 'glass_facade'} repeat={[3, 2]} opacity={0.5} metalness={0.45} roughness={0.12} />
      </mesh>
      <mesh position={[0, heightM * 0.78, depthM * 0.48]} castShadow>
        <boxGeometry args={[widthM * 1.02, 0.08, depthM * 0.22]} />
        <TexMat mapKey={kit.roof || 'metal_panel'} repeat={[3, 1]} metalness={0.35} />
      </mesh>
      <mesh position={[0, heightM * 0.92, depthM * 0.4]}>
        <boxGeometry args={[widthM * 0.7, 0.28, 0.1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
}

function TombModel({
  widthM,
  depthM,
  heightM,
  kit,
}: Omit<Props, 'domain'> & { kit: DomainTextureKit }) {
  const h = Math.max(0.8, heightM);
  const r = kit.repeat;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry
          args={[Math.max(widthM, depthM) * 0.55, Math.max(widthM, depthM) * 0.62, 0.08, 32]}
        />
        <TexMat mapKey={kit.ground} repeat={[4, 4]} roughness={1} />
      </mesh>
      <mesh position={[0, 0.15, depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.85, 0.22, depthM * 0.7]} />
        <TexMat mapKey={kit.primary} repeat={r} />
      </mesh>
      <mesh position={[0, h * 0.45, -depthM * 0.12]} castShadow>
        <sphereGeometry
          args={[Math.min(widthM, depthM) * 0.28, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <TexMat mapKey={kit.secondary} repeat={[2, 2]} roughness={0.95} />
      </mesh>
      <mesh position={[0, h * 0.55, depthM * 0.22]} castShadow>
        <boxGeometry args={[widthM * 0.22, h * 0.9, 0.1]} />
        <TexMat mapKey={kit.primary} repeat={[1, 2]} />
      </mesh>
      {[-0.2, 0, 0.2].map((fx, i) => (
        <mesh
          key={fx}
          position={[widthM * fx * 0.5, 0.08, depthM * (0.35 + i * 0.02)]}
          castShadow
        >
          <boxGeometry args={[0.25, 0.08, 0.35]} />
          <TexMat mapKey={kit.primary} repeat={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

export function DomainBuilding3D({ domain, widthM, depthM, heightM }: Props) {
  const meta = DOMAIN_MODEL_META[domain] || DOMAIN_MODEL_META.residential;
  const kit = DOMAIN_TEXTURE_KITS[domain] || DOMAIN_TEXTURE_KITS.residential;
  const w = Math.max(4, widthM);
  const d = Math.max(4, depthM);
  const h = Math.max(1.2, heightM);

  // Warm ground under every model using domain kit
  const groundKey = kit.ground;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[Math.max(w, d) * 0.95, 48]} />
        <TexMat mapKey={groundKey} repeat={[6, 6]} roughness={0.95} color={meta.groundColor} />
      </mesh>

      {domain === 'residential' ? (
        <ResidentialModel widthM={w} depthM={d} heightM={h} kit={kit} />
      ) : null}
      {domain === 'villa' ? <VillaModel widthM={w} depthM={d} heightM={h} kit={kit} /> : null}
      {domain === 'rural' ? <RuralModel widthM={w} depthM={d} heightM={h} kit={kit} /> : null}
      {domain === 'apartment' ? (
        <ApartmentModel widthM={w} depthM={d} heightM={h} kit={kit} />
      ) : null}
      {domain === 'office' ? <OfficeModel widthM={w} depthM={d} heightM={h} kit={kit} /> : null}
      {domain === 'shop' ? <ShopModel widthM={w} depthM={d} heightM={h} kit={kit} /> : null}
      {domain === 'tomb' ? <TombModel widthM={w} depthM={d} heightM={h} kit={kit} /> : null}
    </group>
  );
}

export function domainCameraHint(
  domain: SpaceActiveDomain,
  widthM: number,
  depthM: number,
  heightM: number,
) {
  const meta = DOMAIN_MODEL_META[domain];
  const span = Math.max(widthM, depthM);
  if (domain === 'apartment' || domain === 'office') {
    return {
      position: [span * 1.1, heightM * (domain === 'office' ? 4 : 3.2), span * 1.2] as [
        number,
        number,
        number,
      ],
      target: [0, heightM * (domain === 'office' ? 2.2 : 1.8), 0] as [number, number, number],
      maxDistance: meta.fogFar,
    };
  }
  if (domain === 'tomb') {
    return {
      position: [span * 0.9, 3.2, span * 1.1] as [number, number, number],
      target: [0, 0.5, 0] as [number, number, number],
      maxDistance: 22,
    };
  }
  return {
    position: [widthM * 0.95, heightM * 1.7, depthM * 1.15] as [number, number, number],
    target: [0, heightM * 0.45, 0] as [number, number, number],
    maxDistance: meta.fogFar * 0.7,
  };
}
