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
  if (addressData.length === 2 && addressData[0] === addressData[1]) {
    return addressData[0];
  }

  return addressData.join(' ');
}
