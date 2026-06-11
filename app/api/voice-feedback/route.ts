import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const body = await request.json();
  const { company, role, question, transcript, duration, volume, localAnalysis } = body;

  const invalid =
    validateText(question, { max: LIMITS.question, label: "質問" }) ||
    validateText(transcript, { required: true, max: LIMITS.answer, label: "文字起こし" });
  if (invalid) return NextResponse.json({ feedback: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ feedback: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "voice-feedback");
    if (!usage.allowed) return NextResponse.json({ feedback: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ feedback: fallback(transcript, localAnalysis) });

  const prompt = `
あなたはIT就活生向けの面接コーチです。
以下の音声面接結果をもとに、面接で改善すべき話し方と回答内容を分析してください。

企業名: ${company}
職種: ${role}
質問: ${question}

文字起こし:
${transcript}

簡易音声指標:
- 発話時間: ${duration}秒
- 音量レベル: ${volume}
- ローカル分析:
${localAnalysis}

出力形式:
【総合評価】
【回答内容の良い点】
【回答内容の改善点】
【話し方の改善点】
【ハキハキ度】
【抑揚・アクセントに関する注意】
【改善後の回答例】
【次の練習メニュー】

注意:
- 音声特徴量は簡易指標なので断定しない
- 就活面接で実践しやすい助言にする
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) return NextResponse.json({ feedback: fallback(transcript, localAnalysis) });
  const data = await response.json();
  return NextResponse.json({ feedback: data.output_text ?? fallback(transcript, localAnalysis) });
}

function fallback(transcript: string, localAnalysis: string) {
  return `${localAnalysis}

【回答内容の簡易フィードバック】
${transcript ? "回答は取得できています。次は、結論→理由→具体例→企業との接続の順番に整えると面接で伝わりやすくなります。" : "文字起こしが取得できていません。マイク許可とブラウザ対応を確認してください。"}

【話し方の改善】
- 最初の一文を短くする
- 語尾を言い切る
- 重要な言葉の前に一拍置く
- 早口にならないようにする
- 声量を一定に保つ`;
}
