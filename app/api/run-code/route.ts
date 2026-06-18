import { NextResponse } from "next/server";
import { simplePythonLikeJudge, TestCase } from "@/lib/simpleJudge";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { code, tests } = await request.json() as { code: string; tests: TestCase[] };

  if (!Array.isArray(tests)) {
    return NextResponse.json({ ok: false, results: [], error: "テストケースの形式が不正です。" }, { status: 400 });
  }

  const invalid =
    validateText(code, { required: true, max: LIMITS.longText, label: "コード" }) ||
    validateText(JSON.stringify(tests ?? []), { required: true, max: LIMITS.longText, label: "テストケース" });
  if (invalid) return NextResponse.json({ ok: false, results: [], error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ ok: false, results: [], error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "run-code");
    if (!usage.allowed) return NextResponse.json({ ok: false, results: [], error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  const mode = process.env.CODE_RUNNER_MODE || "simple";

  if (mode === "piston") {
    return runWithPiston(code, tests);
  }

  if (mode === "judge0") {
    return runWithJudge0(code, tests);
  }

  return NextResponse.json({
    ok: true,
    mode: "simple",
    results: simplePythonLikeJudge(code, tests)
  });
}

async function runWithPiston(code: string, tests: TestCase[]) {
  const endpoint = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";
  const results = [];

  for (const test of tests) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "python",
          version: "3.10.0",
          files: [{ name: "main.py", content: code }],
          stdin: test.input
        })
      });

      const data = await response.json();
      const actual = String(data.run?.stdout ?? "").trim();
      const stderr = String(data.run?.stderr ?? "").trim();

      results.push({
        input: test.input,
        expected: test.expected.trim(),
        actual,
        stderr,
        passed: actual === test.expected.trim(),
        note: test.note
      });
    } catch (error) {
      results.push({
        input: test.input,
        expected: test.expected.trim(),
        actual: "",
        stderr: "Piston execution failed.",
        passed: false,
        note: test.note
      });
    }
  }

  return NextResponse.json({ ok: true, mode: "piston", results });
}

async function runWithJudge0(code: string, tests: TestCase[]) {
  const endpoint = process.env.JUDGE0_API_URL;
  const apiKey = process.env.JUDGE0_API_KEY;

  if (!endpoint) {
    return NextResponse.json({
      ok: false,
      mode: "judge0",
      message: "JUDGE0_API_URL is not configured.",
      results: simplePythonLikeJudge(code, tests)
    }, { status: 400 });
  }

  const results = [];

  for (const test of tests) {
    try {
      const response = await fetch(`${endpoint}/submissions?base64_encoded=false&wait=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-RapidAPI-Key": apiKey } : {})
        },
        body: JSON.stringify({
          source_code: code,
          language_id: 71,
          stdin: test.input
        })
      });

      const data = await response.json();
      const actual = String(data.stdout ?? "").trim();
      const stderr = String(data.stderr ?? data.compile_output ?? "").trim();

      results.push({
        input: test.input,
        expected: test.expected.trim(),
        actual,
        stderr,
        passed: actual === test.expected.trim(),
        note: test.note
      });
    } catch {
      results.push({
        input: test.input,
        expected: test.expected.trim(),
        actual: "",
        stderr: "Judge0 execution failed.",
        passed: false,
        note: test.note
      });
    }
  }

  return NextResponse.json({ ok: true, mode: "judge0", results });
}
