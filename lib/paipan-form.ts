import { Solar } from 'lunar-javascript';
import { type LocationOption } from '@/lib/location-engine';
import { formatLunarDay, formatLunarMonth } from '@/lib/birth-entry';

export interface PaipanInfoData {
  guid: string;
  type: 0 | 1 | 2;
  username: string;
  sex: 0 | 1;
  birthday: string;
  lunarArr: [number, string, string, boolean, { cnm: string; cnd: string }] | [];
  sunTime: string;
  address: string;
  unknowhour: 0 | 1;
  typeId: string;
  bjtime: 0 | 1;
  hw: 0 | 1;
  isSave: boolean;
  xls: 0 | 1;
}

export interface CaseTypeOption {
  id: string;
  name: string;
}

export interface FormLocationState {
  option: LocationOption | null;
  addressData: string[];
  longitude: number;
  latitude?: number;
  timezone: number;
}

export const DEFAULT_CASE_TYPE_ID = '00000000-0000-0000-0000-000000000000';

export const DEFAULT_CASE_TYPES: CaseTypeOption[] = [
  { id: DEFAULT_CASE_TYPE_ID, name: '默认分类' },
];

export const UNKNOWN_LOCATION: FormLocationState = {
  option: {
    id: 'default:unknown-beijing',
    scope: 'china',
    displayName: '未知地',
    fullName: '未知地 北京时间 --',
    country: '中国',
    countryEn: 'China',
    city: '北京时间',
    district: '--',
    lng: 116.416,
    lat: 39.9288,
    tz: 8,
    timezoneLabel: 'UTC+8',
  },
  addressData: ['未知地', '北京时间', '--'],
  longitude: 116.416,
  latitude: 39.9288,
  timezone: 8,
};

export function createDefaultInfoData(): PaipanInfoData {
  return {
    guid: '',
    type: 0,
    username: '',
    sex: 1,
    birthday: '1990-01-01 00:00',
    lunarArr: [],
    sunTime: '1990-01-01 00:00',
    address: '未知地 北京时间 --',
    unknowhour: 0,
    typeId: DEFAULT_CASE_TYPE_ID,
    bjtime: 0,
    hw: 0,
    isSave: false,
    xls: 0,
  };
}

export function getBirthdayParts(datetime: string) {
  const [datePart = '1990-01-01', timePart = '00:00'] = datetime.split(' ');
  const [year = 1990, month = 1, day = 1] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0] = timePart.split(':').map(Number);

  return { year, month, day, hour, minute };
}

export function padPart(value: number | string) {
  return String(value).padStart(2, '0');
}

function compactAddressSegments(addressData: string[]) {
  const result: string[] = [];

  for (const rawSegment of addressData) {
    const segment = `${rawSegment || ''}`.trim();
    if (!segment || segment === '--') {
      continue;
    }

    if (result[result.length - 1] === segment) {
      continue;
    }

    result.push(segment);
  }

  return result;
}

export function toDateTimeString(year: number, month: number, day: number, hour: number, minute: number) {
  return `${year}-${padPart(month)}-${padPart(day)} ${padPart(hour)}:${padPart(minute)}`;
}

export function getSolarFromInfo(info: Pick<PaipanInfoData, 'birthday'>) {
  const { year, month, day, hour, minute } = getBirthdayParts(info.birthday);
  return Solar.fromYmdHms(year, month, day, hour, minute, 0);
}

export function buildLunarArrFromBirthday(birthday: string): PaipanInfoData['lunarArr'] {
  const { year, month, day, hour, minute } = getBirthdayParts(birthday);
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();

  return [
    lunar.getYear(),
    padPart(Math.abs(lunar.getMonth())),
    padPart(lunar.getDay()),
    lunar.getMonth() < 0,
    {
      cnm: formatLunarMonth(lunar.getMonth()),
      cnd: formatLunarDay(lunar.getDay()),
    },
  ];
}

export function formatBirthLabel(info: Pick<PaipanInfoData, 'birthday' | 'lunarArr' | 'unknowhour'>, type: 0 | 1 | 2) {
  const { year, month, day, hour, minute } = getBirthdayParts(info.birthday);

  if (type === 1 && info.lunarArr.length > 0) {
    const [lYear, , , , lunarLabel] = info.lunarArr;
    if (lunarLabel) {
      return `${lYear}年${lunarLabel.cnm}${lunarLabel.cnd} ${info.unknowhour ? '未知时辰' : `${padPart(hour)}:${padPart(minute)}`}`;
    }
  }

  if (type === 2) {
    const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
    const timeLabel = info.unknowhour ? '未知时辰' : eightChar.getTime();
    return `${eightChar.getYear()} ${eightChar.getMonth()} ${eightChar.getDay()} ${timeLabel}`;
  }

  return `${year}年${padPart(month)}月${padPart(day)}日 ${info.unknowhour ? '未知时辰' : `${padPart(hour)}:${padPart(minute)}`}`;
}

export function formatAddressLabel(addressData: string[]) {
  const segments = compactAddressSegments(addressData);

  if (!segments.length) {
    return '未知地';
  }

  if (segments.length === 2 && segments[0] === segments[1]) {
    return segments[0];
  }

  return segments.join(' ');
}

export function normalizeBirthPlaceLabel(addressData: string[]) {
  const cleaned = compactAddressSegments(addressData).filter((item) => item !== '北京时间');

  if (cleaned.length === 0 || cleaned[0] === '未知地') {
    return '北京';
  }

  return [...new Set(cleaned)].join(' ');
}

export interface AnalyzeEntryProgressInput {
  timeConfirmed: boolean;
  locationConfirmed: boolean;
  hasKnownBirthHour: boolean;
  hasKnownLocation: boolean;
  usesSolarTime: boolean;
}

export interface AnalyzeEntryProgressItem {
  label: string;
  done: boolean;
  value: string;
}

export interface AnalyzeEntryProgressState {
  entryReadiness: AnalyzeEntryProgressItem[];
  readinessScore: number;
  nextHint: string;
  canSubmit: boolean;
}

export function getAnalyzeEntryProgress({
  timeConfirmed,
  locationConfirmed,
  hasKnownBirthHour,
  hasKnownLocation,
  usesSolarTime,
}: AnalyzeEntryProgressInput): AnalyzeEntryProgressState {
  const entryReadiness: AnalyzeEntryProgressItem[] = [
    {
      label: '出生时间确认',
      done: timeConfirmed,
      value: timeConfirmed ? (hasKnownBirthHour ? '已确认具体时分' : '已确认：时辰未知') : '尚未确认出生时间',
    },
    {
      label: '出生地点确认',
      done: locationConfirmed,
      value: locationConfirmed ? (hasKnownLocation ? '已确认出生地点' : '已确认：未知地（按北京时间）') : '尚未确认出生地点',
    },
    {
      label: '时间精度',
      done: hasKnownBirthHour,
      value: hasKnownBirthHour ? '当前到具体时分' : '当前按未知时辰',
    },
    {
      label: '环境坐标',
      done: hasKnownLocation,
      value: hasKnownLocation ? '已使用具体地点' : '当前按未知地 / 北京时间',
    },
    {
      label: '时间修正',
      done: usesSolarTime,
      value: usesSolarTime ? '真太阳时已开启' : '当前按钟表时间',
    },
  ];

  const readinessScore = Math.round((entryReadiness.filter((item) => item.done).length / entryReadiness.length) * 100);
  const canSubmit = timeConfirmed && locationConfirmed;
  const nextHint = !timeConfirmed
    ? '先确认出生时间；如果暂时不知道具体时分，也请在弹窗里开启“时间不确定”。'
    : !locationConfirmed
      ? '再确认出生地点；如果只能按北京时间处理，也请在地点弹窗里明确确认一次。'
      : !hasKnownLocation
        ? '当前可以进入判断；后续如果能补上出生地点，时间修正和环境判断会更稳。'
        : !hasKnownBirthHour
          ? '当前可以进入判断；后续如果能确认时辰，阶段窗口和动作建议会更稳。'
          : !usesSolarTime
            ? '建议开启真太阳时，让结果更接近真实节律。'
            : '当前信息已经够进入判断，后续重点是看结果页里的结构、阶段和动作排序。';

  return {
    entryReadiness,
    readinessScore,
    nextHint,
    canSubmit,
  };
}
