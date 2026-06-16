# TASKS.md — チケット一覧

凡例: P0=v3.0(自分用完成) / P1=v3.5(公開準備) / P2=v4.0(収益化)
状態: TODO / DOING / DONE
1チケット=Codexの1作業単位。上から順に着手する。

---

## P0 — v3.0 自分用完成

### P0-001: 締切リマインダー(画面内通知) — DONE
目的: 締切の見落としを防ぐ。
対象: app/page.tsx(ダッシュボード)、app/layout.tsx。
実装方針:
- ダッシュボード読み込み時、「今日締切」「期限切れ」「3日以内」の企業があれば画面上部に警告バー(.warning-box)を表示
- 警告バーから該当企業のステータス変更へスクロールできる
- ブラウザのNotification APIは使わない(許可UXが重く、v3.0では過剰)
受け入れ条件:
- 今日締切/期限切れ/3日以内の企業がある時のみ警告バーが出る
- 内定・見送りの企業は対象外
- 該当なしの時は何も表示されない
- 既存UIを壊さない / npm run build が通る

### P0-002: 面接採点履歴の保存 — DONE
目的: /api/interview-evaluate の採点結果を蓄積し、P0-003(弱点可視化)の材料にする。
対象: app/interview/page.tsx、app/voice-interview/page.tsx、(新規)lib/evaluationStore.ts。
実装方針:
- 採点成功時に localStorage キー `jobforge-evaluations` へ追記保存
- 保存形式: {id, createdAt, company, role, question, scores, total, verdict, missing_keywords, source:"text"|"voice"}
- 回答本文(answer/transcript)は保存しない(個人情報最小化。スコアだけで可視化は成立する)
- 保存・読込・削除を lib/evaluationStore.ts に分離(テキスト面接と音声面接で共用)
受け入れ条件:
- テキスト面接・音声面接の両方で採点結果が保存される
- 回答本文がlocalStorageに保存されていない
- 既存UIを壊さない / npm run build が通る

### P0-003: 弱点の経時可視化 — TODO
目的: 採点履歴から「どの観点が弱いか」「練習で改善しているか」を見えるようにする。
対象: (新規)app/growth/page.tsx、app/layout.tsx(ナビ追加)、app/page.tsx(ダッシュボードにリンク)。
実装方針:
- jobforge-evaluations を読み、観点別(structure/specificity/relevance/company_fit/depth_resistance)の平均スコアを .progress バーで表示
- 直近5回と全期間の平均を並べ、改善/悪化を矢印で示す
- 頻出 missing_keywords の上位5件を表示
- チャートライブラリは追加しない(CSSの .progress を使う)
受け入れ条件:
- 採点履歴0件の時に案内文が出る(エラーにならない)
- 観点別平均・直近5回比較・頻出不足キーワードが表示される
- npm run build が通る

### P0-004: ESの版管理 — TODO
目的: 同じ企業・同じ文書タイプのESを書き直した時、過去版に戻れるようにする。
対象: app/es/page.tsx。
実装方針:
- 保存時、同一(companyName, documentType)の既存文書があれば上書きせず新規保存し、同グループとして扱う
- 一覧をグループ表示し、グループ内で「v1, v2, ...」と版を表示、選択で過去版の本文を閲覧・復元(=その内容で新版を作成)できる
- データ構造の破壊的変更はしない(既存の配列形式を維持し、グルーピングは表示時に計算する)
受け入れ条件:
- 同一企業・同一タイプで2回保存すると2版として表示される
- 過去版を開いて復元できる
- 既存の保存済みESが消えない・表示が壊れない
- npm run build が通る

### P0-005: 全データのエクスポート/インポート — TODO
目的: 端末移行・バックアップ・退会時のデータ持ち出しに備える(v3.5の退会機能の前提)。
対象: app/data/page.tsx。
実装方針:
- 現状companiesのみのバックアップを、jobforge-companies / jobforge-es-documents / jobforge-interview-logs / jobforge-evaluations の4キー一括に拡張
- エクスポートJSONに version と各キーを含め、インポート時はキーごとに存在チェックして復元
- 旧形式(companiesのみ)のJSONもインポートできる後方互換を維持
- 全削除ボタンも4キー対象に拡張(確認ダイアログ必須)
受け入れ条件:
- 4種のデータが1ファイルで書き出せ、復元できる
- 旧形式バックアップも読み込める
- npm run build が通る

**P0完了 = v3.0完成。タグ v3.0 を打つ。**

---

## P1 — v3.5 公開準備

### P1-001: AI送信の事前同意表示 — TODO
目的: ユーザーの入力が外部AI(OpenAI/Tavily)へ送られることの明示(プライバシー上の必須要件)。
対象: AI機能を持つ全ページ、(新規)lib/consent.ts。
実装方針:
- 初回のAI機能実行時にモーダルまたはconfirmで「入力内容は回答生成のため外部AI(OpenAI等)に送信されます。個人情報は書かないでください」と表示し、同意を localStorage `jobforge-ai-consent` に記録
- 同意済みなら再表示しない。設定からリセット可能(data ページに「同意をリセット」を追加)
受け入れ条件:
- 未同意でAI機能を実行すると同意表示が出る / 拒否したら送信されない
- 同意済みなら出ない / npm run build が通る

### P1-002: プライバシーポリシー・利用規約の実質化 — TODO
目的: 公開に耐える「たたき台」を用意する(弁護士レベルの断定はしない)。
対象: app/privacy/page.tsx、app/terms/page.tsx。
実装方針:
- 記載必須項目: 収集データの範囲 / 保存場所(端末・Supabase) / 外部送信先(OpenAI, Tavily, Stripe) / 削除方法 / AI出力(締切等)の正確性は保証せず公式確認が必要 / 問い合わせ先
- 文末に「本文書はたたき台であり、専門家の確認前である」旨の開発者向けコメントをコード内に残す
受け入れ条件: 上記項目が網羅されている / npm run build が通る

### P1-003: 退会・全データ削除 — TODO
目的: 自分のデータを完全に消す権利の保証。
対象: (新規)app/api/delete-account/route.ts、app/data/page.tsx。
実装方針:
- 認証必須。Supabase上の本人の全テーブル行を削除し、auth.usersからも削除(service role)
- 実行前に二段階確認。完了後localStorageも全消去しトップへ
受け入れ条件: 退会後、本人データがDBに残らない / 他人のデータに影響しない / npm run build が通る

### P1-004: レート制限と不正利用対策 — TODO
目的: APIコスト暴走の防止(無料枠とは別の、連打・自動化対策)。
対象: lib/serverAuth.ts、AI系全ルート。
実装方針: usage_eventsを利用し、同一ユーザーの直近1分の呼び出しが10回を超えたら429を返す関数を追加し全AI系ルートに適用。
受け入れ条件: 連打で429になる / 通常利用に影響しない / npm run build が通る

### P1-005: ログの個人情報排除 — TODO
目的: エラーログ経由の情報漏えい防止。
対象: 全APIルート。
実装方針: console.error等にbody全体・ES本文・回答全文を渡している箇所を、エラーメッセージとルート名のみに置換。
受け入れ条件: grepでログ出力に本文系変数が含まれない / npm run build が通る

---

## P2 — v4.0 収益化完成

### P2-001: クレジット制への課金変更 — TODO
目的: 月額サブスクから「無料枠+都度クレジット購入」へ主軸を移す(SPEC 1章の収益方針)。
対象: supabase(creditsテーブル追加)、/api/create-checkout-session、/api/stripe-webhook、lib/serverAuth.ts、app/pricing/page.tsx。
実装方針: Stripe one-time payment(例: 100回分/¥300)。webhookで credits を加算。checkAndCountUsage は「無料枠→クレジット→拒否」の順で消費。既存サブスクはProとして併存維持。
受け入れ条件: テストモードで購入→残高加算→消費が動く / 本番モードは有効化しない / npm run build が通る

### P2-002: 運営者向け利用状況ダッシュボード — TODO
対象: (新規)app/admin/page.tsx、(新規)/api/admin-stats。
実装方針: 環境変数 ADMIN_EMAIL と一致するユーザーのみ閲覧可。日別利用回数・ユーザー数・機能別内訳(usage_events集計)。個人を特定する表示はしない。
受け入れ条件: 管理者以外は403 / npm run build が通る

### P2-003: 残りAI系ルートの無料枠ゲート統一 — TODO
対象: /api/run-code、/api/generate-problem、/api/company-research、/api/live-company-research、/api/parse-research-company、/api/suggest-next-actions、/api/analyze-weakness、/api/schedule-advice、/api/company-prep。
実装方針: 各ルートに getVerifiedUser + checkAndCountUsage + validate を適用(interview-sim と同じパターン)。
受け入れ条件: 全AI系ルートが同一の認証・枠消費パターンになる / npm run build が通る

### P2-004: 問い合わせ窓口とデプロイ準備 — TODO
対象: (新規)app/contact/page.tsx、README.md。
実装方針: 問い合わせはメールリンク+GitHub Issues案内で開始(フォーム自作はスパム対策コストが高いため見送り)。READMEにVercelデプロイ手順・必要環境変数一覧を記載。デプロイ自体は人間が実行する。
受け入れ条件: 必要環境変数が漏れなく文書化されている / npm run build が通る

**P2完了 = v4.0完成 = プロジェクト完成。**
