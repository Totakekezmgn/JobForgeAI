# SPEC.md — JobForge AI 仕様書

最終更新: 2026-06-12 / 現行バージョン: v3.0開発中(ダッシュボード統合まで完了)

## 1. プロダクト定義

IT就活生向けの統合管理AIアプリ。企業管理・締切管理・ES管理・AI面接対策(テキスト/音声)・コーディングテスト対策を一元化する。

### 3つの目的(優先順)
1. 開発者本人が就活で実利用できること
2. 公開・収益化できる安全なWebアプリであること
3. 「設計・開発・公開・運用した個人開発実績」として就活で語れること

### 最上位の設計制約
- **個人情報最小化**: 高機微データ(ES・面接回答)はローカル保存が基本。クラウド保存は明示同意(オプトイン)時のみ
- **検証分離**: AIによる評価・採点は、生成とは独立したコンテキスト(別APIルート・別プロンプト)で行う
- **未ログインでも動く**: Supabase未設定・未ログイン時はlocalStorageのみで全機能が劣化動作する(AI機能はfallback文面)

## 2. 技術スタック

- Next.js 14.2 (App Router) / TypeScript 5.5 / React 18.3
- Supabase (Auth: Magic Link / DB: PostgreSQL / RLS有効)
- Stripe (現状: 月額サブスク¥480。v4.0で都度クレジット制へ移行予定)
- OpenAI Responses API (gpt-4.1-mini) / Tavily (企業リサーチ) / Piston (コード実行)
- 追加ライブラリは原則禁止(チャート等もCSSで実装する)。必要な場合は人間の承認を得る

## 3. 認証・セキュリティ仕様(v2.6/v2.7で確立。変更禁止)

- クライアントは `lib/authFetch.ts` の `authFetch()` でAPIを呼ぶ(SupabaseセッションのJWTを自動添付)
- APIルートは `lib/serverAuth.ts` の `getVerifiedUser(request)` で本人確認。**クライアントが送るuserIdを信用してはならない**
- RLSはanon全閉鎖。DBアクセスはservice role(APIルート)経由のみ
- AI系ルートは `checkAndCountUsage()` でサーバーサイド無料枠(1日5回)を消費する
- 入力は `lib/validate.ts` で長さ検証(コスト防衛)
- Stripe checkoutは `client_reference_id = auth.uid`。webhookで解約時にPro状態を落とす
- 旧localStorage UUIDデータは `/api/migrate-legacy` で引き継ぎ

## 4. データ仕様

### localStorageキー一覧(クライアント保存)
| キー | 内容 |
|---|---|
| jobforge-companies | 企業配列 {id,name,status,deadline,nextAction,memo,officialUrl} |
| jobforge-es-documents | ES配列 {id,companyName,documentType,title,content,aiReview,createdAt} |
| jobforge-interview-logs | 面接ログ配列 |
| jobforge-user-key | 旧UUID(移行用に保持) |
| jobforge-usage-YYYY-MM-DD | 表示用の利用回数カウンタ |

### Supabaseテーブル
learning_history / subscriptions / job_companies / job_interview_logs / job_es_documents / usage_events
(スキーマは supabase/schema.sql + schema_v2_6.sql 参照)

### 選考ステータス(全画面で共通。変更時は全画面同時に)
検討中 / IS応募予定 / ES作成中 / ES提出済み / 一次面接 / 二次面接 / 最終面接 / 内定 / 見送り

## 5. APIルート一覧(現状)

| ルート | 役割 | 認証 | 無料枠 |
|---|---|---|---|
| /api/interview-sim | 想定質問の生成(生成専用) | 要 | 消費 |
| /api/interview-evaluate | 回答の独立採点(検証分離) | 要 | 消費 |
| /api/voice-feedback | 話し方コーチング | 要 | 消費 |
| /api/review-answer | コード採点 | 要 | 消費 |
| /api/es-review | ES添削 | 要 | 消費 |
| /api/companies (GET/POST), /api/companies/sync | 企業クラウド保存 | 要 | - |
| /api/history, /api/save-history | 学習履歴 | 要 | - |
| /api/interview-logs, /api/es-documents | 面接ログ/ESクラウド保存 | 要 | - |
| /api/me | プラン状態 | 要 | - |
| /api/migrate-legacy | 旧UUID引き継ぎ | 要 | - |
| /api/create-checkout-session, /api/stripe-webhook | 課金 | 要/署名 | - |
| /api/company-research, /api/live-company-research, /api/parse-research-company, /api/suggest-next-actions, /api/analyze-weakness, /api/schedule-advice, /api/company-prep, /api/generate-problem, /api/run-code | その他AI/補助 | 一部未ゲート(P2-003で統一) | 一部 |

## 6. 画面一覧(現状)

/ (統合ダッシュボード: ステータス集計・締切タイムライン・直接ステータス更新) /
companies / import-company / calendar / calendar-export / tasks / es / interview /
voice-interview / interview-logs / research / live-research / company / roadmap /
data (現状は企業データのみのバックアップ) / cloud / pricing / login / privacy / terms

## 7. 検証分離の実装規約

- 採点AI(`interview-evaluate`)には「質問・回答・ルーブリック・音声指標」のみを渡す。生成時の文脈・改善案を渡してはならない
- 採点AIの出力はJSON固定(scores / total / verdict / covered_keywords / missing_keywords / weakest_point / probing_question)
- 採点項目: structure / specificity / relevance / company_fit / depth_resistance (+ keyword_coverage)
- 改善案の生成は採点と別の呼び出しで行う(将来機能)

## 8. バージョンロードマップ(完成定義)

- **v3.0(自分用完成)**: ダッシュボード統合[済] / 締切リマインダー / 採点履歴の蓄積と弱点可視化 / ES版管理 / 全データのエクスポート・インポート
- **v3.5(公開準備)**: AI送信同意 / 規約・ポリシー実質化 / クラウドオプトインUI / 退会・全削除 / レート制限 / ログの個人情報排除
- **v4.0(収益化完成・最終)**: 無料枠+都度クレジット購入 / usage_events連動 / 運営ダッシュボード / 問い合わせ / デプロイ
- 詳細チケットは TASKS.md を正とする
