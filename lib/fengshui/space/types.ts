/** 空间场模拟器类型 — 结构近似场，非物理 CFD */

export type FieldLayer = 'energy' | 'wind' | 'light' | 'nineStar' | 'qimen';

/** 地图选址注入 */
export interface SpaceGeoPlace {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  name?: string;
  source: 'google' | 'nominatim' | 'manual';
}

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

/** 与布局目录一致的业态域 — 驱动 Three.js 体块模型 */
export type SpaceActiveDomain =
  | 'residential'
  | 'shop'
  | 'tomb'
  | 'villa'
  | 'rural'
  | 'office'
  | 'apartment';

export interface SpaceLabState {
  room: SpaceRoom;
  vents: SpaceVent[];
  lights: SpaceLight[];
  structures: SpaceStructure[];
  time: SpaceTimeState;
  activeLayer: FieldLayer;
  showCompass: boolean;
  showNinePalace: boolean;
  /**
   * 专业平面叠图：八方位 / 二十四山 / 九宫 / 扇区 / 九星
   * 参考日式户型方位分析展示
   */
  planOverlayMode:
    | 'none'
    | 'bagua8'
    | 'radial24'
    | 'bagua9'
    | 'sector'
    | 'flyingStar';
  /** 纸质户型底（浅色） */
  planPaperStyle: boolean;
  /** data URL of uploaded floor plan */
  underlayDataUrl: string | null;
  underlayOpacity: number;
  gridSize: number;
  /** 地图选址 */
  geo: SpaceGeoPlace | null;
  /** 奇门遁甲示意层开关 */
  qimenEnabled: boolean;
  /** 当前业态域 → 3D 模型套件 */
  activeDomain: SpaceActiveDomain;
  /** 专业模式：读数更全、可导出 */
  proMode: boolean;
  /** 最近加载的预设标题（导出用） */
  presetTitle?: string | null;
  presetId?: string | null;
}

export interface FieldGrids {
  energy: Float32Array;
  wind: Float32Array;
  light: Float32Array;
  nineStar: Float32Array;
  qimen: Float32Array;
  width: number;
  height: number;
}

export interface QimenPalaceNote {
  index: number;
  door: string;
  star: string;
  structuralHint: string;
  intensity: number;
}

export interface QimenSpaceReading {
  juLabel: string;
  valueFu: string;
  valueShi: string;
  hourPillar: string;
  dayPillar: string;
  palaces: QimenPalaceNote[];
  summaryNotes: string[];
  actions: string[];
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
  qimen: QimenSpaceReading | null;
  meta: {
    dizhiHour: string;
    sunAzimuthDeg: number;
    moonPhaseLabel: string;
    nineStarLabel: string;
    entranceElement: string;
    geoAddress?: string | null;
  };
}
