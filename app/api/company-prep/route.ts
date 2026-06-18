import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { company, role, level } = await request.json();

  const invalid =
    validateText(company, { max: LIMITS.shortText, label: "企業名" }) ||
    validateText(role, { max: LIMITS.shortText, label: "職種" }) ||
    validateText(level, { max: LIMITS.shortText, label: "現在レベル" });
  if (invalid) return NextResponse.json({ plan: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ plan: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "company-prep");
    if (!usage.allowed) return NextResponse.json({ plan: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      plan: fallbackPlan(company, role, level)
    });
  }

  const prompt = `
あなたは日本のIT就活生向けのコーディングテスト対策講師です。
以下の条件で、企業別コーディングテスト対策プランを作成してください。

企業名: ${company}
職種: ${role}
現在レベル: ${level}

注意:
- 企業の実際の過去問を断定しない
- 公開情報がない場合は、一般的なIT企業の傾向として推定と明記
- Pythonで対策する前提
- 初学者にも実行可能な内容
- コピーではなく、学習戦略として出す

出力形式:
【前提】
【出題されやすいカテゴリ推定】
【優先して練習すべき内容】
【模擬問題セット 5問】
【7日間対策スケジュール】
【面接で説明できる学習方針】
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
      plan: fallbackPlan(company, role, level)
    });
  }

  const data = await response.json();

  return NextResponse.json({
    plan: data.output_text ?? fallbackPlan(company, role, level)
  });
}

function fallbackPlan(company: string, role: string, level: string) {
  return `【前提】
${company || "対象企業"}の${role || "開発職"}向け対策です。
実際の過去問を断定せず、一般的なIT企業のコーディングテスト傾向として対策します。
現在レベルは「${level || "初級"}」として設計します。

【出題されやすいカテゴリ推定】
1. 文字列処理
2. 配列・リスト操作
3. 辞書・頻度カウント
4. 全探索
5. ソート

【優先して練習すべき内容】
- 標準入力の処理
- for文とif文の組み合わせ
- Counter・dict・set
- O(N)で解く意識
- 解法を言語化する練習

【模擬問題セット 5問】
1. 文字列の中で最も多い文字を出力
2. N個の整数の中から重複を除いた個数を出力
3. 商品名と個数のペアを集計
4. 条件を満たす組み合わせを全探索
5. 数列をソートして中央値を出力

【7日間対策スケジュール】
Day 1: 標準入力・文字列処理
Day 2: 配列とループ
Day 3: 辞書・Counter
Day 4: 全探索
Day 5: ソート
Day 6: 30分模擬テスト
Day 7: 解けなかった問題の復習と説明練習

【面接で説明できる学習方針】
私は、コーディングテスト対策として、まず標準入力・配列・辞書・全探索といった基礎頻出分野を優先して学習しています。
単に解答を暗記するのではなく、なぜその計算量で解けるのか、どのデータ構造を使うべきかを説明できるように練習しています。`;
}
