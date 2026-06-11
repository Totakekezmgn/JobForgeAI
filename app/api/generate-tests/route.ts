import { NextResponse } from "next/server";
import { fallbackTests } from "@/lib/fallback";

export async function POST(request: Request) {
  const { problem } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ tests: fallbackTests, source: "fallback" });
  }

  const prompt = `
以下のコーディングテスト問題に対して、検証用テストケースを3つ作ってください。
必ずJSONのみで返してください。
形式:
[
  {"input":"...", "expected":"...", "note":"..."}
]

【問題】
${problem}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) return NextResponse.json({ tests: fallbackTests, source: "fallback_after_error" });

  const data = await response.json();
  try {
    return NextResponse.json({ tests: JSON.parse(data.output_text), source: "openai" });
  } catch {
    return NextResponse.json({ tests: fallbackTests, source: "fallback_after_parse_error" });
  }
}
