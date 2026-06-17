# UPGRADE_v2_6.md — JobForge v2.6 アップグレードガイド(セキュリティ + 検証分離)

最終更新: 2026-06-17

このドキュメントはv2.6時点のアップグレード履歴である。現行の公開・収益化方針は SPEC.md / TASKS.md / BUSINESS.md を正とする。

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

- 新ルート `/api/interview-evaluate`: 採点専用。生成側の文脈を受け取らず、質問・回答・ルーブリックのみで採点し、JSON(観点別スコア・判定・不足キーワード・深掘り質問)を返す
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

- [x] 全ページのAPI呼び出しをauthFetchへ統一する方針をv2.7で確立
- [x] Stripe checkoutのauth.uid紐づけ方針をv2.7で確立
- [ ] `/api/run-code` `/api/generate-problem` `/api/live-company-research` など残りAI/外部API系ルートにも利用枠ゲートを適用
- [ ] `live-company-research` に高コスト機能としてのキャッシュ・重み付きクレジット消費を適用

## 現行方針への接続

v2.6では「認証」「RLS閉鎖」「サーバーサイド無料枠」を確立した。v3.5以降ではこれに加えて、以下を公開前の必須条件とする。

- 全AI/外部API系ルートのゲート統一
- レート制限
- ログの個人情報排除
- `live-company-research` の無料回数制限・キャッシュ・重課金化
- Pro無制限の廃止

## 設計メモ: なぜこの形にしたか

- **RLS全閉鎖 + service role経由**: クライアントから直接Supabaseを触らせず、アクセス制御の責任をAPIルート1箇所に集約。個人開発では「守る場所を減らす」のが最も安全
- **未ログイン時はlocal_only**: Supabase未設定でもアプリが動く既存の思想を維持。ただしAI/外部API系はコスト防衛のためログイン必須またはfallbackに限定
- **評価AIに改善案を作らせない**: 採点者と改善提案者を分けることで、採点が「自分の改善案に都合の良い評価」に引きずられるのを防ぐ(検証分離の本質)
