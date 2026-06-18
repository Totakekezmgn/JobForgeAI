import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { companies } = await request.json();

  if (!Array.isArray(companies)) {
    return NextResponse.json({ advice: "", error: "企業リストの形式が不正です。" }, { status: 400 });
  }

  const invalid = validateText(JSON.stringify(companies ?? []), { max: LIMITS.longText, label: "企業リスト" });
  if (invalid) return NextResponse.json({ advice: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ advice: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "schedule-advice");
    if (!usage.allowed) return NextResponse.json({ advice: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ advice: fallback(companies || []) });
  }

  const prompt = `
あなたはIT就活生向けの就活秘書AIです。
以下の企業リストをもとに、今日やるべき優先順位を作ってください。

企業リスト:
${JSON.stringify(companies, null, 2)}

出力形式:
【今日の最優先】
【次にやること】
【後回しでよいこと】
【危険な締切】
【30分だけ使うなら何をするか】

注意:
- 現実的なタスクに分解する
- 締切が近いものを優先
- 面接前は企業研究と回答練習を優先
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) {
    return NextResponse.json({ advice: fallback(companies || []) });
  }

  const data = await response.json();
  return NextResponse.json({ advice: data.output_text ?? fallback(companies || []) });
}

function fallback(companies: any[]) {
  if (!companies.length) {
    return `【今日の最優先】
まず企業管理ページで応募予定企業を3社登録してください。

【次にやること】
各企業に締切日、選考状況、次にやることを設定します。

【30分だけ使うなら何をするか】
一番志望度が高い企業を1社選び、企業研究メモを作成してください。`;
  }

  const sorted = [...companies].sort((a, b) => String(a.deadline || "9999").localeCompare(String(b.deadline || "9999")));
  const top = sorted[0];

  return `【今日の最優先】
${top.name} の対策を進めてください。
締切・予定日: ${top.deadline || "未設定"}
次にやること: ${top.nextAction || "未設定"}

【次にやること】
- 企業研究を10分
- 志望動機を15分
- 面接またはコーディング対策を20分

【後回しでよいこと】
締切が遠い企業の細かい調査は後回しで構いません。

【危険な締切】
日付が近いものから順に確認してください。

【30分だけ使うなら何をするか】
${top.name} の志望動機を1分で話せる形に整えてください。`;
}
