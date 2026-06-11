# デプロイ手順

## 1. GitHubへアップロード

```bash
git init
git add .
git commit -m "initial release"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

## 2. Vercel

- Vercelにログイン
- New Project
- GitHub repositoryを選択
- Environment Variablesを設定
- Deploy

## 3. Supabase

- Project作成
- SQL Editorで `supabase/schema.sql` を実行
- Project URL / anon key / service role key をVercelに設定

## 4. Stripe

- Product作成
- Price作成
- Price IDを `NEXT_PUBLIC_STRIPE_PRICE_ID` に設定
- Webhook endpointを作成

Webhook endpoint:

```bash
https://your-domain.vercel.app/api/stripe-webhook
```

受信イベント:

- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted

## 5. OpenAI

- API Keyを取得
- `OPENAI_API_KEY` に設定

## 6. 動作確認

- 問題生成
- テストケース生成
- AI採点
- 料金ページ
- Stripe Checkout
- Webhook後のPro判定
