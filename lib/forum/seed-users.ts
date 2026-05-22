// v5-D61 论坛虚拟用户池生成器
// 输入 seed → 输出确定性 500 用户。完全离线，不需要 LLM。

import { ForumUserRecord } from './types';
import { INDUSTRIES, CATEGORIES } from './templates';

const SURNAMES = [
  '王','李','张','刘','陈','杨','黄','赵','吴','周','徐','孙','马','朱','胡','郭','何','高','林','罗',
  '郑','梁','谢','宋','唐','许','韩','冯','邓','曹','彭','曾','肖','田','董','袁','潘','于','蒋','蔡',
  '余','杜','叶','程','苏','魏','吕','丁','任','沈',
];

const PROVINCES = [
  { p: '广东', cities: ['广州', '深圳', '东莞', '佛山', '中山', '惠州'] },
  { p: '北京', cities: ['朝阳', '海淀', '丰台', '昌平', '通州'] },
  { p: '上海', cities: ['浦东', '闵行', '徐汇', '虹口', '杨浦'] },
  { p: '浙江', cities: ['杭州', '宁波', '温州', '绍兴', '金华', '台州'] },
  { p: '江苏', cities: ['南京', '苏州', '无锡', '常州', '南通', '徐州'] },
  { p: '四川', cities: ['成都', '绵阳', '德阳'] },
  { p: '湖南', cities: ['长沙', '株洲', '湘潭'] },
  { p: '湖北', cities: ['武汉', '宜昌', '襄阳'] },
  { p: '河南', cities: ['郑州', '洛阳', '南阳'] },
  { p: '山东', cities: ['济南', '青岛', '烟台', '潍坊'] },
  { p: '河北', cities: ['石家庄', '保定', '唐山'] },
  { p: '福建', cities: ['福州', '厦门', '泉州'] },
  { p: '陕西', cities: ['西安', '咸阳'] },
  { p: '辽宁', cities: ['沈阳', '大连'] },
  { p: '云南', cities: ['昆明', '大理'] },
  { p: '广西', cities: ['南宁', '柳州'] },
  { p: '海外', cities: ['新加坡', '东京', '吉隆坡', '多伦多', '湾区', '迪拜'] },
];

const MASTER_BIOS = [
  '研习八字十二年，元亨利贞坛常驻。',
  '紫微斗数民间研究者，南派为主。',
  '六爻 + 梅花结合实战，八年。',
  '专注奇门遁甲应用层。',
  '风水方向偏阳宅，三合派。',
  '塔罗 + 占星结合，五年咨询经验。',
  '姓名学独立研究，偏五格剖象。',
  '面相民间师承，偏麻衣。',
  '专注择日和黄历应用。',
  '改运方向，偏五行平衡。',
];

const ENTHUSIAST_BIOS = [
  '兴趣爱好者，自学三年。',
  '在校学生，刚学一年命理。',
  '宝妈一枚，自学看孩子。',
  '跨界来玩，本职互联网。',
  '退休老人，研究家族命理。',
  '玄学小白，持续打卡中。',
  '从塔罗入门，慢慢学到八字。',
];

const OFFICIAL_BIOS = [
  '世界易学说官方账号',
  'WorldYi 编辑组',
  '人生 K 线官方答主',
];

// 简单确定性 PRNG（mulberry32）
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function maskName(full: string): string {
  // 王某 → 王**；二字名 → 王*；三字名 → 王**
  if (full.length <= 2) return full[0] + '*';
  return full[0] + '*'.repeat(full.length - 1);
}

function pickGivenName(rng: () => number): string {
  const chars = '安博昌晨成诚承春达东方风刚高广国海涵浩宏华辉慧佳家健建杰瑾静俊凯科兰立力良灵磊明娜楠楠宁鹏巧琴清庆'.split('');
  const len = rng() < 0.5 ? 2 : 1;
  let r = '';
  for (let i = 0; i < len; i++) r += pick(rng, chars);
  return r;
}

function pickHandle(rng: () => number, displayName: string): string {
  const adjectives = ['看山', '听风', '观云', '问月', '行远', '寻梦', '执笔', '安然', '半夏', '一念', '清欢', '随缘', '无尘', '问雪', '南山', '北舟', '流光', '初见', '若兰', '听雨'];
  const r = rng();
  if (r < 0.35) return displayName + '_' + Math.floor(rng() * 99 + 1);
  if (r < 0.65) return pick(rng, adjectives);
  if (r < 0.85) return pick(rng, adjectives) + Math.floor(rng() * 99 + 1);
  return pick(rng, adjectives) + '_' + pick(rng, adjectives);
}

function pickEmailLocal(rng: () => number, handle: string): string {
  const slug = handle.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
  const slugFinal = slug.length >= 4 ? slug : 'wy_' + Math.floor(rng() * 9999);
  return `${slugFinal}_${Math.floor(rng() * 9999)}`;
}

export interface SeedOptions {
  seed?: number;
  total?: number;
  // 比例：master 8% / official 1.5% / asker 70% / enthusiast 20.5%
  masterRatio?: number;
  officialRatio?: number;
  askerRatio?: number;
}

export function generateForumUserPool(options: SeedOptions = {}): ForumUserRecord[] {
  const seed = options.seed ?? 42;
  const total = options.total ?? 500;
  const masterRatio = options.masterRatio ?? 0.08;
  const officialRatio = options.officialRatio ?? 0.015;
  const askerRatio = options.askerRatio ?? 0.70;
  // enthusiastRatio = 1 - 上面三者

  const rng = makeRng(seed);
  const users: ForumUserRecord[] = [];

  for (let i = 0; i < total; i++) {
    const r = rng();
    let role: ForumUserRecord['role'];
    if (r < officialRatio) role = 'official';
    else if (r < officialRatio + masterRatio) role = 'master';
    else if (r < officialRatio + masterRatio + askerRatio) role = 'asker';
    else role = 'enthusiast';

    const surname = pick(rng, SURNAMES);
    const given = pickGivenName(rng);
    const fullName = surname + given;
    const masked = maskName(fullName);

    const provinceData = pick(rng, PROVINCES);
    const city = pick(rng, provinceData.cities);

    let industry = pick(rng, INDUSTRIES);
    let occupation = pick(rng, industry.occupations);
    if (role === 'official') {
      industry = INDUSTRIES.find((x) => x.key === 'culture') || industry;
      occupation = '世界易学说官方';
    } else if (role === 'master') {
      industry = INDUSTRIES.find((x) => x.key === 'religion') || industry;
      occupation = '命理研究者';
    }

    const handle = role === 'official'
      ? `worldyi_${i + 1}`
      : pickHandle(rng, masked);

    const emailLocal = role === 'official' ? `official_${i + 1}` : pickEmailLocal(rng, handle);
    const email = `${emailLocal}@worldyi.community`;

    const interests: string[] = [];
    const intCount = role === 'master' ? 3 : role === 'enthusiast' ? 2 : 1;
    const used = new Set<string>();
    for (let k = 0; k < intCount; k++) {
      const cat = pick(rng, CATEGORIES);
      if (!used.has(cat.key)) {
        used.add(cat.key);
        interests.push(cat.key);
      }
    }

    const bio = role === 'official' ? pick(rng, OFFICIAL_BIOS)
      : role === 'master' ? pick(rng, MASTER_BIOS)
      : role === 'enthusiast' ? pick(rng, ENTHUSIAST_BIOS)
      : `${industry.label} · ${occupation}`;

    const reputation = role === 'official' ? 9999
      : role === 'master' ? 800 + Math.floor(rng() * 1500)
      : role === 'enthusiast' ? 50 + Math.floor(rng() * 400)
      : Math.floor(rng() * 30);

    const joinedDaysAgo = Math.floor(rng() * 730) + 30;
    const joinedAt = new Date(Date.now() - joinedDaysAgo * 86400_000).toISOString();

    users.push({
      id: `fu_${(seed + '').padStart(4, '0')}_${(i + 1).toString().padStart(4, '0')}`,
      handle,
      displayName: masked,
      email,
      city,
      province: provinceData.p,
      occupation,
      industry: industry.key,
      interests,
      role,
      bio,
      avatarSeed: handle,
      joinedAt,
      reputation,
    });
  }

  return users;
}
