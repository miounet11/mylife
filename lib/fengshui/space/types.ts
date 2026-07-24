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
  /** 显示家具示意 */
  showFurniture: boolean;
  /** 显示房间名 */
  showRoomLabels: boolean;
  /** 显示面积㎡ */
  showRoomAreas: boolean;
  /** 当前方案布局名（用于户型分区） */
  layoutLabel?: string | null;
  /**
   * CAD 可编辑户型分区（0–1 归一化）
   * 有值时平面/等距/3D 优先用此数据，而非临时生成
   */
  floorZones?: Array<{
    id: string;
    kind: string;
    x: number;
    y: number;
    w: number;
    h: number;
    labelKey?: string;
    label?: string;
    areaSqm?: number;
    furniture?: string[];
  }> | null;
  /** CAD 编辑模式 */
  cadEditMode?: boolean;
  /** 吸附网格（归一化，默认 0.02 ≈ 2%） */
  cadSnap?: number;
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
  /**
   * 关联用户主盘八字（人宅合参）
   * 不改变几何，只驱动建议与完整报表
   */
  profileLink?: SpaceProfileLink | null;
  /** AI 美化后的彩平图 data URL（可叠加/替换 underlay） */
  beautifyImageDataUrl?: string | null;
}

/** 空间场关联的用户八字摘要 */
export interface SpaceProfileLink {
  fortuneId: string;
  birthSignature: string;
  displayName?: string;
  dayMaster?: string;
  /** 用神 + 喜神 */
  yongShen: string[];
  jiShen: string[];
  linkedAt: string;
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
