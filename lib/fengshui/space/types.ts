/** 空间场模拟器类型 — 结构近似场，非物理 CFD */

export type FieldLayer = 'energy' | 'wind' | 'light' | 'nineStar';

export type VentKind = 'inlet' | 'outlet';

export interface SpaceVent {
  id: string;
  kind: VentKind;
  /** normalized 0-1 room coords */
  x: number;
  y: number;
  /** degrees, 0 = east, counter-clockwise in screen math uses azimuth */
  azimuthDeg: number;
  spreadDeg: number;
  speed: number;
  intensity: number;
  halfLifeSec: number;
  enabled: boolean;
}

export interface SpaceLight {
  id: string;
  /** normalized 0-1 */
  x: number;
  y: number;
  azimuthDeg: number;
  intensity: number;
  /** if true, azimuth follows clock hour */
  followSun: boolean;
  label: string;
  enabled: boolean;
}

export interface SpaceStructure {
  id: string;
  kind: 'box' | 'column' | 'arc';
  x: number;
  y: number;
  w: number;
  h: number;
  block: number;
}

export interface SpaceRoom {
  /** meters */
  widthM: number;
  depthM: number;
  heightM: number;
  /** facing of main entrance: 东/东南/... */
  entranceFacing: string;
  /** rotation of plan relative to north, degrees */
  planRotationDeg: number;
}

export interface SpaceTimeState {
  /** 0-23 */
  hour: number;
  minute: number;
  /** follow system clock */
  followClock: boolean;
  year: number;
  month: number;
  day: number;
  nineStarEnabled: boolean;
  tideBoost: number;
}

export interface SpaceLabState {
  room: SpaceRoom;
  vents: SpaceVent[];
  lights: SpaceLight[];
  structures: SpaceStructure[];
  time: SpaceTimeState;
  activeLayer: FieldLayer;
  showCompass: boolean;
  showNinePalace: boolean;
  /** data URL of uploaded floor plan */
  underlayDataUrl: string | null;
  underlayOpacity: number;
  gridSize: number;
}

export interface FieldGrids {
  energy: Float32Array;
  wind: Float32Array;
  light: Float32Array;
  nineStar: Float32Array;
  width: number;
  height: number;
}

export interface SpaceFieldSummary {
  peakEnergy: number;
  avgEnergy: number;
  stagnationRatio: number;
  draftCorridor: number;
  lightBalance: number;
  nineStarBias: number;
  structuralNotes: string[];
  priorityActions: string[];
}

export interface SpaceSimResult {
  grids: FieldGrids;
  summary: SpaceFieldSummary;
  meta: {
    dizhiHour: string;
    sunAzimuthDeg: number;
    moonPhaseLabel: string;
    nineStarLabel: string;
    entranceElement: string;
  };
}
