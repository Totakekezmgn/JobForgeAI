# CHANGELOG.md — 変更履歴

## Unreleased — 設計ドキュメント改訂(2026-06-17)
- P1-002: app/api配下のroute.tsを外部サービス別に棚卸しし、未ゲートのOpenAI/Tavily/Piston系ルートへ認証・入力検証・利用枠消費を追加
- P1-001: AI/外部API機能の実行前に OpenAI / Tavily / Piston 等への外部送信同意を共通表示し、dataページに同意リセットを追加
- Pro「無制限」方針を廃止し、月次クレジット付与または都度クレジット購入へ変更
- `live-company-research` を高コスト機能として分離し、無料回数制限・重いクレジット消費・キャッシュ必須へ変更
- P2-003だった「残りAI系ルートの無料枠ゲート統一」をP1へ前倒し
- 全AI/外部API系ルートの必須ゲートを `getVerifiedUser + validate + checkRateLimit + checkAndCountUsage` に統一
- 初期API予算の目安を追加: 開発3,000〜6,000円 / クローズドβ月5,000円 / 公開初期月10,000円
- BUSINESS.md / SPEC.md / TASKS.md / DECISIONS.md / CODEX.md / DEPLOY.md をコスト防衛方針に合わせて更新

## v3.0(開発中)
- 全データ管理: 企業・ES・面接ログ・採点履歴の4キー一括エクスポート/インポート、旧形式復元、確認付き全削除を追加 [済]
- ES版管理: 同一企業・同一文書タイプをグループ化し、v1/v2表示・過去版閲覧・復元保存の導線を追加 [済]
- 弱点分析: 採点履歴から観点別平均・直近5回比較・頻出不足キーワードを表示し、採点履歴を直近100件保持に制限 [済]
- 面接採点履歴: テキスト面接・音声面接の採点結果を回答本文なしで `jobforge-evaluations` に保存 [済]
- 締切リマインダー: 期限切れ / 今日締切 / 3日以内の選考中企業をダッシュボード上部に警告表示し、該当企業のステータス変更へスクロール [済]
- ダッシュボード統合: 選考ステータス集計 / 締切タイムライン(緊急度色分け) / ダッシュボード上でのステータス直接更新 / ES・面接ログ件数表示 [済]
- P0完了。v3.0完成。

## v2.7 — 安全に公開できる土台
- 全ページのAPI呼び出しをauthFetch(JWT添付)に統一、401時の案内文言を統一
- 旧UUIDデータのアカウント引き継ぎ(/api/migrate-legacy + /cloudのボタン)
- Stripe checkoutを auth.uid 紐づけに変更、解約イベントでPro状態を解除
- 入力長バリデーション(lib/validate.ts)をAI系5ルートに適用、es-reviewに無料枠ゲート追加

## v2.6 — セキュリティ + 検証分離
- RLS全開放ポリシーを閉鎖(schema_v2_6.sql)、APIルートにJWT本人確認(lib/serverAuth.ts)
- 無料枠をサーバーサイド管理に変更(usage_eventsテーブル)
- 検証分離: 面接回答の独立採点ルート /api/interview-evaluate を新設、interview-simを生成専用化
- 音声面接の採点を独立評価に接続、ユーザーキー2系統問題を解消

## v2.5以前(原型)
- 企業管理 / 締切管理 / ES管理 / AI面接 / 音声面接 / 企業リサーチ / コーディングテスト対策 / Stripeサブスク / Supabase保存(当時はRLS開放・localStorage UUID認証)
