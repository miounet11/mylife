'use client';

/**
 * Domain-specific procedural Three.js massing models.
 * Professional schematic only (not BIM). Switches with activeDomain.
 */

import type { SpaceActiveDomain } from '@/lib/fengshui/space/types';
import { DOMAIN_MODEL_META } from '@/lib/fengshui/space/domain-models';

type Props = {
  domain: SpaceActiveDomain;
  widthM: number;
  depthM: number;
  heightM: number;
};

function Mat({
  color,
  opacity = 1,
  metalness = 0.1,
  roughness = 0.75,
}: {
  color: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

function ResidentialModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  const hw = widthM / 2;
  const hd = depthM / 2;
  return (
    <group>
      <mesh position={[0, heightM / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[widthM * 0.96, heightM, depthM * 0.92]} />
        <Mat color="#e7e2d8" roughness={0.85} />
      </mesh>
      <mesh position={[0, heightM * 0.35, hd * 0.55]} castShadow>
        <boxGeometry args={[widthM * 0.55, 0.12, depthM * 0.22]} />
        <Mat color="#94a3b8" metalness={0.25} />
      </mesh>
      <mesh position={[0, heightM * 0.55, hd * 0.62]}>
        <boxGeometry args={[widthM * 0.5, heightM * 0.35, 0.06]} />
        <Mat color="#bae6fd" opacity={0.45} metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[-hw * 0.15, heightM * 0.45, 0]}>
        <boxGeometry args={[0.08, heightM * 0.85, depthM * 0.5]} />
        <Mat color="#d6d3d1" opacity={0.5} />
      </mesh>
    </group>
  );
}

function VillaModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  const h1 = heightM;
  const h2 = heightM * 0.85;
  return (
    <group>
      <mesh position={[0, 0.05, depthM * 0.15]} receiveShadow>
        <boxGeometry args={[widthM * 1.15, 0.1, depthM * 1.2]} />
        <Mat color="#86a36a" roughness={0.95} />
      </mesh>
      <mesh position={[0, h1 / 2, -depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.9, h1, depthM * 0.75]} />
        <Mat color="#f5f0e6" />
      </mesh>
      <mesh position={[0, h1 + h2 / 2, -depthM * 0.08]} castShadow>
        <boxGeometry args={[widthM * 0.72, h2, depthM * 0.55]} />
        <Mat color="#efe8db" />
      </mesh>
      <mesh position={[0, h1 + h2 + 0.35, -depthM * 0.08]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[widthM * 0.55, 0.12, depthM * 0.6]} />
        <Mat color="#9a3412" roughness={0.7} />
      </mesh>
      <mesh position={[0, h1 + h2 + 0.35, -depthM * 0.08]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[widthM * 0.55, 0.12, depthM * 0.6]} />
        <Mat color="#9a3412" roughness={0.7} />
      </mesh>
      {[-0.28, 0.28].map((fx) => (
        <mesh key={fx} position={[widthM * fx, h1 * 0.4, depthM * 0.28]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, h1 * 0.8, 10]} />
          <Mat color="#d6d3d1" />
        </mesh>
      ))}
    </group>
  );
}

function RuralModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  const wallH = heightM * 0.55;
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[widthM * 1.05, 0.06, depthM * 1.05]} />
        <Mat color="#c4b59a" roughness={1} />
      </mesh>
      <mesh position={[0, heightM / 2, -depthM * 0.32]} castShadow>
        <boxGeometry args={[widthM * 0.72, heightM, depthM * 0.28]} />
        <Mat color="#e7dcc8" />
      </mesh>
      <mesh position={[-widthM * 0.38, wallH / 2, depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.2, wallH, depthM * 0.55]} />
        <Mat color="#ddd2be" />
      </mesh>
      <mesh position={[widthM * 0.38, wallH / 2, depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.2, wallH, depthM * 0.55]} />
        <Mat color="#ddd2be" />
      </mesh>
      <mesh position={[0, wallH * 0.4, depthM * 0.42]} castShadow>
        <boxGeometry args={[widthM * 0.55, wallH * 0.75, 0.12]} />
        <Mat color="#a8a29e" />
      </mesh>
      {[-0.18, 0.18].map((fx) => (
        <mesh key={fx} position={[widthM * fx, wallH * 0.55, depthM * 0.48]} castShadow>
          <boxGeometry args={[0.18, wallH * 1.1, 0.18]} />
          <Mat color="#78716c" />
        </mesh>
      ))}
    </group>
  );
}

function ApartmentModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  const floors = 6;
  const fh = heightM * 0.95;
  return (
    <group>
      {Array.from({ length: floors }, (_, i) => (
        <group key={i} position={[0, i * fh + fh / 2, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[widthM * 0.95, fh * 0.92, depthM * 0.7]} />
            <Mat color={i % 2 === 0 ? '#e2e8f0' : '#f1f5f9'} />
          </mesh>
          <mesh position={[0, 0, depthM * 0.36]}>
            <boxGeometry args={[widthM * 0.85, fh * 0.35, 0.04]} />
            <Mat color="#7dd3fc" opacity={0.55} metalness={0.5} roughness={0.15} />
          </mesh>
        </group>
      ))}
      <mesh position={[widthM * 0.35, (floors * fh) / 2, -depthM * 0.15]} castShadow>
        <boxGeometry args={[widthM * 0.18, floors * fh, depthM * 0.25]} />
        <Mat color="#94a3b8" />
      </mesh>
    </group>
  );
}

function OfficeModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  const podiumH = heightM * 1.1;
  const towerH = heightM * 5.5;
  return (
    <group>
      <mesh position={[0, podiumH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[widthM, podiumH, depthM]} />
        <Mat color="#cbd5e1" metalness={0.2} />
      </mesh>
      <mesh position={[0, podiumH + towerH / 2, -depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.55, towerH, depthM * 0.55]} />
        <Mat color="#bae6fd" opacity={0.72} metalness={0.55} roughness={0.18} />
      </mesh>
      {[-0.2, 0, 0.2].map((fx) => (
        <mesh key={fx} position={[widthM * fx * 0.55, podiumH + towerH / 2, depthM * 0.22]}>
          <boxGeometry args={[0.06, towerH * 0.98, 0.06]} />
          <Mat color="#e2e8f0" metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, podiumH + towerH + 0.15, -depthM * 0.05]}>
        <boxGeometry args={[widthM * 0.5, 0.25, depthM * 0.5]} />
        <Mat color="#0f172a" />
      </mesh>
    </group>
  );
}

function ShopModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  return (
    <group>
      <mesh position={[0, 0.02, depthM * 0.42]} receiveShadow>
        <boxGeometry args={[widthM * 1.2, 0.05, depthM * 0.25]} />
        <Mat color="#a8a29e" roughness={0.95} />
      </mesh>
      <mesh position={[0, heightM / 2, -depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.95, heightM, depthM * 0.85]} />
        <Mat color="#f5f5f4" />
      </mesh>
      <mesh position={[0, heightM * 0.45, depthM * 0.38]} castShadow>
        <boxGeometry args={[widthM * 0.88, heightM * 0.75, 0.08]} />
        <Mat color="#38bdf8" opacity={0.4} metalness={0.45} roughness={0.12} />
      </mesh>
      <mesh position={[0, heightM * 0.78, depthM * 0.48]} castShadow>
        <boxGeometry args={[widthM * 1.02, 0.08, depthM * 0.22]} />
        <Mat color="#f59e0b" metalness={0.15} />
      </mesh>
      <mesh position={[0, heightM * 0.92, depthM * 0.4]}>
        <boxGeometry args={[widthM * 0.7, 0.28, 0.1]} />
        <Mat color="#0f172a" />
      </mesh>
      <mesh position={[0, heightM * 0.4, -depthM * 0.38]}>
        <boxGeometry args={[widthM * 0.7, heightM * 0.7, depthM * 0.2]} />
        <Mat color="#d6d3d1" opacity={0.85} />
      </mesh>
    </group>
  );
}

function TombModel({ widthM, depthM, heightM }: Omit<Props, 'domain'>) {
  const h = Math.max(0.8, heightM);
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry
          args={[Math.max(widthM, depthM) * 0.55, Math.max(widthM, depthM) * 0.62, 0.08, 32]}
        />
        <Mat color="#57534e" roughness={1} />
      </mesh>
      <mesh position={[0, 0.15, depthM * 0.05]} castShadow>
        <boxGeometry args={[widthM * 0.85, 0.22, depthM * 0.7]} />
        <Mat color="#78716c" />
      </mesh>
      <mesh position={[0, h * 0.45, -depthM * 0.12]} castShadow>
        <sphereGeometry
          args={[Math.min(widthM, depthM) * 0.28, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <Mat color="#6b7280" roughness={0.95} />
      </mesh>
      <mesh position={[0, h * 0.55, depthM * 0.22]} castShadow>
        <boxGeometry args={[widthM * 0.22, h * 0.9, 0.1]} />
        <Mat color="#a8a29e" metalness={0.05} />
      </mesh>
      {[-0.2, 0, 0.2].map((fx, i) => (
        <mesh
          key={fx}
          position={[widthM * fx * 0.5, 0.08, depthM * (0.35 + i * 0.02)]}
          castShadow
        >
          <boxGeometry args={[0.25, 0.08, 0.35]} />
          <Mat color="#57534e" />
        </mesh>
      ))}
      <mesh position={[0, 0.28, depthM * 0.32]} castShadow>
        <boxGeometry args={[widthM * 0.35, 0.12, 0.2]} />
        <Mat color="#44403c" />
      </mesh>
    </group>
  );
}

export function DomainBuilding3D({ domain, widthM, depthM, heightM }: Props) {
  const meta = DOMAIN_MODEL_META[domain] || DOMAIN_MODEL_META.residential;
  const w = Math.max(4, widthM);
  const d = Math.max(4, depthM);
  const h = Math.max(1.2, heightM);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[Math.max(w, d) * 0.95, 48]} />
        <meshStandardMaterial color={meta.groundColor} roughness={0.95} />
      </mesh>

      {domain === 'residential' ? <ResidentialModel widthM={w} depthM={d} heightM={h} /> : null}
      {domain === 'villa' ? <VillaModel widthM={w} depthM={d} heightM={h} /> : null}
      {domain === 'rural' ? <RuralModel widthM={w} depthM={d} heightM={h} /> : null}
      {domain === 'apartment' ? <ApartmentModel widthM={w} depthM={d} heightM={h} /> : null}
      {domain === 'office' ? <OfficeModel widthM={w} depthM={d} heightM={h} /> : null}
      {domain === 'shop' ? <ShopModel widthM={w} depthM={d} heightM={h} /> : null}
      {domain === 'tomb' ? <TombModel widthM={w} depthM={d} heightM={h} /> : null}
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
