# CHANGELOG.md — 変更履歴

## v3.0(開発中)
- ダッシュボード統合: 選考ステータス集計 / 締切タイムライン(緊急度色分け) / ダッシュボード上でのステータス直接更新 / ES・面接ログ件数表示 [済]
- 残: P0-001〜P0-005(TASKS.md参照)

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
