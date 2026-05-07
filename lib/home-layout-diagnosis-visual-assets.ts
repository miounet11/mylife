import type { VisualAssetManifest } from '@/lib/visual-assets';

export const HOME_LAYOUT_DIAGNOSIS_VISUAL_BATCH_ID = 'home-layout-diagnosis-200-v1';
export const HOME_LAYOUT_DIAGNOSIS_LIBRARY_KEY = 'home_layout_diagnosis';
export const HOME_LAYOUT_DIAGNOSIS_BRAND_PACK_ID = 'world-yi-layout-diagnosis-v1';

type HomeLayoutArchetype = {
  key: string;
  zh: string;
  en: string;
  region: string;
  rooms: string;
  planTraits: string[];
};

type HomeLayoutIssueTheme = {
  key: string;
  zh: string;
  en: string;
  markers: string[];
  causeChain: string;
  priority: string;
  adjustment: string;
  bottomLine: string;
};

type HomeLayoutDiagnosisAssetSpec = {
  index: number;
  id: string;
  slug: string;
  ratio: '16:9' | '9:16';
  size: '2048x1152' | '1152x2048';
  layout: HomeLayoutArchetype;
  issue: HomeLayoutIssueTheme;
};

const layoutArchetypes: HomeLayoutArchetype[] = [
  {
    key: 'downtown-studio-open-plan',
    zh: '海外城市单身公寓',
    en: 'Downtown studio apartment',
    region: 'North America / UK city rental',
    rooms: 'studio',
    planTraits: ['open sleeping-living zone', 'compact entry', 'one bathroom core', 'single main window wall'],
  },
  {
    key: 'one-bedroom-balcony-axis',
    zh: '一房一厅阳台轴线户型',
    en: 'One-bedroom condo with balcony axis',
    region: 'Canada / Australia condo',
    rooms: '1 bed 1 bath',
    planTraits: ['entry faces living room', 'balcony at far end', 'open kitchen', 'bedroom beside bathroom'],
  },
  {
    key: 'one-bedroom-den',
    zh: '一房加书房公寓',
    en: 'One-bedroom plus den',
    region: 'US / Canada urban condo',
    rooms: '1 bed + den',
    planTraits: ['den without full window', 'bathroom near bedroom door', 'open dining corner', 'limited foyer storage'],
  },
  {
    key: 'two-bedroom-long-corridor',
    zh: '两房长走廊公寓',
    en: 'Two-bedroom long-corridor condo',
    region: 'US / Canada apartment',
    rooms: '2 bed 1 bath',
    planTraits: ['long narrow corridor', 'bedroom doors along one side', 'living room at corridor end', 'central bathroom'],
  },
  {
    key: 'two-bedroom-open-kitchen',
    zh: '两房开放厨房公寓',
    en: 'Two-bedroom open-kitchen condo',
    region: 'Australia / New Zealand apartment',
    rooms: '2 bed 2 bath',
    planTraits: ['open kitchen island', 'living dining merged', 'entry with no vestibule', 'wet core near bedroom'],
  },
  {
    key: 'two-bedroom-split-plan',
    zh: '两房分卧式公寓',
    en: 'Split-bedroom condo',
    region: 'North American condo',
    rooms: '2 bed 2 bath',
    planTraits: ['bedrooms on opposite sides', 'living room center', 'bathroom doors near bedroom entries', 'balcony line across living'],
  },
  {
    key: 'three-bedroom-dark-hall',
    zh: '三房暗过道户型',
    en: 'Three-bedroom condo with dark hallway',
    region: 'Singapore / Malaysia apartment',
    rooms: '3 bed 2 bath',
    planTraits: ['internal hallway with weak light', 'clustered bedroom doors', 'bathroom in the core', 'living balcony at one end'],
  },
  {
    key: 'three-bedroom-ensuite',
    zh: '三房主套房户型',
    en: 'Three-bedroom primary-suite condo',
    region: 'US / Canada family condo',
    rooms: '3 bed 2 bath',
    planTraits: ['ensuite beside primary bed wall', 'secondary bedrooms share hall bath', 'open public zone', 'entry sees living'],
  },
  {
    key: 'narrow-townhouse-entry',
    zh: '窄面宽联排入户户型',
    en: 'Narrow townhouse with stair entry',
    region: 'US / Canada townhouse',
    rooms: '3 bed townhouse',
    planTraits: ['front door beside stair', 'narrow foyer', 'kitchen behind living', 'vertical circulation core'],
  },
  {
    key: 'townhouse-open-stair',
    zh: '开放楼梯联排户型',
    en: 'Townhouse with open stairwell',
    region: 'UK / North America townhouse',
    rooms: '3-4 bed townhouse',
    planTraits: ['open stair in living area', 'through living-dining path', 'powder room near entry', 'rear patio door'],
  },
  {
    key: 'single-family-ranch',
    zh: '北美牧场式平层住宅',
    en: 'Single-family ranch house',
    region: 'US suburban house',
    rooms: '3 bed 2 bath',
    planTraits: ['wide horizontal plan', 'bedroom wing', 'garage entry', 'kitchen-dining-family room chain'],
  },
  {
    key: 'suburban-two-storey',
    zh: '郊区双层四房住宅',
    en: 'Suburban two-storey four-bedroom house',
    region: 'US / Canada suburbs',
    rooms: '4 bed 3 bath',
    planTraits: ['front foyer with stairs', 'open family room', 'kitchen island', 'upstairs bedroom cluster'],
  },
  {
    key: 'side-by-side-duplex',
    zh: '双拼住宅侧入户型',
    en: 'Side-by-side duplex',
    region: 'Canada / Australia duplex',
    rooms: '2-3 bed duplex',
    planTraits: ['side entry', 'shared wall side has fewer windows', 'linear kitchen', 'compact bedroom zone'],
  },
  {
    key: 'basement-suite-low-light',
    zh: '地下室套间低采光户型',
    en: 'Basement suite with low daylight',
    region: 'Canada basement rental',
    rooms: '1-2 bed suite',
    planTraits: ['small high windows', 'low daylight corridor', 'bathroom near bedroom', 'open kitchen-living room'],
  },
  {
    key: 'loft-mezzanine',
    zh: 'Loft 夹层开放户型',
    en: 'Loft with mezzanine sleeping area',
    region: 'US / UK loft apartment',
    rooms: 'loft',
    planTraits: ['double-height living', 'mezzanine bed', 'open stair', 'bathroom under or beside stair'],
  },
  {
    key: 'corner-window-condo',
    zh: '转角窗公寓户型',
    en: 'Corner-window condo',
    region: 'US / Canada high-rise',
    rooms: '2 bed corner unit',
    planTraits: ['two exterior window walls', 'angled living room', 'entry near service core', 'bedroom doors face public zone'],
  },
  {
    key: 'central-bath-core-apartment',
    zh: '中置卫浴核心公寓',
    en: 'Apartment with central bathroom core',
    region: 'Singapore / Hong Kong overseas rental',
    rooms: '2-3 bed apartment',
    planTraits: ['bathroom and laundry in center', 'bedrooms around core', 'limited cross ventilation', 'compact kitchen'],
  },
  {
    key: 'small-home-kitchen-dining',
    zh: '小住宅厨餐合并户型',
    en: 'Small home with combined kitchen-dining',
    region: 'Australia / New Zealand small home',
    rooms: '2 bed small house',
    planTraits: ['kitchen and dining overlap', 'short entry into living', 'laundry beside bath', 'limited storage wall'],
  },
  {
    key: 'multi-generation-suite',
    zh: '多代同住套房户型',
    en: 'Multi-generation suite layout',
    region: 'Overseas Chinese family home',
    rooms: '4 bed + in-law suite',
    planTraits: ['secondary suite', 'shared kitchen pressure', 'multiple bedroom doors', 'public-private boundary conflict'],
  },
  {
    key: 'shared-rental-room-bath',
    zh: '合租房共卫户型',
    en: 'Shared rental with common bathroom',
    region: 'Student / young professional rental',
    rooms: 'shared 3-4 room rental',
    planTraits: ['private rooms around common hallway', 'shared bath', 'small shared kitchen', 'weak entry storage'],
  },
];

const issueThemes: HomeLayoutIssueTheme[] = [
  {
    key: 'entry-no-buffer',
    zh: '入户无缓冲',
    en: 'Entry without buffer',
    markers: ['01 入户直冲', '02 玄关纳气缓冲缺失', '03 视线轴过直', '04 鞋柜收纳挤压'],
    causeChain: '入户无缓冲导致视线轴和气流过直，进一步放大公共区空散感，所以先补玄关停顿点。',
    priority: 'Priority 1｜入户缓冲；Priority 2｜收纳落位；Priority 3｜客厅聚焦',
    adjustment: '玄关｜半高柜、窄屏风、地毯或端景墙｜让入户视线先停一下，减少一眼泄到底。',
    bottomLine: '门一泄，厅就散；先补缓冲，再谈风水。',
  },
  {
    key: 'through-living-balcony',
    zh: '穿堂动线',
    en: 'Through-line from entry to window or balcony',
    markers: ['01 门窗对线', '02 穿堂动线', '03 客厅不聚焦', '04 阳台泄线'],
    causeChain: '门窗对线形成穿堂动线，公共区停留感变弱，所以先截断直线再整理客厅中心。',
    priority: 'Priority 1｜截断穿堂线；Priority 2｜客厅主活动区；Priority 3｜阳台过渡',
    adjustment: '客厅｜用矮柜、植物组、地毯边界和沙发角度打断直线｜让气流、视线和活动都慢下来。',
    bottomLine: '穿堂不是玄，问题是留不住人和活动中心。',
  },
  {
    key: 'long-narrow-corridor',
    zh: '长窄过道',
    en: 'Long narrow circulation corridor',
    markers: ['01 交通核冗长', '02 暗过道', '03 空间浪费', '04 动线绕行'],
    causeChain: '交通核过长会吃掉有效面积，也让暗区和杂物停留变明显，所以先压缩过道功能负担。',
    priority: 'Priority 1｜主通道清空；Priority 2｜端景照明；Priority 3｜墙面浅收纳',
    adjustment: '过道｜取消凸出堆物，补连续照明和薄型收纳｜减少卡顿、暗沉和绕行。',
    bottomLine: '户型的问题，不在玄，在堵。',
  },
  {
    key: 'living-room-as-passage',
    zh: '客厅过道化',
    en: 'Living room turned into traffic passage',
    markers: ['01 客厅过道化', '02 沙发背后无靠', '03 主活动区被切割', '04 公共区太散'],
    causeChain: '客厅被主通道切开后，沙发和活动中心都不稳定，所以先确定停留区再让通道贴边走。',
    priority: 'Priority 1｜客厅聚焦；Priority 2｜沙发靠实；Priority 3｜通道贴边',
    adjustment: '客厅｜调整沙发靠实墙或稳定柜体，地毯圈定主活动区｜降低被路过打断的感觉。',
    bottomLine: '厅不稳，家就散；先定客厅中心。',
  },
  {
    key: 'bedroom-door-bed-line',
    zh: '卧室门线冲',
    en: 'Bedroom door line conflicts with bed position',
    markers: ['01 门线冲', '02 床位不稳', '03 床头无靠', '04 睡眠区被动线打断'],
    causeChain: '卧室门线压到床位会让休息区暴露在动线里，睡眠稳定性被削弱，所以先避门线再谈摆件。',
    priority: 'Priority 1｜床头靠实；Priority 2｜避开门线；Priority 3｜遮挡视线',
    adjustment: '卧室｜床头靠实墙，床身避开门线直冲，门口增加柔性遮挡｜提升休息区安稳感。',
    bottomLine: '卧不稳，人难安；床先离开门线。',
  },
  {
    key: 'kitchen-dining-water-fire',
    zh: '厨餐水火动线混乱',
    en: 'Kitchen-dining work triangle conflict',
    markers: ['01 水火动线混乱', '02 厨餐互相压迫', '03 服务核拥堵', '04 油烟外溢'],
    causeChain: '厨房操作线和餐桌通行线交叠，会放大拥堵、油烟和清洁压力，所以先理顺服务核。',
    priority: 'Priority 1｜厨房操作线；Priority 2｜餐桌退让；Priority 3｜排风与清洁',
    adjustment: '厨房｜水槽、灶台、备餐区保持顺手三角，餐桌避开灶台开合线｜减少家务动线打架。',
    bottomLine: '厨餐乱，家务就乱；先把服务核理顺。',
  },
  {
    key: 'bathroom-quiet-zone',
    zh: '卫浴扰静区',
    en: 'Bathroom interfering with quiet zone',
    markers: ['01 洁污分区不清', '02 卫浴扰静区', '03 湿区贴卧室', '04 门对门'],
    causeChain: '卫生间贴近卧室且洁污分区不清，会把湿气、噪音和异味带到休息区，所以先做干湿与门口过渡。',
    priority: 'Priority 1｜湿区边界；Priority 2｜门常闭与排风；Priority 3｜卧室遮挡',
    adjustment: '卫生间｜加强排风、门常闭，设置干区过渡和吸湿收纳｜减少湿气与噪音外溢。',
    bottomLine: '湿区不收，静区就乱；先分洁污。',
  },
  {
    key: 'light-ventilation-break',
    zh: '采光通风断裂',
    en: 'Broken daylight and ventilation path',
    markers: ['01 暗厅', '02 暗卫', '03 通风路径断裂', '04 明暗失衡'],
    causeChain: '采光通风路径断裂会让局部滞闷、潮湿和异味更难散，所以先打开可持续的换气路径。',
    priority: 'Priority 1｜通风路径；Priority 2｜暗区照明；Priority 3｜防潮除味',
    adjustment: '暗区｜补连续照明、保持门缝换气、增强排风和除湿｜降低滞闷、潮湿与异味。',
    bottomLine: '明暗失衡，久住就闷；先让空气走起来。',
  },
  {
    key: 'storage-blocks-flow',
    zh: '收纳挤压动线',
    en: 'Storage shortage blocking circulation',
    markers: ['01 玄关收纳不足', '02 餐边收纳缺失', '03 衣柜落位别扭', '04 收纳挤压动线'],
    causeChain: '收纳缺位会把杂物推到通道和公共区，杂乱又继续放大动线卡顿，所以先给高频物品落位。',
    priority: 'Priority 1｜玄关收纳；Priority 2｜餐边收纳；Priority 3｜卧室衣柜线',
    adjustment: '收纳｜鞋包钥匙、餐厨杂物、衣物分别落到固定墙面｜让通道不再承担仓库功能。',
    bottomLine: '家里最伤人的，不是小，而是乱冲乱堵。',
  },
  {
    key: 'dynamic-static-zoning',
    zh: '动静分区混乱',
    en: 'Active and quiet zones mixed',
    markers: ['01 动静分区混乱', '02 厨卫扰静', '03 公私边界弱', '04 噪音路径短'],
    causeChain: '动区、静区和服务区互相穿插，会让休息、家务和会客互相干扰，所以先分清公私和动静边界。',
    priority: 'Priority 1｜公私边界；Priority 2｜动静分区；Priority 3｜厨卫降噪',
    adjustment: '分区｜用家具朝向、门口遮挡、地毯和收纳墙建立边界｜减少厨房、卫浴和客厅对卧室的干扰。',
    bottomLine: '先改动线，再谈风水。',
  },
];

function padAssetIndex(index: number) {
  return String(index).padStart(3, '0');
}

function getRatioForAsset(index: number): HomeLayoutDiagnosisAssetSpec['ratio'] {
  return index % 5 === 0 || index % 5 === 2 ? '9:16' : '16:9';
}

function getSizeForRatio(ratio: HomeLayoutDiagnosisAssetSpec['ratio']): HomeLayoutDiagnosisAssetSpec['size'] {
  return ratio === '9:16' ? '1152x2048' : '2048x1152';
}

function buildAssetSpecs(): HomeLayoutDiagnosisAssetSpec[] {
  const specs: HomeLayoutDiagnosisAssetSpec[] = [];

  for (const layout of layoutArchetypes) {
    for (const issue of issueThemes) {
      const index = specs.length + 1;
      const ratio = getRatioForAsset(index);
      specs.push({
        index,
        id: `HLD-${padAssetIndex(index)}`,
        slug: `home-layout-diagnosis-${layout.key}-${issue.key}`,
        ratio,
        size: getSizeForRatio(ratio),
        layout,
        issue,
      });
    }
  }

  return specs;
}

export function buildHomeLayoutDiagnosisVisualPrompt(spec: HomeLayoutDiagnosisAssetSpec) {
  const { layout, issue, ratio, size } = spec;

  return [
    'Use case: infographic-diagram',
    'Asset type: Life Kline / World Yi home layout issue diagnosis reference image.',
    '',
    'Role:',
    'You are 禅院宅居断事师, a senior floor-plan diagnosis consultant, circulation analyst, traditional feng-shui form consultant, and professional home infographic designer.',
    '',
    'Audience:',
    'Overseas Chinese users who live in condos, townhouses, single-family homes, basement suites, studios, lofts, duplexes, shared rentals, and multi-generation homes. The image must feel professional, calm, premium, and useful for North America, Australia, the UK, Singapore, Malaysia, and other overseas Chinese contexts.',
    '',
    'Primary request:',
    `Generate a ${ratio} 户型问题诊断图 / HOME LAYOUT ISSUE DIAGNOSIS for a ${layout.zh} (${layout.en}) in ${layout.region}.`,
    `Rooms and plan type: ${layout.rooms}.`,
    `Visible layout traits to draw: ${layout.planTraits.join(' / ')}.`,
    `Main issue focus: ${issue.zh} (${issue.en}).`,
    '',
    'Direction rule:',
    'Because this is a reference asset rather than a user-uploaded real plan, include this exact orientation boundary in the image:',
    '方向假设：上北下南，左西右东，仅供结构分析参考',
    '',
    'Problem-only stance:',
    'The image only does three things: 找问题 / 说因果 / 给改法.',
    'Do not include an advantages module. Do not say 整体不错但. Do not comfort the viewer. Do not exaggerate fear.',
    '',
    'Professional terms to use correctly:',
    '玄关纳气缓冲, 视线轴, 门线冲, 穿堂动线, 动静分区, 洁污分区, 服务核, 交通核, 暗厅, 暗卫, 明暗失衡, 开间进深比, 采光通风路径, 湿区干扰, 噪音外溢, 公私边界, 安稳性.',
    'Translate feng-shui form judgments into plain structural Chinese. Example meaning: 门对门导致视线和气流过直，隐私与安稳感变弱.',
    '',
    'Required infographic modules:',
    '1. Title: 户型问题诊断图 / HOME LAYOUT ISSUE DIAGNOSIS.',
    '2. Subtitle: Structure · Flow · Light · Feng Shui / Based on layout evidence only.',
    '3. Main floor-plan panel: a clear schematic floor plan, not a renovation rendering, with low-saturation zone colors and thin architectural lines.',
    '4. Direction box: show 方向假设：上北下南，左西右东，仅供结构分析参考.',
    `5. Numbered issue markers placed on exact plan locations: ${issue.markers.join(' / ')}.`,
    '6. 核心问题清单: show 4-6 short rows only. Format each row as 位置｜问题｜因果, but keep each cell 2-8 Chinese characters. No long sentences.',
    `7. 因果链: draw it as 3-4 arrow nodes. Use this meaning, but shorten visible text: ${issue.causeChain}`,
    `8. 优先级: show only three compact priority rows based on: ${issue.priority}`,
    `9. 低成本调整: show as 3 small icon cards. Use this meaning, but shorten visible text: ${issue.adjustment}`,
    '10. 验证与边界: show 7-21 天观察 with five icons only: 睡眠 / 潮湿 / 异味 / 杂物 / 动线.',
    `11. Bottom sentence: ${issue.bottomLine}`,
    '',
    'Text density contract:',
    'Readable text should be sparse and large. The whole image should contain headings, short labels, issue marker labels, short table cells, priority labels, and brand signature only.',
    'Do not render paragraph blocks. Do not render tiny body copy. Do not render dense tables. If information needs detail, use arrows, icons, color zones, check marks, line weights, and diagrams instead of text.',
    'Maximum visible Chinese body copy per non-title module: 2 short lines. Each short line should be under about 14 Chinese characters.',
    'The cause chain must look like icon node -> icon node -> icon node, not a paragraph.',
    'The issue list must look like a compact inspection checklist, not an article excerpt.',
    '',
    'Visual style:',
    'Premium architectural diagnosis report, restrained editorial information design, cream white, light gray, mist beige, muted gray-cafe, dark gray, deep navy, and controlled dark red issue markers.',
    'Use fine linework, soft blueprint texture, clear hierarchy, generous spacing, bilingual Chinese-English mix, elegant serif title, clean sans-serif body.',
    'Keep text large and readable. Use short labels and compact cards, not dense paragraphs or tiny fake microtext.',
    '',
    'Floor-plan drawing rules:',
    'Invent a plausible clean schematic plan matching the listed layout traits. Keep walls, doors, windows, balcony, kitchen, bathroom, bedrooms, living room, entry, and storage zones clear.',
    'The numbered problem markers must land on exact visible places on the plan. Use arrows and short callouts, not vague off-plan labels.',
    'Do not alter the structure as if remodeling. Only show diagnosis overlays and low-cost adjustment directions.',
    '',
    'Safety and content boundaries:',
    'Use a non-deterministic, non-fear-based educational boundary. Feng shui form language must explain structure, movement, light, moisture, noise and privacy, not fate.',
    '不要使用大吉、大凶、必灾、注定.',
    'Do not invent external roads, bridges, hospitals, schools, floor level, resident identity, medical outcomes, or legal/financial guarantees.',
    'Do not create a real estate poster, mystical talisman poster, horror red-black ad, cheap feng shui chart, or interior decoration rendering.',
    'Do not use fortune-telling props, lucky symbols, Bagua mirror sales graphics, charms, deities, crystal balls, or sensational language.',
    '',
    'Required in-image text:',
    'Text must be part of the generated image, readable, compact, and not added later.',
    '户型问题诊断图',
    'HOME LAYOUT ISSUE DIAGNOSIS',
    '核心问题清单',
    '因果链',
    '优先级',
    '低成本调整',
    '验证与边界',
    '7-21 天观察',
    '世界易 / 人生K线 · www.life-kline.com',
    'Keep the brand mark as a compact signature occupying about 4-7% of canvas.',
    '',
    'Output:',
    `Ratio ${ratio}, size ${size}, high-quality infographic, no transparent background.`,
  ].join('\n');
}

export function buildHomeLayoutDiagnosisVisualManifest(): VisualAssetManifest {
  const specs = buildAssetSpecs();

  return {
    batch: {
      id: HOME_LAYOUT_DIAGNOSIS_VISUAL_BATCH_ID,
      name: '户型问题诊断信息图 200 张',
      libraryKey: HOME_LAYOUT_DIAGNOSIS_LIBRARY_KEY,
      module: 'MINGLI',
      targetCount: specs.length,
      model: 'gpt-image-2',
      brandPackId: HOME_LAYOUT_DIAGNOSIS_BRAND_PACK_ID,
      meta: {
        purpose: 'Plan 200 home layout issue-diagnosis reference infographics for overseas Chinese users, covering mainstream residential floor-plan archetypes and common structural problems.',
        promptRole: '禅院宅居断事师｜户型问题诊断信息图顾问（问题导向版）',
        publishGate: 'manual_review_required',
        generationMode: 'manifest_only_until_visual_run',
        safetyBoundary: 'structure-first home layout education; no deterministic feng-shui claims; no invented external context',
      },
    },
    assets: specs.map((spec) => ({
      id: spec.id,
      assetType: 'home_layout_issue_infographic',
      module: 'MINGLI',
      slug: spec.slug,
      title: `${spec.layout.zh}｜${spec.issue.zh}诊断图`,
      description: `面向海外华人主流居住场景的${spec.layout.zh}问题导向信息图，重点诊断${spec.issue.zh}。`,
      size: spec.size,
      ratio: spec.ratio,
      quality: 'high',
      prompt: buildHomeLayoutDiagnosisVisualPrompt(spec),
      negativePrompt: [
        'cheap feng shui poster',
        'horror mysticism',
        'red black fear ad',
        'talisman',
        'lucky charm',
        'crystal ball',
        'fortune teller',
        'real estate sales poster',
        'renovation rendering',
        'unreadable microtext',
        'fake Chinese characters',
        'deterministic disaster claim',
        '大吉',
        '大凶',
        '必灾',
        '注定',
      ].join(', '),
      subject: `${spec.layout.en} floor-plan issue diagnosis focused on ${spec.issue.en}.`,
      userQuestion: 'What visible floor-plan problems should be diagnosed first, and what low-cost correction should be prioritized?',
      overlayCopySimplified: '户型问题诊断图',
      overlayCopyTraditional: '戶型問題診斷圖',
      overlayCopyEnglish: 'HOME LAYOUT ISSUE DIAGNOSIS',
      labelCopySimplified: ['入户', '动线', '采光', '通风', '厨卫', '卧室', '收纳', '优先级'],
      labelCopyTraditional: ['入戶', '動線', '採光', '通風', '廚衛', '臥室', '收納', '優先級'],
      ctaCopySimplified: '上传户型图，先看问题链',
      ctaCopyTraditional: '上傳戶型圖，先看問題鏈',
      mustShow: [
        'clear schematic floor plan with entry, windows, balcony, kitchen, bathroom, bedrooms, living room and storage zones',
        `numbered markers: ${spec.issue.markers.join(' / ')}`,
        'orientation assumption box',
        'core issue list with position, problem and cause',
        'cause-effect chain, priority and low-cost adjustment modules',
        '7-21 day verification and boundary note',
        'compact Life Kline / World Yi brand signature',
      ],
      mustAvoid: [
        'advantages or comfort-language module',
        'invented external environment',
        'deterministic fate or disaster claims',
        'dense unreadable paragraphs',
        'ancient talisman or cheap metaphysics style',
      ],
      layout: spec.ratio === '16:9'
        ? 'wide architectural diagnosis board: left 58% floor plan with numbered overlays, right 42% issue list, cause chain, priority and adjustment cards, bottom boundary strip'
        : 'vertical mobile diagnosis board: top title and direction box, middle large floor plan, lower stacked issue list, cause chain, priority, adjustment and boundary modules',
      targetRoutes: ['/tools/application-home-order', '/chat', '/visual-assets'],
      relatedContentSlugs: [],
      relatedToolSlugs: ['application-home-order'],
      relatedReportThemes: [
        'home_layout_diagnosis',
        'feng_shui_form',
        'movement_flow',
        'overseas_chinese_home',
        spec.issue.key,
      ],
      altText: `${spec.layout.zh}${spec.issue.zh}户型问题诊断信息图，包含方向假设、问题标注、因果链、优先级和低成本调整。`,
      meta: {
        layoutKey: spec.layout.key,
        issueKey: spec.issue.key,
        overseasRegion: spec.layout.region,
        rooms: spec.layout.rooms,
        ratioUse: spec.ratio === '16:9' ? 'desktop_article_and_tool_page' : 'mobile_social_and_chat_reference',
        exactDirectionAssumption: '方向假设：上北下南，左西右东，仅供结构分析参考',
        referenceOnly: true,
      },
    })),
  };
}
