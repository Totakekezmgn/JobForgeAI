import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

/**
 * v2.6変更: このルートは「生成専用」になった。
 * 旧版は想定質問の生成と回答の評価を1プロンプトで行っていたが、
 * 評価は /api/interview-evaluate(独立コンテキスト)に分離した。
 */
export async function POST(request: Request) {
  const { company, role, mode } = await request.json();

  const invalid =
    validateText(company, { max: LIMITS.shortText, label: "企業名" }) ||
    validateText(role, { max: LIMITS.shortText, label: "職種" }) ||
    validateText(mode, { max: LIMITS.shortText, label: "面接段階" });
  if (invalid) return NextResponse.json({ result: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ result: "", mode: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "interview-sim");
    if (!usage.allowed) {
      return NextResponse.json(
        { result: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。`, usage },
        { status: 429 }
      );
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ result: fallback(company, role, mode) });
  }

  const prompt = `
あなたは日本のIT就活生を支援する面接コーチです。
以下の条件で面接の準備資料を作成してください。
回答の評価・採点はこの依頼に含まれません(別工程で行います)。

企業名: ${company}
職種: ${role}
面接段階: ${mode}

出力形式:
【想定質問 5問】
【各質問の意図】
【回答を組み立てる際のポイント】
【この企業ならではの注意点】

注意:
- 断定しすぎない
- 学生が面接で自然に話せる表現にする
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) return NextResponse.json({ result: fallback(company, role, mode) });

  const data = await response.json();
  return NextResponse.json({ result: data.output_text ?? fallback(company, role, mode) });
}

function fallback(company: string, role: string, mode: string) {
  return `【想定質問 5問】
1. ${company || "この企業"}を志望する理由を教えてください。
2. ${role || "志望職種"}で活かせるあなたの強みは何ですか。
3. 学生時代に最も力を入れたことを教えてください。
4. チームで困難を乗り越えた経験はありますか。
5. 入社後にどのように成長したいですか。

【各質問の意図】
- 1は企業理解の深さ、2は自己分析、3-4は再現性のある行動特性、5はキャリア観を見ています。

【回答を組み立てる際のポイント】
- 結論→具体例→学び→企業との接続の順番で話す
- 数字や固有名詞で具体性を出す
- 1分版と3分版を用意する

【この企業ならではの注意点】
- ${mode || "面接"}では深掘りに備えて「なぜ」を3回自問しておく`;
}
