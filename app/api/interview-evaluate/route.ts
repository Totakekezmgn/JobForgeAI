import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

/**
 * 検証分離(Verification Separation)による面接回答の独立評価。
 *
 * 設計意図:
 * 「質問生成」と「回答評価」を同じプロンプトでやると、モデルは自分の文脈に
 * 引きずられて評価が甘くなる(自己批判の弱さ)。このルートは評価専用で、
 * 生成側の文脈を一切受け取らず、「質問・回答・ルーブリック」だけで採点する。
 *
 * 音声面接の場合は voiceMetrics(発話時間・音量など)も評価材料に加える。
 */
export async function POST(request: Request) {
  const { question, answer, company, role, keywords, voiceMetrics } = await request.json();

  const invalid =
    validateText(question, { required: true, max: LIMITS.question, label: "質問" }) ||
    validateText(answer, { required: true, max: LIMITS.answer, label: "回答" });
  if (invalid) return NextResponse.json({ ok: false, error: invalid }, { status: 400 });

  // サーバーサイド無料枠チェック(ログイン済みのみ。未ログインは回数管理できないため拒否)
  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ ok: false, mode: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "interview-evaluate");
    if (!usage.allowed) {
      return NextResponse.json(
        { ok: false, error: `本日の無料枠(${usage.limit}回)を使い切りました。`, usage },
        { status: 429 }
      );
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: true, evaluation: fallbackEvaluation(), source: "fallback" });
  }

  // 評価者には「何を評価するか」だけを渡す。改善案の生成はさせない(役割分離)。
  const rubricKeywords: string[] = Array.isArray(keywords) ? keywords : [];

  const prompt = `
あなたは日本のIT企業の採用面接官です。以下の回答を厳密に採点してください。
あなたの役割は採点のみです。改善案や模範解答は書かないでください。

企業: ${company || "不明"}
職種: ${role || "不明"}
質問: ${question}

回答:
${answer}
${voiceMetrics ? `\n音声指標(参考。断定材料にしない):\n${JSON.stringify(voiceMetrics)}` : ""}

採点ルーブリック(各0-5点):
1. structure: 結論ファーストで構成されているか
2. specificity: 具体的なエピソード・数字があるか
3. relevance: 質問に正面から答えているか
4. company_fit: 企業・職種との接続があるか
5. depth_resistance: 「なぜ?」と深掘りされても破綻しない根拠があるか
${rubricKeywords.length > 0 ? `6. keyword_coverage: 次のキーワードをどの程度カバーしているか: ${rubricKeywords.join("、")}` : ""}

必ず次のJSON形式のみで出力してください(前置き・コードブロック禁止):
{
  "scores": { "structure": 0, "specificity": 0, "relevance": 0, "company_fit": 0, "depth_resistance": 0${rubricKeywords.length > 0 ? ', "keyword_coverage": 0' : ""} },
  "total": 0,
  "verdict": "pass" または "borderline" または "fail",
  "covered_keywords": [],
  "missing_keywords": [],
  "weakest_point": "最も弱い観点とその理由を1文で",
  "probing_question": "面接官として次に深掘りする質問を1つ"
}
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
    return NextResponse.json({ ok: true, evaluation: fallbackEvaluation(), source: "fallback_after_error" });
  }

  const data = await response.json();
  const raw: string = data.output_text ?? "";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(cleaned);
    return NextResponse.json({ ok: true, evaluation, source: "openai" });
  } catch {
    // JSONとして読めない場合も原文を返し、クライアント側で表示できるようにする
    return NextResponse.json({ ok: true, evaluation: { raw }, source: "openai_unparsed" });
  }
}

function fallbackEvaluation() {
  return {
    scores: { structure: 0, specificity: 0, relevance: 0, company_fit: 0, depth_resistance: 0 },
    total: 0,
    verdict: "borderline",
    covered_keywords: [],
    missing_keywords: [],
    weakest_point: "OPENAI_API_KEY未設定のため自動採点できません。",
    probing_question: "結論→具体例→学び→企業との接続の順で話せていますか?"
  };
}
