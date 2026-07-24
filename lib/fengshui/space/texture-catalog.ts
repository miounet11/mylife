/**
 * Space Lab material textures (AI-generated seamless maps)
 * Served from /images/fengshui-space/textures/
 */

import type { SpaceActiveDomain } from './types';

const BASE = '/images/fengshui-space/textures';

export type TextureKey =
  | 'floor_wood'
  | 'floor_granite'
  | 'floor_tile'
  | 'wall_plaster'
  | 'glass_facade'
  | 'roof_terracotta'
  | 'roof_shingle'
  | 'ground_earth'
  | 'ground_grass'
  | 'sidewalk_asphalt'
  | 'stone_limestone'
  | 'metal_panel';

export const TEXTURE_URLS: Record<TextureKey, string> = {
  floor_wood: `${BASE}/floor_wood.jpg`,
  floor_granite: `${BASE}/floor_granite.jpg`,
  floor_tile: `${BASE}/floor_tile.jpg`,
  wall_plaster: `${BASE}/wall_plaster.jpg`,
  glass_facade: `${BASE}/glass_facade.jpg`,
  roof_terracotta: `${BASE}/roof_terracotta.jpg`,
  roof_shingle: `${BASE}/roof_shingle.jpg`,
  ground_earth: `${BASE}/ground_earth.jpg`,
  ground_grass: `${BASE}/ground_grass.jpg`,
  sidewalk_asphalt: `${BASE}/sidewalk_asphalt.jpg`,
  stone_limestone: `${BASE}/stone_limestone.jpg`,
  metal_panel: `${BASE}/metal_panel.jpg`,
};

/** Per-domain material kit for Three.js */
export type DomainTextureKit = {
  ground: TextureKey;
  primary: TextureKey;
  secondary: TextureKey;
  accent?: TextureKey;
  roof?: TextureKey;
  repeat: [number, number];
};

export const DOMAIN_TEXTURE_KITS: Record<SpaceActiveDomain, DomainTextureKit> = {
  residential: {
    ground: 'floor_wood',
    primary: 'wall_plaster',
    secondary: 'floor_wood',
    accent: 'glass_facade',
    repeat: [3, 3],
  },
  villa: {
    ground: 'ground_grass',
    primary: 'wall_plaster',
    secondary: 'floor_wood',
    roof: 'roof_terracotta',
    accent: 'glass_facade',
    repeat: [4, 4],
  },
  rural: {
    ground: 'ground_earth',
    primary: 'wall_plaster',
    secondary: 'roof_terracotta',
    accent: 'stone_limestone',
    repeat: [5, 5],
  },
  apartment: {
    ground: 'sidewalk_asphalt',
    primary: 'wall_plaster',
    secondary: 'glass_facade',
    accent: 'metal_panel',
    repeat: [4, 4],
  },
  office: {
    ground: 'sidewalk_asphalt',
    primary: 'glass_facade',
    secondary: 'metal_panel',
    accent: 'floor_granite',
    repeat: [3, 6],
  },
  shop: {
    ground: 'sidewalk_asphalt',
    primary: 'wall_plaster',
    secondary: 'floor_tile',
    accent: 'glass_facade',
    roof: 'metal_panel',
    repeat: [3, 3],
  },
  tomb: {
    ground: 'ground_earth',
    primary: 'stone_limestone',
    secondary: 'floor_granite',
    accent: 'metal_panel',
    repeat: [2, 2],
  },
};

export function allTextureUrls(): string[] {
  return Object.values(TEXTURE_URLS);
}
