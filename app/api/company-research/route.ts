import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { company, memo } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ result: fallback(company, memo) });
  }

  const prompt = `
あなたはIT就活生向けの企業研究アドバイザーです。
以下の企業について、就活で使える形に整理してください。

企業名: ${company}
ユーザーメモ:
${memo || "未入力"}

出力形式:
【事業理解】
【エンジニア職で見るべきポイント】
【志望動機に使える観点】
【面接で聞かれそうな質問】
【逆質問案】
【注意点】

注意:
- 最新情報を断定しない
- メモがある場合はメモを優先する
- 面接で話しやすい実用的な内容にする
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
    return NextResponse.json({ result: fallback(company, memo) });
  }

  const data = await response.json();
  return NextResponse.json({ result: data.output_text ?? fallback(company, memo) });
}

function fallback(company: string, memo: string) {
  return `【事業理解】
${company || "対象企業"}について、まずは公式サイト、採用サイト、説明会メモをもとに、事業内容・顧客・提供価値を整理してください。

【エンジニア職で見るべきポイント】
- どのプロダクトに関わる可能性があるか
- 技術選定や開発体制
- チーム開発の進め方
- 若手がどの範囲まで任されるか

【志望動機に使える観点】
- 自分の成長軸と企業の環境が合うか
- 事業の社会的価値に共感できるか
- 技術を通してどのような課題解決に関わりたいか

【面接で聞かれそうな質問】
1. なぜ${company || "この企業"}なのですか。
2. どの事業に興味がありますか。
3. エンジニアとしてどのように成長したいですか。
4. チーム開発で大切にしていることは何ですか。

【逆質問案】
- 若手エンジニアが最初に任される業務範囲を教えてください。
- 開発チームで評価される行動は何ですか。
- 入社前に学んでおくと良い技術はありますか。

【注意点】
企業研究は抽象的にせず、「自分の経験」と「企業の事業」を1つ以上つなげて話せるようにしてください。

【あなたのメモ】
${memo || "未入力"}`;
}
