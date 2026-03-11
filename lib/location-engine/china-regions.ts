/**
 * 中国行政区划数据 (含经纬度)
 * 数据结构: 省 -> 市 -> 区/县
 * 用于真太阳时计算的地理位置选择
 */

export interface District {
  name: string;
  longitude: number;
  latitude: number;
}

export interface City {
  name: string;
  longitude: number;
  latitude: number;
  districts: District[];
}

export interface Province {
  name: string;
  longitude: number;
  latitude: number;
  cities: City[];
}

// 中国所有省市区数据
export const CHINA_REGIONS: Province[] = [
  // ========== 直辖市 ==========
  {
    name: '北京市',
    longitude: 116.4074,
    latitude: 39.9042,
    cities: [
      {
        name: '北京市',
        longitude: 116.4074,
        latitude: 39.9042,
        districts: [
          { name: '东城区', longitude: 116.4166, latitude: 39.9289 },
          { name: '西城区', longitude: 116.3662, latitude: 39.9123 },
          { name: '朝阳区', longitude: 116.4865, latitude: 39.9219 },
          { name: '丰台区', longitude: 116.2869, latitude: 39.8585 },
          { name: '石景山区', longitude: 116.2229, latitude: 39.9056 },
          { name: '海淀区', longitude: 116.2982, latitude: 39.9593 },
          { name: '门头沟区', longitude: 116.1021, latitude: 39.9404 },
          { name: '房山区', longitude: 116.1433, latitude: 39.7479 },
          { name: '通州区', longitude: 116.6566, latitude: 39.9096 },
          { name: '顺义区', longitude: 116.6545, latitude: 40.1302 },
          { name: '昌平区', longitude: 116.2312, latitude: 40.2207 },
          { name: '大兴区', longitude: 116.3418, latitude: 39.7264 },
          { name: '怀柔区', longitude: 116.6319, latitude: 40.3161 },
          { name: '平谷区', longitude: 117.1212, latitude: 40.1406 },
          { name: '密云区', longitude: 116.8433, latitude: 40.3768 },
          { name: '延庆区', longitude: 115.9748, latitude: 40.4567 },
        ],
      },
    ],
  },
  {
    name: '天津市',
    longitude: 117.1901,
    latitude: 39.1256,
    cities: [
      {
        name: '天津市',
        longitude: 117.1901,
        latitude: 39.1256,
        districts: [
          { name: '和平区', longitude: 117.2145, latitude: 39.1172 },
          { name: '河东区', longitude: 117.2513, latitude: 39.1281 },
          { name: '河西区', longitude: 117.2233, latitude: 39.1095 },
          { name: '南开区', longitude: 117.1506, latitude: 39.1382 },
          { name: '河北区', longitude: 117.1967, latitude: 39.1478 },
          { name: '红桥区', longitude: 117.1514, latitude: 39.1671 },
          { name: '东丽区', longitude: 117.3143, latitude: 39.0864 },
          { name: '西青区', longitude: 117.0089, latitude: 39.1412 },
          { name: '津南区', longitude: 117.3571, latitude: 38.9919 },
          { name: '北辰区', longitude: 117.1353, latitude: 39.2244 },
          { name: '武清区', longitude: 117.0441, latitude: 39.3841 },
          { name: '宝坻区', longitude: 117.3099, latitude: 39.7173 },
          { name: '滨海新区', longitude: 117.6986, latitude: 39.0032 },
          { name: '宁河区', longitude: 117.8254, latitude: 39.3305 },
          { name: '静海区', longitude: 116.9741, latitude: 38.9475 },
          { name: '蓟州区', longitude: 117.4084, latitude: 40.0457 },
        ],
      },
    ],
  },
  {
    name: '上海市',
    longitude: 121.4737,
    latitude: 31.2304,
    cities: [
      {
        name: '上海市',
        longitude: 121.4737,
        latitude: 31.2304,
        districts: [
          { name: '黄浦区', longitude: 121.4846, latitude: 31.2318 },
          { name: '徐汇区', longitude: 121.4365, latitude: 31.1883 },
          { name: '长宁区', longitude: 121.4246, latitude: 31.2204 },
          { name: '静安区', longitude: 121.4479, latitude: 31.2288 },
          { name: '普陀区', longitude: 121.3970, latitude: 31.2496 },
          { name: '虹口区', longitude: 121.5047, latitude: 31.2647 },
          { name: '杨浦区', longitude: 121.5260, latitude: 31.2595 },
          { name: '闵行区', longitude: 121.3817, latitude: 31.1128 },
          { name: '宝山区', longitude: 121.4891, latitude: 31.4052 },
          { name: '嘉定区', longitude: 121.2655, latitude: 31.3747 },
          { name: '浦东新区', longitude: 121.5447, latitude: 31.2214 },
          { name: '金山区', longitude: 121.3416, latitude: 30.7419 },
          { name: '松江区', longitude: 121.2277, latitude: 31.0326 },
          { name: '青浦区', longitude: 121.1240, latitude: 31.1496 },
          { name: '奉贤区', longitude: 121.4741, latitude: 30.9179 },
          { name: '崇明区', longitude: 121.3973, latitude: 31.6227 },
        ],
      },
    ],
  },
  {
    name: '重庆市',
    longitude: 106.5516,
    latitude: 29.5630,
    cities: [
      {
        name: '重庆市',
        longitude: 106.5516,
        latitude: 29.5630,
        districts: [
          { name: '渝中区', longitude: 106.5691, latitude: 29.5530 },
          { name: '万州区', longitude: 108.4089, latitude: 30.8079 },
          { name: '涪陵区', longitude: 107.3896, latitude: 29.7030 },
          { name: '大渡口区', longitude: 106.4831, latitude: 29.4843 },
          { name: '江北区', longitude: 106.5749, latitude: 29.6063 },
          { name: '沙坪坝区', longitude: 106.4542, latitude: 29.5411 },
          { name: '九龙坡区', longitude: 106.5110, latitude: 29.5020 },
          { name: '南岸区', longitude: 106.5446, latitude: 29.5000 },
          { name: '北碚区', longitude: 106.3959, latitude: 29.8057 },
          { name: '綦江区', longitude: 106.6512, latitude: 28.9606 },
          { name: '大足区', longitude: 105.7214, latitude: 29.7007 },
          { name: '渝北区', longitude: 106.6312, latitude: 29.7182 },
          { name: '巴南区', longitude: 106.5402, latitude: 29.4029 },
          { name: '黔江区', longitude: 108.7709, latitude: 29.5332 },
          { name: '长寿区', longitude: 107.0818, latitude: 29.8576 },
          { name: '江津区', longitude: 106.2592, latitude: 29.2901 },
          { name: '合川区', longitude: 106.2764, latitude: 29.9723 },
          { name: '永川区', longitude: 105.9270, latitude: 29.3560 },
          { name: '南川区', longitude: 107.0989, latitude: 29.1576 },
          { name: '璧山区', longitude: 106.2311, latitude: 29.5935 },
          { name: '铜梁区', longitude: 106.0545, latitude: 29.8399 },
          { name: '潼南区', longitude: 105.8400, latitude: 30.1912 },
          { name: '荣昌区', longitude: 105.5943, latitude: 29.4049 },
          { name: '开州区', longitude: 108.3933, latitude: 31.1609 },
          { name: '梁平区', longitude: 107.8000, latitude: 30.6754 },
          { name: '武隆区', longitude: 107.7601, latitude: 29.3255 },
        ],
      },
    ],
  },

  // ========== 华北地区 ==========
  {
    name: '河北省',
    longitude: 114.5149,
    latitude: 38.0428,
    cities: [
      { name: '石家庄市', longitude: 114.5149, latitude: 38.0428, districts: [
        { name: '长安区', longitude: 114.5391, latitude: 38.0369 },
        { name: '桥西区', longitude: 114.4612, latitude: 38.0041 },
        { name: '新华区', longitude: 114.4633, latitude: 38.0511 },
        { name: '井陉矿区', longitude: 114.0621, latitude: 38.0652 },
        { name: '裕华区', longitude: 114.5313, latitude: 38.0063 },
        { name: '藁城区', longitude: 114.8471, latitude: 38.0218 },
        { name: '鹿泉区', longitude: 114.3135, latitude: 38.0857 },
        { name: '栾城区', longitude: 114.6483, latitude: 37.9002 },
      ]},
      { name: '唐山市', longitude: 118.1802, latitude: 39.6306, districts: [
        { name: '路南区', longitude: 118.1545, latitude: 39.6250 },
        { name: '路北区', longitude: 118.2008, latitude: 39.6244 },
        { name: '古冶区', longitude: 118.4580, latitude: 39.7334 },
        { name: '开平区', longitude: 118.2616, latitude: 39.6713 },
        { name: '丰南区', longitude: 118.1131, latitude: 39.5762 },
        { name: '丰润区', longitude: 118.1295, latitude: 39.8324 },
        { name: '曹妃甸区', longitude: 118.4605, latitude: 39.2731 },
      ]},
      { name: '秦皇岛市', longitude: 119.5182, latitude: 39.8857, districts: [
        { name: '海港区', longitude: 119.6104, latitude: 39.9343 },
        { name: '山海关区', longitude: 119.7756, latitude: 39.9784 },
        { name: '北戴河区', longitude: 119.4886, latitude: 39.8347 },
        { name: '抚宁区', longitude: 119.2439, latitude: 39.8761 },
      ]},
      { name: '邯郸市', longitude: 114.5391, latitude: 36.6256, districts: [
        { name: '邯山区', longitude: 114.5310, latitude: 36.6003 },
        { name: '丛台区', longitude: 114.4930, latitude: 36.6363 },
        { name: '复兴区', longitude: 114.4621, latitude: 36.6389 },
        { name: '峰峰矿区', longitude: 114.2130, latitude: 36.4187 },
      ]},
      { name: '邢台市', longitude: 114.5048, latitude: 37.0682, districts: [] },
      { name: '保定市', longitude: 115.4648, latitude: 38.8737, districts: [
        { name: '竞秀区', longitude: 115.4587, latitude: 38.8776 },
        { name: '莲池区', longitude: 115.4970, latitude: 38.8836 },
        { name: '满城区', longitude: 115.3222, latitude: 38.9482 },
        { name: '清苑区', longitude: 115.4898, latitude: 38.7651 },
        { name: '徐水区', longitude: 115.6557, latitude: 39.0184 },
      ]},
      { name: '张家口市', longitude: 114.8857, latitude: 40.7688, districts: [] },
      { name: '承德市', longitude: 117.9334, latitude: 40.9925, districts: [] },
      { name: '沧州市', longitude: 116.8574, latitude: 38.3106, districts: [] },
      { name: '廊坊市', longitude: 116.7042, latitude: 39.5186, districts: [
        { name: '安次区', longitude: 116.7029, latitude: 39.5021 },
        { name: '广阳区', longitude: 116.7107, latitude: 39.5228 },
        { name: '固安县', longitude: 116.2989, latitude: 39.4384 },
        { name: '永清县', longitude: 116.4990, latitude: 39.3206 },
        { name: '香河县', longitude: 117.0063, latitude: 39.7613 },
        { name: '大城县', longitude: 116.6536, latitude: 38.7053 },
        { name: '文安县', longitude: 116.4575, latitude: 38.8730 },
        { name: '大厂回族自治县', longitude: 116.9895, latitude: 39.8865 },
        { name: '霸州市', longitude: 116.3914, latitude: 39.1256 },
        { name: '三河市', longitude: 117.0787, latitude: 39.9830 },
      ]},
      { name: '衡水市', longitude: 115.6707, latitude: 37.7392, districts: [] },
    ],
  },
  {
    name: '山西省',
    longitude: 112.5489,
    latitude: 37.8706,
    cities: [
      { name: '太原市', longitude: 112.5489, latitude: 37.8706, districts: [
        { name: '小店区', longitude: 112.5657, latitude: 37.7365 },
        { name: '迎泽区', longitude: 112.5634, latitude: 37.8633 },
        { name: '杏花岭区', longitude: 112.5708, latitude: 37.8840 },
        { name: '尖草坪区', longitude: 112.4867, latitude: 37.9402 },
        { name: '万柏林区', longitude: 112.5156, latitude: 37.8593 },
        { name: '晋源区', longitude: 112.4779, latitude: 37.7247 },
      ]},
      { name: '大同市', longitude: 113.2953, latitude: 40.0903, districts: [] },
      { name: '阳泉市', longitude: 113.5804, latitude: 37.8568, districts: [] },
      { name: '长治市', longitude: 113.1163, latitude: 36.1954, districts: [] },
      { name: '晋城市', longitude: 112.8513, latitude: 35.4908, districts: [] },
      { name: '朔州市', longitude: 112.4329, latitude: 39.3316, districts: [] },
      { name: '晋中市', longitude: 112.7521, latitude: 37.6878, districts: [] },
      { name: '运城市', longitude: 111.0039, latitude: 35.0228, districts: [] },
      { name: '忻州市', longitude: 112.7342, latitude: 38.4167, districts: [] },
      { name: '临汾市', longitude: 111.5190, latitude: 36.0880, districts: [] },
      { name: '吕梁市', longitude: 111.1441, latitude: 37.5183, districts: [] },
    ],
  },
  {
    name: '内蒙古自治区',
    longitude: 111.7652,
    latitude: 40.8183,
    cities: [
      { name: '呼和浩特市', longitude: 111.7652, latitude: 40.8183, districts: [
        { name: '新城区', longitude: 111.6655, latitude: 40.8583 },
        { name: '回民区', longitude: 111.6240, latitude: 40.8083 },
        { name: '玉泉区', longitude: 111.6746, latitude: 40.7530 },
        { name: '赛罕区', longitude: 111.7019, latitude: 40.7922 },
      ]},
      { name: '包头市', longitude: 109.8400, latitude: 40.6571, districts: [] },
      { name: '乌海市', longitude: 106.7943, latitude: 39.6553, districts: [] },
      { name: '赤峰市', longitude: 118.8863, latitude: 42.2570, districts: [] },
      { name: '通辽市', longitude: 122.2438, latitude: 43.6170, districts: [] },
      { name: '鄂尔多斯市', longitude: 109.7813, latitude: 39.6083, districts: [] },
      { name: '呼伦贝尔市', longitude: 119.7658, latitude: 49.2122, districts: [] },
      { name: '巴彦淖尔市', longitude: 107.3875, latitude: 40.7431, districts: [] },
      { name: '乌兰察布市', longitude: 113.1145, latitude: 41.0223, districts: [] },
      { name: '兴安盟', longitude: 122.0378, latitude: 46.0826, districts: [] },
      { name: '锡林郭勒盟', longitude: 116.0466, latitude: 43.9332, districts: [] },
      { name: '阿拉善盟', longitude: 105.7289, latitude: 38.8510, districts: [] },
    ],
  },

  // ========== 东北地区 ==========
  {
    name: '辽宁省',
    longitude: 123.4291,
    latitude: 41.7968,
    cities: [
      { name: '沈阳市', longitude: 123.4291, latitude: 41.7968, districts: [
        { name: '和平区', longitude: 123.4204, latitude: 41.7891 },
        { name: '沈河区', longitude: 123.4587, latitude: 41.7963 },
        { name: '大东区', longitude: 123.4699, latitude: 41.8053 },
        { name: '皇姑区', longitude: 123.4252, latitude: 41.8244 },
        { name: '铁西区', longitude: 123.3765, latitude: 41.8027 },
        { name: '苏家屯区', longitude: 123.3440, latitude: 41.6649 },
        { name: '浑南区', longitude: 123.4497, latitude: 41.7149 },
        { name: '沈北新区', longitude: 123.5266, latitude: 42.0530 },
        { name: '于洪区', longitude: 123.3080, latitude: 41.7940 },
      ]},
      { name: '大连市', longitude: 121.6147, latitude: 38.9140, districts: [
        { name: '中山区', longitude: 121.6449, latitude: 38.9187 },
        { name: '西岗区', longitude: 121.6125, latitude: 38.9145 },
        { name: '沙河口区', longitude: 121.5941, latitude: 38.9049 },
        { name: '甘井子区', longitude: 121.5258, latitude: 38.9532 },
        { name: '旅顺口区', longitude: 121.2619, latitude: 38.8513 },
        { name: '金州区', longitude: 121.7827, latitude: 39.1001 },
      ]},
      { name: '鞍山市', longitude: 122.9949, latitude: 41.1085, districts: [] },
      { name: '抚顺市', longitude: 123.9573, latitude: 41.8807, districts: [] },
      { name: '本溪市', longitude: 123.7667, latitude: 41.2947, districts: [] },
      { name: '丹东市', longitude: 124.3549, latitude: 40.0001, districts: [] },
      { name: '锦州市', longitude: 121.1269, latitude: 41.0951, districts: [] },
      { name: '营口市', longitude: 122.2349, latitude: 40.6683, districts: [] },
      { name: '阜新市', longitude: 121.6701, latitude: 42.0218, districts: [] },
      { name: '辽阳市', longitude: 123.2367, latitude: 41.2684, districts: [] },
      { name: '盘锦市', longitude: 122.0703, latitude: 41.1194, districts: [] },
      { name: '铁岭市', longitude: 123.8441, latitude: 42.2861, districts: [] },
      { name: '朝阳市', longitude: 120.4509, latitude: 41.5736, districts: [] },
      { name: '葫芦岛市', longitude: 120.8372, latitude: 40.7110, districts: [] },
    ],
  },
  {
    name: '吉林省',
    longitude: 125.3235,
    latitude: 43.8171,
    cities: [
      { name: '长春市', longitude: 125.3235, latitude: 43.8171, districts: [
        { name: '南关区', longitude: 125.3505, latitude: 43.8640 },
        { name: '宽城区', longitude: 125.3264, latitude: 43.9018 },
        { name: '朝阳区', longitude: 125.2883, latitude: 43.8337 },
        { name: '二道区', longitude: 125.3746, latitude: 43.8652 },
        { name: '绿园区', longitude: 125.2558, latitude: 43.8803 },
        { name: '双阳区', longitude: 125.6642, latitude: 43.5252 },
        { name: '九台区', longitude: 125.8395, latitude: 44.1517 },
      ]},
      { name: '吉林市', longitude: 126.5496, latitude: 43.8378, districts: [] },
      { name: '四平市', longitude: 124.3505, latitude: 43.1668, districts: [] },
      { name: '辽源市', longitude: 125.1450, latitude: 42.8878, districts: [] },
      { name: '通化市', longitude: 125.9398, latitude: 41.7281, districts: [] },
      { name: '白山市', longitude: 126.4148, latitude: 41.9425, districts: [] },
      { name: '松原市', longitude: 124.8252, latitude: 45.1417, districts: [] },
      { name: '白城市', longitude: 122.8407, latitude: 45.6196, districts: [] },
      { name: '延边朝鲜族自治州', longitude: 129.5132, latitude: 42.9048, districts: [] },
    ],
  },
  {
    name: '黑龙江省',
    longitude: 126.6424,
    latitude: 45.7570,
    cities: [
      { name: '哈尔滨市', longitude: 126.6424, latitude: 45.7570, districts: [
        { name: '道里区', longitude: 126.6167, latitude: 45.7553 },
        { name: '南岗区', longitude: 126.6687, latitude: 45.7600 },
        { name: '道外区', longitude: 126.6494, latitude: 45.7924 },
        { name: '平房区', longitude: 126.6373, latitude: 45.5975 },
        { name: '松北区', longitude: 126.5101, latitude: 45.8020 },
        { name: '香坊区', longitude: 126.6622, latitude: 45.7077 },
        { name: '呼兰区', longitude: 126.5873, latitude: 45.8892 },
        { name: '阿城区', longitude: 126.9580, latitude: 45.5454 },
        { name: '双城区', longitude: 126.3128, latitude: 45.3830 },
      ]},
      { name: '齐齐哈尔市', longitude: 123.9179, latitude: 47.3540, districts: [] },
      { name: '鸡西市', longitude: 130.9696, latitude: 45.2949, districts: [] },
      { name: '鹤岗市', longitude: 130.2979, latitude: 47.3498, districts: [] },
      { name: '双鸭山市', longitude: 131.1592, latitude: 46.6464, districts: [] },
      { name: '大庆市', longitude: 125.1037, latitude: 46.5907, districts: [] },
      { name: '伊春市', longitude: 128.8995, latitude: 47.7278, districts: [] },
      { name: '佳木斯市', longitude: 130.3611, latitude: 46.8139, districts: [] },
      { name: '七台河市', longitude: 131.0030, latitude: 45.7710, districts: [] },
      { name: '牡丹江市', longitude: 129.6329, latitude: 44.5521, districts: [] },
      { name: '黑河市', longitude: 127.5285, latitude: 50.2449, districts: [] },
      { name: '绥化市', longitude: 126.9688, latitude: 46.6531, districts: [] },
      { name: '大兴安岭地区', longitude: 124.7118, latitude: 52.3353, districts: [] },
    ],
  },

  // ========== 华东地区 ==========
  {
    name: '江苏省',
    longitude: 118.7969,
    latitude: 32.0603,
    cities: [
      { name: '南京市', longitude: 118.7969, latitude: 32.0603, districts: [
        { name: '玄武区', longitude: 118.7978, latitude: 32.0486 },
        { name: '秦淮区', longitude: 118.7947, latitude: 32.0394 },
        { name: '建邺区', longitude: 118.7319, latitude: 32.0036 },
        { name: '鼓楼区', longitude: 118.7697, latitude: 32.0665 },
        { name: '浦口区', longitude: 118.6281, latitude: 32.0588 },
        { name: '栖霞区', longitude: 118.9092, latitude: 32.0964 },
        { name: '雨花台区', longitude: 118.7794, latitude: 31.9918 },
        { name: '江宁区', longitude: 118.8399, latitude: 31.9535 },
        { name: '六合区', longitude: 118.8413, latitude: 32.3221 },
        { name: '溧水区', longitude: 119.0283, latitude: 31.6513 },
        { name: '高淳区', longitude: 118.8751, latitude: 31.3276 },
      ]},
      { name: '无锡市', longitude: 120.3119, latitude: 31.4912, districts: [
        { name: '锡山区', longitude: 120.3576, latitude: 31.5887 },
        { name: '惠山区', longitude: 120.2989, latitude: 31.6808 },
        { name: '滨湖区', longitude: 120.2833, latitude: 31.5271 },
        { name: '梁溪区', longitude: 120.3033, latitude: 31.5660 },
        { name: '新吴区', longitude: 120.3522, latitude: 31.5509 },
        { name: '江阴市', longitude: 120.2854, latitude: 31.9206 },
        { name: '宜兴市', longitude: 119.8233, latitude: 31.3404 },
      ]},
      { name: '徐州市', longitude: 117.1847, latitude: 34.2618, districts: [] },
      { name: '常州市', longitude: 119.9741, latitude: 31.8115, districts: [] },
      { name: '苏州市', longitude: 120.5853, latitude: 31.2990, districts: [
        { name: '虎丘区', longitude: 120.5719, latitude: 31.2961 },
        { name: '吴中区', longitude: 120.6323, latitude: 31.2626 },
        { name: '相城区', longitude: 120.6424, latitude: 31.3691 },
        { name: '姑苏区', longitude: 120.6167, latitude: 31.3117 },
        { name: '吴江区', longitude: 120.6453, latitude: 31.1380 },
        { name: '常熟市', longitude: 120.7520, latitude: 31.6538 },
        { name: '张家港市', longitude: 120.5543, latitude: 31.8756 },
        { name: '昆山市', longitude: 120.9808, latitude: 31.3856 },
        { name: '太仓市', longitude: 121.1303, latitude: 31.4576 },
      ]},
      { name: '南通市', longitude: 120.8943, latitude: 31.9807, districts: [] },
      { name: '连云港市', longitude: 119.2218, latitude: 34.5966, districts: [] },
      { name: '淮安市', longitude: 119.0150, latitude: 33.6103, districts: [] },
      { name: '盐城市', longitude: 120.1617, latitude: 33.3476, districts: [] },
      { name: '扬州市', longitude: 119.4124, latitude: 32.3942, districts: [] },
      { name: '镇江市', longitude: 119.4247, latitude: 32.1876, districts: [] },
      { name: '泰州市', longitude: 119.9234, latitude: 32.4559, districts: [] },
      { name: '宿迁市', longitude: 118.2752, latitude: 33.9630, districts: [] },
    ],
  },
  {
    name: '浙江省',
    longitude: 120.1536,
    latitude: 30.2875,
    cities: [
      { name: '杭州市', longitude: 120.1536, latitude: 30.2875, districts: [
        { name: '上城区', longitude: 120.1692, latitude: 30.2425 },
        { name: '拱墅区', longitude: 120.1418, latitude: 30.3194 },
        { name: '西湖区', longitude: 120.1306, latitude: 30.2593 },
        { name: '滨江区', longitude: 120.2120, latitude: 30.2084 },
        { name: '萧山区', longitude: 120.2644, latitude: 30.1847 },
        { name: '余杭区', longitude: 120.2998, latitude: 30.4189 },
        { name: '富阳区', longitude: 119.9602, latitude: 30.0486 },
        { name: '临安区', longitude: 119.7247, latitude: 30.2339 },
        { name: '临平区', longitude: 120.3000, latitude: 30.4189 },
        { name: '钱塘区', longitude: 120.4922, latitude: 30.2700 },
      ]},
      { name: '宁波市', longitude: 121.5501, latitude: 29.8684, districts: [
        { name: '海曙区', longitude: 121.5505, latitude: 29.8597 },
        { name: '江北区', longitude: 121.5550, latitude: 29.8869 },
        { name: '北仑区', longitude: 121.8444, latitude: 29.8991 },
        { name: '镇海区', longitude: 121.7162, latitude: 29.9489 },
        { name: '鄞州区', longitude: 121.5466, latitude: 29.8161 },
        { name: '奉化区', longitude: 121.4074, latitude: 29.6549 },
      ]},
      { name: '温州市', longitude: 120.6994, latitude: 28.0001, districts: [] },
      { name: '嘉兴市', longitude: 120.7568, latitude: 30.7460, districts: [] },
      { name: '湖州市', longitude: 120.0865, latitude: 30.8944, districts: [] },
      { name: '绍兴市', longitude: 120.5801, latitude: 30.0295, districts: [] },
      { name: '金华市', longitude: 119.6495, latitude: 29.0895, districts: [] },
      { name: '衢州市', longitude: 118.8593, latitude: 28.9705, districts: [] },
      { name: '舟山市', longitude: 122.1066, latitude: 29.9853, districts: [] },
      { name: '台州市', longitude: 121.4206, latitude: 28.6561, districts: [] },
      { name: '丽水市', longitude: 119.9228, latitude: 28.4672, districts: [] },
    ],
  },
  {
    name: '安徽省',
    longitude: 117.2831,
    latitude: 31.8612,
    cities: [
      { name: '合肥市', longitude: 117.2831, latitude: 31.8612, districts: [
        { name: '瑶海区', longitude: 117.3094, latitude: 31.8579 },
        { name: '庐阳区', longitude: 117.2646, latitude: 31.8787 },
        { name: '蜀山区', longitude: 117.2604, latitude: 31.8512 },
        { name: '包河区', longitude: 117.3096, latitude: 31.7933 },
        { name: '长丰县', longitude: 117.1676, latitude: 32.4776 },
        { name: '肥东县', longitude: 117.4693, latitude: 31.8878 },
        { name: '肥西县', longitude: 117.1582, latitude: 31.7068 },
        { name: '庐江县', longitude: 117.2881, latitude: 31.2555 },
        { name: '巢湖市', longitude: 117.8740, latitude: 31.6004 },
      ]},
      { name: '芜湖市', longitude: 118.4331, latitude: 31.3524, districts: [] },
      { name: '蚌埠市', longitude: 117.3892, latitude: 32.9170, districts: [] },
      { name: '淮南市', longitude: 117.0183, latitude: 32.6473, districts: [] },
      { name: '马鞍山市', longitude: 118.5073, latitude: 31.6704, districts: [] },
      { name: '淮北市', longitude: 116.7984, latitude: 33.9555, districts: [] },
      { name: '铜陵市', longitude: 117.8121, latitude: 30.9455, districts: [] },
      { name: '安庆市', longitude: 117.0630, latitude: 30.5263, districts: [] },
      { name: '黄山市', longitude: 118.3381, latitude: 29.7146, districts: [] },
      { name: '滁州市', longitude: 118.3167, latitude: 32.3017, districts: [] },
      { name: '阜阳市', longitude: 115.8141, latitude: 32.8908, districts: [] },
      { name: '宿州市', longitude: 116.9644, latitude: 33.6469, districts: [] },
      { name: '六安市', longitude: 116.5078, latitude: 31.7528, districts: [] },
      { name: '亳州市', longitude: 115.7785, latitude: 33.8441, districts: [] },
      { name: '池州市', longitude: 117.4919, latitude: 30.6648, districts: [] },
      { name: '宣城市', longitude: 118.7580, latitude: 30.9403, districts: [] },
    ],
  },
  {
    name: '福建省',
    longitude: 119.2965,
    latitude: 26.0745,
    cities: [
      { name: '福州市', longitude: 119.2965, latitude: 26.0745, districts: [
        { name: '鼓楼区', longitude: 119.3038, latitude: 26.0819 },
        { name: '台江区', longitude: 119.3144, latitude: 26.0529 },
        { name: '仓山区', longitude: 119.3151, latitude: 26.0463 },
        { name: '马尾区', longitude: 119.4555, latitude: 25.9896 },
        { name: '晋安区', longitude: 119.3286, latitude: 26.0818 },
        { name: '长乐区', longitude: 119.5231, latitude: 25.9625 },
      ]},
      { name: '厦门市', longitude: 118.0894, latitude: 24.4798, districts: [
        { name: '思明区', longitude: 118.0819, latitude: 24.4454 },
        { name: '海沧区', longitude: 118.0329, latitude: 24.4846 },
        { name: '湖里区', longitude: 118.1465, latitude: 24.5120 },
        { name: '集美区', longitude: 118.0971, latitude: 24.5757 },
        { name: '同安区', longitude: 118.1520, latitude: 24.7229 },
        { name: '翔安区', longitude: 118.2479, latitude: 24.6186 },
      ]},
      { name: '莆田市', longitude: 119.0078, latitude: 25.4310, districts: [] },
      { name: '三明市', longitude: 117.6390, latitude: 26.2631, districts: [] },
      { name: '泉州市', longitude: 118.6759, latitude: 24.8741, districts: [] },
      { name: '漳州市', longitude: 117.6471, latitude: 24.5128, districts: [] },
      { name: '南平市', longitude: 118.1777, latitude: 26.6356, districts: [] },
      { name: '龙岩市', longitude: 117.0176, latitude: 25.0913, districts: [] },
      { name: '宁德市', longitude: 119.5476, latitude: 26.6656, districts: [] },
    ],
  },
  {
    name: '江西省',
    longitude: 115.9093,
    latitude: 28.6765,
    cities: [
      { name: '南昌市', longitude: 115.9093, latitude: 28.6765, districts: [
        { name: '东湖区', longitude: 115.8990, latitude: 28.6850 },
        { name: '西湖区', longitude: 115.8772, latitude: 28.6568 },
        { name: '青云谱区', longitude: 115.9251, latitude: 28.6212 },
        { name: '青山湖区', longitude: 115.9617, latitude: 28.6824 },
        { name: '新建区', longitude: 115.8154, latitude: 28.6927 },
        { name: '红谷滩区', longitude: 115.8580, latitude: 28.6980 },
      ]},
      { name: '景德镇市', longitude: 117.1785, latitude: 29.2687, districts: [] },
      { name: '萍乡市', longitude: 113.8542, latitude: 27.6229, districts: [] },
      { name: '九江市', longitude: 116.0009, latitude: 29.7050, districts: [] },
      { name: '新余市', longitude: 114.9173, latitude: 27.8178, districts: [] },
      { name: '鹰潭市', longitude: 117.0690, latitude: 28.2602, districts: [] },
      { name: '赣州市', longitude: 114.9350, latitude: 25.8314, districts: [] },
      { name: '吉安市', longitude: 114.9927, latitude: 27.1138, districts: [] },
      { name: '宜春市', longitude: 114.4163, latitude: 27.8153, districts: [] },
      { name: '抚州市', longitude: 116.3582, latitude: 27.9485, districts: [] },
      { name: '上饶市', longitude: 117.9433, latitude: 28.4546, districts: [] },
    ],
  },
  {
    name: '山东省',
    longitude: 117.0207,
    latitude: 36.6683,
    cities: [
      { name: '济南市', longitude: 117.0207, latitude: 36.6683, districts: [
        { name: '历下区', longitude: 117.0764, latitude: 36.6663 },
        { name: '市中区', longitude: 116.9973, latitude: 36.6510 },
        { name: '槐荫区', longitude: 116.9011, latitude: 36.6513 },
        { name: '天桥区', longitude: 116.9873, latitude: 36.6781 },
        { name: '历城区', longitude: 117.0651, latitude: 36.6799 },
        { name: '长清区', longitude: 116.7518, latitude: 36.5535 },
        { name: '章丘区', longitude: 117.5262, latitude: 36.7143 },
        { name: '济阳区', longitude: 117.1731, latitude: 36.9784 },
        { name: '莱芜区', longitude: 117.6599, latitude: 36.2145 },
        { name: '钢城区', longitude: 117.8112, latitude: 36.0867 },
      ]},
      { name: '青岛市', longitude: 120.3826, latitude: 36.0671, districts: [
        { name: '市南区', longitude: 120.3867, latitude: 36.0748 },
        { name: '市北区', longitude: 120.3746, latitude: 36.0871 },
        { name: '黄岛区', longitude: 120.1981, latitude: 35.9606 },
        { name: '崂山区', longitude: 120.4690, latitude: 36.1071 },
        { name: '李沧区', longitude: 120.4328, latitude: 36.1451 },
        { name: '城阳区', longitude: 120.3963, latitude: 36.3078 },
        { name: '即墨区', longitude: 120.4472, latitude: 36.3897 },
      ]},
      { name: '淄博市', longitude: 118.0548, latitude: 36.8136, districts: [] },
      { name: '枣庄市', longitude: 117.3237, latitude: 34.8107, districts: [] },
      { name: '东营市', longitude: 118.6748, latitude: 37.4346, districts: [] },
      { name: '烟台市', longitude: 121.4479, latitude: 37.4638, districts: [] },
      { name: '潍坊市', longitude: 119.1071, latitude: 36.7083, districts: [] },
      { name: '济宁市', longitude: 116.5873, latitude: 35.4152, districts: [] },
      { name: '泰安市', longitude: 117.0878, latitude: 36.2000, districts: [] },
      { name: '威海市', longitude: 122.1212, latitude: 37.5135, districts: [] },
      { name: '日照市', longitude: 119.5269, latitude: 35.4164, districts: [] },
      { name: '临沂市', longitude: 118.3564, latitude: 35.1041, districts: [] },
      { name: '德州市', longitude: 116.3575, latitude: 37.4357, districts: [] },
      { name: '聊城市', longitude: 115.9852, latitude: 36.4568, districts: [] },
      { name: '滨州市', longitude: 117.9703, latitude: 37.3820, districts: [] },
      { name: '菏泽市', longitude: 115.4804, latitude: 35.2334, districts: [] },
    ],
  },

  // ========== 华中地区 ==========
  {
    name: '河南省',
    longitude: 113.6254,
    latitude: 34.7466,
    cities: [
      { name: '郑州市', longitude: 113.6254, latitude: 34.7466, districts: [
        { name: '中原区', longitude: 113.6132, latitude: 34.7482 },
        { name: '二七区', longitude: 113.6391, latitude: 34.7231 },
        { name: '管城回族区', longitude: 113.6773, latitude: 34.7542 },
        { name: '金水区', longitude: 113.6606, latitude: 34.8004 },
        { name: '上街区', longitude: 113.3087, latitude: 34.8027 },
        { name: '惠济区', longitude: 113.6171, latitude: 34.8673 },
      ]},
      { name: '开封市', longitude: 114.3076, latitude: 34.7972, districts: [] },
      { name: '洛阳市', longitude: 112.4540, latitude: 34.6196, districts: [] },
      { name: '平顶山市', longitude: 113.1929, latitude: 33.7661, districts: [] },
      { name: '安阳市', longitude: 114.3925, latitude: 36.0973, districts: [] },
      { name: '鹤壁市', longitude: 114.2974, latitude: 35.7482, districts: [] },
      { name: '新乡市', longitude: 113.9268, latitude: 35.3032, districts: [] },
      { name: '焦作市', longitude: 113.2420, latitude: 35.2158, districts: [] },
      { name: '濮阳市', longitude: 115.0296, latitude: 35.7618, districts: [] },
      { name: '许昌市', longitude: 113.8266, latitude: 34.0223, districts: [] },
      { name: '漯河市', longitude: 114.0165, latitude: 33.5760, districts: [
        { name: '源汇区', longitude: 114.0060, latitude: 33.5529 },
        { name: '郾城区', longitude: 114.0068, latitude: 33.5872 },
        { name: '召陵区', longitude: 114.0939, latitude: 33.5860 },
        { name: '舞阳县', longitude: 113.6093, latitude: 33.4362 },
        { name: '临颍县', longitude: 113.9316, latitude: 33.8278 },
      ]},
      { name: '三门峡市', longitude: 111.2002, latitude: 34.7723, districts: [
        { name: '湖滨区', longitude: 111.1886, latitude: 34.7780 },
        { name: '陕州区', longitude: 111.1032, latitude: 34.7205 },
        { name: '渑池县', longitude: 111.7613, latitude: 34.7672 },
        { name: '卢氏县', longitude: 111.0476, latitude: 34.0543 },
        { name: '义马市', longitude: 111.8746, latitude: 34.7472 },
        { name: '灵宝市', longitude: 110.8949, latitude: 34.5168 },
      ]},
      { name: '南阳市', longitude: 112.5286, latitude: 33.0114, districts: [
        { name: '宛城区', longitude: 112.5395, latitude: 33.0037 },
        { name: '卧龙区', longitude: 112.5287, latitude: 32.9892 },
        { name: '南召县', longitude: 112.4291, latitude: 33.4909 },
        { name: '方城县', longitude: 113.0127, latitude: 33.2545 },
        { name: '西峡县', longitude: 111.4731, latitude: 33.3072 },
        { name: '镇平县', longitude: 112.2398, latitude: 33.0339 },
        { name: '内乡县', longitude: 111.8491, latitude: 33.0467 },
        { name: '淅川县', longitude: 111.4905, latitude: 33.1381 },
        { name: '社旗县', longitude: 112.9489, latitude: 33.0561 },
        { name: '唐河县', longitude: 112.8073, latitude: 32.6947 },
        { name: '新野县', longitude: 112.3606, latitude: 32.5209 },
        { name: '桐柏县', longitude: 113.4286, latitude: 32.3790 },
        { name: '邓州市', longitude: 112.0875, latitude: 32.6876 },
      ]},
      { name: '商丘市', longitude: 115.6563, latitude: 34.4147, districts: [
        { name: '梁园区', longitude: 115.6200, latitude: 34.4433 },
        { name: '睢阳区', longitude: 115.6534, latitude: 34.3888 },
        { name: '民权县', longitude: 115.1480, latitude: 34.6479 },
        { name: '睢县', longitude: 115.0716, latitude: 34.4454 },
        { name: '宁陵县', longitude: 115.3051, latitude: 34.4545 },
        { name: '柘城县', longitude: 115.3052, latitude: 34.0911 },
        { name: '虞城县', longitude: 115.8285, latitude: 34.4002 },
        { name: '夏邑县', longitude: 116.1317, latitude: 34.2371 },
        { name: '永城市', longitude: 116.4494, latitude: 33.9292 },
      ]},
      { name: '信阳市', longitude: 114.0913, latitude: 32.1470, districts: [
        { name: '浉河区', longitude: 114.0587, latitude: 32.1168 },
        { name: '平桥区', longitude: 114.1259, latitude: 32.1009 },
        { name: '罗山县', longitude: 114.5128, latitude: 32.2030 },
        { name: '光山县', longitude: 114.9189, latitude: 32.0109 },
        { name: '新县', longitude: 114.8793, latitude: 31.6439 },
        { name: '商城县', longitude: 115.4086, latitude: 31.7987 },
        { name: '固始县', longitude: 115.6540, latitude: 32.1680 },
        { name: '潢川县', longitude: 115.0519, latitude: 32.1319 },
        { name: '淮滨县', longitude: 115.4205, latitude: 32.4731 },
        { name: '息县', longitude: 114.7402, latitude: 32.3428 },
      ]},
      { name: '周口市', longitude: 114.6967, latitude: 33.6261, districts: [
        { name: '川汇区', longitude: 114.6421, latitude: 33.6256 },
        { name: '淮阳区', longitude: 114.8864, latitude: 33.7321 },
        { name: '扶沟县', longitude: 114.3947, latitude: 34.0599 },
        { name: '西华县', longitude: 114.5298, latitude: 33.7672 },
        { name: '商水县', longitude: 114.6061, latitude: 33.5391 },
        { name: '沈丘县', longitude: 115.0986, latitude: 33.4094 },
        { name: '郸城县', longitude: 115.1772, latitude: 33.6448 },
        { name: '太康县', longitude: 114.8378, latitude: 34.0637 },
        { name: '鹿邑县', longitude: 115.4843, latitude: 33.8601 },
        { name: '项城市', longitude: 114.8755, latitude: 33.4672 },
      ]},
      { name: '驻马店市', longitude: 114.0224, latitude: 33.0116, districts: [
        { name: '驿城区', longitude: 113.9939, latitude: 32.9732 },
        { name: '西平县', longitude: 114.0213, latitude: 33.3877 },
        { name: '上蔡县', longitude: 114.2643, latitude: 33.2628 },
        { name: '平舆县', longitude: 114.6356, latitude: 32.9573 },
        { name: '正阳县', longitude: 114.3925, latitude: 32.6039 },
        { name: '确山县', longitude: 114.0260, latitude: 32.8028 },
        { name: '泌阳县', longitude: 113.3270, latitude: 32.7178 },
        { name: '汝南县', longitude: 114.3617, latitude: 33.0046 },
        { name: '遂平县', longitude: 114.0129, latitude: 33.1459 },
        { name: '新蔡县', longitude: 114.9650, latitude: 32.7502 },
      ]},
      { name: '济源市', longitude: 112.5901, latitude: 35.0670, districts: [
        { name: '济源市区', longitude: 112.5901, latitude: 35.0670 },
      ]},
    ],
  },
  {
    name: '湖北省',
    longitude: 114.3054,
    latitude: 30.5931,
    cities: [
      { name: '武汉市', longitude: 114.3054, latitude: 30.5931, districts: [
        { name: '江岸区', longitude: 114.3095, latitude: 30.6004 },
        { name: '江汉区', longitude: 114.2706, latitude: 30.6015 },
        { name: '硚口区', longitude: 114.2152, latitude: 30.5820 },
        { name: '汉阳区', longitude: 114.2195, latitude: 30.5489 },
        { name: '武昌区', longitude: 114.3164, latitude: 30.5541 },
        { name: '青山区', longitude: 114.3846, latitude: 30.6395 },
        { name: '洪山区', longitude: 114.3438, latitude: 30.5003 },
        { name: '东西湖区', longitude: 114.1372, latitude: 30.6199 },
        { name: '汉南区', longitude: 114.0848, latitude: 30.3088 },
        { name: '蔡甸区', longitude: 114.0292, latitude: 30.5360 },
        { name: '江夏区', longitude: 114.3218, latitude: 30.3473 },
        { name: '黄陂区', longitude: 114.3754, latitude: 30.8815 },
        { name: '新洲区', longitude: 114.8012, latitude: 30.8413 },
      ]},
      { name: '黄石市', longitude: 115.0381, latitude: 30.1996, districts: [] },
      { name: '十堰市', longitude: 110.7872, latitude: 32.6470, districts: [] },
      { name: '宜昌市', longitude: 111.2866, latitude: 30.6919, districts: [] },
      { name: '襄阳市', longitude: 112.1224, latitude: 32.0090, districts: [] },
      { name: '鄂州市', longitude: 114.8949, latitude: 30.3910, districts: [] },
      { name: '荆门市', longitude: 112.1992, latitude: 31.0354, districts: [] },
      { name: '孝感市', longitude: 113.9165, latitude: 30.9246, districts: [] },
      { name: '荆州市', longitude: 112.2394, latitude: 30.3350, districts: [] },
      { name: '黄冈市', longitude: 114.8723, latitude: 30.4533, districts: [] },
      { name: '咸宁市', longitude: 114.3224, latitude: 29.8413, districts: [] },
      { name: '随州市', longitude: 113.3827, latitude: 31.6901, districts: [] },
      { name: '恩施土家族苗族自治州', longitude: 109.4870, latitude: 30.2721, districts: [] },
      { name: '仙桃市', longitude: 113.4549, latitude: 30.3650, districts: [] },
      { name: '潜江市', longitude: 112.8993, latitude: 30.4019, districts: [] },
      { name: '天门市', longitude: 113.1657, latitude: 30.6530, districts: [] },
      { name: '神农架林区', longitude: 110.6756, latitude: 31.7448, districts: [] },
    ],
  },
  {
    name: '湖南省',
    longitude: 112.9823,
    latitude: 28.1941,
    cities: [
      { name: '长沙市', longitude: 112.9823, latitude: 28.1941, districts: [
        { name: '芙蓉区', longitude: 113.0324, latitude: 28.1853 },
        { name: '天心区', longitude: 112.9890, latitude: 28.1138 },
        { name: '岳麓区', longitude: 112.9315, latitude: 28.2349 },
        { name: '开福区', longitude: 112.9861, latitude: 28.2560 },
        { name: '雨花区', longitude: 113.0382, latitude: 28.1354 },
        { name: '望城区', longitude: 112.8196, latitude: 28.3473 },
      ]},
      { name: '株洲市', longitude: 113.1341, latitude: 27.8274, districts: [] },
      { name: '湘潭市', longitude: 112.9443, latitude: 27.8298, districts: [] },
      { name: '衡阳市', longitude: 112.5719, latitude: 26.8929, districts: [] },
      { name: '邵阳市', longitude: 111.4691, latitude: 27.2368, districts: [] },
      { name: '岳阳市', longitude: 113.1290, latitude: 29.3573, districts: [] },
      { name: '常德市', longitude: 111.6985, latitude: 29.0319, districts: [] },
      { name: '张家界市', longitude: 110.4794, latitude: 29.1172, districts: [] },
      { name: '益阳市', longitude: 112.3552, latitude: 28.5534, districts: [] },
      { name: '郴州市', longitude: 113.0150, latitude: 25.7705, districts: [] },
      { name: '永州市', longitude: 111.6134, latitude: 26.4205, districts: [] },
      { name: '怀化市', longitude: 109.9981, latitude: 27.5546, districts: [] },
      { name: '娄底市', longitude: 111.9939, latitude: 27.7003, districts: [] },
      { name: '湘西土家族苗族自治州', longitude: 109.7392, latitude: 28.3110, districts: [] },
    ],
  },

  // ========== 华南地区 ==========
  {
    name: '广东省',
    longitude: 113.2644,
    latitude: 23.1291,
    cities: [
      { name: '广州市', longitude: 113.2644, latitude: 23.1291, districts: [
        { name: '荔湾区', longitude: 113.2441, latitude: 23.1255 },
        { name: '越秀区', longitude: 113.2668, latitude: 23.1288 },
        { name: '海珠区', longitude: 113.3172, latitude: 23.0834 },
        { name: '天河区', longitude: 113.3613, latitude: 23.1246 },
        { name: '白云区', longitude: 113.2731, latitude: 23.1579 },
        { name: '黄埔区', longitude: 113.4591, latitude: 23.1064 },
        { name: '番禺区', longitude: 113.3844, latitude: 22.9378 },
        { name: '花都区', longitude: 113.2203, latitude: 23.4036 },
        { name: '南沙区', longitude: 113.5251, latitude: 22.8013 },
        { name: '从化区', longitude: 113.5871, latitude: 23.5452 },
        { name: '增城区', longitude: 113.8109, latitude: 23.2611 },
      ]},
      { name: '韶关市', longitude: 113.5977, latitude: 24.8109, districts: [] },
      { name: '深圳市', longitude: 114.0596, latitude: 22.5429, districts: [
        { name: '罗湖区', longitude: 114.1317, latitude: 22.5482 },
        { name: '福田区', longitude: 114.0556, latitude: 22.5223 },
        { name: '南山区', longitude: 113.9302, latitude: 22.5337 },
        { name: '宝安区', longitude: 113.8831, latitude: 22.5549 },
        { name: '龙岗区', longitude: 114.2461, latitude: 22.7205 },
        { name: '盐田区', longitude: 114.2369, latitude: 22.5578 },
        { name: '龙华区', longitude: 114.0445, latitude: 22.6915 },
        { name: '坪山区', longitude: 114.3461, latitude: 22.6908 },
        { name: '光明区', longitude: 113.9359, latitude: 22.7489 },
      ]},
      { name: '珠海市', longitude: 113.5767, latitude: 22.2710, districts: [] },
      { name: '汕头市', longitude: 116.6820, latitude: 23.3537, districts: [] },
      { name: '佛山市', longitude: 113.1215, latitude: 23.0217, districts: [
        { name: '禅城区', longitude: 113.1223, latitude: 23.0090 },
        { name: '南海区', longitude: 113.1426, latitude: 23.0288 },
        { name: '顺德区', longitude: 113.2936, latitude: 22.8046 },
        { name: '三水区', longitude: 112.8970, latitude: 23.1557 },
        { name: '高明区', longitude: 112.8926, latitude: 22.9002 },
      ]},
      { name: '江门市', longitude: 113.0819, latitude: 22.5787, districts: [] },
      { name: '湛江市', longitude: 110.3594, latitude: 21.2707, districts: [] },
      { name: '茂名市', longitude: 110.9191, latitude: 21.6631, districts: [] },
      { name: '肇庆市', longitude: 112.4653, latitude: 23.0466, districts: [] },
      { name: '惠州市', longitude: 114.4163, latitude: 23.1117, districts: [] },
      { name: '梅州市', longitude: 116.1176, latitude: 24.2889, districts: [] },
      { name: '汕尾市', longitude: 115.3643, latitude: 22.7742, districts: [] },
      { name: '河源市', longitude: 114.7000, latitude: 23.7434, districts: [] },
      { name: '阳江市', longitude: 111.9822, latitude: 21.8582, districts: [] },
      { name: '清远市', longitude: 113.0563, latitude: 23.6817, districts: [] },
      { name: '东莞市', longitude: 113.7518, latitude: 23.0207, districts: [] },
      { name: '中山市', longitude: 113.3929, latitude: 22.5176, districts: [] },
      { name: '潮州市', longitude: 116.6225, latitude: 23.6567, districts: [] },
      { name: '揭阳市', longitude: 116.3726, latitude: 23.5499, districts: [] },
      { name: '云浮市', longitude: 112.0445, latitude: 22.9157, districts: [] },
    ],
  },
  {
    name: '广西壮族自治区',
    longitude: 108.3200,
    latitude: 22.8240,
    cities: [
      { name: '南宁市', longitude: 108.3200, latitude: 22.8240, districts: [
        { name: '兴宁区', longitude: 108.3686, latitude: 22.8540 },
        { name: '青秀区', longitude: 108.4949, latitude: 22.7859 },
        { name: '江南区', longitude: 108.2730, latitude: 22.7814 },
        { name: '西乡塘区', longitude: 108.3065, latitude: 22.8339 },
        { name: '良庆区', longitude: 108.3927, latitude: 22.7594 },
        { name: '邕宁区', longitude: 108.4870, latitude: 22.7586 },
        { name: '武鸣区', longitude: 108.2746, latitude: 23.1583 },
      ]},
      { name: '柳州市', longitude: 109.4283, latitude: 24.3265, districts: [] },
      { name: '桂林市', longitude: 110.2903, latitude: 25.2742, districts: [] },
      { name: '梧州市', longitude: 111.2793, latitude: 23.4769, districts: [] },
      { name: '北海市', longitude: 109.1206, latitude: 21.4811, districts: [] },
      { name: '防城港市', longitude: 108.3538, latitude: 21.6869, districts: [] },
      { name: '钦州市', longitude: 108.6539, latitude: 21.9810, districts: [] },
      { name: '贵港市', longitude: 109.5988, latitude: 23.1118, districts: [] },
      { name: '玉林市', longitude: 110.1548, latitude: 22.6364, districts: [] },
      { name: '百色市', longitude: 106.6180, latitude: 23.9016, districts: [] },
      { name: '贺州市', longitude: 111.5523, latitude: 24.4113, districts: [] },
      { name: '河池市', longitude: 108.0852, latitude: 24.6930, districts: [] },
      { name: '来宾市', longitude: 109.2214, latitude: 23.7500, districts: [] },
      { name: '崇左市', longitude: 107.3647, latitude: 22.3767, districts: [] },
    ],
  },
  {
    name: '海南省',
    longitude: 110.3312,
    latitude: 20.0319,
    cities: [
      { name: '海口市', longitude: 110.3312, latitude: 20.0319, districts: [
        { name: '秀英区', longitude: 110.2934, latitude: 20.0075 },
        { name: '龙华区', longitude: 110.3016, latitude: 20.0286 },
        { name: '琼山区', longitude: 110.3540, latitude: 20.0035 },
        { name: '美兰区', longitude: 110.3659, latitude: 20.0286 },
      ]},
      { name: '三亚市', longitude: 109.5120, latitude: 18.2528, districts: [] },
      { name: '三沙市', longitude: 112.3380, latitude: 16.8310, districts: [] },
      { name: '儋州市', longitude: 109.5768, latitude: 19.5175, districts: [] },
      { name: '五指山市', longitude: 109.5166, latitude: 18.7758, districts: [] },
      { name: '琼海市', longitude: 110.4746, latitude: 19.2461, districts: [] },
      { name: '文昌市', longitude: 110.7537, latitude: 19.6130, districts: [] },
      { name: '万宁市', longitude: 110.3893, latitude: 18.7961, districts: [] },
      { name: '东方市', longitude: 108.6537, latitude: 19.0951, districts: [] },
      { name: '定安县', longitude: 110.3589, latitude: 19.6813, districts: [] },
      { name: '屯昌县', longitude: 110.1017, latitude: 19.3516, districts: [] },
      { name: '澄迈县', longitude: 110.0067, latitude: 19.7401, districts: [] },
      { name: '临高县', longitude: 109.6878, latitude: 19.9082, districts: [] },
      { name: '白沙黎族自治县', longitude: 109.4518, latitude: 19.2246, districts: [] },
      { name: '昌江黎族自治县', longitude: 109.0557, latitude: 19.2981, districts: [] },
      { name: '乐东黎族自治县', longitude: 109.1752, latitude: 18.7502, districts: [] },
      { name: '陵水黎族自治县', longitude: 110.0372, latitude: 18.5060, districts: [] },
      { name: '保亭黎族苗族自治县', longitude: 109.7025, latitude: 18.6364, districts: [] },
      { name: '琼中黎族苗族自治县', longitude: 109.8383, latitude: 19.0331, districts: [] },
    ],
  },

  // ========== 西南地区 ==========
  {
    name: '四川省',
    longitude: 104.0657,
    latitude: 30.6595,
    cities: [
      { name: '成都市', longitude: 104.0657, latitude: 30.6595, districts: [
        { name: '锦江区', longitude: 104.0836, latitude: 30.6567 },
        { name: '青羊区', longitude: 104.0619, latitude: 30.6741 },
        { name: '金牛区', longitude: 104.0516, latitude: 30.6918 },
        { name: '武侯区', longitude: 104.0430, latitude: 30.6424 },
        { name: '成华区', longitude: 104.1018, latitude: 30.6599 },
        { name: '龙泉驿区', longitude: 104.2749, latitude: 30.5566 },
        { name: '青白江区', longitude: 104.2509, latitude: 30.8784 },
        { name: '新都区', longitude: 104.1593, latitude: 30.8234 },
        { name: '温江区', longitude: 103.8480, latitude: 30.6824 },
        { name: '双流区', longitude: 103.9234, latitude: 30.5746 },
        { name: '郫都区', longitude: 103.9013, latitude: 30.7951 },
        { name: '新津区', longitude: 103.8114, latitude: 30.4098 },
      ]},
      { name: '自贡市', longitude: 104.7734, latitude: 29.3522, districts: [] },
      { name: '攀枝花市', longitude: 101.7185, latitude: 26.5822, districts: [] },
      { name: '泸州市', longitude: 105.4425, latitude: 28.8718, districts: [] },
      { name: '德阳市', longitude: 104.3981, latitude: 31.1277, districts: [] },
      { name: '绵阳市', longitude: 104.6795, latitude: 31.4676, districts: [] },
      { name: '广元市', longitude: 105.8297, latitude: 32.4337, districts: [] },
      { name: '遂宁市', longitude: 105.5927, latitude: 30.5327, districts: [] },
      { name: '内江市', longitude: 105.0584, latitude: 29.5801, districts: [] },
      { name: '乐山市', longitude: 103.7654, latitude: 29.5521, districts: [] },
      { name: '南充市', longitude: 106.1107, latitude: 30.8378, districts: [] },
      { name: '眉山市', longitude: 103.8493, latitude: 30.0754, districts: [] },
      { name: '宜宾市', longitude: 104.6428, latitude: 28.7522, districts: [] },
      { name: '广安市', longitude: 106.6333, latitude: 30.4557, districts: [] },
      { name: '达州市', longitude: 107.4684, latitude: 31.2096, districts: [] },
      { name: '雅安市', longitude: 103.0421, latitude: 29.9881, districts: [] },
      { name: '巴中市', longitude: 106.7473, latitude: 31.8674, districts: [] },
      { name: '资阳市', longitude: 104.6277, latitude: 30.1286, districts: [] },
      { name: '阿坝藏族羌族自治州', longitude: 102.2248, latitude: 31.8998, districts: [] },
      { name: '甘孜藏族自治州', longitude: 101.9625, latitude: 30.0505, districts: [] },
      { name: '凉山彝族自治州', longitude: 102.2673, latitude: 27.8819, districts: [] },
    ],
  },
  {
    name: '贵州省',
    longitude: 106.7135,
    latitude: 26.5783,
    cities: [
      { name: '贵阳市', longitude: 106.7135, latitude: 26.5783, districts: [
        { name: '南明区', longitude: 106.7142, latitude: 26.5682 },
        { name: '云岩区', longitude: 106.7241, latitude: 26.6043 },
        { name: '花溪区', longitude: 106.6705, latitude: 26.4099 },
        { name: '乌当区', longitude: 106.7521, latitude: 26.6301 },
        { name: '白云区', longitude: 106.6307, latitude: 26.6836 },
        { name: '观山湖区', longitude: 106.6254, latitude: 26.6181 },
      ]},
      { name: '六盘水市', longitude: 104.8305, latitude: 26.5925, districts: [] },
      { name: '遵义市', longitude: 106.9271, latitude: 27.7256, districts: [] },
      { name: '安顺市', longitude: 105.9473, latitude: 26.2531, districts: [] },
      { name: '毕节市', longitude: 105.2832, latitude: 27.3019, districts: [] },
      { name: '铜仁市', longitude: 109.1891, latitude: 27.7311, districts: [] },
      { name: '黔西南布依族苗族自治州', longitude: 104.9061, latitude: 25.0883, districts: [] },
      { name: '黔东南苗族侗族自治州', longitude: 107.9823, latitude: 26.5835, districts: [] },
      { name: '黔南布依族苗族自治州', longitude: 107.5225, latitude: 26.2539, districts: [] },
    ],
  },
  {
    name: '云南省',
    longitude: 102.7123,
    latitude: 25.0406,
    cities: [
      { name: '昆明市', longitude: 102.7123, latitude: 25.0406, districts: [
        { name: '五华区', longitude: 102.7077, latitude: 25.0353 },
        { name: '盘龙区', longitude: 102.7519, latitude: 25.1163 },
        { name: '官渡区', longitude: 102.7437, latitude: 25.0150 },
        { name: '西山区', longitude: 102.6643, latitude: 25.0377 },
        { name: '东川区', longitude: 103.1879, latitude: 26.0830 },
        { name: '呈贡区', longitude: 102.8016, latitude: 24.8895 },
      ]},
      { name: '曲靖市', longitude: 103.7961, latitude: 25.4898, districts: [] },
      { name: '玉溪市', longitude: 102.5278, latitude: 24.3469, districts: [] },
      { name: '保山市', longitude: 99.1617, latitude: 25.1121, districts: [] },
      { name: '昭通市', longitude: 103.7171, latitude: 27.3387, districts: [] },
      { name: '丽江市', longitude: 100.2270, latitude: 26.8557, districts: [] },
      { name: '普洱市', longitude: 100.9666, latitude: 22.8254, districts: [] },
      { name: '临沧市', longitude: 100.0890, latitude: 23.8774, districts: [] },
      { name: '楚雄彝族自治州', longitude: 101.5281, latitude: 25.0453, districts: [] },
      { name: '红河哈尼族彝族自治州', longitude: 103.3755, latitude: 23.3636, districts: [] },
      { name: '文山壮族苗族自治州', longitude: 104.2162, latitude: 23.3999, districts: [] },
      { name: '西双版纳傣族自治州', longitude: 100.7971, latitude: 22.0074, districts: [] },
      { name: '大理白族自治州', longitude: 100.2251, latitude: 25.5896, districts: [] },
      { name: '德宏傣族景颇族自治州', longitude: 98.5780, latitude: 24.4365, districts: [] },
      { name: '怒江傈僳族自治州', longitude: 98.8567, latitude: 25.8170, districts: [] },
      { name: '迪庆藏族自治州', longitude: 99.7029, latitude: 27.8188, districts: [] },
    ],
  },
  {
    name: '西藏自治区',
    longitude: 91.1172,
    latitude: 29.6540,
    cities: [
      { name: '拉萨市', longitude: 91.1172, latitude: 29.6540, districts: [
        { name: '城关区', longitude: 91.1320, latitude: 29.6527 },
        { name: '堆龙德庆区', longitude: 91.0033, latitude: 29.6460 },
        { name: '达孜区', longitude: 91.3499, latitude: 29.6690 },
      ]},
      { name: '日喀则市', longitude: 88.8848, latitude: 29.2670, districts: [] },
      { name: '昌都市', longitude: 97.1724, latitude: 31.1369, districts: [] },
      { name: '林芝市', longitude: 94.3624, latitude: 29.6489, districts: [] },
      { name: '山南市', longitude: 91.7665, latitude: 29.2363, districts: [] },
      { name: '那曲市', longitude: 92.0514, latitude: 31.4760, districts: [] },
      { name: '阿里地区', longitude: 80.1055, latitude: 32.5000, districts: [] },
    ],
  },

  // ========== 西北地区 ==========
  {
    name: '陕西省',
    longitude: 108.9540,
    latitude: 34.2658,
    cities: [
      { name: '西安市', longitude: 108.9540, latitude: 34.2658, districts: [
        { name: '新城区', longitude: 108.9602, latitude: 34.2664 },
        { name: '碑林区', longitude: 108.9402, latitude: 34.2565 },
        { name: '莲湖区', longitude: 108.9339, latitude: 34.2650 },
        { name: '灞桥区', longitude: 109.0644, latitude: 34.2727 },
        { name: '未央区', longitude: 108.9467, latitude: 34.2928 },
        { name: '雁塔区', longitude: 108.9491, latitude: 34.2225 },
        { name: '阎良区', longitude: 109.2261, latitude: 34.6622 },
        { name: '临潼区', longitude: 109.2141, latitude: 34.3664 },
        { name: '长安区', longitude: 108.9069, latitude: 34.1580 },
        { name: '高陵区', longitude: 109.0885, latitude: 34.5347 },
        { name: '鄠邑区', longitude: 108.6050, latitude: 34.1084 },
      ]},
      { name: '铜川市', longitude: 108.9454, latitude: 34.8967, districts: [] },
      { name: '宝鸡市', longitude: 107.2370, latitude: 34.3612, districts: [] },
      { name: '咸阳市', longitude: 108.7089, latitude: 34.3295, districts: [] },
      { name: '渭南市', longitude: 109.5098, latitude: 34.4997, districts: [] },
      { name: '延安市', longitude: 109.4898, latitude: 36.5854, districts: [] },
      { name: '汉中市', longitude: 107.0282, latitude: 33.0776, districts: [] },
      { name: '榆林市', longitude: 109.7348, latitude: 38.2854, districts: [] },
      { name: '安康市', longitude: 109.0293, latitude: 32.6846, districts: [] },
      { name: '商洛市', longitude: 109.9405, latitude: 33.8679, districts: [] },
    ],
  },
  {
    name: '甘肃省',
    longitude: 103.8236,
    latitude: 36.0580,
    cities: [
      { name: '兰州市', longitude: 103.8236, latitude: 36.0580, districts: [
        { name: '城关区', longitude: 103.8252, latitude: 36.0569 },
        { name: '七里河区', longitude: 103.7856, latitude: 36.0657 },
        { name: '西固区', longitude: 103.6282, latitude: 36.0884 },
        { name: '安宁区', longitude: 103.7190, latitude: 36.1043 },
        { name: '红古区', longitude: 102.8593, latitude: 36.3454 },
      ]},
      { name: '嘉峪关市', longitude: 98.2772, latitude: 39.7868, districts: [] },
      { name: '金昌市', longitude: 102.1876, latitude: 38.5200, districts: [] },
      { name: '白银市', longitude: 104.1389, latitude: 36.5448, districts: [] },
      { name: '天水市', longitude: 105.7249, latitude: 34.5809, districts: [] },
      { name: '武威市', longitude: 102.6370, latitude: 37.9283, districts: [] },
      { name: '张掖市', longitude: 100.4499, latitude: 38.9251, districts: [] },
      { name: '平凉市', longitude: 106.6652, latitude: 35.5428, districts: [] },
      { name: '酒泉市', longitude: 98.4941, latitude: 39.7330, districts: [] },
      { name: '庆阳市', longitude: 107.6386, latitude: 35.7342, districts: [] },
      { name: '定西市', longitude: 104.6263, latitude: 35.5795, districts: [] },
      { name: '陇南市', longitude: 104.9218, latitude: 33.4009, districts: [] },
      { name: '临夏回族自治州', longitude: 103.2121, latitude: 35.5994, districts: [] },
      { name: '甘南藏族自治州', longitude: 102.9110, latitude: 34.9860, districts: [] },
    ],
  },
  {
    name: '青海省',
    longitude: 101.7782,
    latitude: 36.6171,
    cities: [
      { name: '西宁市', longitude: 101.7782, latitude: 36.6171, districts: [
        { name: '城东区', longitude: 101.8032, latitude: 36.5994 },
        { name: '城中区', longitude: 101.7839, latitude: 36.6216 },
        { name: '城西区', longitude: 101.7654, latitude: 36.6287 },
        { name: '城北区', longitude: 101.7662, latitude: 36.6500 },
      ]},
      { name: '海东市', longitude: 102.1040, latitude: 36.5029, districts: [] },
      { name: '海北藏族自治州', longitude: 100.9009, latitude: 36.9546, districts: [] },
      { name: '黄南藏族自治州', longitude: 102.0154, latitude: 35.5191, districts: [] },
      { name: '海南藏族自治州', longitude: 100.6198, latitude: 36.2865, districts: [] },
      { name: '果洛藏族自治州', longitude: 100.2442, latitude: 34.4715, districts: [] },
      { name: '玉树藏族自治州', longitude: 97.0085, latitude: 33.0040, districts: [] },
      { name: '海西蒙古族藏族自治州', longitude: 97.3707, latitude: 37.3770, districts: [] },
    ],
  },
  {
    name: '宁夏回族自治区',
    longitude: 106.2587,
    latitude: 38.4721,
    cities: [
      { name: '银川市', longitude: 106.2587, latitude: 38.4721, districts: [
        { name: '兴庆区', longitude: 106.2884, latitude: 38.4738 },
        { name: '西夏区', longitude: 106.1300, latitude: 38.4952 },
        { name: '金凤区', longitude: 106.2422, latitude: 38.4727 },
      ]},
      { name: '石嘴山市', longitude: 106.3839, latitude: 38.9842, districts: [] },
      { name: '吴忠市', longitude: 106.1990, latitude: 37.9976, districts: [] },
      { name: '固原市', longitude: 106.2427, latitude: 36.0159, districts: [] },
      { name: '中卫市', longitude: 105.1967, latitude: 37.5000, districts: [] },
    ],
  },
  {
    name: '新疆维吾尔自治区',
    longitude: 87.6177,
    latitude: 43.7928,
    cities: [
      { name: '乌鲁木齐市', longitude: 87.6177, latitude: 43.7928, districts: [
        { name: '天山区', longitude: 87.6318, latitude: 43.7943 },
        { name: '沙依巴克区', longitude: 87.5982, latitude: 43.8011 },
        { name: '新市区', longitude: 87.5740, latitude: 43.8421 },
        { name: '水磨沟区', longitude: 87.6421, latitude: 43.8328 },
        { name: '头屯河区', longitude: 87.4263, latitude: 43.8769 },
        { name: '达坂城区', longitude: 88.3118, latitude: 43.3636 },
        { name: '米东区', longitude: 87.6859, latitude: 43.9740 },
      ]},
      { name: '克拉玛依市', longitude: 84.8893, latitude: 45.5798, districts: [] },
      { name: '吐鲁番市', longitude: 89.1899, latitude: 42.9474, districts: [] },
      { name: '哈密市', longitude: 93.5283, latitude: 42.8191, districts: [] },
      { name: '昌吉回族自治州', longitude: 87.3042, latitude: 44.0146, districts: [] },
      { name: '博尔塔拉蒙古自治州', longitude: 82.0748, latitude: 44.9056, districts: [] },
      { name: '巴音郭楞蒙古自治州', longitude: 86.1509, latitude: 41.7636, districts: [] },
      { name: '阿克苏地区', longitude: 80.2651, latitude: 41.1706, districts: [] },
      { name: '克孜勒苏柯尔克孜自治州', longitude: 76.1728, latitude: 39.7134, districts: [] },
      { name: '喀什地区', longitude: 75.9891, latitude: 39.4677, districts: [] },
      { name: '和田地区', longitude: 79.9253, latitude: 37.1107, districts: [] },
      { name: '伊犁哈萨克自治州', longitude: 81.3179, latitude: 43.9219, districts: [] },
      { name: '塔城地区', longitude: 82.9857, latitude: 46.7463, districts: [] },
      { name: '阿勒泰地区', longitude: 88.1396, latitude: 47.8484, districts: [] },
      { name: '石河子市', longitude: 86.0411, latitude: 44.3054, districts: [] },
      { name: '阿拉尔市', longitude: 81.2859, latitude: 40.5419, districts: [] },
      { name: '图木舒克市', longitude: 79.0749, latitude: 39.8673, districts: [] },
      { name: '五家渠市', longitude: 87.5428, latitude: 44.1668, districts: [] },
      { name: '北屯市', longitude: 87.8242, latitude: 47.3632, districts: [] },
      { name: '铁门关市', longitude: 85.5012, latitude: 41.8273, districts: [] },
      { name: '双河市', longitude: 82.3535, latitude: 44.8401, districts: [] },
      { name: '可克达拉市', longitude: 80.6355, latitude: 43.9492, districts: [] },
      { name: '昆玉市', longitude: 79.2910, latitude: 37.2078, districts: [] },
      { name: '胡杨河市', longitude: 84.8275, latitude: 44.6925, districts: [] },
    ],
  },

  // ========== 特别行政区 ==========
  {
    name: '香港特别行政区',
    longitude: 114.1694,
    latitude: 22.3193,
    cities: [
      {
        name: '香港',
        longitude: 114.1694,
        latitude: 22.3193,
        districts: [
          { name: '中西区', longitude: 114.1543, latitude: 22.2866 },
          { name: '湾仔区', longitude: 114.1826, latitude: 22.2765 },
          { name: '东区', longitude: 114.2260, latitude: 22.2842 },
          { name: '南区', longitude: 114.1600, latitude: 22.2471 },
          { name: '油尖旺区', longitude: 114.1733, latitude: 22.3117 },
          { name: '深水埗区', longitude: 114.1632, latitude: 22.3309 },
          { name: '九龙城区', longitude: 114.1928, latitude: 22.3282 },
          { name: '黄大仙区', longitude: 114.2034, latitude: 22.3419 },
          { name: '观塘区', longitude: 114.2311, latitude: 22.3108 },
          { name: '荃湾区', longitude: 114.1220, latitude: 22.3682 },
          { name: '屯门区', longitude: 113.9767, latitude: 22.3908 },
          { name: '元朗区', longitude: 114.0324, latitude: 22.4428 },
          { name: '北区', longitude: 114.1487, latitude: 22.4940 },
          { name: '大埔区', longitude: 114.1713, latitude: 22.4513 },
          { name: '西贡区', longitude: 114.2643, latitude: 22.3839 },
          { name: '沙田区', longitude: 114.1950, latitude: 22.3817 },
          { name: '葵青区', longitude: 114.1393, latitude: 22.3548 },
          { name: '离岛区', longitude: 113.9456, latitude: 22.2867 },
        ],
      },
    ],
  },
  {
    name: '澳门特别行政区',
    longitude: 113.5439,
    latitude: 22.1987,
    cities: [
      {
        name: '澳门',
        longitude: 113.5439,
        latitude: 22.1987,
        districts: [
          { name: '花地玛堂区', longitude: 113.5528, latitude: 22.2083 },
          { name: '花王堂区', longitude: 113.5489, latitude: 22.1981 },
          { name: '望德堂区', longitude: 113.5501, latitude: 22.1941 },
          { name: '大堂区', longitude: 113.5540, latitude: 22.1885 },
          { name: '风顺堂区', longitude: 113.5419, latitude: 22.1878 },
          { name: '嘉模堂区', longitude: 113.5584, latitude: 22.1566 },
          { name: '路凼填海区', longitude: 113.5659, latitude: 22.1388 },
          { name: '圣方济各堂区', longitude: 113.5599, latitude: 22.1238 },
        ],
      },
    ],
  },
  {
    name: '台湾省',
    longitude: 121.5654,
    latitude: 25.0330,
    cities: [
      { name: '台北市', longitude: 121.5654, latitude: 25.0330, districts: [] },
      { name: '新北市', longitude: 121.4627, latitude: 25.0170, districts: [] },
      { name: '桃园市', longitude: 121.3010, latitude: 24.9936, districts: [] },
      { name: '台中市', longitude: 120.6736, latitude: 24.1477, districts: [] },
      { name: '台南市', longitude: 120.2270, latitude: 22.9999, districts: [] },
      { name: '高雄市', longitude: 120.3014, latitude: 22.6273, districts: [] },
      { name: '基隆市', longitude: 121.7391, latitude: 25.1276, districts: [] },
      { name: '新竹市', longitude: 120.9675, latitude: 24.8066, districts: [] },
      { name: '嘉义市', longitude: 120.4530, latitude: 23.4802, districts: [] },
      { name: '新竹县', longitude: 121.0012, latitude: 24.8392, districts: [] },
      { name: '苗栗县', longitude: 120.8208, latitude: 24.5602, districts: [] },
      { name: '彰化县', longitude: 120.5161, latitude: 24.0518, districts: [] },
      { name: '南投县', longitude: 120.9876, latitude: 23.8383, districts: [] },
      { name: '云林县', longitude: 120.5273, latitude: 23.7075, districts: [] },
      { name: '嘉义县', longitude: 120.5740, latitude: 23.4519, districts: [] },
      { name: '屏东县', longitude: 120.4879, latitude: 22.6691, districts: [] },
      { name: '宜兰县', longitude: 121.7535, latitude: 24.7021, districts: [] },
      { name: '花莲县', longitude: 121.6014, latitude: 23.9872, districts: [] },
      { name: '台东县', longitude: 121.1474, latitude: 22.7583, districts: [] },
      { name: '澎湖县', longitude: 119.5793, latitude: 23.5710, districts: [] },
      { name: '金门县', longitude: 118.3169, latitude: 24.4323, districts: [] },
      { name: '连江县', longitude: 119.9399, latitude: 26.1505, districts: [] },
    ],
  },
];

// 获取所有省份
export function getProvinces(): string[] {
  return CHINA_REGIONS.map(p => p.name);
}

// 根据省份获取城市
export function getCitiesByProvince(provinceName: string): City[] {
  const province = CHINA_REGIONS.find(p => p.name === provinceName);
  return province?.cities || [];
}

// 根据省份和城市获取区县
export function getDistrictsByCity(provinceName: string, cityName: string): District[] {
  const province = CHINA_REGIONS.find(p => p.name === provinceName);
  const city = province?.cities.find(c => c.name === cityName);
  return city?.districts || [];
}

// 根据名称模糊搜索位置
// 简化拼音映射 (常用城市)
const PINYIN_MAP: Record<string, string[]> = {
  '北京': ['beijing', 'bj', 'peking'],
  '上海': ['shanghai', 'sh'],
  '广州': ['guangzhou', 'gz'],
  '深圳': ['shenzhen', 'sz'],
  '杭州': ['hangzhou', 'hz'],
  '南京': ['nanjing', 'nj'],
  '成都': ['chengdu', 'cd'],
  '重庆': ['chongqing', 'cq'],
  '武汉': ['wuhan', 'wh'],
  '西安': ['xian', 'xa'],
  '天津': ['tianjin', 'tj'],
  '苏州': ['suzhou'],
  '郑州': ['zhengzhou', 'zz'],
  '长沙': ['changsha', 'cs'],
  '青岛': ['qingdao', 'qd'],
  '大连': ['dalian', 'dl'],
  '厦门': ['xiamen', 'xm'],
  '宁波': ['ningbo', 'nb'],
  '福州': ['fuzhou', 'fz'],
  '合肥': ['hefei', 'hf'],
  '昆明': ['kunming', 'km'],
  '贵阳': ['guiyang', 'gy'],
  '南宁': ['nanning', 'nn'],
  '海口': ['haikou', 'hk'],
  '石家庄': ['shijiazhuang', 'sjz'],
  '太原': ['taiyuan', 'ty'],
  '沈阳': ['shenyang', 'sy'],
  '长春': ['changchun', 'cc'],
  '哈尔滨': ['haerbin', 'harbin', 'heb'],
  '济南': ['jinan', 'jn'],
  '兰州': ['lanzhou', 'lz'],
  '西宁': ['xining', 'xn'],
  '银川': ['yinchuan', 'yc'],
  '乌鲁木齐': ['wulumuqi', 'urumqi', 'wlmq'],
  '拉萨': ['lasa', 'lhasa', 'ls'],
  '呼和浩特': ['huhehaote', 'hohhot', 'hhht'],
  '香港': ['hongkong', 'hk', 'xianggang'],
  '澳门': ['macau', 'aomen', 'macao'],
  '台北': ['taipei', 'taibei', 'tb'],
  '朝阳': ['chaoyang', 'cy'],
  '浦东': ['pudong', 'pd'],
  '海淀': ['haidian', 'hd'],
};

// 计算字符串相似度 (简单的 Levenshtein 距离近似)
function fuzzyMatch(str: string, keyword: string): number {
  str = str.toLowerCase();
  keyword = keyword.toLowerCase();

  // 精确包含
  if (str.includes(keyword)) return 100;
  if (keyword.includes(str)) return 90;

  // 去除常见后缀后匹配
  const cleanStr = str.replace(/省|市|区|县|自治区|自治州|地区|特别行政区|壮族|维吾尔|回族|新区/g, '');
  const cleanKw = keyword.replace(/省|市|区|县/g, '');

  if (cleanStr.includes(cleanKw)) return 85;
  if (cleanKw.includes(cleanStr)) return 80;

  // 首字匹配
  if (cleanStr.startsWith(cleanKw)) return 75;
  if (cleanKw.startsWith(cleanStr)) return 70;

  // 拼音匹配
  for (const [chinese, pinyins] of Object.entries(PINYIN_MAP)) {
    if (str.includes(chinese)) {
      for (const pinyin of pinyins) {
        if (pinyin.includes(keyword) || keyword.includes(pinyin)) {
          return 65;
        }
      }
    }
  }

  // 部分字符匹配 (连续字符)
  let maxMatch = 0;
  for (let i = 0; i < keyword.length; i++) {
    for (let j = i + 1; j <= keyword.length; j++) {
      const sub = keyword.substring(i, j);
      if (cleanStr.includes(sub) && sub.length > maxMatch) {
        maxMatch = sub.length;
      }
    }
  }
  if (maxMatch >= 2) {
    return Math.min(60, maxMatch * 15);
  }

  return 0;
}

export function searchLocation(keyword: string): Array<{
  province: string;
  city: string;
  district?: string;
  longitude: number;
  latitude: number;
  fullName: string;
}> {
  const results: Array<{
    province: string;
    city: string;
    district?: string;
    longitude: number;
    latitude: number;
    fullName: string;
    score: number;
  }> = [];

  const kw = keyword.trim().toLowerCase();
  if (!kw) return results;

  for (const province of CHINA_REGIONS) {
    // 匹配省份
    const provinceScore = fuzzyMatch(province.name, kw);
    if (provinceScore > 30) {
      results.push({
        province: province.name,
        city: province.cities[0]?.name || '',
        longitude: province.longitude,
        latitude: province.latitude,
        fullName: province.name,
        score: provinceScore,
      });
    }

    for (const city of province.cities) {
      // 匹配城市
      const cityScore = fuzzyMatch(city.name, kw);
      if (cityScore > 30) {
        results.push({
          province: province.name,
          city: city.name,
          longitude: city.longitude,
          latitude: city.latitude,
          fullName: `${province.name} ${city.name}`,
          score: cityScore + 5, // 城市级别稍微提高优先级
        });
      }

      for (const district of city.districts) {
        // 匹配区县
        const districtScore = fuzzyMatch(district.name, kw);
        if (districtScore > 30) {
          results.push({
            province: province.name,
            city: city.name,
            district: district.name,
            longitude: district.longitude,
            latitude: district.latitude,
            fullName: `${province.name} ${city.name} ${district.name}`,
            score: districtScore,
          });
        }
      }
    }
  }

  // 按分数排序，取前20个结果
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ score, ...rest }) => rest);
}

// 获取位置的经纬度
export function getLocationCoordinates(
  provinceName: string,
  cityName?: string,
  districtName?: string
): { longitude: number; latitude: number } | null {
  const province = CHINA_REGIONS.find(p => p.name === provinceName);
  if (!province) return null;

  if (!cityName) {
    return { longitude: province.longitude, latitude: province.latitude };
  }

  const city = province.cities.find(c => c.name === cityName);
  if (!city) {
    return { longitude: province.longitude, latitude: province.latitude };
  }

  if (!districtName) {
    return { longitude: city.longitude, latitude: city.latitude };
  }

  const district = city.districts.find(d => d.name === districtName);
  if (!district) {
    return { longitude: city.longitude, latitude: city.latitude };
  }

  return { longitude: district.longitude, latitude: district.latitude };
}

/**
 * 计算均时差 (Equation of Time)
 * 真太阳时 = 平太阳时 + 均时差
 *
 * 公式: E = 9.87 * sin(2B) - 7.53 * cos(B) - 1.5 * sin(B)
 * 其中 B = 360/365 * (N - 81) 度，N为一年中的第几天
 *
 * @param date 日期对象
 * @returns 均时差（分钟），正值表示真太阳时比平太阳时快
 */
export function calculateEquationOfTime(date: Date): number {
  // 计算一年中的第几天
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // 计算B角度（转换为弧度）
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);

  // 均时差公式（结果为分钟）
  const E = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  return E;
}

/**
 * 计算地方平太阳时偏移 (Local Mean Time Offset)
 * 仅基于经度计算，不含均时差
 *
 * @param longitude 经度
 * @returns 相对于北京时间的偏移（分钟）
 */
export function calculateLocalMeanTimeOffset(longitude: number): number {
  // 中国标准时间基于东经120度
  // 每度经度差对应4分钟时差
  return (longitude - 120) * 4;
}

/**
 * 计算真太阳时偏移 (True Solar Time Offset)
 * 真太阳时 = 北京时间 + 经度时差 + 均时差
 *
 * @param longitude 经度
 * @param date 日期对象（用于计算均时差）
 * @returns 相对于北京时间的偏移（分钟）
 */
export function calculateTrueSolarTimeOffset(longitude: number, date?: Date): number {
  const localMeanOffset = calculateLocalMeanTimeOffset(longitude);
  const equationOfTime = date ? calculateEquationOfTime(date) : 0;
  return localMeanOffset + equationOfTime;
}

/**
 * 太阳时计算结果
 */
export interface SolarTimeResult {
  /** 北京时间 */
  beijingTime: Date;
  /** 地方平太阳时 */
  localMeanTime: Date;
  /** 真太阳时 */
  trueSolarTime: Date;
  /** 经度时差（分钟） */
  longitudeOffset: number;
  /** 均时差（分钟） */
  equationOfTime: number;
  /** 真太阳时总偏移（分钟） */
  totalOffset: number;
}

/**
 * 计算完整的太阳时信息
 * 返回北京时间、地方平太阳时、真太阳时三个值
 *
 * @param beijingTime 北京时间
 * @param longitude 经度
 * @returns 包含三种时间的对象
 */
export function calculateAllSolarTimes(beijingTime: Date, longitude: number): SolarTimeResult {
  // 经度时差（分钟）
  const longitudeOffset = calculateLocalMeanTimeOffset(longitude);

  // 均时差（分钟）
  const equationOfTime = calculateEquationOfTime(beijingTime);

  // 总偏移
  const totalOffset = longitudeOffset + equationOfTime;

  // 计算地方平太阳时
  const localMeanTime = new Date(beijingTime.getTime() + longitudeOffset * 60 * 1000);

  // 计算真太阳时
  const trueSolarTime = new Date(beijingTime.getTime() + totalOffset * 60 * 1000);

  return {
    beijingTime,
    localMeanTime,
    trueSolarTime,
    longitudeOffset,
    equationOfTime,
    totalOffset
  };
}

/**
 * 格式化时间显示
 * @param date 日期对象
 * @returns 格式化的时间字符串 HH:mm:ss
 */
export function formatTimeDisplay(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期时间显示
 * @param date 日期对象
 * @returns 格式化的日期时间字符串 YYYY-MM-DD HH:mm:ss
 */
export function formatDateTimeDisplay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} ${formatTimeDisplay(date)}`;
}

export default CHINA_REGIONS;
