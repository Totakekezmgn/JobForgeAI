import { NextResponse } from "next/server";
import { fallbackProblem } from "@/lib/fallback";

export async function POST(request: Request) {
  const { level, category } = await request.json();

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
