'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceActiveDomain, SpaceLabState, SpaceSimResult } from '@/lib/fengshui/space';
import { heatmapColor, pickLayerGrid } from '@/lib/fengshui/space';
import { DOMAIN_MODEL_META } from '@/lib/fengshui/space/domain-models';
import { DomainBuilding3D, domainCameraHint } from './domain-building-3d';

type Props = {
  state: SpaceLabState;
  result: SpaceSimResult;
};

function HeatFloor({
  grids,
  layer,
  widthM,
  depthM,
}: {
  grids: SpaceSimResult['grids'];
  layer: Float32Array;
  widthM: number;
  depthM: number;
}) {
  const texture = useMemo(() => {
    const w = grids.width;
    const h = grids.height;
    const data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = layer[(h - 1 - y) * w + x];
        const [r, g, b, a] = heatmapColor(v, 230);
        const i = (y * w + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
      }
    }
    const tex = new THREE.DataTexture(data, w, h);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, [grids.width, grids.height, layer]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
      <planeGeometry args={[widthM * 0.92, depthM * 0.92]} />
      <meshStandardMaterial map={texture} transparent opacity={0.78} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function Structures({
  structures,
  widthM,
  depthM,
  heightM,
}: {
  structures: SpaceLabState['structures'];
  widthM: number;
  depthM: number;
  heightM: number;
}) {
  return (
    <group>
      {structures.map((s) => {
        const x = (s.x + s.w / 2 - 0.5) * widthM;
        const z = (s.y + s.h / 2 - 0.5) * depthM;
        const w = Math.max(0.2, s.w * widthM);
        const d = Math.max(0.2, s.h * depthM);
        const h = s.kind === 'column' ? heightM * 0.85 : heightM * 0.45;
        return (
          <mesh key={s.id} position={[x, h / 2 + 0.05, z]} castShadow>
            {s.kind === 'column' ? (
              <cylinderGeometry args={[Math.min(w, d) / 2, Math.min(w, d) / 2, h, 16]} />
            ) : (
              <boxGeometry args={[w, h, d]} />
            )}
            <meshStandardMaterial color="#6b7280" transparent opacity={0.45} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function Vents({
  vents,
  widthM,
  depthM,
}: {
  vents: SpaceLabState['vents'];
  widthM: number;
  depthM: number;
}) {
  return (
    <group>
      {vents
        .filter((v) => v.enabled)
        .map((v) => {
          const x = (v.x - 0.5) * widthM;
          const z = (v.y - 0.5) * depthM;
          const color = v.kind === 'inlet' ? '#4ade80' : '#38bdf8';
          return (
            <mesh key={v.id} position={[x, 0.2, z]}>
              <sphereGeometry args={[0.16, 14, 14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
            </mesh>
          );
        })}
    </group>
  );
}

function DriftFogParticles({
  count = 400,
  accent = '#fbbf24',
  spread = 10,
}: {
  count?: number;
  accent?: string;
  spread?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = Math.random() * 2.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.85;
    }
    return arr;
  }, [count, spread]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + dt * 0.08;
      if (y > 2.9) y = 0.05;
      attr.setY(i, y);
      attr.setX(i, attr.getX(i) + Math.sin(i + y) * dt * 0.03);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color={accent}
        transparent
        opacity={0.2}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function ScaleBar({ widthM }: { widthM: number }) {
  const len = Math.min(5, Math.max(2, Math.round(widthM / 3)));
  return (
    <group position={[-widthM * 0.4, 0.06, widthM * 0.42]}>
      <mesh>
        <boxGeometry args={[len, 0.04, 0.08]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[-len / 2, 0.08, 0]}>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[len / 2, 0.08, 0]}>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

function Scene({ state, result }: Props) {
  const domain = (state.activeDomain || 'residential') as SpaceActiveDomain;
  const meta = DOMAIN_MODEL_META[domain];
  const layer = pickLayerGrid(result.grids, state.activeLayer);
  const { widthM, depthM, heightM } = state.room;
  const cam = domainCameraHint(domain, widthM, depthM, heightM);

  return (
    <>
      <color attach="background" args={['#0b0e14']} />
      <fog attach="fog" args={['#0b0e14', 10, meta.fogFar]} />
      <PerspectiveCamera makeDefault position={cam.position} fov={42} />
      <ambientLight intensity={0.42} />
      <directionalLight
        castShadow
        position={[8, 14, 6]}
        intensity={1.15}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 3, 3]} intensity={0.35} color={meta.accentColor} />

      <DomainBuilding3D domain={domain} widthM={widthM} depthM={depthM} heightM={heightM} />
      {/* 室内热力叠层：住宅/商铺等展示；阴宅略抬高示意 */}
      <HeatFloor grids={result.grids} layer={layer} widthM={widthM} depthM={depthM} />
      <Structures structures={state.structures} widthM={widthM} depthM={depthM} heightM={heightM} />
      <Vents vents={state.vents} widthM={widthM} depthM={depthM} />
      <DriftFogParticles
        count={meta.particleCount}
        accent={meta.accentColor}
        spread={Math.max(widthM, depthM) * 1.1}
      />
      {state.proMode ? <ScaleBar widthM={widthM} /> : null}

      <OrbitControls
        makeDefault
        enableDamping
        maxPolarAngle={Math.PI / 2.02}
        minDistance={2.5}
        maxDistance={cam.maxDistance}
        target={cam.target}
      />
    </>
  );
}

export function SpaceViewport3D({ state, result }: Props) {
  const domain = (state.activeDomain || 'residential') as SpaceActiveDomain;
  const meta = DOMAIN_MODEL_META[domain];

  return (
    <div className="relative h-full w-full">
      <Canvas
        key={domain}
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene state={state} result={result} />
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 max-w-[70%] rounded-md bg-black/55 px-2 py-1 text-[10px] leading-snug text-white/90">
        <div className="font-semibold text-amber-200/95">
          {meta.label} · {meta.modelName}
        </div>
        <div className="text-white/55">{meta.blurb} · 拖拽旋转 / 滚轮缩放</div>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 text-[10px] text-white/45">
        层：{state.activeLayer} · {result.meta.dizhiHour}时 · {result.meta.nineStarLabel}
        {state.proMode ? ' · PRO' : ''}
      </div>
    </div>
  );
}
