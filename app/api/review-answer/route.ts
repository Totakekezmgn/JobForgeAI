import { NextResponse } from "next/server";
import { fallbackReview } from "@/lib/fallback";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { problem, answer, testResults } = await request.json();

  const invalid =
    validateText(problem, { required: true, max: LIMITS.longText, label: "問題" }) ||
    validateText(answer, { required: true, max: LIMITS.longText, label: "回答コード" });
  if (invalid) return NextResponse.json({ review: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ review: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "review-answer");
    if (!usage.allowed) return NextResponse.json({ review: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ review: fallbackReview, source: "fallback" });

  const prompt = `
あなたは日本のIT就活生向けのコーディングテスト講師です。
問題、回答コード、テスト結果をもとに採点してください。

含める内容:
- 100点満点の点数
- 良い点
- バグ・不足点
- 計算量
- 改善方針
- 模範解答
- 次に学ぶべきこと

【問題】
${problem}

【回答】
${answer}

【テスト結果】
${JSON.stringify(testResults ?? [], null, 2)}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) return NextResponse.json({ review: fallbackReview, source: "fallback_after_error" });
  const data = await response.json();
  return NextResponse.json({ review: data.output_text ?? fallbackReview, source: "openai" });
}
