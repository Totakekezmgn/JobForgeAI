import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { researchText, companyHint } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      company: fallback(researchText, companyHint)
    });
  }

  const prompt = `
あなたはIT就活生向けの企業管理アシスタントです。
以下の企業リサーチ結果から、企業管理に登録すべき情報をJSONで抽出してください。

企業名ヒント: ${companyHint || "未指定"}

リサーチ本文:
${researchText}

必ずJSONのみで返してください。
形式:
{
  "name": "企業名",
  "status": "検討中 or IS応募予定 or ES作成中 or ES提出済み or 一次面接 or 二次面接 or 最終面接",
  "deadline": "YYYY-MM-DD または空文字",
  "nextAction": "次にやるべきこと",
  "memo": "就活用メモ。締切が不確実な場合は公式確認が必要と書く",
  "officialUrl": "公式URLまたは空文字"
}

厳守:
- 締切を断定できない場合は deadline を空文字にする
- 不確かな締切はmemoに候補として書く
- 推測でURLを作らない
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
    return NextResponse.json({
      company: fallback(researchText, companyHint)
    });
  }

  const data = await response.json();
  const text = data.output_text || "";

  try {
    return NextResponse.json({ company: JSON.parse(text) });
  } catch {
    return NextResponse.json({
      company: fallback(researchText, companyHint)
    });
  }
}

function fallback(researchText: string, companyHint: string) {
  return {
    name: companyHint || "企業名未設定",
    status: "検討中",
    deadline: "",
    nextAction: "公式採用サイト・マイページで締切を確認する",
    memo: `AI抽出のフォールバックです。以下のリサーチ内容を確認してください。\n\n${String(researchText || "").slice(0, 800)}`,
    officialUrl: ""
  };
}
