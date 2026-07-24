'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceLabState, SpaceSimResult } from '@/lib/fengshui/space';
import { heatmapColor, pickLayerGrid } from '@/lib/fengshui/space';

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
        // flip y for three texture
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[widthM, depthM]} />
      <meshStandardMaterial map={texture} transparent opacity={0.92} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function RoomShell({ widthM, depthM, heightM }: { widthM: number; depthM: number; heightM: number }) {
  const hw = widthM / 2;
  const hd = depthM / 2;
  const wallMat = <meshStandardMaterial color="#f2f0ea" transparent opacity={0.55} side={THREE.DoubleSide} />;
  const t = 0.08;
  return (
    <group>
      {/* floor plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[widthM + 0.2, depthM + 0.2]} />
        <meshStandardMaterial color="#dcd6c8" roughness={0.9} />
      </mesh>
      {/* walls */}
      <mesh position={[0, heightM / 2, -hd]} castShadow>
        <boxGeometry args={[widthM, heightM, t]} />
        {wallMat}
      </mesh>
      <mesh position={[0, heightM / 2, hd]} castShadow>
        <boxGeometry args={[widthM, heightM, t]} />
        {wallMat}
      </mesh>
      <mesh position={[-hw, heightM / 2, 0]} castShadow>
        <boxGeometry args={[t, heightM, depthM]} />
        {wallMat}
      </mesh>
      <mesh position={[hw, heightM / 2, 0]} castShadow>
        <boxGeometry args={[t, heightM, depthM]} />
        {wallMat}
      </mesh>
    </group>
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
          <mesh key={s.id} position={[x, h / 2, z]} castShadow>
            {s.kind === 'column' ? (
              <cylinderGeometry args={[Math.min(w, d) / 2, Math.min(w, d) / 2, h, 16]} />
            ) : (
              <boxGeometry args={[w, h, d]} />
            )}
            <meshStandardMaterial color="#6b7280" transparent opacity={0.55} roughness={0.7} />
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
            <mesh key={v.id} position={[x, 0.15, z]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
            </mesh>
          );
        })}
    </group>
  );
}

function DriftFogParticles({ count = 400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = Math.random() * 2.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + dt * 0.08;
      if (y > 2.6) y = 0.05;
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
        size={0.06}
        color="#fbbf24"
        transparent
        opacity={0.22}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function Scene({ state, result }: Props) {
  const layer = pickLayerGrid(result.grids, state.activeLayer);
  const { widthM, depthM, heightM } = state.room;

  return (
    <>
      <color attach="background" args={['#0b0e14']} />
      <fog attach="fog" args={['#0b0e14', 8, 28]} />
      <PerspectiveCamera makeDefault position={[widthM * 0.9, heightM * 1.6, depthM * 1.1]} fov={45} />
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[6, 10, 4]}
        intensity={1.1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 2.5, 2]} intensity={0.35} color="#93c5fd" />

      <RoomShell widthM={widthM} depthM={depthM} heightM={heightM} />
      <HeatFloor grids={result.grids} layer={layer} widthM={widthM} depthM={depthM} />
      <Structures structures={state.structures} widthM={widthM} depthM={depthM} heightM={heightM} />
      <Vents vents={state.vents} widthM={widthM} depthM={depthM} />
      <DriftFogParticles count={480} />

      <OrbitControls
        makeDefault
        enableDamping
        maxPolarAngle={Math.PI / 2.05}
        minDistance={3}
        maxDistance={24}
        target={[0, 0.6, 0]}
      />
    </>
  );
}

export function SpaceViewport3D({ state, result }: Props) {
  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
        <Scene state={state} result={result} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 text-[11px] text-white/80">
        Three.js 真 3D · 墙体 + 体积雾粒子 · 拖拽旋转 / 滚轮缩放
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-white/45">
        层：{state.activeLayer} · {result.meta.dizhiHour}时 · {result.meta.nineStarLabel}
      </div>
    </div>
  );
}
