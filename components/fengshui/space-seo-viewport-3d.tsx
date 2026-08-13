'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceLabState, SpaceSimResult } from '@/lib/fengshui/space';
import { heatmapColor, pickLayerGrid } from '@/lib/fengshui/space';

const FACE_XZ: Record<string, [number, number]> = {
  北: [0, -1],
  东北: [0.71, -0.71],
  东: [1, 0],
  东南: [0.71, 0.71],
  南: [0, 1],
  西南: [-0.71, 0.71],
  西: [-1, 0],
  西北: [-0.71, -0.71],
};

const ZONE_COLOR: Record<string, string> = {
  living: '#e8d48b',
  bedroom: '#d4a574',
  bath: '#c5d4e8',
  kitchen: '#ddd0c0',
  balcony: '#e7efd8',
  corridor: '#ece6dc',
  storage: '#d7cfc4',
  shop: '#f0e6d4',
  office: '#d5deea',
  yard: '#c5d6b4',
  other: '#d8d2c8',
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
        const [r, g, b, a] = heatmapColor(v, 210);
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[widthM, depthM]} />
      <meshStandardMaterial map={texture} transparent opacity={0.55} roughness={0.9} />
    </mesh>
  );
}

function WallSegment({
  length,
  height,
  thickness,
  door,
}: {
  length: number;
  height: number;
  thickness: number;
  door: boolean;
}) {
  if (!door || length < 1.6) {
    return (
      <mesh>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial color="#ece7dc" roughness={0.68} />
      </mesh>
    );
  }
  const gap = Math.min(0.82, length * 0.32);
  const side = (length - gap) / 2;
  return (
    <group>
      <mesh position={[-(gap / 2 + side / 2), 0, 0]}>
        <boxGeometry args={[side, height, thickness]} />
        <meshStandardMaterial color="#ece7dc" roughness={0.68} />
      </mesh>
      <mesh position={[gap / 2 + side / 2, 0, 0]}>
        <boxGeometry args={[side, height, thickness]} />
        <meshStandardMaterial color="#ece7dc" roughness={0.68} />
      </mesh>
    </group>
  );
}

function RoomFurniture({ kind, w, d }: { kind: string; w: number; d: number }) {
  if (kind === 'bedroom') {
    return (
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[Math.min(w * 0.42, 1.9), 0.26, Math.min(d * 0.52, 2)]} />
        <meshStandardMaterial color="#8b6b4a" roughness={0.8} />
      </mesh>
    );
  }
  if (kind === 'living') {
    return (
      <group>
        <mesh position={[0, 0.2, d * 0.22]} castShadow>
          <boxGeometry args={[Math.min(w * 0.52, 2.3), 0.36, 0.42]} />
          <meshStandardMaterial color="#6b7280" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.16, -0.05]} castShadow>
          <boxGeometry args={[0.72, 0.28, 0.72]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'kitchen') {
    return (
      <mesh position={[0, 0.28, -d * 0.26]} castShadow>
        <boxGeometry args={[Math.max(0.8, w * 0.62), 0.52, 0.42]} />
        <meshStandardMaterial color="#78716c" roughness={0.7} />
      </mesh>
    );
  }
  if (kind === 'bath') {
    return (
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.52, 0.26, Math.min(0.85, d * 0.45)]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.55} />
      </mesh>
    );
  }
  if (kind === 'office') {
    return (
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[Math.min(1.4, w * 0.45), 0.4, 0.7]} />
        <meshStandardMaterial color="#57534e" roughness={0.7} />
      </mesh>
    );
  }
  return null;
}

function DollhouseRoom({
  zone,
  widthM,
  depthM,
}: {
  zone: NonNullable<SpaceLabState['floorZones']>[number];
  widthM: number;
  depthM: number;
}) {
  const openAir = zone.kind === 'balcony' || zone.kind === 'yard' || zone.kind === 'corridor';
  const wallH = zone.kind === 'balcony' || zone.kind === 'yard' ? 0.28 : zone.kind === 'corridor' ? 0 : 0.92;
  const t = 0.05;
  const w = Math.max(0.35, zone.w * widthM);
  const d = Math.max(0.35, zone.h * depthM);
  const cx = (zone.x + zone.w / 2 - 0.5) * widthM;
  const cz = (zone.y + zone.h / 2 - 0.5) * depthM;
  const color = ZONE_COLOR[zone.kind] || ZONE_COLOR.other;
  const label =
    zone.label ||
    ({
      living: '客厅',
      bedroom: '卧室',
      bath: '卫',
      kitchen: '厨',
      balcony: '阳台',
      corridor: '',
      storage: '储',
      shop: '铺',
      office: '办公',
      yard: '院',
    }[zone.kind] || '');

  const doorSide =
    Math.abs(cx) >= Math.abs(cz) ? (cx >= 0 ? 'west' : 'east') : cz >= 0 ? 'north' : 'south';

  return (
    <group position={[cx, 0, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[w * 0.98, d * 0.98]} />
        <meshStandardMaterial color={color} roughness={0.82} transparent opacity={openAir ? 0.55 : 0.88} />
      </mesh>
      {wallH > 0 ? (
        <>
          <group position={[0, wallH / 2, -d / 2 + t / 2]}>
            <WallSegment length={w} height={wallH} thickness={t} door={doorSide === 'north'} />
          </group>
          <group position={[0, wallH / 2, d / 2 - t / 2]}>
            <WallSegment length={w} height={wallH} thickness={t} door={doorSide === 'south'} />
          </group>
          <group position={[-w / 2 + t / 2, wallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <WallSegment length={d} height={wallH} thickness={t} door={doorSide === 'west'} />
          </group>
          <group position={[w / 2 - t / 2, wallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <WallSegment length={d} height={wallH} thickness={t} door={doorSide === 'east'} />
          </group>
        </>
      ) : null}
      <RoomFurniture kind={zone.kind} w={w} d={d} />
      {label && w > 1.05 && d > 1.05 ? (
        <Html position={[0, Math.max(wallH, 0.35) + 0.1, 0]} center distanceFactor={11} occlude={false}>
          <div className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white">
            {label}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function FacingPosts({
  widthM,
  depthM,
  enhance,
  reduce,
}: {
  widthM: number;
  depthM: number;
  enhance: string[];
  reduce: string[];
}) {
  const seen = new Set<string>();
  const items: Array<{ f: string; kind: 'yong' | 'ji' }> = [];
  for (const f of enhance) {
    if (!FACE_XZ[f] || seen.has(f)) continue;
    seen.add(f);
    items.push({ f, kind: 'yong' });
  }
  for (const f of reduce) {
    if (!FACE_XZ[f] || seen.has(f)) continue;
    seen.add(f);
    items.push({ f, kind: 'ji' });
  }
  return (
    <group>
      {items.map(({ f, kind }) => {
        const dir = FACE_XZ[f];
        const x = dir[0] * widthM * 0.52;
        const z = dir[1] * depthM * 0.52;
        const h = kind === 'yong' ? 1.55 : 0.95;
        const color = kind === 'yong' ? '#f8fafc' : '#64748b';
        return (
          <group key={`${kind}-${f}`} position={[x, h / 2, z]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.06, h, 10]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={kind === 'yong' ? 0.35 : 0.08} />
            </mesh>
            <Html position={[0, h / 2 + 0.12, 0]} center occlude={false} distanceFactor={12}>
              <div className="text-[10px] font-bold text-white/90">{kind === 'yong' ? `用·${f}` : `忌·${f}`}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function EntranceMarker({
  facing,
  widthM,
  depthM,
}: {
  facing: string;
  widthM: number;
  depthM: number;
}) {
  const dir = FACE_XZ[facing] || FACE_XZ.南;
  const x = dir[0] * widthM * 0.5;
  const z = dir[1] * depthM * 0.5;
  return (
    <group position={[x, 0.08, z]}>
      <mesh>
        <boxGeometry args={[0.9, 0.12, 0.28]} />
        <meshStandardMaterial color="#ea580c" emissive="#c2410c" emissiveIntensity={0.25} />
      </mesh>
      <Html position={[0, 0.35, 0]} center occlude={false} distanceFactor={12}>
        <div className="rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white">入口·{facing}</div>
      </Html>
    </group>
  );
}

function Scene({
  state,
  result,
  highlightFacings,
  reduceFacings,
}: {
  state: SpaceLabState;
  result: SpaceSimResult;
  highlightFacings?: string[];
  reduceFacings?: string[];
}) {
  const { widthM, depthM } = state.room;
  const span = Math.max(widthM, depthM, 6);
  const layer = pickLayerGrid(result.grids, state.activeLayer);
  const zones = state.floorZones || [];

  return (
    <>
      <color attach="background" args={['#0b0e14']} />
      <fog attach="fog" args={['#0b0e14', 14, 38]} />
      <PerspectiveCamera makeDefault position={[span * 0.55, span * 1.05, span * 0.55]} fov={36} />
      <ambientLight intensity={0.7} />
      <directionalLight castShadow position={[10, 16, 8]} intensity={1.15} />
      <hemisphereLight args={['#dbeafe', '#44403c', 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <circleGeometry args={[span * 1.2, 56]} />
        <meshStandardMaterial color="#b08968" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[widthM + 0.35, depthM + 0.35]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.88} />
      </mesh>

      <HeatFloor grids={result.grids} layer={layer} widthM={widthM} depthM={depthM} />

      {zones.map((z) => (
        <DollhouseRoom key={z.id} zone={z} widthM={widthM} depthM={depthM} />
      ))}

      <EntranceMarker facing={state.room.entranceFacing} widthM={widthM} depthM={depthM} />
      <FacingPosts
        widthM={widthM}
        depthM={depthM}
        enhance={highlightFacings || []}
        reduce={reduceFacings || []}
      />

      <OrbitControls
        makeDefault
        enableDamping
        autoRotate
        autoRotateSpeed={0.45}
        target={[0, 0.2, 0]}
        minPolarAngle={0.28}
        maxPolarAngle={0.98}
        minDistance={span * 0.7}
        maxDistance={span * 2.4}
      />
    </>
  );
}

export function SpaceSeoViewport3D({
  state,
  result,
  highlightFacings,
  reduceFacings,
}: {
  state: SpaceLabState;
  result: SpaceSimResult;
  highlightFacings?: string[];
  reduceFacings?: string[];
}) {
  return (
    <div className="relative h-full w-full">
      <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true, alpha: false }}>
        <Scene
          state={state}
          result={result}
          highlightFacings={highlightFacings}
          reduceFacings={reduceFacings}
        />
      </Canvas>
    </div>
  );
}
