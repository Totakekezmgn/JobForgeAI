import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { companies } = await request.json();

  if (!Array.isArray(companies)) {
    return NextResponse.json({ advice: "", error: "企業データの形式が不正です。" }, { status: 400 });
  }

  const invalid = validateText(JSON.stringify(companies ?? []), { max: LIMITS.longText, label: "企業データ" });
  if (invalid) return NextResponse.json({ advice: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ advice: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "suggest-next-actions");
    if (!usage.allowed) return NextResponse.json({ advice: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ advice: fallback(companies || []) });
  }

  const prompt = `
あなたはIT就活生向けの就活秘書AIです。
以下の企業管理データをもとに、今日やるべきタスクを現実的に提案してください。

企業データ:
${JSON.stringify(companies, null, 2)}

出力形式:
【今日の最優先タスク】
【30分でやるなら】
【1時間あるなら】
【後回しでいいもの】
【締切リスク】
【明日やること】

条件:
- 締切が近いものを優先
- 面接前は企業研究・想定質問・回答練習を優先
- ES前は志望動機・ガクチカ・自己PRを優先
- コーディングテスト前は問題演習を優先
- 具体的な行動に分解する
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
    return NextResponse.json({ advice: fallback(companies || []) });
  }

  const data = await response.json();

  return NextResponse.json({
    advice: data.output_text ?? fallback(companies || [])
  });
}

function fallback(companies: any[]) {
  if (!companies.length) {
    return `【今日の最優先タスク】
企業管理ページで、まず応募予定企業を3社登録してください。

【30分でやるなら】
1社だけ選び、締切日と次にやることを入力してください。

【1時間あるなら】
企業研究、ES、面接、コード対策のどれが必要かを分解してください。`;
  }

  const sorted = [...companies].sort((a, b) => String(a.deadline || "9999").localeCompare(String(b.deadline || "9999")));
  const top = sorted[0];

  return `【今日の最優先タスク】
${top.name} の対策を進めてください。

【30分でやるなら】
${top.nextAction || "次にやることを1つ決めて登録してください。"}

【1時間あるなら】
- 企業研究 15分
- 志望動機整理 20分
- 面接またはコード対策 25分

【締切リスク】
締切が近い企業から順に確認してください。`;
}
