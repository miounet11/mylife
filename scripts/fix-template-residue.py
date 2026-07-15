#!/usr/bin/env python3
"""Fix unreplaced template placeholders in forum_answers body text."""

import sqlite3
import random
import re
import sys

DB_PATH = "/home/life-kline-next/data/lifekline.db"

# Same replacement pools as generator.ts
REPLACEMENTS = {
    "{observation}": [
        "今年走的不是顺水大运", "近月有一处明显的转折",
        "所谓\"卡住\"主要是中宫力量不够", "你现在正处在一轮大运的换气期",
        "命宫主星太弱", "化忌冲", "空宫无主星", "禄存独坐",
    ],
    "{situation}": [
        "工作卡住", "钱的问题", "关系紧张", "健康焦虑",
    ],
    "{root_cause}": [
        "你过度依赖一种节奏", "你和环境的对位错了",
        "你并不在最适合自己的圈子里", "你这一年走的运不在正向",
        "你的生活和你的盘位对不上", "你该换一个行业而不是换一个城市",
    ],
    "{trigger}": [
        "对方拖延签字", "父母突然介入", "体检报告异常",
    ],
    "{certain}": [
        "你目前位置不会更差", "近 90 天内有一次窗口", "你身边人的助力是真实的",
    ],
    "{uncertain}": [
        "你具体能拿到的资源量", "对方那边的真实意图", "父母这边的态度变化",
    ],
    "{trait_a}": [
        "不利远行", "利财不利官", "动则有变",
    ],
    "{trait_b}": [
        "宜守不宜攻", "近贵远小人", "审慎签约",
    ],
    "{risk}": [
        "月初有口舌官非", "近期有破财", "健康亮黄灯",
    ],
    "{primary_action}": [
        "先把现有项目跑完，不要分心", "把家里的关系理顺一遍", "约一次身体检查",
    ],
    "{window}": [
        "本月 18 号到 25 号", "下月初的 7 天", "春节前 14 天",
    ],
    "{verdict}": [
        "可以稳一稳，不要急动", "可以推进，但要避开下个月初",
        "维持现状最好", "该断的要断了",
    ],
    "{next_year}": [
        "明年同期", "明年清明前", "后年才有下一次",
    ],
    "{time_window}": [
        "立春后一个月", "夏至前后", "中秋节那一周", "冬至前 10 天",
    ],
    "{topic}": [
        "八字命理", "紫微斗数", "面相手相", "风水布局", "姓名学", "梅花易数",
    ],
}

def fix_body(body):
    """Replace all unreplaced template placeholders with random values."""
    if not body:
        return body, 0
    count = 0
    fixed = body
    for placeholder, options in REPLACEMENTS.items():
        while placeholder in fixed:
            fixed = fixed.replace(placeholder, random.choice(options), 1)
            count += 1
    return fixed, count

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    cur = conn.cursor()

    pattern = "%" + "${" + "%"
    cur.execute("SELECT id, body FROM forum_answers WHERE body LIKE ?", (pattern,))
    rows = cur.fetchall()

    if not rows:
        print("No broken answers found.")
        conn.close()
        return

    print(f"Found {len(rows)} answers with unreplaced placeholders")
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

    # Verify
    cur.execute("SELECT COUNT(*) FROM forum_answers WHERE body LIKE ?", (pattern,))
    remaining = cur.fetchone()[0]
    print(f"Fixed {fixed_count} answers ({total_replacements} replacements)")
    print(f"Remaining unreplaced: {remaining}")

    if remaining > 0:
        cur.execute("SELECT id, body FROM forum_answers WHERE body LIKE ? LIMIT 3", (pattern,))
        print("Sample remaining:")
        for r in cur.fetchall():
            # Show only the placeholder parts
            matches = re.findall(r"\$\{[a-z_]+\}", r[1])
            print(f"  {r[0]}: {matches}")

    conn.close()
    return 0 if remaining == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
