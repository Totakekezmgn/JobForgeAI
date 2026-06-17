# DEPLOY.md — デプロイ手順

最終更新: 2026-06-17

この手順は、JobForge AIをVercel + Supabase + Stripe + OpenAI + Tavilyで公開するためのもの。
本番公開前に、必ず「APIコスト防衛チェック」を完了する。

## 0. 本番公開前の必須チェック

以下が未完了の場合、本番公開しない。

- [ ] 全AI/外部API系ルートが `getVerifiedUser` を通っている
- [ ] 全AI/外部API系ルートが `validate` を通っている
- [ ] 全AI/外部API系ルートが `checkAndCountUsage` または同等のクレジット消費を通っている
- [ ] 全AI/外部API系ルートにrate limitがある
- [ ] `live-company-research` に月間無料回数制限がある
- [ ] `live-company-research` にキャッシュがある
- [ ] pricing画面に「無制限」表記が残っていない
- [ ] ログにES本文・面接回答全文・メールアドレス・検索結果全文が出ない
- [ ] Stripeはテストモードで動作確認済み
- [ ] OpenAI/Tavilyの月額上限または運用上限を決めている
- [ ] プライバシーポリシー・利用規約が最低限整っている
- [ ] 退会・全データ削除の動線がある

## 1. 初期API予算

### 開発・自分用テスト

- OpenAI: $10〜20程度
- Tavily: 無料枠で開始
- Stripe: テストモード
- Supabase/Vercel: 無料枠
- 合計目安: 3,000〜6,000円

### クローズドβ

- 月上限: 5,000円程度
- live-company-researchは1ユーザー月3回まで
- Tavilyは無料枠優先。必要なら小額上限

### 公開初期

- 月上限: 10,000円程度
- OpenAI: 5,000円目安
- Tavily: 3,000円目安
- 予備: 2,000円

## 2. GitHubへアップロード

```bash
git init
git add .
git commit -m "initial release"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

既にGit管理済みの場合は、通常のcommit/pushのみ行う。

```bash
git status
git add .
git commit -m "prepare safe public beta"
git push
```

## 3. Vercel

- Vercelにログイン
- New Project
- GitHub repositoryを選択
- Environment Variablesを設定
- Deploy

## 4. 必要環境変数

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### OpenAI

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### Tavily

```bash
TAVILY_API_KEY=
TAVILY_DEFAULT_SEARCH_DEPTH=basic
```

### Stripe

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=
```

v4.0のクレジット制移行後は、複数Price IDを使う。

```bash
NEXT_PUBLIC_STRIPE_CREDIT_PACK_S_PRICE_ID=
NEXT_PUBLIC_STRIPE_CREDIT_PACK_M_PRICE_ID=
NEXT_PUBLIC_STRIPE_CREDIT_PACK_L_PRICE_ID=
```

### Admin

```bash
ADMIN_EMAIL=
```

## 5. Supabase

- Project作成
- SQL Editorで `supabase/schema.sql` を実行
- v2.6以降のSQLがある場合は `supabase/schema_v2_6.sql` も実行
- credits / credit_transactions / research_cache を追加する場合はv4.0用SQLを実行
- Project URL / anon key / service role key をVercelに設定

## 6. Stripe

### テストモード

- Credit Pack S/M/Lの商品を作成
- 必要ならPro/Pro Plusの商品を作成
- Price IDをVercel環境変数に設定
- Webhook endpointを作成

Webhook endpoint:

```bash
https://your-domain.vercel.app/api/stripe-webhook
```

受信イベント:

- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted

本番モードは、テストモードで以下を確認するまで有効化しない。

- 購入後にcreditsが増える
- webhook再送で二重加算されない
- クレジット消費が反映される
- 残高不足時に外部APIを叩かず拒否される

## 7. OpenAI

- API Keyを取得
- `OPENAI_API_KEY` に設定
- `OPENAI_MODEL` を設定
- 本番公開前に利用上限・アラートを設定する
- token上限をAPIルート側で設定する

## 8. Tavily

- API Keyを取得
- `TAVILY_API_KEY` に設定
- 初期は無料枠で開始
- search_depthはbasicをデフォルトにする
- Advanced / Extract / Crawlは有料クレジット限定にする
- 本番公開前にusage監視を確認する

## 9. 動作確認

- ログイン
- 問題生成
- テストケース生成
- AI採点
- ES添削
- 面接質問生成
- 面接採点
- 企業リサーチ
- live-company-research Basic
- live-company-research キャッシュヒット
- 無料枠超過時の拒否
- 短時間連打時の429
- 料金ページ
- Stripe Checkout
- Webhook後のクレジット加算
- クレジット消費
- 退会・全データ削除

## 10. 公開後の運用

- 初月はAPI上限を低く保つ
- usage_eventsを毎日確認する
- live-company-researchの利用回数とキャッシュ率を確認する
- 想定以上に原価が高い機能は、無料枠から外すかcreditCostを上げる
- 問い合わせ・不具合報告はGitHub Issuesまたはメールで受ける
