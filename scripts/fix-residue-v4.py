import sqlite3, re, random, sys

DB_PATH = "/home/life-kline-next/data/lifekline.db"

BRACED = {
    "${observation}": [
        "今年走的不是顺水大运", "近月有一处明显的转折",
        '所谓"卡住"主要是中宫力量不够', "你现在正处在一轮大运的换气期",
        "命宫主星太弱", "化忌冲", "空宫无主星", "禄存独坐",
    ],
    "${situation}": [
        "工作卡住", "钱的问题", "关系紧张", "健康焦虑",
    ],
    "${root_cause}": [
        "你过度依赖一种节奏", "你和环境的对位错了",
        "你并不在最适合自己的圈子里", "你这一年走的运不在正向",
        "你的生活和你的盘位对不上", "你该换一个行业而不是换一个城市",
    ],
    "${trigger}": [
        "对方拖延签字", "父母突然介入", "体检报告异常",
    ],
    "${certain}": [
        "你目前位置不会更差", "近 90 天内有一次窗口", "你身边人的助力是真实的",
    ],
    "${uncertain}": [
        "你具体能拿到的资源量", "对方那边的真实意图", "父母这边的态度变化",
    ],
    "${trait_a}": [
        "不利远行", "利财不利官", "动则有变",
    ],
    "${trait_b}": [
        "宜守不宜攻", "近贵远小人", "审慎签约",
    ],
    "${risk}": [
        "月初有口舌官非", "近期有破财", "健康亮黄灯",
    ],
    "${primary_action}": [
        "先把现有项目跑完，不要分心", "把家里的关系理顺一遍", "约一次身体检查",
    ],
    "${window}": [
        "本月 18 号到 25 号", "下月初的 7 天", "春节前 14 天",
    ],
    "${verdict}": [
        "可以稳一稳，不要急动", "可以推进，但要避开下个月初",
        "维持现状最好", "该断的要断了",
    ],
    "${next_year}": [
        "明年同期", "明年清明前", "后年才有下一次",
    ],
    "${time_window}": [
        "立春后一个月", "夏至前后", "中秋节那一周", "冬至前 10 天",
    ],
    "${topic}": [
        "八字命理", "紫微斗数", "面相手相", "风水布局", "姓名学", "梅花易数",
    ],
}

# Every known bare $ value that appears in DB bodies and needs its $ removed
BARE_VALUES = {
    # trait_a
    "不利远行", "利财不利官", "动则有变",
    # trait_b
    "宜守不宜攻", "近贵远小人", "审慎签约",
    # risk
    "月初有口舌官非", "近期有破财", "健康亮黄灯",
    # primary_action
    "先把现有项目跑完，不要分心", "把家里的关系理顺一遍", "约一次身体检查",
    # window
    "本月 18 号到 25 号", "下月初的 7 天", "春节前 14 天",
    # verdict
    "可以稳一稳，不要急动", "可以推进，但要避开下个月初", "维持现状最好", "该断的要断了",
    # next_year
    "明年同期", "明年清明前", "后年才有下一次",
    # time_window
    "立春后一个月", "夏至前后", "中秋节那一周", "冬至前 10 天",
    # certain
    "你目前位置不会更差", "近 90 天内有一次窗口", "你身边人的助力是真实的",
    # uncertain
    "你具体能拿到的资源量", "对方那边的真实意图", "父母这边的态度变化",
    # trigger
    "对方拖延签字", "父母突然介入", "体检报告异常",
    # situation
    "工作卡住", "钱的问题", "关系紧张", "健康焦虑",
    # observation
    "今年走的不是顺水大运", "近月有一处明显的转折",
    '所谓"卡住"主要是中宫力量不够', "你现在正处在一轮大运的换气期",
    "命宫主星太弱", "化忌冲", "空宫无主星", "禄存独坐",
    # root_cause
    "你过度依赖一种节奏", "你和环境的对位错了",
    "你并不在最适合自己的圈子里", "你这一年走的运不在正向",
    "你的生活和你的盘位对不上", "你该换一个行业而不是换一个城市",
    # Distractor / key / other fragments
    "表面的运势", "别人怎么看", "一时的情绪", "过去的经验",
    "你最近 3 个月的节奏", "你和家庭/合伙人的关系", "你自己的体能和睡眠",
    "你给到的命盘片段", "原岗位再扛 6 个月", "本城找机会", "维持现状到明年",
    "立刻跳槽", "出去自己干", "跨城市发展",
    "立刻辞职", "和对方摊牌", "搬家或者换城市",
    "手头的活", "日常作息", "一份明确的预算",
    "情绪化决策", "靠人情借钱", "突然换城市",
    "深夜签合同", "和长辈正面冲突", "接陌生项目",
    "一次法律咨询", "把存款转到稳定理财", "体检 + 减少熬夜",
    "暂停继续推进", "冷处理 3 天", "复诊确认",
    "出生时辰", "家里其他人的近况", "最近一次的健康指标",
    "完整大运流年", "命宫迁移宫细节", "配偶宫信息",
}

def count_all_patterns(body):
    return len(re.findall(r"\$\{[a-z_]+\}", body))

def fix_body(body):
    count = 0
    fixed = body

    # First: fix ${xxx} patterns
    for placeholder, options in BRACED.items():
        while placeholder in fixed:
            fixed = fixed.replace(placeholder, random.choice(options), 1)
            count += 1

    # Second: remove $ prefix from known bare values
    # Match $ followed by known Chinese text value
    # Sort by length descending to match longest first
    sorted_vals = sorted(BARE_VALUES, key=len, reverse=True)
    for val in sorted_vals:
        pattern = "$" + val
        if pattern in fixed:
            n = fixed.count(pattern)
            fixed = fixed.replace(pattern, val)
            count += n

    return fixed, count

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    cur = conn.cursor()

    # Find all rows with ${} or $bare
    pattern_sql = "%" + "${" + "%"
    cur.execute("SELECT id, body FROM forum_answers WHERE body LIKE ?", (pattern_sql,))
    rows = list(cur.fetchall())
    found_ids = {r[0] for r in rows}

    # Also find rows with bare $ values (without braces) that the first query missed
    # Query for any row containing $ followed by Chinese
    # We use a broader query: any $ that is not followed by { or digit
    cur.execute("SELECT id, body FROM forum_answers WHERE body LIKE '%'||char(36)||'%'")
    for row_id, body in cur:
        if row_id not in found_ids:
            # Check if it has bare $ patterns
            for val in BARE_VALUES:
                if ("$" + val) in body:
                    rows.append((row_id, body))
                    found_ids.add(row_id)
                    break

    if not rows:
        print("No broken answers found.")
        conn.close()
        return 0

    print(f"Found {len(rows)} answers with dollar patterns")

    total_replacements = 0
    fixed_count = 0

    for answer_id, body in rows:
        fixed_body, count = fix_body(body)
        if count > 0:
            cur.execute(
                "UPDATE forum_answers SET body = ? WHERE id = ?",
                (fixed_body, answer_id)
            )
            total_replacements += count
            fixed_count += 1

    conn.commit()

    # Verify: check for remaining ${} patterns
    cur.execute("SELECT COUNT(*) FROM forum_answers WHERE body LIKE ?", (pattern_sql,))
    remaining_braced = cur.fetchone()[0]

    # Check for remaining $bare patterns
    remaining_bare = 0
    for val in BARE_VALUES:
        cur.execute("SELECT COUNT(*) FROM forum_answers WHERE body LIKE ?", ("%" + "$" + val + "%",))
        remaining_bare += cur.fetchone()[0]

    print(f"Fixed {fixed_count} answers ({total_replacements} replacements)")
    print(f"Remaining unreplaced ${{}}: {remaining_braced}")
    print(f"Remaining $bare: {remaining_bare}")

    conn.close()
    return 0 if (remaining_braced == 0 and remaining_bare == 0) else 1

if __name__ == "__main__":
    sys.exit(main())
