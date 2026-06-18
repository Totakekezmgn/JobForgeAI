import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

type HistoryItem = {
  level: string;
  category: string;
  problem: string;
  answer: string;
  review: string;
};

const categoryOrder = ["文字列", "配列", "辞書", "全探索", "ソート", "累積和"];

export async function POST(request: Request) {
  const { history } = await request.json() as { history: HistoryItem[] };

  if (!Array.isArray(history)) {
    return NextResponse.json({ summary: [], recommended: [], roadmap: "", error: "学習履歴の形式が不正です。" }, { status: 400 });
  }

  const invalid = validateText(JSON.stringify(history ?? []), { max: LIMITS.longText, label: "学習履歴" });
  if (invalid) return NextResponse.json({ summary: [], recommended: [], roadmap: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ summary: [], recommended: [], roadmap: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "analyze-weakness");
    if (!usage.allowed) return NextResponse.json({ summary: [], recommended: [], roadmap: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  const summary = categoryOrder.map((category) => {
    const items = history.filter((item) => item.category === category);
    const count = items.length;
    const failSignals = items.filter((item) =>
      item.review.includes("改善") ||
      item.review.includes("不足") ||
      item.review.includes("バグ") ||
      item.review.includes("FAIL")
    ).length;

    return {
      category,
      count,
      weakScore: Math.max(0, 3 - count) + failSignals
    };
  }).sort((a, b) => b.weakScore - a.weakScore);

  const recommended = summary.slice(0, 3).map((item) => item.category);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      summary,
      recommended,
      roadmap: fallbackRoadmap(recommended)
    });
  }

  const prompt = `
あなたは日本のIT就活生向けのコーディングテスト講師です。
以下の学習履歴集計をもとに、次の7日間の学習ロードマップを作成してください。

条件:
- 初心者にも実行しやすい
- 1日30〜60分
- Python前提
- 企業のコーディングテスト対策向け
- 具体的な練習内容を書く

【集計】
${JSON.stringify(summary, null, 2)}

【優先カテゴリ】
${recommended.join(", ")}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt
    })
  });

  if (!response.ok) {
    return NextResponse.json({
      summary,
      recommended,
      roadmap: fallbackRoadmap(recommended)
    });
  }

  const data = await response.json();

  return NextResponse.json({
    summary,
    recommended,
    roadmap: data.output_text ?? fallbackRoadmap(recommended)
  });
}

function fallbackRoadmap(recommended: string[]) {
  const first = recommended[0] || "文字列";
  const second = recommended[1] || "配列";
  const third = recommended[2] || "辞書";

  return `【7日間ロードマップ】

Day 1: ${first}
- 基本文法を確認
- 初級問題を2問
- 解けなかった問題の模範解答を写経

Day 2: ${first}
- 条件分岐とループを使った問題を2問
- なぜその解法になるかを文章化

Day 3: ${second}
- 入力処理とリスト操作を復習
- 初級〜中級問題を2問

Day 4: ${second}
- 計算量を意識して解く
- O(N), O(N log N) の違いを確認

Day 5: ${third}
- 辞書・Counter・setを練習
- 頻度カウント問題を2問

Day 6: 総合演習
- ${first}, ${second}, ${third} を混ぜた問題を3問

Day 7: 模擬テスト
- 30分で2問
- 解けなかった問題をAIレビューにかける`;
}
