# TASKS.md — チケット一覧

凡例: P0=v3.0(自分用完成) / P1=v3.5(安全公開準備) / P2=v4.0(収益化完成)
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

### P0-003: 弱点の経時可視化 — DONE
目的: 採点履歴から「どの観点が弱いか」「練習で改善しているか」を見えるようにする。
対象: (新規)app/growth/page.tsx、app/layout.tsx(ナビ追加)、app/page.tsx(ダッシュボードにリンク)。
実装方針:
- jobforge-evaluations を読み、観点別(structure/specificity/relevance/company_fit/depth_resistance)の平均スコアを .progress バーで表示
- 直近5回と全期間の平均を並べ、改善/悪化を矢印で示す
- 頻出 missing_keywords の上位5件を表示
- チャートライブラリは追加しない(CSSの .progress を使う)
- 採点履歴の保存件数に上限を設ける: lib/evaluationStore.ts の saveEvaluation で直近100件のみ保持し、超過分は古いものから破棄する
受け入れ条件:
- 採点履歴0件の時に案内文が出る(エラーにならない)
- 観点別平均・直近5回比較・頻出不足キーワードが表示される
- 採点履歴が101件目以降も保存でき、保持件数が100件を超えない
- npm run build が通る

### P0-004: ESの版管理 — DONE
目的: 同じ企業・同じ文書タイプのESを書き直した時、過去版に戻れるようにする。
対象: app/es/page.tsx。
実装方針:
- 保存時、同一(companyName, documentType)の既存文書があれば上書きせず新規保存し、同グループとして扱う
- 一覧をグループ表示し、グループ内で「v1, v2, ...」と版を表示、選択で過去版の本文を閲覧・復元(=その内容で新版を作成)できる
- データ構造の破壊的変更はしない
受け入れ条件:
- 同一企業・同一タイプで2回保存すると2版として表示される
- 過去版を開いて復元できる
- 既存の保存済みESが消えない・表示が壊れない
- npm run build が通る

### P0-005: 全データのエクスポート/インポート — DONE
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

## P1 — v3.5 安全公開準備

### P1-001: AI送信の事前同意表示 — TODO
目的: ユーザーの入力が外部AI(OpenAI/Tavily/Piston等)へ送られることを明示する。
対象: AI機能を持つ全ページ、(新規)lib/consent.ts、app/data/page.tsx。
実装方針:
- 初回のAI機能実行時にモーダルまたはconfirmで「入力内容は回答生成・検索・コード実行のため外部サービスへ送信されます。個人情報・機密情報は書かないでください」と表示
- 同意を localStorage `jobforge-ai-consent` に記録
- 同意済みなら再表示しない
- dataページに「AI外部送信同意をリセット」を追加
受け入れ条件:
- 未同意でAI機能を実行すると同意表示が出る / 拒否したら送信されない
- 同意済みなら出ない
- 同意リセット後は再表示される
- npm run build が通る

### P1-002: 全AI/外部APIルートのゲート統一 — TODO
目的: 未ゲートAPIによるAPIコスト暴走を防ぐ。旧P2-003をP1へ前倒しする。
対象: /api/run-code、/api/generate-problem、/api/company-research、/api/live-company-research、/api/parse-research-company、/api/suggest-next-actions、/api/analyze-weakness、/api/schedule-advice、/api/company-prep、および既存AI系全ルート。
実装方針:
- 各ルートに `getVerifiedUser + validate + checkAndCountUsage` を適用
- 既にゲート済みのルートも実装パターンを確認し、差異があれば統一
- `checkAndCountUsage` に featureKey / creditCost / provider を渡せる設計にする。未実装なら仕様の曖昧点として報告してから最小変更で実装
- 未ログイン時は401「ログインが必要です。/login からログインしてください。」を返す
受け入れ条件:
- 全AI/外部API系ルートが同一の認証・入力検証・利用枠消費パターンになる
- 未ログインでは実行されない
- 無料枠超過時は外部APIを叩く前に拒否される
- usage_eventsに route / featureKey / creditCost / provider / status が記録される
- npm run build が通る

### P1-003: レート制限と不正利用対策 — TODO
目的: 無料枠とは別に、連打・自動化・コード実行悪用を止める。
対象: lib/serverAuth.ts または lib/rateLimit.ts、AI/外部API系全ルート。
実装方針:
- usage_eventsまたは専用テーブルを利用し、同一ユーザーの直近1分の呼び出しが10回を超えたら429を返す
- `live-company-research` と `/api/run-code` はより厳しく、直近1分3回を超えたら429
- 429時は外部APIを叩かない
受け入れ条件:
- 通常AI機能は1分10回超で429
- live-company-research / run-code は1分3回超で429
- 通常利用に過度な影響がない
- npm run build が通る

### P1-004: ログの個人情報排除 — TODO
目的: エラーログ経由の情報漏えい防止。
対象: 全APIルート。
実装方針:
- console.error等にbody全体・ES本文・回答全文・メールアドレス・検索結果全文を渡している箇所を、エラーメッセージとルート名のみに置換
- OpenAI/Tavily/Pistonのレスポンス全文をログに出さない
受け入れ条件:
- grepでログ出力に本文系変数が含まれない
- エラー発生時に最低限のroute名とmessageは残る
- npm run build が通る

### P1-005: live-company-researchのコスト防衛 — TODO
目的: Tavily + OpenAIの二重課金ルートを公開可能な形に制限する。
対象: /api/live-company-research、(新規)lib/researchCache.ts、Supabase research_cache テーブルまたは既存DB構造。
実装方針:
- 無料ユーザーは月3回まで
- 初期値は Tavily Basic Search のみ
- Advanced Search / Extract / Crawl は有料クレジット消費時のみ許可
- `companyName + date + searchDepth + queryHash` でキャッシュキーを作成
- 同一条件の当日検索はTavilyを叩かずキャッシュを返す
- OpenAI入力token削減のため、Tavily結果から必要項目だけ渡す
受け入れ条件:
- 同一企業を同日に再検索してもTavilyを再実行しない
- 無料ユーザーは月3回を超えると拒否される
- Basic/Advancedで消費クレジットが異なる
- キャッシュヒット時はusage_eventsのstatusがcachedになる
- npm run build が通る

### P1-006: プライバシーポリシー・利用規約の実質化 — TODO
目的: 公開に耐える「たたき台」を用意する(弁護士レベルの断定はしない)。
対象: app/privacy/page.tsx、app/terms/page.tsx。
実装方針:
- 記載必須項目: 収集データの範囲 / 保存場所(端末・Supabase) / 外部送信先(OpenAI, Tavily, Stripe, Piston) / 削除方法 / AI出力の正確性は保証せず公式確認が必要 / 問い合わせ先 / 返金方針のたたき台
- 文末に「本文書はたたき台であり、専門家の確認前である」旨の開発者向けコメントをコード内に残す
受け入れ条件:
- 上記項目が網羅されている
- npm run build が通る

### P1-007: 退会・全データ削除 — TODO
目的: 自分のデータを完全に消す権利の保証。
対象: (新規)app/api/delete-account/route.ts、app/data/page.tsx。
実装方針:
- 認証必須。Supabase上の本人の全テーブル行を削除し、auth.usersからも削除(service role)
- 実行前に二段階確認。完了後localStorageも全消去しトップへ
- credit_transactionsは会計・不正防止上の記録として残す必要があるか仕様確認。残す場合はuser_idを匿名化
受け入れ条件:
- 退会後、本人の個人データがDBに残らない
- 他人のデータに影響しない
- localStorageも削除される
- npm run build が通る

**P1完了 = 限定公開・クローズドβが可能。**

---

## P2 — v4.0 収益化完成

### P2-001: クレジットテーブルと台帳の追加 — TODO
目的: 月額無制限をやめ、「無料枠+都度クレジット購入」へ主軸を移す。
対象: supabase schema、lib/serverAuth.ts または lib/credits.ts。
実装方針:
- credits テーブル: user_id / balance / updated_at
- credit_transactions テーブル: user_id / type(purchase, consume, grant, refund, adjust) / amount / feature_key / route / stripe_event_id / created_at
- クレジット消費は台帳に記録してからbalanceを更新する
受け入れ条件:
- 残高加算・消費・履歴確認ができる
- 二重webhookで重複加算されない
- npm run build が通る

### P2-002: 重み付きクレジット消費の実装 — TODO
目的: live-company-research等の高コスト機能を通常AI機能と同額扱いにしない。
対象: lib/serverAuth.ts、lib/credits.ts、AI/外部API系全ルート。
実装方針:
- 通常AI機能: 1 credit
- 企業別対策/企業リサーチ: 2 credits
- live-company-research Basic: 4 credits
- live-company-research Advanced: 6 credits
- Extract/Crawlあり: 8〜10 credits
- run-code: 1 credit + 厳しめのrate limit
受け入れ条件:
- 機能ごとに正しいcreditCostがusage_eventsとcredit_transactionsへ記録される
- 残高不足時は外部API実行前に拒否される
- npm run build が通る

### P2-003: Stripe one-time paymentへの変更 — TODO
目的: 学生向けに月額課金より買い切りクレジットを主軸にする。
対象: /api/create-checkout-session、/api/stripe-webhook、app/pricing/page.tsx。
実装方針:
- Stripe one-time paymentで Credit Pack S/M/L を作成
- 例: S=100 credits/¥300、M=300 credits/¥800、L=700 credits/¥1,500
- webhookの checkout.session.completed で credits を加算
- Stripe本番モードは人間が最終確認するまで有効化しない
受け入れ条件:
- テストモードで購入→残高加算→消費が動く
- webhook再送でも二重加算されない
- npm run build が通る

### P2-004: Pro無制限の廃止と料金ページ刷新 — TODO
目的: API原価を無視した赤字プランを廃止する。
対象: app/pricing/page.tsx、/api/me、subscriptions関連。
実装方針:
- Proは「月額480円で無制限」ではなく「クラウド履歴 + 月150 credits」などに変更
- Pro Plusを作る場合は「月980円 + 月400 credits」程度に留める
- 既存サブスクは移行期間としてPro扱いにし、無制限表記を消す
受け入れ条件:
- UI上に「無制限」の文言が残らない
- Proユーザーにも月次credit上限がある
- npm run build が通る

### P2-005: 運営者向け利用状況ダッシュボード — TODO
目的: 利用量・原価・高コスト機能の偏りを監視する。
対象: (新規)app/admin/page.tsx、(新規)/api/admin-stats。
実装方針:
- 環境変数 ADMIN_EMAIL と一致するユーザーのみ閲覧可
- 日別利用回数・ユーザー数・機能別内訳・消費クレジット・cache hit率を表示
- 個人を特定する表示はしない
受け入れ条件:
- 管理者以外は403
- 機能別使用回数と消費creditが見える
- live-company-researchの利用回数とキャッシュ率が見える
- npm run build が通る

### P2-006: API予算・運用ガードの文書化 — TODO
目的: 収益化前に「いくらまで燃えていいか」を決める。
対象: DEPLOY.md、README.md。
実装方針:
- 開発: OpenAI $10〜20、Tavily無料枠
- クローズドβ: 月5,000円上限
- 公開初期: 月10,000円上限
- OpenAI/Tavily/Stripe/Supabase/Vercelの環境変数・上限設定・確認手順を記載
受け入れ条件:
- 本番公開前チェックリストにAPI上限・Tavilyキャッシュ・Stripeテストが含まれる
- npm run build が通る

### P2-007: 問い合わせ窓口とデプロイ準備 — TODO
対象: (新規)app/contact/page.tsx、README.md。
実装方針:
- 問い合わせはメールリンク+GitHub Issues案内で開始(フォーム自作はスパム対策コストが高いため見送り)
- READMEにVercelデプロイ手順・必要環境変数一覧を記載
- デプロイ自体は人間が実行する
受け入れ条件:
- 必要環境変数が漏れなく文書化されている
- npm run build が通る

**P2完了 = v4.0完成 = プロジェクト完成。**
