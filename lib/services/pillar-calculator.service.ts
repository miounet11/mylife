// 四柱计算服务 - 单一职责：计算四柱八字
import { Lunar, Solar } from 'lunar-javascript';
import type { Pillar } from '../user-types';
import { ZHI_CANG_GAN, ZHI_CHONG, ZHI_HE, ZHI_XING, ZHI_HAI } from '../bazi-constants';

const STEM_ELEMENT: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

export interface BirthInfo {
  date: Date;
  time: string;
  timezone: number;
}

export class PillarCalculatorService {
  calculate(birthInfo: BirthInfo): Pillar[] {
    const { date, time, timezone } = birthInfo;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const [hour, minute] = time.split(':').map(Number);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute || 0, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();

    return [
      this.buildPillar(
        eightChar.getYearGan(),
        eightChar.getYearZhi(),
        eightChar.getYearNaYin(),
        eightChar
      ),
      this.buildPillar(
        eightChar.getMonthGan(),
        eightChar.getMonthZhi(),
        eightChar.getMonthNaYin(),
        eightChar
      ),
      this.buildPillar(
        eightChar.getDayGan(),
        eightChar.getDayZhi(),
        eightChar.getDayNaYin(),
        eightChar
      ),
      this.buildPillar(
        eightChar.getTimeGan(),
        eightChar.getTimeZhi(),
        eightChar.getTimeNaYin(),
        eightChar
      ),
    ];
  }

  private buildPillar(
    gan: string,
    zhi: string,
    nayin: string,
    eightChar: any
  ): Pillar {
    const hiddenStems = ZHI_CANG_GAN[zhi] || [];
    const allZhi = [
      eightChar.getYearZhi(),
      eightChar.getMonthZhi(),
      eightChar.getDayZhi(),
      eightChar.getTimeZhi(),
    ];

    return {
      celestialStem: gan,
      earthlyBranch: zhi,
      hiddenStems,
      nayin,
      fiveElements: {
        main: STEM_ELEMENT[gan] || 'wood',
        hidden: hiddenStems.map(s => STEM_ELEMENT[s] || 'wood'),
        strength: 0.5,
      },
      relationships: {
        combination: allZhi.filter(z => z !== zhi && ZHI_HE[zhi] === z),
        clash: allZhi.filter(z => z !== zhi && ZHI_CHONG[zhi] === z),
        penalty: allZhi.filter(z => z !== zhi && ZHI_XING[zhi] === z),
        harm: allZhi.filter(z => z !== zhi && ZHI_HAI[zhi] === z),
      },
    };
  }

  getDayMaster(pillars: Pillar[]): string {
    return pillars[2].celestialStem;
  }

  toBaziString(pillars: Pillar[]): string[] {
    return pillars.map(p => p.celestialStem + p.earthlyBranch);
  }
}
