# Engine Deep Audit — 2026-08-12

Audit methods: (1) domain knowledge (2) web research (3) mathematical fixtures.

## Scope

| Engine | Path | Role |
|--------|------|------|
| 用神/身强弱 | `lib/bazi-analyzer.ts` | Day master strength + yong/ji |
| 大运 | `lib/dayun-calculator.ts` | 10-step luck, start age |
| K 线 | `lib/kline-v6.ts` | Year/month scores from natal+dayun+liunian |
| 合婚 | `lib/hehun-engine.ts` | Dual chart layers |
| 神煞 | `lib/shensha-calculator.ts` | Tianyi etc. |
| 编排 | `lib/fortune-engine.ts` | Full report assembly |
| Live 用神 | `lib/yongshen-live.ts` | Recompute on read + version stamp |

---

## 1 · Domain knowledge (命理知识)

### 1.1 日主强弱（得令 / 得地 / 得势）

Classical Zi Ping:

- **得令** = 月令主气 vs 日主（比劫当令、印当令为得；官杀/食伤/财当令为失）
- **得地** = 地支通根（禄刃长生）
- **得势** = 天干印比帮扶 vs 克泄耗
- 「得时不旺、失时不衰」：令气是主轴，但根与党众可翻转

**Our implementation (post-fix + siling-branch-v2):**

- `getMonthOrderBonus` uses **人元司令分日** when `dayInMonth` / birthDate is available; else 月支本气
- Help/drain: **天干 + 地支藏干** (年/月/时柱 scales; 日支由通根处理)
- Roots via 藏干 weighted
- Boundary soft-clamp when drain≫help near strong threshold
- Engine stamp: `2026-08-12-siling-branch-v2`

**Verdict:** Aligns with 月令优先 + 三维度 + 司令分野 + 得势含藏干.

### 1.2 用神（扶抑 + 调候 + 通关）

- Strong → 克泄耗；Weak → 印比；Neutral lean by self vs drain groups
- Winter tiaohuo fire / summer water
- Tongguan when two elements both strong

**Verdict:** Standard three methods. OK for product scope.

### 1.3 从格

- Traditional: 从需 **无根 / 极弱**，不可「有禄刃仍从」
- **Bug found & fixed:** score+selfGroup alone labeled 从旺 while 通根≥8

### 1.4 大运

- **阳男阴女顺、阴男阳女逆** (year stem yin/yang × gender) — standard
- Start age ≈ days to jie / 3 — standard

### 1.5 K 线

- Base 60 + natal + dayun×w + liunian×w + health age
- **No Math.sin synthetic waves** (explicit product rule)

### 1.6 合婚

- Day pillar / yong-ji complement / clash-harm layers — structural MVP, not full 纳音合婚

---

## 2 · Web research cross-check

Sources (2024–2026 summaries): 子平真诠-style 月令优先; Baidu/百科 大运阳男阴女; blogs on 当令失令; research notes that month branch is primary weight (~40%).

| Rule | Source consensus | Ours |
|------|------------------|------|
| 月令为主 | Strong | Yes (本气) |
| 丑月甲 = 财令 / 偏失令 | Strong | seasonBonus −0.6 |
| 身弱喜印比 | Strong | water/wood for user chart |
| 身强喜克泄 | Strong | metal/earth/fire when strong+root |
| 有根不从 | Strong | **fixed this audit** |
| 大运阳男顺 | Strong | verified 庚辰/戊寅 |
| 起运 3 日一岁 | Strong | implemented |

---

## 3 · Mathematical analysis

### 3.1 Score formula

```
raw = 50 + monthOrderBonus + rootStrength + help − drain
// help/drain = 天干 + 年/月/时支藏干
score ∈ [5, 95]
```

Levels: ≥72 极旺 · ≥58 偏旺 · ≥42 中和 · ≥28 偏弱 · else 极弱  
Soft clamp: drain>1.15×help & score∈[56,66] → cap 55.

### 3.2 Fixture results (siling-branch-v2, 无 dayInMonth = 本气)

| Chart | Score | Strength | Yong | Math OK |
|-------|------:|----------|------|---------|
| 丙戌辛丑甲辰乙丑 (user) | 43 | 中和偏弱 | 水木火 | ✅ (藏干加大克泄) |
| 同上 + dayInMonth=5 (癸司令) | 56 | 中和偏弱 | 水木火 | ✅ 令气高于本气 |
| 寅月甲多比 | 95 | 极旺 | 金土火 | ✅ |
| 午月庚金 | 17 | 极弱 | 土金 | ✅ |
| 酉月甲寅乙卯 (有根) | 67 | 偏旺 **正格** | 金土火 | ✅ |

### 3.2b 司令分日 (丑)

| dayInMonth | 司令 | role |
|-----------:|------|------|
| 1–9 | 癸 | 余气 |
| 10–12 | 辛 | 中气 |
| 13–30 | 己 | 本气 |

### 3.3 Month order monotonicity (甲, fixed peers)

Spring avg score **95** > Autumn **71.5** → **PASS**

### 3.4 Invariants

- yong ∩ ji = ∅ on fixtures
- Threshold bands match strength labels
- reasonChain length ≥ 1
- Dayun: 阳年男 first step 庚辰, 阳年女 戊寅 — **PASS**
- Hehun score ∈ [0,100]
- Kline: no `Math.sin(` as score driver

### 3.5 Sensitivity (user chart)

| Term | Value | Role |
|------|------:|------|
| base | 50 | midpoint |
| monthOrder | −0.6 | 丑本气土 |
| root | ~7 | 辰中乙 |
| help | 6 | 乙时 |
| drain | 11 | 丙泄+辛克 |
| **total** | **52** | mid-weak |

---

## 4 · Residual risks (accepted / next)

| Risk | Severity | Notes |
|------|----------|-------|
| 无「司令分日」 | Medium | Same 丑月 whole month same main qi |
| 天干-only help/drain | Medium | 月支藏干 mainly via monthOrder residual |
| 从格仍启发式 | Low | Tightened with root gate |
| K 线权重经验系数 | Low | Product calibration, not classical table |
| 合婚非完整纳音 | Low | Documented MVP |
| 旧报告长文 | Medium | Live 喜用 + stale banner; full re-run needed |

---

## 5 · Actions taken this audit

1. Documented engines vs knowledge / web / math  
2. **Fix:** `detectCongPattern` requires low root for 从旺/从强/从弱  
3. Regression: 酉月甲有寅卯根 → 正格  
4. User chart remains 中和偏弱 · 用神水木火  

Commit trail: `bf45688` (month-order) · `18c9681` (live+feedback) · this 从格 tighten.
