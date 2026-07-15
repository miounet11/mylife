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

# Dollar-without-braces patterns: these are truncated versions of braced placeholders
# that got into the DB when the generator replace chain was incomplete.
# We need to match $word tokens that are followed by Chinese text or end-of-line
# and replace them with the same pool as the braced version.
BARE_MAP = {
    "$利财不利官": "${trait_a}",
    "$不利远行": "${trait_a}",
    "$动则有变": "${trait_a}",
    "$宜守不宜攻": "${trait_b}",
    "$近贵远小人": "${trait_b}",
    "$审慎签约": "${trait_b}",
    "$月初有口舌官非": "${risk}",
    "$近期有破财": "${risk}",
    "$健康亮黄灯": "${risk}",
    "$先把现有项目跑完，不要分心": "${primary_action}",
    "$把家里的关系理顺一遍": "${primary_action}",
    "$约一次身体检查": "${primary_action}",
    "$本月 18 号到 25 号": "${window}",
    "$下月初的 7 天": "${window}",
    "$春节前 14 天": "${window}",
    "$可以稳一稳，不要急动": "${verdict}",
    "$可以推进，但要避开下个月初": "${verdict}",
    "$维持现状最好": "${verdict}",
    "$该断的要断了": "${verdict}",
    "$明年同期": "${next_year}",
    "$明年清明前": "${next_year}",
    "$后年才有下一次": "${next_year}",
    "$立春后一个月": "${time_window}",
    "$夏至前后": "${time_window}",
    "$中秋节那一周": "${time_window}",
    "$冬至前 10 天": "${time_window}",
    "$你目前位置不会更差": "${certain}",
    "$近 90 天内有一次窗口": "${certain}",
    "$你身边人的助力是真实的": "${certain}",
    "$你具体能拿到的资源量": "${uncertain}",
    "$对方那边的真实意图": "${uncertain}",
    "$父母这边的态度变化": "${uncertain}",
    "$对方拖延签字": "${trigger}",
    "$父母突然介入": "${trigger}",
    "$体检报告异常": "${trigger}",
    "$工作卡住": "${situation}",
    "$钱的问题": "${situation}",
    "$关系紧张": "${situation}",
    "$健康焦虑": "${situation}",
    "$今年走的不是顺水大运": "${observation}",
    "$近月有一处明显的转折": "${observation}",
    '$所谓"卡住"主要是中宫力量不够': "${observation}",
    "$你现在正处在一轮大运的换气期": "${observation}",
    "$命宫主星太弱": "${observation}",
    "$化忌冲": "${observation}",
    "$空宫无主星": "${observation}",
    "$禄存独坐": "${observation}",
    "$你过度依赖一种节奏": "${root_cause}",
    "$你和环境的对位错了": "${root_cause}",
    "$你并不在最适合自己的圈子里": "${root_cause}",
    "$你这一年走的运不在正向": "${root_cause}",
    "$你的生活和你的盘位对不上": "${root_cause}",
    "$你该换一个行业而不是换一个城市": "${root_cause}",
}

def count_all_patterns(body):
    """Count ALL ${} patterns in body."""
    return len(re.findall(r"\$\{[a-z_]+\}", body))

def fix_body(body):
    count = 0
    fixed = body

    # First: fix ${xxx} patterns
    for placeholder, options in BRACED.items():
        while placeholder in fixed:
            fixed = fixed.replace(placeholder, random.choice(options), 1)
            count += 1

    # Second: fix $bare patterns (dollar without braces)
    # These are the actual replacement values that got left with a $ prefix
    # Sort by length descending to match longest first
    bare_keys = sorted(BARE_MAP.keys(), key=len, reverse=True)
    for bare_key in bare_keys:
        if bare_key in fixed:
            # Count how many times
            n = fixed.count(bare_key)
            if n > 0:
                # Replace ALL occurrences of this bare key
                # The bare key IS the actual text, just with a $ prefix
                # So we remove the $ prefix (keep the text)
                fixed_text = bare_key[1:]  # remove the $
                fixed = fixed.replace(bare_key, fixed_text)
                count += n

    return fixed, count

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    cur = conn.cursor()

    pattern_sql = "%" + "${" + "%"
    cur.execute("SELECT id, body FROM forum_answers WHERE body LIKE ?", (pattern_sql,))
    rows = cur.fetchall()

    if not rows:
        print("No broken answers found.")
        conn.close()
        return 0

    print(f"Found {len(rows)} answers with unreplaced placeholders")

    # Show current patterns
    pattern_counts = {}
    bare_counts = {}
    for _, body in rows:
        for m in re.findall(r"\$\{[a-z_]+\}", body):
            pattern_counts[m] = pattern_counts.get(m, 0) + 1
        for bk in BARE_MAP:
            n = body.count(bk)
            if n > 0:
                bare_counts[bk] = bare_counts.get(bk, 0) + n
    print("${} patterns in DB:")
    for p, c in sorted(pattern_counts.items(), key=lambda x: -x[1]):
        print(f"  {p}: {c}")
    print("$bare patterns in DB:")
    for p, c in sorted(bare_counts.items(), key=lambda x: -x[1])[:20]:
        print(f"  {p}: {c}")

    total_replacements = 0
    fixed_count = 0

    for answer_id, body in rows:
        before_count = count_all_patterns(body)
        if before_count == 0:
            continue
        fixed_body, count = fix_body(body)
        if count > 0:
            cur.execute(
                "UPDATE forum_answers SET body = ? WHERE id = ?",
                (fixed_body, answer_id)
            )
            total_replacements += count
            fixed_count += 1
            after_count = count_all_patterns(fixed_body)
            if after_count > 0:
                print(f"WARNING: {answer_id} still has {after_count} patterns after fix")

    conn.commit()

    # Verify: check for remaining ${} patterns
    cur.execute("SELECT COUNT(*) FROM forum_answers WHERE body LIKE ?", (pattern_sql,))
    remaining = cur.fetchone()[0]
    print(f"\nFixed {fixed_count} answers ({total_replacements} replacements)")
    print(f"Remaining unreplaced ${{}}: {remaining}")

    if remaining > 0:
        cur.execute("SELECT id, body FROM forum_answers WHERE body LIKE ? LIMIT 5", (pattern_sql,))
        print("Sample remaining:")
        for r in cur.fetchall():
            matches = re.findall(r"\$\{[a-z_]+\}", r[1])
            print(f"  {r[0]}: {matches}")

    conn.close()
    return 0 if remaining == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
