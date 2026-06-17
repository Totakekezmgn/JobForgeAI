# SPEC.md — JobForge AI 仕様書

最終更新: 2026-06-17 / 現行バージョン: v3.0完成・v3.5公開準備前

## 1. プロダクト定義

IT就活生向けの統合管理AIアプリ。企業管理・締切管理・ES管理・AI面接対策(テキスト/音声)・コーディングテスト対策・企業研究を一元化する。

### 3つの目的(優先順)
1. 開発者本人が就活で実利用できること
2. 公開・収益化できる安全なWebアプリであること
3. 「設計・開発・公開・運用した個人開発実績」として就活で語れること

### 最上位の設計制約
- **個人情報最小化**: 高機微データ(ES・面接回答)はローカル保存が基本。クラウド保存は明示同意(オプトイン)時のみ。
- **検証分離**: AIによる評価・採点は、生成とは独立したコンテキスト(別APIルート・別プロンプト)で行う。
- **未ログインでも動く**: Supabase未設定・未ログイン時はlocalStorageのみで主要機能が劣化動作する。AI機能はログイン必須またはfallback文面。
- **コスト上限主義**: 公開前に、全AI/外部APIルートへ認証・入力検証・利用枠消費・レート制限・ログ抑制を通す。高コスト機能は重いクレジット消費とキャッシュを必須にする。

## 2. 技術スタック

- Next.js 14.2 (App Router) / TypeScript 5.5 / React 18.3
- Supabase (Auth: Magic Link / DB: PostgreSQL / RLS有効)
- Stripe (v4.0で都度クレジット購入を主軸にする。月額Proは「無制限」ではなく月次クレジット付与へ変更)
- OpenAI Responses API (標準モデルは環境変数で管理。現行想定: gpt-4.1-mini)
- Tavily (企業リサーチ。`live-company-research` は高コスト扱い)
- Piston (コード実行。API原価よりも悪用・高負荷対策を重視)
- 追加ライブラリは原則禁止。必要な場合は人間の承認を得る。

## 3. 認証・セキュリティ仕様(v2.6/v2.7で確立。変更禁止)

- クライアントは `lib/authFetch.ts` の `authFetch()` でAPIを呼ぶ(SupabaseセッションのJWTを自動添付)。
- APIルートは `lib/serverAuth.ts` の `getVerifiedUser(request)` で本人確認する。**クライアントが送るuserIdを信用してはならない**。
- RLSはanon全閉鎖。DBアクセスはservice role(APIルート)経由のみ。
- AI/外部API系ルートは `checkAndCountUsage()` でサーバーサイド無料枠・クレジット枠を消費する。
- 入力は `lib/validate.ts` で長さ検証する。長文入力・検索条件・企業メモなどは個別上限を持つ。
- AI/外部API系ルートは `checkRateLimit()` を通す。同一ユーザーの短時間連打は429を返す。
- `console.log` / `console.error` にES本文・面接回答全文・メールアドレス・APIキー・リクエストbody全体を出してはならない。
- Stripe checkoutは `client_reference_id = auth.uid`。webhookで購入クレジットを加算し、解約時はPro状態を落とす。
- 旧localStorage UUIDデータは `/api/migrate-legacy` で引き継ぐ。

## 4. コスト管理仕様

### 4.1 利用枠の基本方針

利用枠は「無料枠 → 購入クレジット → 拒否」の順で消費する。

- 未ログイン: AI/外部API系は原則不可。必要ならデモ用fallbackのみ。
- 無料ログイン: 通常AIは1日5クレジットまで。`live-company-research` は月3回まで。
- 購入ユーザー: 購入済みクレジットを重み付きで消費。
- Proユーザー: 毎月固定クレジットを付与。**無制限は禁止**。

### 4.2 クレジット重み

| 機能分類 | 代表ルート | 消費クレジット |
|---|---|---:|
| 通常AI生成/採点 | `/api/interview-sim`, `/api/interview-evaluate`, `/api/es-review`, `/api/review-answer` | 1 |
| 履歴・弱点分析 | `/api/analyze-weakness`, `/api/suggest-next-actions`, `/api/schedule-advice` | 1 |
| 企業別対策 | `/api/company-prep`, `/api/company-research` | 2 |
| ライブ企業調査 Basic | `/api/live-company-research` | 4 |
| ライブ企業調査 Advanced | `/api/live-company-research` | 6 |
| Tavily Extract/Crawlを伴う調査 | `/api/live-company-research` | 8〜10 |
| コード実行 | `/api/run-code` | 1。ただし短時間連打制限を別途強化 |

### 4.3 `live-company-research` の特別ルール

`live-company-research` はTavily + OpenAIの二重コストが発生するため、通常AI機能と同じ扱いにしない。

- 無料ユーザーは月3回まで。
- `search_depth` は初期値 `basic`。Advancedは有料クレジット消費時のみ許可。
- 検索結果は `companyName + date + searchDepth + queryHash` でキャッシュする。
- 同じ企業・同じ日・同じdepthの検索はTavilyを再実行せずキャッシュを返す。
- Extract/Crawlを使う場合は最大URL数を制限する。
- 1回のOpenAI入力・出力token上限を設ける。
- 失敗時も外部API実行後ならusage_eventsに記録する。

## 5. データ仕様

### localStorageキー一覧(クライアント保存)
| キー | 内容 |
|---|---|
| jobforge-companies | 企業配列 {id,name,status,deadline,nextAction,memo,officialUrl} |
| jobforge-es-documents | ES配列 {id,companyName,documentType,title,content,aiReview,createdAt} |
| jobforge-interview-logs | 面接ログ配列 |
| jobforge-evaluations | 採点履歴。回答本文は保存しない |
| jobforge-user-key | 旧UUID(移行用に保持) |
| jobforge-ai-consent | AI外部送信同意 |
| jobforge-usage-YYYY-MM-DD | 表示用の利用回数カウンタ。課金判定には使わない |

### Supabaseテーブル

既存:
- learning_history
- subscriptions
- job_companies
- job_interview_logs
- job_es_documents
- usage_events

v4.0で追加予定:
- credits: ユーザーの購入/付与クレジット残高
- credit_transactions: 購入・消費・返却の台帳
- research_cache: Tavily/OpenAIの企業調査キャッシュ

### usage_eventsに最低限入れる項目

- user_id
- route
- feature_key
- credit_cost
- provider (`openai`, `tavily`, `piston`, `mixed`)
- status (`success`, `failed`, `blocked`, `cached`)
- created_at

本文・ES・面接回答・検索結果全文はusage_eventsに保存しない。

### 選考ステータス(全画面で共通。変更時は全画面同時に)

検討中 / IS応募予定 / ES作成中 / ES提出済み / 一次面接 / 二次面接 / 最終面接 / 内定 / 見送り

## 6. APIルート一覧(目標状態)

| ルート | 役割 | 認証 | 入力検証 | 利用枠/クレジット | レート制限 |
|---|---|---|---|---|---|
| /api/interview-sim | 想定質問の生成(生成専用) | 要 | 要 | 1 | 要 |
| /api/interview-evaluate | 回答の独立採点(検証分離) | 要 | 要 | 1 | 要 |
| /api/voice-feedback | 話し方コーチング | 要 | 要 | 1 | 要 |
| /api/review-answer | コード採点 | 要 | 要 | 1 | 要 |
| /api/es-review | ES添削 | 要 | 要 | 1 | 要 |
| /api/generate-problem | 問題生成 | 要 | 要 | 1 | 要 |
| /api/run-code | コード実行 | 要 | 要 | 1 | 強化 |
| /api/company-research | 企業リサーチ | 要 | 要 | 2 | 要 |
| /api/live-company-research | ライブ企業調査 | 要 | 要 | 4〜10 | 強化 |
| /api/parse-research-company | 企業情報抽出 | 要 | 要 | 2 | 要 |
| /api/suggest-next-actions | 次アクション提案 | 要 | 要 | 1 | 要 |
| /api/analyze-weakness | 弱点分析 | 要 | 要 | 1 | 要 |
| /api/schedule-advice | スケジュール助言 | 要 | 要 | 1 | 要 |
| /api/company-prep | 企業別対策 | 要 | 要 | 2 | 要 |
| /api/companies, /api/companies/sync | 企業クラウド保存 | 要 | 要 | - | 通常 |
| /api/history, /api/save-history | 学習履歴 | 要 | 要 | - | 通常 |
| /api/interview-logs, /api/es-documents | 面接ログ/ESクラウド保存 | 要 | 要 | - | 通常 |
| /api/me | プラン状態 | 要 | - | - | 通常 |
| /api/migrate-legacy | 旧UUID引き継ぎ | 要 | 要 | - | 通常 |
| /api/create-checkout-session, /api/stripe-webhook | 課金 | 要/署名 | 要 | - | 通常 |

## 7. 画面一覧(現状)

/ (統合ダッシュボード) / companies / import-company / calendar / calendar-export / tasks / es / interview / voice-interview / interview-logs / research / live-research / company / roadmap / growth / data / cloud / pricing / login / privacy / terms

v4.0追加予定:
- admin
- contact

## 8. 検証分離の実装規約

- 採点AI(`interview-evaluate`)には「質問・回答・ルーブリック・音声指標」のみを渡す。生成時の文脈・改善案を渡してはならない。
- 採点AIの出力はJSON固定(scores / total / verdict / covered_keywords / missing_keywords / weakest_point / probing_question)。
- 採点項目: structure / specificity / relevance / company_fit / depth_resistance (+ keyword_coverage)。
- 改善案の生成は採点と別の呼び出しで行う。

## 9. バージョンロードマップ(完成定義)

- **v3.0(自分用完成)**: ダッシュボード統合 / 締切リマインダー / 採点履歴の蓄積と弱点可視化 / ES版管理 / 全データのエクスポート・インポート [完了]
- **v3.5(安全公開準備)**: AI送信同意 / 全AIルートのゲート統一 / レート制限 / ログ個人情報排除 / live-company-researchのキャッシュ・重課金化 / 規約・ポリシー / 退会・全削除
- **v4.0(収益化完成・最終)**: 都度クレジット購入 / 重み付きクレジット消費 / Pro無制限廃止 / 運営ダッシュボード / 問い合わせ / 本番デプロイ準備

詳細チケットは TASKS.md を正とする。
