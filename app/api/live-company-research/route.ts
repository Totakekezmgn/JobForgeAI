import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { company, target } = await request.json();
  const tavilyKey = process.env.TAVILY_API_KEY;
  let searchContext = "";

  if (tavilyKey) {
    try {
      const queries = [
        `${company} 新卒採用 インターン 締切`,
        `${company} internship deadline new graduate Japan`,
        `${company} 選考 締切 マイページ`
      ];
      const results: string[] = [];
      for (const query of queries) {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query, search_depth: "basic", max_results: 5 })
        });
        if (res.ok) {
          const data = await res.json();
          results.push(JSON.stringify(data.results || [], null, 2));
        }
      }
      searchContext = results.join("\n\n");
    } catch {
      searchContext = "";
    }
  }

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ result: fallback(company, target, Boolean(tavilyKey)) });

  const prompt = `
あなたはIT就活生向けの企業リサーチアシスタントです。
以下の検索結果または条件をもとに、就活生向けに整理してください。

企業名: ${company}
調査対象: ${target}

検索結果:
${searchContext || "検索API未設定、または検索結果なし"}

出力形式:
【確認できた情報】
【インターン・選考締切候補】
【公式確認が必要な情報】
【就活生が今日やるべきこと】
【企業管理に登録すべき項目】
【注意点】

厳守:
- 検索結果にない締切を断定しない
- 締切は必ず「公式確認が必要」と添える
- 不明な場合は不明と書く
- 推測と事実を分ける
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });

  if (!response.ok) return NextResponse.json({ result: fallback(company, target, Boolean(tavilyKey)) });
  const data = await response.json();
  return NextResponse.json({ result: data.output_text ?? fallback(company, target, Boolean(tavilyKey)) });
}

function fallback(company: string, target: string, hasSearchKey: boolean) {
  return `【確認できた情報】
現在はOpenAI APIキーが未設定のため、AIによる詳細分析は行っていません。
Tavily APIキー: ${hasSearchKey ? "設定あり" : "未設定"}

【インターン・選考締切候補】
${company || "対象企業"} の ${target || "新卒採用・インターン"} については、公式採用サイト、採用マイページ、ナビサイトで確認してください。
AIが締切を断定するのは危険です。

【公式確認が必要な情報】
- インターン応募締切
- ES提出締切
- Webテスト締切
- 面接日程
- 早期選考の有無
- マイページ限定情報

【就活生が今日やるべきこと】
1. 公式採用サイトを確認
2. マイページ登録
3. 締切をJobForgeの企業管理に登録
4. 次にやることを設定
5. 面接・ES・コード対策に分解

【企業管理に登録すべき項目】
- 企業名: ${company || "未入力"}
- 選考状況
- 締切日
- 次にやること
- 公式URL
- メモ

【注意点】
締切情報は変動します。最終確認は必ず公式情報で行ってください。`;
}
