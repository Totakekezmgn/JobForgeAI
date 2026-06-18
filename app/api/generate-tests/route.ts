import { NextResponse } from "next/server";
import { fallbackTests } from "@/lib/fallback";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { problem } = await request.json();

  const invalid = validateText(problem, { required: true, max: LIMITS.longText, label: "問題" });
  if (invalid) return NextResponse.json({ tests: [], error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ tests: [], error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "generate-tests");
    if (!usage.allowed) return NextResponse.json({ tests: [], error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

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
