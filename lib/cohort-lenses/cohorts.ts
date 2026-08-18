import type { CohortFacts, CohortRegion } from './types';

const GREATER_CHINA_RE =
  /香港|香港島|九龍|新界|台灣|台湾|台北|高雄|台中|澳門|澳门|新加坡|singapore|hong\s*kong|taiwan|taipei|macau|macao/i;

const OVERSEAS_RE =
  /美国|美國|usa|united states|纽约|紐約|洛杉矶|加州|加拿大|canada|toronto|vancouver|澳洲|澳大利亚|sydney|melbourne|英国|英國|london|uk|europe|德国|法國|法国|日本|东京|東京|韩国|韓國|首尔|new york|san francisco|seattle|boston|paris|berlin/i;

export function parseBirthYear(input: string | Date | number | null | undefined): number | null {
  if (input instanceof Date && Number.isFinite(input.getTime())) {
    return input.getFullYear();
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    const year = input > 3000 ? new Date(input).getFullYear() : Math.round(input);
    return year >= 1940 && year <= 2035 ? year : null;
  }
  const raw = `${input || ''}`.trim();
  const iso = raw.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (iso) {
    const year = Number(iso[1]);
    return year >= 1940 && year <= 2035 ? year : null;
  }
  const dmy = raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dmy) {
    const year = Number(dmy[3]);
    return year >= 1940 && year <= 2035 ? year : null;
  }
  const yearOnly = raw.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    return year >= 1940 && year <= 2035 ? year : null;
  }
  const parsed = new Date(raw);
  if (Number.isFinite(parsed.getTime())) {
    const year = parsed.getFullYear();
    return year >= 1940 && year <= 2035 ? year : null;
  }
  return null;
}

export function resolveCohortRegion(place?: string | null): CohortRegion {
  const text = `${place || ''}`.trim();
  if (!text) return 'cn-mainland';
  if (GREATER_CHINA_RE.test(text)) return 'greater-china';
  if (OVERSEAS_RE.test(text)) return 'overseas';
  return 'cn-mainland';
}

export function resolveCohortKey(year: number): string {
  if (year < 1965) return 'cn-55-64';
  if (year < 1975) return 'cn-65-74';
  if (year < 1980) return 'cn-75-79';
  if (year < 1985) return 'cn-80-84';
  if (year < 1990) return 'cn-85-89';
  if (year < 1995) return 'cn-90-94';
  if (year < 2000) return 'cn-95-99';
  if (year < 2005) return 'cn-00-04';
  if (year < 2010) return 'cn-05-09';
  if (year < 2015) return 'cn-10-14';
  return 'cn-15-plus';
}

const FACTS: Record<string, CohortFacts> = {
  'cn-55-64': {
    key: 'cn-55-64',
    yearStart: 1955,
    yearEnd: 1964,
    label: '55–64 年出生',
    generationName: '物质重建一代',
    childhoodSetting: '物质短缺、集体生活和高度政治化的公共气氛',
    mediaDiet: '广播、报纸和大字报，而不是个人屏幕',
    familyShape: '多子女家庭、长幼秩序清楚，个人空间很小',
    schoolTone: '学业常被运动打断，知识被视为稀缺机会',
    comingOfAgeEvent: '恢复高考、返城和单位分配',
    jobMarketEntry: '体制内分配为主，个人选择空间窄',
    careerAdvantage: '吃苦耐劳、能在规则里把一件事做完',
    careerTrap: '把「单位稳」误当成长期安全，转型时容易偏晚',
    relationshipNorm: '介绍相亲、家庭同意比个人浪漫更重要',
    attachmentPull: '责任先于感受，冲突常常压着不说',
    moneyFormative: '票证、储蓄和「有总比没有强」',
    moneyHabit: '高储蓄、低杠杆、先留后花',
    moneyBlind: '低估通胀和资产配置，现金安全感过强',
    blindspot: '把忍耐当成美德，难以及时更新自己的位置',
    blindspotDaily: '明明该交接或求助，仍习惯一个人扛',
    blindspotFlip: '把「能扛」改成「能排优先级并交付」',
    olderContrast: '比更早一辈更早接触城市单位和高考通道',
    youngerContrast: '比 70 后更少把市场选择当成默认权利',
    valueCore: '稳定、面子、家庭责任和可验证的积累',
  },
  'cn-65-74': {
    key: 'cn-65-74',
    yearStart: 1965,
    yearEnd: 1974,
    label: '65–74 年出生',
    generationName: '改革接缝一代',
    childhoodSetting: '集体生活尚未退场，商品经济刚露头',
    mediaDiet: '电视开始进家，但频道很少、叙事很统一',
    familyShape: '兄弟姐妹仍常见，长子长女责任重',
    schoolTone: '恢复秩序后的应试开始变重要',
    comingOfAgeEvent: '改革开放、下海潮和第一波城市化',
    jobMarketEntry: '从分配转向双向选择，有人下海有人留守',
    careerAdvantage: '能同时读懂体制语言和市场机会',
    careerTrap: '在「稳」和「搏」之间反复横跳，决策成本高',
    relationshipNorm: '家庭介入仍强，但个人选择开始被允许',
    attachmentPull: '用提供资源表达爱，口头亲密较少',
    moneyFormative: '物价闯关、下海暴富故事和早期商品房',
    moneyHabit: '抓住窗口就上，同时保留退路',
    moneyBlind: '容易把一次窗口运气当成可复制能力',
    blindspot: '用上一代的稳定标准衡量下一代的流动生活',
    blindspotDaily: '对子女或下属的节奏不耐烦，却说不清自己的怕',
    blindspotFlip: '把「我走过的路」改成「你现在的约束」',
    olderContrast: '比 50 后更早把个人前途从单位里拆出来',
    youngerContrast: '比 80 后更少把自我表达当成职业资本',
    valueCore: '抓住窗口、对家庭交代得过去、留一条后路',
  },
  'cn-75-79': {
    key: 'cn-75-79',
    yearStart: 1975,
    yearEnd: 1979,
    label: '75–79 年出生',
    generationName: '市场化前夜一代',
    childhoodSetting: '物资开始丰富，但选择仍然不多',
    mediaDiet: '港台流行文化、录音带和早期电视连续剧',
    familyShape: '计划生育已推进，家庭资源开始集中',
    schoolTone: '重点学校和高考赛道迅速硬化',
    comingOfAgeEvent: '南巡讲话后的市场加速和高校并轨',
    jobMarketEntry: '国企改革、外企进入和第一批互联网岗位并存',
    careerAdvantage: '能把正规训练转成可售卖的专业能力',
    careerTrap: '过早把自己锁进「体面行业」，转换时羞耻感重',
    relationshipNorm: '恋爱开始自由，但结婚仍被当作社会完成式',
    attachmentPull: '用成就证明自己配被爱',
    moneyFormative: '福利分房尾声和商品房起步',
    moneyHabit: '先买房再谈别的，现金和房产并重',
    moneyBlind: '把房产当成唯一正确的长期答案',
    blindspot: '把「看起来成功」和「自己过得去」绑死',
    blindspotDaily: '很难承认倦怠，只会继续加码工作',
    blindspotFlip: '把体面改成可验证的阶段目标',
    olderContrast: '比 70 前更习惯个人简历而不是组织履历',
    youngerContrast: '比 85 后更难接受职业身份频繁重写',
    valueCore: '专业体面、家庭交代、资产落袋',
  },
  'cn-80-84': {
    key: 'cn-80-84',
    yearStart: 1980,
    yearEnd: 1984,
    label: '80 前',
    generationName: '独生第一批',
    childhoodSetting: '全家资源压在一个孩子身上，期待很具体',
    mediaDiet: '电视新闻、少儿节目和纸质作业，信息按天更新',
    familyShape: '独生或准独生，父母的人生赌注很集中',
    schoolTone: '重点班、奥数和「不能让孩子输在起跑线」',
    comingOfAgeEvent: '入世、外企黄金十年和高校扩招并行',
    jobMarketEntry: '外企、公务员和早期互联网同时看起来都对',
    careerAdvantage: '执行稳、能扛完整项目、对组织语言熟',
    careerTrap: '把父母期待内化成职业方向，中年才开始问自己要什么',
    relationshipNorm: '先立业再成家的叙事很强，婚育时间被社会钟点盯着',
    attachmentPull: '高责任、低表达，冲突时先讲道理',
    moneyFormative: '成年买房窗口正好撞上房价资产化',
    moneyHabit: '房贷优先，风险资产谨慎，对「一夜翻身」警惕',
    moneyBlind: '过度用房子定义安全感，现金流被锁死也不敢动',
    blindspot: '很难把「我应该」和「我愿意」分开',
    blindspotDaily: '日程排满，但说不清哪一件真正属于自己',
    blindspotFlip: '每周留一件只服务自己判断的小事',
    olderContrast: '比 70 后更早被当成唯一希望来培养',
    youngerContrast: '比 90 后更难把兴趣和职业看成可试验品',
    valueCore: '对得起投入、把一件事做成、给家庭一个交代',
  },
  'cn-85-89': {
    key: 'cn-85-89',
    yearStart: 1985,
    yearEnd: 1989,
    label: '85 后',
    generationName: '互联网启蒙一代',
    childhoodSetting: '城市物质条件明显改善，竞争也同步升温',
    mediaDiet: '电脑房、QQ 和论坛，第一次有了匿名社交',
    familyShape: '独生为主，父母开始用教育消费表达爱',
    schoolTone: '扩招前夜的应试高压，名校叙事很响',
    comingOfAgeEvent: '博客、网游和经济适用房到商品房的跃迁',
    jobMarketEntry: '传统行业饱和，互联网开始给出第二条梯子',
    careerAdvantage: '能把线下执行力和线上工具感拼在一起',
    careerTrap: '既羡慕创业神话，又放不下编制/大厂的身份锚',
    relationshipNorm: '网恋从笑话变成日常，但见面后仍用旧标准验收',
    attachmentPull: '需要被看见，又习惯把脆弱藏进幽默或忙碌',
    moneyFormative: '见证第一波互联网造富，也看见 2008 的收缩',
    moneyHabit: '愿意为技能和学历付费，但对杠杆仍犹豫',
    moneyBlind: '把「赶上风口」和「自己有能力」混为一谈',
    blindspot: '身份切换时动作慢，因为旧身份还在发工资',
    blindspotDaily: '同时养着计划 A 和计划 B，两头都不深',
    blindspotFlip: '给试验期设截止日期，而不是永远两头烧',
    olderContrast: '比 80 前更早把网络当作社会空间',
    youngerContrast: '比 95 后更难把不稳定工作当成默认态',
    valueCore: '赶上变化、保住体面、给自己留试验权',
  },
  'cn-90-94': {
    key: 'cn-90-94',
    yearStart: 1990,
    yearEnd: 1994,
    label: '90 前',
    generationName: '扩招与入世一代',
    childhoodSetting: '城市消费社会成型，农村同伴则经历更快的城乡落差',
    mediaDiet: '电视、MP3、网吧和 QQ 空间并存',
    familyShape: '独生为主，父母用「我们吃过的苦」当教育脚本',
    schoolTone: '扩招后学历通胀，高考仍被当作唯一正门',
    comingOfAgeEvent: '移动互联网爆发、高铁网络和 ant 式支付普及',
    jobMarketEntry: '大厂校招神话与专业过剩同时出现',
    careerAdvantage: '学习速度快，能在平台规则里找到切口',
    careerTrap: '把平台职称当成能力本身，平台一变就空',
    relationshipNorm: '恋爱周期变短，认真关系又被房车期待压着',
    attachmentPull: '既要独立又要被稳定接住，拉扯明显',
    moneyFormative: '成年后同时看见期权故事和房价不可追',
    moneyHabit: '能接受分期和基金定投，但对长期持有耐心不足',
    moneyBlind: '消费升级和焦虑储蓄来回切换，缺少自己的规则',
    blindspot: '把外部评价系统（排名、职级、点赞）当成自我',
    blindspotDaily: '一闲下来就刷信息，很难独自做慢决定',
    blindspotFlip: '给重要决定留 48 小时冷静窗',
    olderContrast: '比 80 后更早把互联网当成基础设施而不是新鲜事物',
    youngerContrast: '比 00 后更难把「不买房」说成轻松的选择',
    valueCore: '效率、可选性、不被上一代的单一剧本困住',
  },
  'cn-95-99': {
    key: 'cn-95-99',
    yearStart: 1995,
    yearEnd: 1999,
    label: '95 后',
    generationName: '移动互联网一代',
    childhoodSetting: '物质条件更好，比较对象却变成全国甚至全球',
    mediaDiet: '智能手机在青春期进入生活，信息按分钟更新',
    familyShape: '父母更会表达投入，也更会用焦虑传递压力',
    schoolTone: '竞赛、留学和本地高考多轨并行',
    comingOfAgeEvent: '疫情打断大学或初职，线上生活变成底色',
    jobMarketEntry: '校招收缩、 intern 内卷和内容行业同时可见',
    careerAdvantage: '内容感、协作感和跨工具能力强',
    careerTrap: '对「没意义的班」容忍度低，但财务缓冲不够就容易空转',
    relationshipNorm: '边界意识更强，也更怕被一段关系吞掉时间',
    attachmentPull: '高表达、高敏感，冲突时先退到线上',
    moneyFormative: '看见大厂裁员和副业神话同时发生',
    moneyHabit: '愿意为体验付费，储蓄靠自动扣款才稳',
    moneyBlind: '低估复利，高估短期技能证书的兑现速度',
    blindspot: '把情绪真实和结构判断混在一起',
    blindspotDaily: '状态不好就怀疑整条路，而不是先看窗口',
    blindspotFlip: '先写可验证的 30 天动作，再决定要不要转向',
    olderContrast: '比 90 前更早把心理健康说出口',
    youngerContrast: '比 05 后仍保有一段「无手机童年」的记忆',
    valueCore: '意义感、节奏自主、关系对等',
  },
  'cn-00-04': {
    key: 'cn-00-04',
    yearStart: 2000,
    yearEnd: 2004,
    label: '00 前',
    generationName: '短视频与疫情青春期',
    childhoodSetting: '数字工具很早就在手边，现实同伴竞争也更早开始',
    mediaDiet: '短视频、弹幕和算法推荐，注意力被切成碎片',
    familyShape: '父母更像项目经理，行程、补习和安全被精密管理',
    schoolTone: '素质教育口号和应试现实长期两张皮',
    comingOfAgeEvent: '疫情占据关键青春期，社交和开学都被打断',
    jobMarketEntry: '尚未完全进入或刚进入，面对的是收缩的校招叙事',
    careerAdvantage: '视觉表达快，能迅速模仿并做出可见结果',
    careerTrap: '把曝光和反馈循环当成能力证明，深度训练不足',
    relationshipNorm: '线上关系密度高，线下承诺更谨慎',
    attachmentPull: '需要高频回应，沉默容易被读成拒绝',
    moneyFormative: '直播带货、游戏内购和父母代付同时存在',
    moneyHabit: '小额高频消费熟练，大额长期规划陌生',
    moneyBlind: '把「会赚钱的人设」和真实现金流搞混',
    blindspot: '很难忍受没有即时反馈的练习期',
    blindspotDaily: '一件事三天没有回音就换赛道',
    blindspotFlip: '给深度技能设 90 天最低练习合同',
    olderContrast: '比 95 后更少经历「互联网是新世界」的惊喜',
    youngerContrast: '比 10 后仍经历过相对完整的校园集体生活',
    valueCore: '被看见、不被浪费时间、保留退出权',
  },
  'cn-05-09': {
    key: 'cn-05-09',
    yearStart: 2005,
    yearEnd: 2009,
    label: '05 后',
    generationName: '数字原生一代',
    childhoodSetting: '平板和手机是学习工具也是玩伴，户外无组织时间更少',
    mediaDiet: '算法从一开始就参与审美和社交',
    familyShape: '家庭日程高度安排，父母用数据和排名对话',
    schoolTone: '双减前后的剧烈摇摆，校内减负校外加码',
    comingOfAgeEvent: '仍在求学，公共叙事已是内卷、安全和全球波动',
    jobMarketEntry: '尚未入场，但对「稳定工作是否还存在」很早就有判断',
    careerAdvantage: '多任务切换快，对视觉和社群规则直觉准',
    careerTrap: '成人世界的慢反馈会让他们误判自己「不行」',
    relationshipNorm: '友谊和恋爱都高度媒介化，当面冲突练习少',
    attachmentPull: '需要明确规则，含糊让他们比上一代更不安',
    moneyFormative: '看到父母为教育和房子焦虑，自己几乎没有现金决策权',
    moneyHabit: '虚拟物品消费熟练，对工资/税务/租房缺少体感',
    moneyBlind: '把家庭支付能力当成自己的风险承受力',
    blindspot: '自我评价过度依赖外部比较',
    blindspotDaily: '同学一发布就觉得自己落后',
    blindspotFlip: '用自己的上周对比，而不是用别人的高光',
    olderContrast: '比 00 前更少一段「先线下后线上」的过渡记忆',
    youngerContrast: '比更幼的一辈更早经历过双减政策摇摆',
    valueCore: '公平感、心理安全、不被单一分数定义',
  },
  'cn-10-14': {
    key: 'cn-10-14',
    yearStart: 2010,
    yearEnd: 2014,
    label: '10 后',
    generationName: '被安排的童年',
    childhoodSetting: '行程表很满，自由玩耍和巷子文化几乎消失',
    mediaDiet: '儿童内容和短视频同时到达，甄别能力还在学',
    familyShape: '父母更懂陪伴话术，也更难放下监控',
    schoolTone: '减负、素养和竞赛信号互相打架',
    comingOfAgeEvent: '仍在童年，公共话题已是安全和全球不确定',
    jobMarketEntry: '尚未入场',
    careerAdvantage: '接触面广，表达工具多',
    careerTrap: '选择太多，缺少自己做主的小失败',
    relationshipNorm: '同伴关系常被课程表切断',
    attachmentPull: '对主要照顾者依赖深，分离练习不足',
    moneyFormative: '看见家庭为教育付费，自己很少经手现金',
    moneyHabit: '电子支付无痛，金钱的重量感弱',
    moneyBlind: '还没建立「赚/存/等」的身体记忆',
    blindspot: '把被安排好的生活误当成自己的选择',
    blindspotDaily: '一有空档就找屏幕，很难忍受无聊',
    blindspotFlip: '每周一块无人安排的空白时间',
    olderContrast: '比 00 后更少一段「自己满街跑」的童年',
    youngerContrast: '比更幼一辈更早进入系统化校外班',
    valueCore: '被保护、被看见、有一点点自己的领地',
  },
  'cn-15-plus': {
    key: 'cn-15-plus',
    yearStart: 2015,
    yearEnd: 2026,
    label: '15 后',
    generationName: '幼童观察窗',
    childhoodSetting: '养育高度专业化，屏幕和户外都被成人设计',
    mediaDiet: '儿童平板和短视频是默认环境，不是后来才进入',
    familyShape: '父母更晚生育、更焦虑，隔代带养仍然常见',
    schoolTone: '入学规则和城市资源绑定更深',
    comingOfAgeEvent: '尚未到来',
    jobMarketEntry: '尚未入场',
    careerAdvantage: '语言和工具暴露极早',
    careerTrap: '过早被项目化，好奇心被课程表取代',
    relationshipNorm: '主要关系在家庭内部，同伴密度取决于课程',
    attachmentPull: '对稳定照看者非常敏感',
    moneyFormative: '几乎没有独立金钱经验',
    moneyHabit: '尚未形成',
    moneyBlind: '不适用，重点在家庭的金钱示范',
    blindspot: '成人容易把养育焦虑写成孩子的性格',
    blindspotDaily: '用更多课解决所有不安',
    blindspotFlip: '先稳住家庭节奏，再谈加项',
    olderContrast: '比 10 后更彻底地生活在设计过的环境里',
    youngerContrast: '对比更小的孩子，他们已开始进入正式学制',
    valueCore: '安全、规律、不被过度开发',
  },
};

export function getCohortFacts(year: number): CohortFacts {
  return FACTS[resolveCohortKey(year)] || FACTS['cn-90-94']!;
}

export function listCohortFacts(): CohortFacts[] {
  return Object.values(FACTS);
}

export function regionLabel(region: CohortRegion): string {
  if (region === 'greater-china') return '港澳台/新加坡语境';
  if (region === 'overseas') return '海外成长语境';
  return '中国大陆语境';
}
