# JobForge v2.6 アップグレードガイド(セキュリティ + 検証分離)

## 何が変わったか

### 1. セキュリティ修正(最重要)

**修正前の問題:**
- RLSポリシーが `using (true)` で全開放 → anonキーを持つ誰でも全ユーザーのデータを読めた
- APIルートがクライアントの送る `userId` をそのまま信用 → なりすまし可能
- 無料枠カウンタがlocalStorage → 削除すれば無制限にAPIクレジットを消費可能

**修正後:**
- anon向けRLSポリシーを全削除(`supabase/schema_v2_6.sql`)
- 全ユーザーデータAPIが SupabaseのJWT(`Authorization: Bearer`)で本人確認(`lib/serverAuth.ts`)
- 無料枠をDBの `usage_events` テーブルでサーバーサイド管理

### 2. 検証分離(Verification Separation)

- 新ルート `/api/interview-evaluate`: 採点専用。生成側の文脈を受け取らず、
  質問・回答・ルーブリックのみで採点し、JSON(観点別スコア・判定・不足キーワード・深掘り質問)を返す
- `/api/interview-sim` は生成専用に変更(想定質問・質問の意図・準備ポイント)
- 面接ページ(`/interview`)は「ステップ1: 生成 → ステップ2: 独立採点」の2段構成に
- 音声面接(`/voice-interview`)も採点を独立評価ルートに分離(音声指標も渡す)

### 3. その他

- ユーザーキーの2系統問題を解消(`codeforge-user-key` → `jobforge-user-key` に統一)
- `lib/authFetch.ts` 追加: セッショントークンを自動添付するfetchヘルパー

## 適用手順

1. SupabaseダッシュボードのSQL Editorで `supabase/schema_v2_6.sql` を実行
2. Supabaseの Authentication → Providers で Email(Magic Link)が有効なことを確認
   (ログイン画面 `/login` は既存のものがそのまま使えます)
3. `npm run dev` で起動し、`/login` からログイン → `/interview` で動作確認

## 既知の残作業(次のバージョンで)

- [ ] 以下のページはまだ素の `fetch` + localStorageのuserIdを使っているため、
      `authFetch` への置き換えが必要(現状はクラウド保存が401になり、ローカル動作のみ):
      `app/cloud/page.tsx`, `app/history/page.tsx`, `app/interview-logs/page.tsx`,
      `app/es/page.tsx`, `app/companies/page.tsx`, `app/import-company/page.tsx`
- [ ] 過去にlocalStorage UUIDで保存されたSupabase上のデータは、新しいauth.uidと
      紐付かない。必要なら「旧IDのデータを自分のアカウントに引き継ぐ」移行機能を作る
- [ ] Stripe webhookの `user_id` もauth.uidベースに揃える(checkout-session作成時に
      `client_reference_id` へauth.uidを渡す)
- [ ] `/api/run-code` `/api/generate-problem` など残りのAI系ルートにも利用枠ゲートを適用

## 設計メモ: なぜこの形にしたか

- **RLS全閉鎖 + service role経由**: クライアントから直接Supabaseを触らせず、
  アクセス制御の責任をAPIルート1箇所に集約。個人開発では「守る場所を減らす」のが最も安全
- **未ログイン時はlocal_only**: Supabase未設定でもアプリが動く既存の思想を維持。
  ログインは「クラウド保存とAI機能を使う条件」という位置づけ
- **評価AIに改善案を作らせない**: 採点者と改善提案者を分けることで、採点が
  「自分の改善案に都合の良い評価」に引きずられるのを防ぐ(検証分離の本質)
