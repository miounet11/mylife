/**
 * 全球主要城市数据 (含经纬度)
 * 数据结构: 洲 -> 国家 -> 城市
 * 用于真太阳时计算的地理位置选择
 */

export interface WorldCity {
  name: string;
  nameEn: string;
  longitude: number;
  latitude: number;
  timezone: string; // 标准时区
}

export interface Country {
  name: string;
  nameEn: string;
  code: string; // ISO 3166-1 alpha-2
  longitude: number;
  latitude: number;
  timezone: string;
  cities: WorldCity[];
}

export interface Continent {
  name: string;
  nameEn: string;
  countries: Country[];
}

// 全球主要城市数据
export const WORLD_REGIONS: Continent[] = [
  // ========== 亚洲 ==========
  {
    name: '亚洲',
    nameEn: 'Asia',
    countries: [
      {
        name: '日本',
        nameEn: 'Japan',
        code: 'JP',
        longitude: 139.6917,
        latitude: 35.6895,
        timezone: 'Asia/Tokyo',
        cities: [
          { name: '东京', nameEn: 'Tokyo', longitude: 139.6917, latitude: 35.6895, timezone: 'Asia/Tokyo' },
          { name: '大阪', nameEn: 'Osaka', longitude: 135.5023, latitude: 34.6937, timezone: 'Asia/Tokyo' },
          { name: '京都', nameEn: 'Kyoto', longitude: 135.7681, latitude: 35.0116, timezone: 'Asia/Tokyo' },
          { name: '横滨', nameEn: 'Yokohama', longitude: 139.6380, latitude: 35.4437, timezone: 'Asia/Tokyo' },
          { name: '名古屋', nameEn: 'Nagoya', longitude: 136.9066, latitude: 35.1815, timezone: 'Asia/Tokyo' },
          { name: '札幌', nameEn: 'Sapporo', longitude: 141.3469, latitude: 43.0618, timezone: 'Asia/Tokyo' },
          { name: '福冈', nameEn: 'Fukuoka', longitude: 130.4017, latitude: 33.5904, timezone: 'Asia/Tokyo' },
          { name: '神户', nameEn: 'Kobe', longitude: 135.1955, latitude: 34.6901, timezone: 'Asia/Tokyo' },
        ],
      },
      {
        name: '韩国',
        nameEn: 'South Korea',
        code: 'KR',
        longitude: 126.9780,
        latitude: 37.5665,
        timezone: 'Asia/Seoul',
        cities: [
          { name: '首尔', nameEn: 'Seoul', longitude: 126.9780, latitude: 37.5665, timezone: 'Asia/Seoul' },
          { name: '釜山', nameEn: 'Busan', longitude: 129.0756, latitude: 35.1796, timezone: 'Asia/Seoul' },
          { name: '仁川', nameEn: 'Incheon', longitude: 126.7052, latitude: 37.4563, timezone: 'Asia/Seoul' },
          { name: '大邱', nameEn: 'Daegu', longitude: 128.6014, latitude: 35.8714, timezone: 'Asia/Seoul' },
          { name: '济州', nameEn: 'Jeju', longitude: 126.5312, latitude: 33.4996, timezone: 'Asia/Seoul' },
        ],
      },
      {
        name: '新加坡',
        nameEn: 'Singapore',
        code: 'SG',
        longitude: 103.8198,
        latitude: 1.3521,
        timezone: 'Asia/Singapore',
        cities: [
          { name: '新加坡', nameEn: 'Singapore', longitude: 103.8198, latitude: 1.3521, timezone: 'Asia/Singapore' },
        ],
      },
      {
        name: '马来西亚',
        nameEn: 'Malaysia',
        code: 'MY',
        longitude: 101.6869,
        latitude: 3.1390,
        timezone: 'Asia/Kuala_Lumpur',
        cities: [
          { name: '吉隆坡', nameEn: 'Kuala Lumpur', longitude: 101.6869, latitude: 3.1390, timezone: 'Asia/Kuala_Lumpur' },
          { name: '槟城', nameEn: 'Penang', longitude: 100.3327, latitude: 5.4164, timezone: 'Asia/Kuala_Lumpur' },
          { name: '新山', nameEn: 'Johor Bahru', longitude: 103.7414, latitude: 1.4927, timezone: 'Asia/Kuala_Lumpur' },
          { name: '马六甲', nameEn: 'Malacca', longitude: 102.2501, latitude: 2.1896, timezone: 'Asia/Kuala_Lumpur' },
        ],
      },
      {
        name: '泰国',
        nameEn: 'Thailand',
        code: 'TH',
        longitude: 100.5018,
        latitude: 13.7563,
        timezone: 'Asia/Bangkok',
        cities: [
          { name: '曼谷', nameEn: 'Bangkok', longitude: 100.5018, latitude: 13.7563, timezone: 'Asia/Bangkok' },
          { name: '清迈', nameEn: 'Chiang Mai', longitude: 98.9853, latitude: 18.7883, timezone: 'Asia/Bangkok' },
          { name: '普吉', nameEn: 'Phuket', longitude: 98.3923, latitude: 7.8804, timezone: 'Asia/Bangkok' },
          { name: '芭提雅', nameEn: 'Pattaya', longitude: 100.8765, latitude: 12.9236, timezone: 'Asia/Bangkok' },
        ],
      },
      {
        name: '越南',
        nameEn: 'Vietnam',
        code: 'VN',
        longitude: 105.8342,
        latitude: 21.0278,
        timezone: 'Asia/Ho_Chi_Minh',
        cities: [
          { name: '河内', nameEn: 'Hanoi', longitude: 105.8342, latitude: 21.0278, timezone: 'Asia/Ho_Chi_Minh' },
          { name: '胡志明市', nameEn: 'Ho Chi Minh City', longitude: 106.6297, latitude: 10.8231, timezone: 'Asia/Ho_Chi_Minh' },
          { name: '岘港', nameEn: 'Da Nang', longitude: 108.2022, latitude: 16.0544, timezone: 'Asia/Ho_Chi_Minh' },
        ],
      },
      {
        name: '印度尼西亚',
        nameEn: 'Indonesia',
        code: 'ID',
        longitude: 106.8456,
        latitude: -6.2088,
        timezone: 'Asia/Jakarta',
        cities: [
          { name: '雅加达', nameEn: 'Jakarta', longitude: 106.8456, latitude: -6.2088, timezone: 'Asia/Jakarta' },
          { name: '巴厘岛', nameEn: 'Bali', longitude: 115.1889, latitude: -8.4095, timezone: 'Asia/Makassar' },
          { name: '泗水', nameEn: 'Surabaya', longitude: 112.7508, latitude: -7.2575, timezone: 'Asia/Jakarta' },
        ],
      },
      {
        name: '菲律宾',
        nameEn: 'Philippines',
        code: 'PH',
        longitude: 120.9842,
        latitude: 14.5995,
        timezone: 'Asia/Manila',
        cities: [
          { name: '马尼拉', nameEn: 'Manila', longitude: 120.9842, latitude: 14.5995, timezone: 'Asia/Manila' },
          { name: '宿务', nameEn: 'Cebu', longitude: 123.8854, latitude: 10.3157, timezone: 'Asia/Manila' },
          { name: '达沃', nameEn: 'Davao', longitude: 125.4553, latitude: 7.1907, timezone: 'Asia/Manila' },
        ],
      },
      {
        name: '印度',
        nameEn: 'India',
        code: 'IN',
        longitude: 77.1025,
        latitude: 28.7041,
        timezone: 'Asia/Kolkata',
        cities: [
          { name: '新德里', nameEn: 'New Delhi', longitude: 77.1025, latitude: 28.7041, timezone: 'Asia/Kolkata' },
          { name: '孟买', nameEn: 'Mumbai', longitude: 72.8777, latitude: 19.0760, timezone: 'Asia/Kolkata' },
          { name: '班加罗尔', nameEn: 'Bangalore', longitude: 77.5946, latitude: 12.9716, timezone: 'Asia/Kolkata' },
          { name: '加尔各答', nameEn: 'Kolkata', longitude: 88.3639, latitude: 22.5726, timezone: 'Asia/Kolkata' },
          { name: '钦奈', nameEn: 'Chennai', longitude: 80.2707, latitude: 13.0827, timezone: 'Asia/Kolkata' },
        ],
      },
      {
        name: '阿联酋',
        nameEn: 'United Arab Emirates',
        code: 'AE',
        longitude: 55.2708,
        latitude: 25.2048,
        timezone: 'Asia/Dubai',
        cities: [
          { name: '迪拜', nameEn: 'Dubai', longitude: 55.2708, latitude: 25.2048, timezone: 'Asia/Dubai' },
          { name: '阿布扎比', nameEn: 'Abu Dhabi', longitude: 54.3773, latitude: 24.4539, timezone: 'Asia/Dubai' },
        ],
      },
      {
        name: '以色列',
        nameEn: 'Israel',
        code: 'IL',
        longitude: 35.2137,
        latitude: 31.7683,
        timezone: 'Asia/Jerusalem',
        cities: [
          { name: '耶路撒冷', nameEn: 'Jerusalem', longitude: 35.2137, latitude: 31.7683, timezone: 'Asia/Jerusalem' },
          { name: '特拉维夫', nameEn: 'Tel Aviv', longitude: 34.7818, latitude: 32.0853, timezone: 'Asia/Jerusalem' },
        ],
      },
      {
        name: '土耳其',
        nameEn: 'Turkey',
        code: 'TR',
        longitude: 32.8597,
        latitude: 39.9334,
        timezone: 'Europe/Istanbul',
        cities: [
          { name: '伊斯坦布尔', nameEn: 'Istanbul', longitude: 28.9784, latitude: 41.0082, timezone: 'Europe/Istanbul' },
          { name: '安卡拉', nameEn: 'Ankara', longitude: 32.8597, latitude: 39.9334, timezone: 'Europe/Istanbul' },
          { name: '伊兹密尔', nameEn: 'Izmir', longitude: 27.1428, latitude: 38.4237, timezone: 'Europe/Istanbul' },
        ],
      },
    ],
  },

  // ========== 欧洲 ==========
  {
    name: '欧洲',
    nameEn: 'Europe',
    countries: [
      {
        name: '英国',
        nameEn: 'United Kingdom',
        code: 'GB',
        longitude: -0.1276,
        latitude: 51.5074,
        timezone: 'Europe/London',
        cities: [
          { name: '伦敦', nameEn: 'London', longitude: -0.1276, latitude: 51.5074, timezone: 'Europe/London' },
          { name: '曼彻斯特', nameEn: 'Manchester', longitude: -2.2426, latitude: 53.4808, timezone: 'Europe/London' },
          { name: '伯明翰', nameEn: 'Birmingham', longitude: -1.8904, latitude: 52.4862, timezone: 'Europe/London' },
          { name: '爱丁堡', nameEn: 'Edinburgh', longitude: -3.1883, latitude: 55.9533, timezone: 'Europe/London' },
          { name: '利物浦', nameEn: 'Liverpool', longitude: -2.9916, latitude: 53.4084, timezone: 'Europe/London' },
        ],
      },
      {
        name: '法国',
        nameEn: 'France',
        code: 'FR',
        longitude: 2.3522,
        latitude: 48.8566,
        timezone: 'Europe/Paris',
        cities: [
          { name: '巴黎', nameEn: 'Paris', longitude: 2.3522, latitude: 48.8566, timezone: 'Europe/Paris' },
          { name: '马赛', nameEn: 'Marseille', longitude: 5.3698, latitude: 43.2965, timezone: 'Europe/Paris' },
          { name: '里昂', nameEn: 'Lyon', longitude: 4.8357, latitude: 45.7640, timezone: 'Europe/Paris' },
          { name: '尼斯', nameEn: 'Nice', longitude: 7.2620, latitude: 43.7102, timezone: 'Europe/Paris' },
        ],
      },
      {
        name: '德国',
        nameEn: 'Germany',
        code: 'DE',
        longitude: 13.4050,
        latitude: 52.5200,
        timezone: 'Europe/Berlin',
        cities: [
          { name: '柏林', nameEn: 'Berlin', longitude: 13.4050, latitude: 52.5200, timezone: 'Europe/Berlin' },
          { name: '慕尼黑', nameEn: 'Munich', longitude: 11.5820, latitude: 48.1351, timezone: 'Europe/Berlin' },
          { name: '法兰克福', nameEn: 'Frankfurt', longitude: 8.6821, latitude: 50.1109, timezone: 'Europe/Berlin' },
          { name: '汉堡', nameEn: 'Hamburg', longitude: 9.9937, latitude: 53.5511, timezone: 'Europe/Berlin' },
          { name: '科隆', nameEn: 'Cologne', longitude: 6.9603, latitude: 50.9375, timezone: 'Europe/Berlin' },
        ],
      },
      {
        name: '意大利',
        nameEn: 'Italy',
        code: 'IT',
        longitude: 12.4964,
        latitude: 41.9028,
        timezone: 'Europe/Rome',
        cities: [
          { name: '罗马', nameEn: 'Rome', longitude: 12.4964, latitude: 41.9028, timezone: 'Europe/Rome' },
          { name: '米兰', nameEn: 'Milan', longitude: 9.1900, latitude: 45.4642, timezone: 'Europe/Rome' },
          { name: '佛罗伦萨', nameEn: 'Florence', longitude: 11.2558, latitude: 43.7696, timezone: 'Europe/Rome' },
          { name: '威尼斯', nameEn: 'Venice', longitude: 12.3155, latitude: 45.4408, timezone: 'Europe/Rome' },
          { name: '那不勒斯', nameEn: 'Naples', longitude: 14.2681, latitude: 40.8518, timezone: 'Europe/Rome' },
        ],
      },
      {
        name: '西班牙',
        nameEn: 'Spain',
        code: 'ES',
        longitude: -3.7038,
        latitude: 40.4168,
        timezone: 'Europe/Madrid',
        cities: [
          { name: '马德里', nameEn: 'Madrid', longitude: -3.7038, latitude: 40.4168, timezone: 'Europe/Madrid' },
          { name: '巴塞罗那', nameEn: 'Barcelona', longitude: 2.1734, latitude: 41.3851, timezone: 'Europe/Madrid' },
          { name: '瓦伦西亚', nameEn: 'Valencia', longitude: -0.3763, latitude: 39.4699, timezone: 'Europe/Madrid' },
          { name: '塞维利亚', nameEn: 'Seville', longitude: -5.9845, latitude: 37.3891, timezone: 'Europe/Madrid' },
        ],
      },
      {
        name: '荷兰',
        nameEn: 'Netherlands',
        code: 'NL',
        longitude: 4.9041,
        latitude: 52.3676,
        timezone: 'Europe/Amsterdam',
        cities: [
          { name: '阿姆斯特丹', nameEn: 'Amsterdam', longitude: 4.9041, latitude: 52.3676, timezone: 'Europe/Amsterdam' },
          { name: '鹿特丹', nameEn: 'Rotterdam', longitude: 4.4777, latitude: 51.9244, timezone: 'Europe/Amsterdam' },
        ],
      },
      {
        name: '比利时',
        nameEn: 'Belgium',
        code: 'BE',
        longitude: 4.3517,
        latitude: 50.8503,
        timezone: 'Europe/Brussels',
        cities: [
          { name: '布鲁塞尔', nameEn: 'Brussels', longitude: 4.3517, latitude: 50.8503, timezone: 'Europe/Brussels' },
          { name: '安特卫普', nameEn: 'Antwerp', longitude: 4.4025, latitude: 51.2194, timezone: 'Europe/Brussels' },
        ],
      },
      {
        name: '瑞士',
        nameEn: 'Switzerland',
        code: 'CH',
        longitude: 7.4474,
        latitude: 46.9480,
        timezone: 'Europe/Zurich',
        cities: [
          { name: '苏黎世', nameEn: 'Zurich', longitude: 8.5417, latitude: 47.3769, timezone: 'Europe/Zurich' },
          { name: '日内瓦', nameEn: 'Geneva', longitude: 6.1432, latitude: 46.2044, timezone: 'Europe/Zurich' },
          { name: '伯尔尼', nameEn: 'Bern', longitude: 7.4474, latitude: 46.9480, timezone: 'Europe/Zurich' },
        ],
      },
      {
        name: '奥地利',
        nameEn: 'Austria',
        code: 'AT',
        longitude: 16.3738,
        latitude: 48.2082,
        timezone: 'Europe/Vienna',
        cities: [
          { name: '维也纳', nameEn: 'Vienna', longitude: 16.3738, latitude: 48.2082, timezone: 'Europe/Vienna' },
          { name: '萨尔茨堡', nameEn: 'Salzburg', longitude: 13.0550, latitude: 47.8095, timezone: 'Europe/Vienna' },
        ],
      },
      {
        name: '瑞典',
        nameEn: 'Sweden',
        code: 'SE',
        longitude: 18.0686,
        latitude: 59.3293,
        timezone: 'Europe/Stockholm',
        cities: [
          { name: '斯德哥尔摩', nameEn: 'Stockholm', longitude: 18.0686, latitude: 59.3293, timezone: 'Europe/Stockholm' },
          { name: '哥德堡', nameEn: 'Gothenburg', longitude: 11.9746, latitude: 57.7089, timezone: 'Europe/Stockholm' },
        ],
      },
      {
        name: '挪威',
        nameEn: 'Norway',
        code: 'NO',
        longitude: 10.7522,
        latitude: 59.9139,
        timezone: 'Europe/Oslo',
        cities: [
          { name: '奥斯陆', nameEn: 'Oslo', longitude: 10.7522, latitude: 59.9139, timezone: 'Europe/Oslo' },
          { name: '卑尔根', nameEn: 'Bergen', longitude: 5.3221, latitude: 60.3913, timezone: 'Europe/Oslo' },
        ],
      },
      {
        name: '丹麦',
        nameEn: 'Denmark',
        code: 'DK',
        longitude: 12.5683,
        latitude: 55.6761,
        timezone: 'Europe/Copenhagen',
        cities: [
          { name: '哥本哈根', nameEn: 'Copenhagen', longitude: 12.5683, latitude: 55.6761, timezone: 'Europe/Copenhagen' },
        ],
      },
      {
        name: '芬兰',
        nameEn: 'Finland',
        code: 'FI',
        longitude: 24.9384,
        latitude: 60.1699,
        timezone: 'Europe/Helsinki',
        cities: [
          { name: '赫尔辛基', nameEn: 'Helsinki', longitude: 24.9384, latitude: 60.1699, timezone: 'Europe/Helsinki' },
        ],
      },
      {
        name: '俄罗斯',
        nameEn: 'Russia',
        code: 'RU',
        longitude: 37.6173,
        latitude: 55.7558,
        timezone: 'Europe/Moscow',
        cities: [
          { name: '莫斯科', nameEn: 'Moscow', longitude: 37.6173, latitude: 55.7558, timezone: 'Europe/Moscow' },
          { name: '圣彼得堡', nameEn: 'Saint Petersburg', longitude: 30.3351, latitude: 59.9343, timezone: 'Europe/Moscow' },
          { name: '新西伯利亚', nameEn: 'Novosibirsk', longitude: 82.9346, latitude: 55.0084, timezone: 'Asia/Novosibirsk' },
          { name: '叶卡捷琳堡', nameEn: 'Yekaterinburg', longitude: 60.6122, latitude: 56.8389, timezone: 'Asia/Yekaterinburg' },
          { name: '海参崴', nameEn: 'Vladivostok', longitude: 131.8869, latitude: 43.1155, timezone: 'Asia/Vladivostok' },
        ],
      },
      {
        name: '波兰',
        nameEn: 'Poland',
        code: 'PL',
        longitude: 21.0122,
        latitude: 52.2297,
        timezone: 'Europe/Warsaw',
        cities: [
          { name: '华沙', nameEn: 'Warsaw', longitude: 21.0122, latitude: 52.2297, timezone: 'Europe/Warsaw' },
          { name: '克拉科夫', nameEn: 'Krakow', longitude: 19.9450, latitude: 50.0647, timezone: 'Europe/Warsaw' },
        ],
      },
      {
        name: '捷克',
        nameEn: 'Czech Republic',
        code: 'CZ',
        longitude: 14.4378,
        latitude: 50.0755,
        timezone: 'Europe/Prague',
        cities: [
          { name: '布拉格', nameEn: 'Prague', longitude: 14.4378, latitude: 50.0755, timezone: 'Europe/Prague' },
        ],
      },
      {
        name: '希腊',
        nameEn: 'Greece',
        code: 'GR',
        longitude: 23.7275,
        latitude: 37.9838,
        timezone: 'Europe/Athens',
        cities: [
          { name: '雅典', nameEn: 'Athens', longitude: 23.7275, latitude: 37.9838, timezone: 'Europe/Athens' },
          { name: '塞萨洛尼基', nameEn: 'Thessaloniki', longitude: 22.9444, latitude: 40.6401, timezone: 'Europe/Athens' },
        ],
      },
      {
        name: '葡萄牙',
        nameEn: 'Portugal',
        code: 'PT',
        longitude: -9.1393,
        latitude: 38.7223,
        timezone: 'Europe/Lisbon',
        cities: [
          { name: '里斯本', nameEn: 'Lisbon', longitude: -9.1393, latitude: 38.7223, timezone: 'Europe/Lisbon' },
          { name: '波尔图', nameEn: 'Porto', longitude: -8.6291, latitude: 41.1579, timezone: 'Europe/Lisbon' },
        ],
      },
      {
        name: '爱尔兰',
        nameEn: 'Ireland',
        code: 'IE',
        longitude: -6.2603,
        latitude: 53.3498,
        timezone: 'Europe/Dublin',
        cities: [
          { name: '都柏林', nameEn: 'Dublin', longitude: -6.2603, latitude: 53.3498, timezone: 'Europe/Dublin' },
        ],
      },
    ],
  },

  // ========== 北美洲 ==========
  {
    name: '北美洲',
    nameEn: 'North America',
    countries: [
      {
        name: '美国',
        nameEn: 'United States',
        code: 'US',
        longitude: -77.0369,
        latitude: 38.9072,
        timezone: 'America/New_York',
        cities: [
          { name: '纽约', nameEn: 'New York', longitude: -74.0060, latitude: 40.7128, timezone: 'America/New_York' },
          { name: '洛杉矶', nameEn: 'Los Angeles', longitude: -118.2437, latitude: 34.0522, timezone: 'America/Los_Angeles' },
          { name: '芝加哥', nameEn: 'Chicago', longitude: -87.6298, latitude: 41.8781, timezone: 'America/Chicago' },
          { name: '休斯顿', nameEn: 'Houston', longitude: -95.3698, latitude: 29.7604, timezone: 'America/Chicago' },
          { name: '旧金山', nameEn: 'San Francisco', longitude: -122.4194, latitude: 37.7749, timezone: 'America/Los_Angeles' },
          { name: '华盛顿', nameEn: 'Washington D.C.', longitude: -77.0369, latitude: 38.9072, timezone: 'America/New_York' },
          { name: '西雅图', nameEn: 'Seattle', longitude: -122.3321, latitude: 47.6062, timezone: 'America/Los_Angeles' },
          { name: '波士顿', nameEn: 'Boston', longitude: -71.0589, latitude: 42.3601, timezone: 'America/New_York' },
          { name: '迈阿密', nameEn: 'Miami', longitude: -80.1918, latitude: 25.7617, timezone: 'America/New_York' },
          { name: '拉斯维加斯', nameEn: 'Las Vegas', longitude: -115.1398, latitude: 36.1699, timezone: 'America/Los_Angeles' },
          { name: '丹佛', nameEn: 'Denver', longitude: -104.9903, latitude: 39.7392, timezone: 'America/Denver' },
          { name: '亚特兰大', nameEn: 'Atlanta', longitude: -84.3880, latitude: 33.7490, timezone: 'America/New_York' },
          { name: '费城', nameEn: 'Philadelphia', longitude: -75.1652, latitude: 39.9526, timezone: 'America/New_York' },
          { name: '凤凰城', nameEn: 'Phoenix', longitude: -112.0740, latitude: 33.4484, timezone: 'America/Phoenix' },
          { name: '圣地亚哥', nameEn: 'San Diego', longitude: -117.1611, latitude: 32.7157, timezone: 'America/Los_Angeles' },
          { name: '夏威夷檀香山', nameEn: 'Honolulu', longitude: -157.8583, latitude: 21.3069, timezone: 'Pacific/Honolulu' },
        ],
      },
      {
        name: '加拿大',
        nameEn: 'Canada',
        code: 'CA',
        longitude: -75.6972,
        latitude: 45.4215,
        timezone: 'America/Toronto',
        cities: [
          { name: '多伦多', nameEn: 'Toronto', longitude: -79.3832, latitude: 43.6532, timezone: 'America/Toronto' },
          { name: '温哥华', nameEn: 'Vancouver', longitude: -123.1207, latitude: 49.2827, timezone: 'America/Vancouver' },
          { name: '蒙特利尔', nameEn: 'Montreal', longitude: -73.5673, latitude: 45.5017, timezone: 'America/Toronto' },
          { name: '卡尔加里', nameEn: 'Calgary', longitude: -114.0719, latitude: 51.0447, timezone: 'America/Edmonton' },
          { name: '渥太华', nameEn: 'Ottawa', longitude: -75.6972, latitude: 45.4215, timezone: 'America/Toronto' },
          { name: '埃德蒙顿', nameEn: 'Edmonton', longitude: -113.4909, latitude: 53.5461, timezone: 'America/Edmonton' },
        ],
      },
      {
        name: '墨西哥',
        nameEn: 'Mexico',
        code: 'MX',
        longitude: -99.1332,
        latitude: 19.4326,
        timezone: 'America/Mexico_City',
        cities: [
          { name: '墨西哥城', nameEn: 'Mexico City', longitude: -99.1332, latitude: 19.4326, timezone: 'America/Mexico_City' },
          { name: '坎昆', nameEn: 'Cancun', longitude: -86.8515, latitude: 21.1619, timezone: 'America/Cancun' },
          { name: '瓜达拉哈拉', nameEn: 'Guadalajara', longitude: -103.3496, latitude: 20.6597, timezone: 'America/Mexico_City' },
        ],
      },
    ],
  },

  // ========== 南美洲 ==========
  {
    name: '南美洲',
    nameEn: 'South America',
    countries: [
      {
        name: '巴西',
        nameEn: 'Brazil',
        code: 'BR',
        longitude: -43.1729,
        latitude: -22.9068,
        timezone: 'America/Sao_Paulo',
        cities: [
          { name: '圣保罗', nameEn: 'Sao Paulo', longitude: -46.6333, latitude: -23.5505, timezone: 'America/Sao_Paulo' },
          { name: '里约热内卢', nameEn: 'Rio de Janeiro', longitude: -43.1729, latitude: -22.9068, timezone: 'America/Sao_Paulo' },
          { name: '巴西利亚', nameEn: 'Brasilia', longitude: -47.9292, latitude: -15.8267, timezone: 'America/Sao_Paulo' },
        ],
      },
      {
        name: '阿根廷',
        nameEn: 'Argentina',
        code: 'AR',
        longitude: -58.3816,
        latitude: -34.6037,
        timezone: 'America/Argentina/Buenos_Aires',
        cities: [
          { name: '布宜诺斯艾利斯', nameEn: 'Buenos Aires', longitude: -58.3816, latitude: -34.6037, timezone: 'America/Argentina/Buenos_Aires' },
        ],
      },
      {
        name: '智利',
        nameEn: 'Chile',
        code: 'CL',
        longitude: -70.6693,
        latitude: -33.4489,
        timezone: 'America/Santiago',
        cities: [
          { name: '圣地亚哥', nameEn: 'Santiago', longitude: -70.6693, latitude: -33.4489, timezone: 'America/Santiago' },
        ],
      },
      {
        name: '秘鲁',
        nameEn: 'Peru',
        code: 'PE',
        longitude: -77.0428,
        latitude: -12.0464,
        timezone: 'America/Lima',
        cities: [
          { name: '利马', nameEn: 'Lima', longitude: -77.0428, latitude: -12.0464, timezone: 'America/Lima' },
        ],
      },
      {
        name: '哥伦比亚',
        nameEn: 'Colombia',
        code: 'CO',
        longitude: -74.0721,
        latitude: 4.7110,
        timezone: 'America/Bogota',
        cities: [
          { name: '波哥大', nameEn: 'Bogota', longitude: -74.0721, latitude: 4.7110, timezone: 'America/Bogota' },
        ],
      },
    ],
  },

  // ========== 大洋洲 ==========
  {
    name: '大洋洲',
    nameEn: 'Oceania',
    countries: [
      {
        name: '澳大利亚',
        nameEn: 'Australia',
        code: 'AU',
        longitude: 151.2093,
        latitude: -33.8688,
        timezone: 'Australia/Sydney',
        cities: [
          { name: '悉尼', nameEn: 'Sydney', longitude: 151.2093, latitude: -33.8688, timezone: 'Australia/Sydney' },
          { name: '墨尔本', nameEn: 'Melbourne', longitude: 144.9631, latitude: -37.8136, timezone: 'Australia/Melbourne' },
          { name: '布里斯班', nameEn: 'Brisbane', longitude: 153.0251, latitude: -27.4698, timezone: 'Australia/Brisbane' },
          { name: '珀斯', nameEn: 'Perth', longitude: 115.8605, latitude: -31.9505, timezone: 'Australia/Perth' },
          { name: '阿德莱德', nameEn: 'Adelaide', longitude: 138.6007, latitude: -34.9285, timezone: 'Australia/Adelaide' },
          { name: '堪培拉', nameEn: 'Canberra', longitude: 149.1300, latitude: -35.2809, timezone: 'Australia/Sydney' },
        ],
      },
      {
        name: '新西兰',
        nameEn: 'New Zealand',
        code: 'NZ',
        longitude: 174.7633,
        latitude: -36.8485,
        timezone: 'Pacific/Auckland',
        cities: [
          { name: '奥克兰', nameEn: 'Auckland', longitude: 174.7633, latitude: -36.8485, timezone: 'Pacific/Auckland' },
          { name: '惠灵顿', nameEn: 'Wellington', longitude: 174.7762, latitude: -41.2865, timezone: 'Pacific/Auckland' },
          { name: '基督城', nameEn: 'Christchurch', longitude: 172.6362, latitude: -43.5321, timezone: 'Pacific/Auckland' },
        ],
      },
    ],
  },

  // ========== 非洲 ==========
  {
    name: '非洲',
    nameEn: 'Africa',
    countries: [
      {
        name: '南非',
        nameEn: 'South Africa',
        code: 'ZA',
        longitude: 28.0473,
        latitude: -26.2041,
        timezone: 'Africa/Johannesburg',
        cities: [
          { name: '约翰内斯堡', nameEn: 'Johannesburg', longitude: 28.0473, latitude: -26.2041, timezone: 'Africa/Johannesburg' },
          { name: '开普敦', nameEn: 'Cape Town', longitude: 18.4241, latitude: -33.9249, timezone: 'Africa/Johannesburg' },
          { name: '德班', nameEn: 'Durban', longitude: 31.0218, latitude: -29.8587, timezone: 'Africa/Johannesburg' },
        ],
      },
      {
        name: '埃及',
        nameEn: 'Egypt',
        code: 'EG',
        longitude: 31.2357,
        latitude: 30.0444,
        timezone: 'Africa/Cairo',
        cities: [
          { name: '开罗', nameEn: 'Cairo', longitude: 31.2357, latitude: 30.0444, timezone: 'Africa/Cairo' },
          { name: '亚历山大', nameEn: 'Alexandria', longitude: 29.9187, latitude: 31.2001, timezone: 'Africa/Cairo' },
        ],
      },
      {
        name: '摩洛哥',
        nameEn: 'Morocco',
        code: 'MA',
        longitude: -6.8498,
        latitude: 33.9716,
        timezone: 'Africa/Casablanca',
        cities: [
          { name: '卡萨布兰卡', nameEn: 'Casablanca', longitude: -7.5898, latitude: 33.5731, timezone: 'Africa/Casablanca' },
          { name: '马拉喀什', nameEn: 'Marrakech', longitude: -7.9811, latitude: 31.6295, timezone: 'Africa/Casablanca' },
        ],
      },
      {
        name: '肯尼亚',
        nameEn: 'Kenya',
        code: 'KE',
        longitude: 36.8219,
        latitude: -1.2921,
        timezone: 'Africa/Nairobi',
        cities: [
          { name: '内罗毕', nameEn: 'Nairobi', longitude: 36.8219, latitude: -1.2921, timezone: 'Africa/Nairobi' },
        ],
      },
      {
        name: '尼日利亚',
        nameEn: 'Nigeria',
        code: 'NG',
        longitude: 3.3792,
        latitude: 6.5244,
        timezone: 'Africa/Lagos',
        cities: [
          { name: '拉各斯', nameEn: 'Lagos', longitude: 3.3792, latitude: 6.5244, timezone: 'Africa/Lagos' },
        ],
      },
    ],
  },
];

// ============ 工具函数 ============

// 获取所有洲
export function getContinents(): string[] {
  return WORLD_REGIONS.map(c => c.name);
}

// 根据洲获取国家
export function getCountriesByContinent(continentName: string): Country[] {
  const continent = WORLD_REGIONS.find(c => c.name === continentName || c.nameEn === continentName);
  return continent?.countries || [];
}

// 根据国家获取城市
export function getCitiesByCountry(continentName: string, countryName: string): WorldCity[] {
  const continent = WORLD_REGIONS.find(c => c.name === continentName || c.nameEn === continentName);
  const country = continent?.countries.find(co => co.name === countryName || co.nameEn === countryName);
  return country?.cities || [];
}

// 搜索全球位置
export function searchWorldLocation(keyword: string): Array<{
  continent: string;
  country: string;
  city: string;
  longitude: number;
  latitude: number;
  timezone: string;
  fullName: string;
}> {
  const results: Array<{
    continent: string;
    country: string;
    city: string;
    longitude: number;
    latitude: number;
    timezone: string;
    fullName: string;
  }> = [];

  const kw = keyword.trim().toLowerCase();
  if (!kw) return results;

  for (const continent of WORLD_REGIONS) {
    for (const country of continent.countries) {
      // 匹配国家
      if (country.name.toLowerCase().includes(kw) || country.nameEn.toLowerCase().includes(kw)) {
        results.push({
          continent: continent.name,
          country: country.name,
          city: country.cities[0]?.name || '',
          longitude: country.longitude,
          latitude: country.latitude,
          timezone: country.timezone,
          fullName: `${country.name}`,
        });
      }

      // 匹配城市
      for (const city of country.cities) {
        if (city.name.toLowerCase().includes(kw) || city.nameEn.toLowerCase().includes(kw)) {
          results.push({
            continent: continent.name,
            country: country.name,
            city: city.name,
            longitude: city.longitude,
            latitude: city.latitude,
            timezone: city.timezone,
            fullName: `${country.name} ${city.name}`,
          });
        }
      }
    }
  }

  return results.slice(0, 20);
}

// 获取位置坐标
export function getWorldLocationCoordinates(
  continentName: string,
  countryName: string,
  cityName?: string
): { longitude: number; latitude: number; timezone: string } | null {
  const continent = WORLD_REGIONS.find(c => c.name === continentName || c.nameEn === continentName);
  if (!continent) return null;

  const country = continent.countries.find(co => co.name === countryName || co.nameEn === countryName);
  if (!country) return null;

  if (!cityName) {
    return { longitude: country.longitude, latitude: country.latitude, timezone: country.timezone };
  }

  const city = country.cities.find(ci => ci.name === cityName || ci.nameEn === cityName);
  if (!city) {
    return { longitude: country.longitude, latitude: country.latitude, timezone: country.timezone };
  }

  return { longitude: city.longitude, latitude: city.latitude, timezone: city.timezone };
}

// 计算真太阳时偏移 (分钟) - 基于当地标准时区
// 注意：国际位置需要考虑当地时区，而不是北京时间
export function calculateWorldTrueSolarTimeOffset(longitude: number, timezone: string): number {
  // 获取时区的标准经度 (每个时区15度)
  const timezoneOffsets: Record<string, number> = {
    // 亚洲
    'Asia/Tokyo': 135,
    'Asia/Seoul': 135,
    'Asia/Singapore': 105,
    'Asia/Kuala_Lumpur': 105,
    'Asia/Bangkok': 105,
    'Asia/Ho_Chi_Minh': 105,
    'Asia/Jakarta': 105,
    'Asia/Makassar': 120,
    'Asia/Manila': 120,
    'Asia/Kolkata': 82.5,
    'Asia/Dubai': 60,
    'Asia/Jerusalem': 35,
    // 欧洲
    'Europe/London': 0,
    'Europe/Dublin': 0,
    'Europe/Paris': 15,
    'Europe/Berlin': 15,
    'Europe/Rome': 15,
    'Europe/Madrid': 15, // 实际用的是西欧时间
    'Europe/Amsterdam': 15,
    'Europe/Brussels': 15,
    'Europe/Zurich': 15,
    'Europe/Vienna': 15,
    'Europe/Stockholm': 15,
    'Europe/Oslo': 15,
    'Europe/Copenhagen': 15,
    'Europe/Helsinki': 30,
    'Europe/Moscow': 45,
    'Europe/Warsaw': 15,
    'Europe/Prague': 15,
    'Europe/Athens': 30,
    'Europe/Lisbon': 0,
    'Europe/Istanbul': 30,
    // 北美
    'America/New_York': -75,
    'America/Chicago': -90,
    'America/Denver': -105,
    'America/Los_Angeles': -120,
    'America/Phoenix': -105,
    'America/Toronto': -75,
    'America/Vancouver': -120,
    'America/Edmonton': -105,
    'America/Mexico_City': -90,
    'America/Cancun': -75,
    'Pacific/Honolulu': -150,
    // 南美
    'America/Sao_Paulo': -45,
    'America/Argentina/Buenos_Aires': -45,
    'America/Santiago': -60,
    'America/Lima': -75,
    'America/Bogota': -75,
    // 大洋洲
    'Australia/Sydney': 150,
    'Australia/Melbourne': 150,
    'Australia/Brisbane': 150,
    'Australia/Perth': 120,
    'Australia/Adelaide': 142.5,
    'Pacific/Auckland': 180,
    // 非洲
    'Africa/Johannesburg': 30,
    'Africa/Cairo': 30,
    'Africa/Casablanca': 0,
    'Africa/Nairobi': 45,
    'Africa/Lagos': 15,
    // 俄罗斯
    'Asia/Novosibirsk': 105,
    'Asia/Yekaterinburg': 75,
    'Asia/Vladivostok': 150,
  };

  const standardLongitude = timezoneOffsets[timezone] || 0;
  return Math.round((longitude - standardLongitude) * 4);
}

export default WORLD_REGIONS;
