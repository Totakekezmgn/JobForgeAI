import { NextResponse } from "next/server";
import { fallbackProblem } from "@/lib/fallback";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { level, category } = await request.json();

  const invalid =
    validateText(level, { max: LIMITS.shortText, label: "難易度" }) ||
    validateText(category, { max: LIMITS.shortText, label: "カテゴリ" });
  if (invalid) return NextResponse.json({ problem: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ problem: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "generate-problem");
    if (!usage.allowed) return NextResponse.json({ problem: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ problem: fallbackProblem, source: "fallback" });

  const prompt = `
あなたは日本のIT就活生向けのコーディングテスト講師です。
以下の条件でPython向けの標準入力問題を1問作ってください。

難易度: ${level}
カテゴリ: ${category}

出力形式:
【問題】
【入力例】
【出力例】
【条件】
【考え方のヒント】
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) return NextResponse.json({ problem: fallbackProblem, source: "fallback_after_error" });
  const data = await response.json();
  return NextResponse.json({ problem: data.output_text ?? fallbackProblem, source: "openai" });
}
