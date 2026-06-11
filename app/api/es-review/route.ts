import { NextResponse } from "next/server";
import { getVerifiedUser, checkAndCountUsage } from "@/lib/serverAuth";
import { validateText, LIMITS } from "@/lib/validate";

export async function POST(request: Request) {
  const { companyName, documentType, content, limit } = await request.json();

  const invalid =
    validateText(companyName, { max: LIMITS.shortText, label: "企業名" }) ||
    validateText(content, { required: true, max: LIMITS.answer, label: "ES本文" });
  if (invalid) return NextResponse.json({ review: "", error: invalid }, { status: 400 });

  const user = await getVerifiedUser(request);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!user) return NextResponse.json({ review: "", error: "login_required" }, { status: 401 });
    const usage = await checkAndCountUsage(user.id, "es-review");
    if (!usage.allowed) return NextResponse.json({ review: "", error: `本日の無料枠(${usage.limit}回)を使い切りました。` }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ review: fallback(companyName, documentType, content, limit) });
  }

  const prompt = `
あなたはIT就活生向けのES添削担当です。
以下の文章を、企業に提出できる水準まで改善してください。

企業名: ${companyName || "未指定"}
文書タイプ: ${documentType}
文字数目安: ${limit || "指定なし"}文字

本文:
${content}

出力形式:
【総合評価】
【良い点】
【弱い点】
【改善方針】
【改善後の文章】
【面接で深掘りされそうな質問】
【次にやること】

条件:
- 学生本人の言葉として自然にする
- 盛りすぎない
- 抽象論を減らして具体化する
- ITエンジニア志望として使える表現にする
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
    return NextResponse.json({ review: fallback(companyName, documentType, content, limit) });
  }

  const data = await response.json();
  return NextResponse.json({ review: data.output_text ?? fallback(companyName, documentType, content, limit) });
}

function fallback(companyName: string, documentType: string, content: string, limit: string) {
  return `【総合評価】
${documentType || "ES文書"}の土台は作れています。次は、抽象的な表現を減らして、経験・行動・結果・学びを具体化すると良くなります。

【良い点】
- 自分の経験をもとに書こうとしている点
- IT就活に使える材料になっている点

【弱い点】
- 企業との接続が弱い可能性があります。
- 結論が長い場合、面接官に伝わりづらくなります。
- 成果や行動が具体的でないと印象に残りにくいです。

【改善方針】
1. 最初に結論を書く
2. 具体的な経験を書く
3. その経験から得た学びを書く
4. ${companyName || "企業"}でどう活かすかを書く

【改善後の文章】
私は、課題を見つけて改善に向けて行動する力を強みとしています。
これまでの経験では、現場で発生している不便さに気づき、周囲の状況を観察しながら改善案を考えることを意識してきました。
この経験から、単に与えられた作業をこなすだけでなく、利用者やチームにとってより良い形を考える姿勢を学びました。
今後はこの姿勢を活かし、${companyName || "貴社"}でエンジニアとして、ユーザーや事業の課題解決に貢献したいです。

【面接で深掘りされそうな質問】
- なぜその課題に気づいたのですか。
- 周囲をどう巻き込みましたか。
- その経験をエンジニア職でどう活かしますか。

【次にやること】
${limit ? `${limit}文字以内に収まるように削る作業をしてください。` : "文字数指定がある場合は、指定文字数に合わせて調整してください。"}`;
}
