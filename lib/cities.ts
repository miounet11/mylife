// 全球城市数据库 - 支持中英文搜索，包含经纬度和时区
export interface CityData {
  name: string;       // 中文名
  nameEn: string;     // 英文名
  province?: string;  // 省/州
  country: string;    // 国家
  countryEn: string;
  lng: number;        // 经度
  lat: number;        // 纬度
  tz: number;         // 标准时区 (UTC offset hours)
}

// ===== 中国主要城市 =====
const chinaCities: CityData[] = [
  // 直辖市
  { name: '北京', nameEn: 'Beijing', province: '北京', country: '中国', countryEn: 'China', lng: 116.407, lat: 39.904, tz: 8 },
  { name: '上海', nameEn: 'Shanghai', province: '上海', country: '中国', countryEn: 'China', lng: 121.474, lat: 31.230, tz: 8 },
  { name: '天津', nameEn: 'Tianjin', province: '天津', country: '中国', countryEn: 'China', lng: 117.190, lat: 39.126, tz: 8 },
  { name: '重庆', nameEn: 'Chongqing', province: '重庆', country: '中国', countryEn: 'China', lng: 106.551, lat: 29.563, tz: 8 },
  // 省会城市
  { name: '广州', nameEn: 'Guangzhou', province: '广东', country: '中国', countryEn: 'China', lng: 113.264, lat: 23.130, tz: 8 },
  { name: '深圳', nameEn: 'Shenzhen', province: '广东', country: '中国', countryEn: 'China', lng: 114.058, lat: 22.543, tz: 8 },
  { name: '杭州', nameEn: 'Hangzhou', province: '浙江', country: '中国', countryEn: 'China', lng: 120.154, lat: 30.274, tz: 8 },
  { name: '南京', nameEn: 'Nanjing', province: '江苏', country: '中国', countryEn: 'China', lng: 118.797, lat: 32.060, tz: 8 },
  { name: '成都', nameEn: 'Chengdu', province: '四川', country: '中国', countryEn: 'China', lng: 104.066, lat: 30.573, tz: 8 },
  { name: '武汉', nameEn: 'Wuhan', province: '湖北', country: '中国', countryEn: 'China', lng: 114.305, lat: 30.593, tz: 8 },
  { name: '西安', nameEn: "Xi'an", province: '陕西', country: '中国', countryEn: 'China', lng: 108.940, lat: 34.341, tz: 8 },
  { name: '长沙', nameEn: 'Changsha', province: '湖南', country: '中国', countryEn: 'China', lng: 112.938, lat: 28.228, tz: 8 },
  { name: '沈阳', nameEn: 'Shenyang', province: '辽宁', country: '中国', countryEn: 'China', lng: 123.432, lat: 41.805, tz: 8 },
  { name: '哈尔滨', nameEn: 'Harbin', province: '黑龙江', country: '中国', countryEn: 'China', lng: 126.535, lat: 45.802, tz: 8 },
  { name: '长春', nameEn: 'Changchun', province: '吉林', country: '中国', countryEn: 'China', lng: 125.324, lat: 43.886, tz: 8 },
  { name: '大连', nameEn: 'Dalian', province: '辽宁', country: '中国', countryEn: 'China', lng: 121.615, lat: 38.914, tz: 8 },
  { name: '济南', nameEn: 'Jinan', province: '山东', country: '中国', countryEn: 'China', lng: 117.000, lat: 36.675, tz: 8 },
  { name: '青岛', nameEn: 'Qingdao', province: '山东', country: '中国', countryEn: 'China', lng: 120.383, lat: 36.067, tz: 8 },
  { name: '郑州', nameEn: 'Zhengzhou', province: '河南', country: '中国', countryEn: 'China', lng: 113.665, lat: 34.757, tz: 8 },
  { name: '石家庄', nameEn: 'Shijiazhuang', province: '河北', country: '中国', countryEn: 'China', lng: 114.515, lat: 38.042, tz: 8 },
  { name: '太原', nameEn: 'Taiyuan', province: '山西', country: '中国', countryEn: 'China', lng: 112.549, lat: 37.870, tz: 8 },
  { name: '合肥', nameEn: 'Hefei', province: '安徽', country: '中国', countryEn: 'China', lng: 117.283, lat: 31.861, tz: 8 },
  { name: '福州', nameEn: 'Fuzhou', province: '福建', country: '中国', countryEn: 'China', lng: 119.306, lat: 26.075, tz: 8 },
  { name: '厦门', nameEn: 'Xiamen', province: '福建', country: '中国', countryEn: 'China', lng: 118.089, lat: 24.479, tz: 8 },
  { name: '南昌', nameEn: 'Nanchang', province: '江西', country: '中国', countryEn: 'China', lng: 115.858, lat: 28.682, tz: 8 },
  { name: '昆明', nameEn: 'Kunming', province: '云南', country: '中国', countryEn: 'China', lng: 102.712, lat: 25.040, tz: 8 },
  { name: '贵阳', nameEn: 'Guiyang', province: '贵州', country: '中国', countryEn: 'China', lng: 106.713, lat: 26.647, tz: 8 },
  { name: '南宁', nameEn: 'Nanning', province: '广西', country: '中国', countryEn: 'China', lng: 108.320, lat: 22.824, tz: 8 },
  { name: '海口', nameEn: 'Haikou', province: '海南', country: '中国', countryEn: 'China', lng: 110.350, lat: 20.020, tz: 8 },
  { name: '兰州', nameEn: 'Lanzhou', province: '甘肃', country: '中国', countryEn: 'China', lng: 103.834, lat: 36.061, tz: 8 },
  { name: '银川', nameEn: 'Yinchuan', province: '宁夏', country: '中国', countryEn: 'China', lng: 106.232, lat: 38.487, tz: 8 },
  { name: '西宁', nameEn: 'Xining', province: '青海', country: '中国', countryEn: 'China', lng: 101.778, lat: 36.617, tz: 8 },
  { name: '乌鲁木齐', nameEn: 'Urumqi', province: '新疆', country: '中国', countryEn: 'China', lng: 87.617, lat: 43.793, tz: 8 },
  { name: '拉萨', nameEn: 'Lhasa', province: '西藏', country: '中国', countryEn: 'China', lng: 91.111, lat: 29.645, tz: 8 },
  { name: '呼和浩特', nameEn: 'Hohhot', province: '内蒙古', country: '中国', countryEn: 'China', lng: 111.751, lat: 40.842, tz: 8 },
  { name: '苏州', nameEn: 'Suzhou', province: '江苏', country: '中国', countryEn: 'China', lng: 120.619, lat: 31.299, tz: 8 },
  { name: '无锡', nameEn: 'Wuxi', province: '江苏', country: '中国', countryEn: 'China', lng: 120.312, lat: 31.491, tz: 8 },
  { name: '宁波', nameEn: 'Ningbo', province: '浙江', country: '中国', countryEn: 'China', lng: 121.550, lat: 29.868, tz: 8 },
  { name: '温州', nameEn: 'Wenzhou', province: '浙江', country: '中国', countryEn: 'China', lng: 120.672, lat: 28.000, tz: 8 },
  { name: '东莞', nameEn: 'Dongguan', province: '广东', country: '中国', countryEn: 'China', lng: 113.746, lat: 23.020, tz: 8 },
  { name: '佛山', nameEn: 'Foshan', province: '广东', country: '中国', countryEn: 'China', lng: 113.122, lat: 23.029, tz: 8 },
  { name: '珠海', nameEn: 'Zhuhai', province: '广东', country: '中国', countryEn: 'China', lng: 113.553, lat: 22.271, tz: 8 },
  // 特别行政区
  { name: '香港', nameEn: 'Hong Kong', country: '中国', countryEn: 'China', lng: 114.174, lat: 22.320, tz: 8 },
  { name: '澳门', nameEn: 'Macau', country: '中国', countryEn: 'China', lng: 113.543, lat: 22.199, tz: 8 },
  { name: '台北', nameEn: 'Taipei', province: '台湾', country: '中国', countryEn: 'China', lng: 121.565, lat: 25.033, tz: 8 },
  { name: '高雄', nameEn: 'Kaohsiung', province: '台湾', country: '中国', countryEn: 'China', lng: 120.312, lat: 22.627, tz: 8 },
];

// ===== 亚洲主要城市 =====
const asiaCities: CityData[] = [
  { name: '东京', nameEn: 'Tokyo', country: '日本', countryEn: 'Japan', lng: 139.692, lat: 35.690, tz: 9 },
  { name: '大阪', nameEn: 'Osaka', country: '日本', countryEn: 'Japan', lng: 135.502, lat: 34.694, tz: 9 },
  { name: '首尔', nameEn: 'Seoul', country: '韩国', countryEn: 'South Korea', lng: 126.978, lat: 37.567, tz: 9 },
  { name: '曼谷', nameEn: 'Bangkok', country: '泰国', countryEn: 'Thailand', lng: 100.502, lat: 13.756, tz: 7 },
  { name: '新加坡', nameEn: 'Singapore', country: '新加坡', countryEn: 'Singapore', lng: 103.820, lat: 1.352, tz: 8 },
  { name: '吉隆坡', nameEn: 'Kuala Lumpur', country: '马来西亚', countryEn: 'Malaysia', lng: 101.687, lat: 3.139, tz: 8 },
  { name: '雅加达', nameEn: 'Jakarta', country: '印度尼西亚', countryEn: 'Indonesia', lng: 106.845, lat: -6.208, tz: 7 },
  { name: '马尼拉', nameEn: 'Manila', country: '菲律宾', countryEn: 'Philippines', lng: 120.984, lat: 14.600, tz: 8 },
  { name: '河内', nameEn: 'Hanoi', country: '越南', countryEn: 'Vietnam', lng: 105.854, lat: 21.029, tz: 7 },
  { name: '胡志明市', nameEn: 'Ho Chi Minh City', country: '越南', countryEn: 'Vietnam', lng: 106.660, lat: 10.823, tz: 7 },
  { name: '新德里', nameEn: 'New Delhi', country: '印度', countryEn: 'India', lng: 77.209, lat: 28.614, tz: 5.5 },
  { name: '孟买', nameEn: 'Mumbai', country: '印度', countryEn: 'India', lng: 72.878, lat: 19.076, tz: 5.5 },
  { name: '迪拜', nameEn: 'Dubai', country: '阿联酋', countryEn: 'UAE', lng: 55.271, lat: 25.205, tz: 4 },
  { name: '仰光', nameEn: 'Yangon', country: '缅甸', countryEn: 'Myanmar', lng: 96.196, lat: 16.871, tz: 6.5 },
  { name: '金边', nameEn: 'Phnom Penh', country: '柬埔寨', countryEn: 'Cambodia', lng: 104.921, lat: 11.557, tz: 7 },
  { name: '德黑兰', nameEn: 'Tehran', country: '伊朗', countryEn: 'Iran', lng: 51.389, lat: 35.689, tz: 3.5 },
  { name: '伊斯坦布尔', nameEn: 'Istanbul', country: '土耳其', countryEn: 'Turkey', lng: 28.979, lat: 41.009, tz: 3 },
];

// ===== 欧洲主要城市 =====
const europeCities: CityData[] = [
  { name: '伦敦', nameEn: 'London', country: '英国', countryEn: 'UK', lng: -0.128, lat: 51.507, tz: 0 },
  { name: '巴黎', nameEn: 'Paris', country: '法国', countryEn: 'France', lng: 2.352, lat: 48.857, tz: 1 },
  { name: '柏林', nameEn: 'Berlin', country: '德国', countryEn: 'Germany', lng: 13.405, lat: 52.520, tz: 1 },
  { name: '罗马', nameEn: 'Rome', country: '意大利', countryEn: 'Italy', lng: 12.496, lat: 41.903, tz: 1 },
  { name: '马德里', nameEn: 'Madrid', country: '西班牙', countryEn: 'Spain', lng: -3.704, lat: 40.417, tz: 1 },
  { name: '莫斯科', nameEn: 'Moscow', country: '俄罗斯', countryEn: 'Russia', lng: 37.618, lat: 55.756, tz: 3 },
  { name: '阿姆斯特丹', nameEn: 'Amsterdam', country: '荷兰', countryEn: 'Netherlands', lng: 4.900, lat: 52.367, tz: 1 },
  { name: '维也纳', nameEn: 'Vienna', country: '奥地利', countryEn: 'Austria', lng: 16.374, lat: 48.208, tz: 1 },
  { name: '苏黎世', nameEn: 'Zurich', country: '瑞士', countryEn: 'Switzerland', lng: 8.541, lat: 47.377, tz: 1 },
  { name: '斯德哥尔摩', nameEn: 'Stockholm', country: '瑞典', countryEn: 'Sweden', lng: 18.069, lat: 59.329, tz: 1 },
  { name: '赫尔辛基', nameEn: 'Helsinki', country: '芬兰', countryEn: 'Finland', lng: 24.938, lat: 60.170, tz: 2 },
  { name: '华沙', nameEn: 'Warsaw', country: '波兰', countryEn: 'Poland', lng: 21.012, lat: 52.230, tz: 1 },
  { name: '布拉格', nameEn: 'Prague', country: '捷克', countryEn: 'Czech Republic', lng: 14.438, lat: 50.076, tz: 1 },
  { name: '雅典', nameEn: 'Athens', country: '希腊', countryEn: 'Greece', lng: 23.728, lat: 37.984, tz: 2 },
  { name: '里斯本', nameEn: 'Lisbon', country: '葡萄牙', countryEn: 'Portugal', lng: -9.139, lat: 38.722, tz: 0 },
  { name: '都柏林', nameEn: 'Dublin', country: '爱尔兰', countryEn: 'Ireland', lng: -6.260, lat: 53.350, tz: 0 },
];

// ===== 北美主要城市 =====
const northAmericaCities: CityData[] = [
  { name: '纽约', nameEn: 'New York', province: 'NY', country: '美国', countryEn: 'USA', lng: -74.006, lat: 40.713, tz: -5 },
  { name: '洛杉矶', nameEn: 'Los Angeles', province: 'CA', country: '美国', countryEn: 'USA', lng: -118.244, lat: 34.052, tz: -8 },
  { name: '旧金山', nameEn: 'San Francisco', province: 'CA', country: '美国', countryEn: 'USA', lng: -122.420, lat: 37.775, tz: -8 },
  { name: '芝加哥', nameEn: 'Chicago', province: 'IL', country: '美国', countryEn: 'USA', lng: -87.630, lat: 41.878, tz: -6 },
  { name: '休斯顿', nameEn: 'Houston', province: 'TX', country: '美国', countryEn: 'USA', lng: -95.370, lat: 29.760, tz: -6 },
  { name: '西雅图', nameEn: 'Seattle', province: 'WA', country: '美国', countryEn: 'USA', lng: -122.332, lat: 47.606, tz: -8 },
  { name: '波士顿', nameEn: 'Boston', province: 'MA', country: '美国', countryEn: 'USA', lng: -71.058, lat: 42.360, tz: -5 },
  { name: '华盛顿', nameEn: 'Washington D.C.', province: 'DC', country: '美国', countryEn: 'USA', lng: -77.037, lat: 38.907, tz: -5 },
  { name: '多伦多', nameEn: 'Toronto', country: '加拿大', countryEn: 'Canada', lng: -79.383, lat: 43.653, tz: -5 },
  { name: '温哥华', nameEn: 'Vancouver', country: '加拿大', countryEn: 'Canada', lng: -123.121, lat: 49.283, tz: -8 },
  { name: '蒙特利尔', nameEn: 'Montreal', country: '加拿大', countryEn: 'Canada', lng: -73.568, lat: 45.502, tz: -5 },
  { name: '墨西哥城', nameEn: 'Mexico City', country: '墨西哥', countryEn: 'Mexico', lng: -99.133, lat: 19.432, tz: -6 },
];

// ===== 南美主要城市 =====
const southAmericaCities: CityData[] = [
  { name: '圣保罗', nameEn: 'São Paulo', country: '巴西', countryEn: 'Brazil', lng: -46.634, lat: -23.548, tz: -3 },
  { name: '布宜诺斯艾利斯', nameEn: 'Buenos Aires', country: '阿根廷', countryEn: 'Argentina', lng: -58.382, lat: -34.604, tz: -3 },
  { name: '利马', nameEn: 'Lima', country: '秘鲁', countryEn: 'Peru', lng: -77.043, lat: -12.046, tz: -5 },
  { name: '圣地亚哥', nameEn: 'Santiago', country: '智利', countryEn: 'Chile', lng: -70.669, lat: -33.449, tz: -4 },
  { name: '波哥大', nameEn: 'Bogotá', country: '哥伦比亚', countryEn: 'Colombia', lng: -74.072, lat: 4.711, tz: -5 },
];

// ===== 大洋洲主要城市 =====
const oceaniaCities: CityData[] = [
  { name: '悉尼', nameEn: 'Sydney', country: '澳大利亚', countryEn: 'Australia', lng: 151.209, lat: -33.868, tz: 10 },
  { name: '墨尔本', nameEn: 'Melbourne', country: '澳大利亚', countryEn: 'Australia', lng: 144.963, lat: -37.814, tz: 10 },
  { name: '奥克兰', nameEn: 'Auckland', country: '新西兰', countryEn: 'New Zealand', lng: 174.763, lat: -36.848, tz: 12 },
];

// ===== 非洲主要城市 =====
const africaCities: CityData[] = [
  { name: '开罗', nameEn: 'Cairo', country: '埃及', countryEn: 'Egypt', lng: 31.236, lat: 30.044, tz: 2 },
  { name: '约翰内斯堡', nameEn: 'Johannesburg', country: '南非', countryEn: 'South Africa', lng: 28.048, lat: -26.205, tz: 2 },
  { name: '内罗毕', nameEn: 'Nairobi', country: '肯尼亚', countryEn: 'Kenya', lng: 36.822, lat: -1.292, tz: 3 },
  { name: '拉各斯', nameEn: 'Lagos', country: '尼日利亚', countryEn: 'Nigeria', lng: 3.379, lat: 6.524, tz: 1 },
  { name: '卡萨布兰卡', nameEn: 'Casablanca', country: '摩洛哥', countryEn: 'Morocco', lng: -7.589, lat: 33.573, tz: 1 },
];

// 合并所有城市
export const ALL_CITIES: CityData[] = [
  ...chinaCities,
  ...asiaCities,
  ...europeCities,
  ...northAmericaCities,
  ...southAmericaCities,
  ...oceaniaCities,
  ...africaCities,
];

// 搜索城市 - 支持中文名、英文名、拼音首字母
export function searchCities(query: string, limit: number = 20): CityData[] {
  if (!query || query.trim().length === 0) {
    // 默认返回中国热门城市
    return chinaCities.slice(0, limit);
  }

  const q = query.toLowerCase().trim();

  return ALL_CITIES.filter(city => {
    return (
      city.name.includes(q) ||
      city.nameEn.toLowerCase().includes(q) ||
      (city.province && city.province.includes(q)) ||
      city.country.includes(q) ||
      city.countryEn.toLowerCase().includes(q)
    );
  }).slice(0, limit);
}

// 根据城市名精确查找
export function findCity(name: string): CityData | undefined {
  return ALL_CITIES.find(c => c.name === name || c.nameEn.toLowerCase() === name.toLowerCase());
}
