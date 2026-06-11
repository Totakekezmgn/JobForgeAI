# JobForge AI v2.7

IT就活を一元管理するAI就活OSです。

## v2.7で追加・改善(安全に公開できる土台)
- 全ページのAPI呼び出しをauthFetch(JWT本人確認)に統一
- 401時の案内メッセージを統一
- 旧UUIDデータのアカウント引き継ぎ(/cloud の引き継ぎボタン)
- Stripe checkoutをログイン本人(auth.uid)に紐づけ、解約イベント処理を追加
- AI系APIに入力長バリデーション(コスト防衛)

## v2.6で追加・改善(セキュリティ + 検証分離)
- RLS全開放の閉鎖、API側JWT本人確認、無料枠のサーバー管理(docs/UPGRADE_v2_6.md参照)
- 面接回答の独立採点ルート /api/interview-evaluate(検証分離)

## v2.5で追加・改善
- 企業リサーチ結果から企業管理へ自動追加
- `/import-company` 追加
- リサーチ本文をAIで企業データ化
- 企業名、選考状況、締切候補、次アクション、公式URL、メモを抽出
- 抽出結果をlocalStorageの企業管理データへ保存
- 自動リサーチページからインポート画面への導線追加
- v2.4までのES管理、音声面接、クラウド同期、カレンダー出力を維持

## 実行

```bash
npm install
npm run dev
```

## .env.local

```bash
OPENAI_API_KEY=
TAVILY_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CODE_RUNNER_MODE=simple
PISTON_API_URL=https://emkc.org/api/v2/piston/execute

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 注意
AIが抽出した締切日は候補です。最終確認は必ず公式サイト・採用マイページで行ってください。

## v2.6候補
- Google Calendar API直接連携
- 締切リマインダー
- 企業カードの編集機能強化
- Supabase Auth正式ログイン
