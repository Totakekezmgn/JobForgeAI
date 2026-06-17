# BUSINESS.md — JobForge AI ビジネス設計

最終更新: 2026-06-17

## 1. ターゲット

- ITエンジニア職を目指す学生
- コーディングテスト初心者
- Pythonで就活対策をしたい人
- SIer / Web系 / 自社開発企業を受ける学生
- ChatGPTは使っているが、就活対策のワークフロー化まではできていない学生

## 2. 価値提案

ChatGPTに毎回プロンプトを書く必要をなくし、以下をワークフロー化する。

1. 問題を解く
2. テストする
3. 採点される
4. 苦手分野が分かる
5. 次にやることが分かる
6. 企業別対策に落とし込む
7. 最新情報を使った企業研究を生成する

単なるAIチャットではなく、「就活対策の業務フロー」をまとめることが価値。

## 3. 料金方針

### 3.1 基本判断

- 月額サブスクの「無制限」は廃止する。
- 主軸は「無料枠 + 都度クレジット購入」。
- Proを残す場合も、無制限ではなく「クラウド履歴 + 月次クレジット付与」とする。
- `live-company-research` はTavily + OpenAIの二重コストが発生するため、通常AI機能より重く課金する。

## 4. プラン案

### Free

- 価格: 0円
- 通常AI: 1日5クレジットまで
- live-company-research: 月3回まで
- ローカル履歴
- 簡易判定
- クラウド保存は限定またはオプトイン

### Credit Pack S

- 価格: 300円
- 付与: 100 credits
- 想定用途: ES添削・面接練習・問題生成を軽く使う

### Credit Pack M

- 価格: 800円
- 付与: 300 credits
- 想定用途: インターン応募期間にまとめて使う

### Credit Pack L

- 価格: 1,500円
- 付与: 700 credits
- 想定用途: 本選考前の集中対策

### Pro

- 価格: 480円/月
- 付与: 月150 credits
- クラウド履歴
- 企業別対策
- 苦手分野分析
- 無制限表記は禁止

### Pro Plus(必要なら)

- 価格: 980円/月
- 付与: 月400 credits
- live-company-researchを多めに使うユーザー向け
- 無制限表記は禁止

## 5. クレジット消費表

| 機能 | 代表ルート | 消費クレジット |
|---|---|---:|
| 問題生成 | /api/generate-problem | 1 |
| コード採点 | /api/review-answer | 1 |
| コード実行 | /api/run-code | 1 |
| 面接質問生成 | /api/interview-sim | 1 |
| 面接回答採点 | /api/interview-evaluate | 1 |
| 音声面接フィードバック | /api/voice-feedback | 1 |
| ES添削 | /api/es-review | 1 |
| 弱点分析 | /api/analyze-weakness | 1 |
| 次アクション提案 | /api/suggest-next-actions | 1 |
| スケジュール助言 | /api/schedule-advice | 1 |
| 企業別面接対策 | /api/company-prep | 2 |
| 企業リサーチ | /api/company-research | 2 |
| ライブ企業調査 Basic | /api/live-company-research | 4 |
| ライブ企業調査 Advanced | /api/live-company-research | 6 |
| Extract/Crawlあり企業調査 | /api/live-company-research | 8〜10 |

## 6. 原価の考え方

料金は固定せず、実運用のusage_eventsから更新する。

### 初期の概算

| 機能分類 | 原価イメージ | 判断 |
|---|---:|---|
| 通常AI生成/採点 | 1回1円未満を目標 | 無料枠に入れてよい |
| 企業別対策 | 1〜2円程度を目標 | 2 credits扱い |
| live-company-research | 2〜7円程度を想定 | 4〜10 credits扱い |
| 深い検索・Extract/Crawl | 10円超もあり得る | 有料限定・回数制限必須 |
| run-code | API原価より悪用/高負荷が問題 | rate limitを強化 |

### 原価計算で見るKPI

- 1ユーザーあたりAPIコスト
- 1有料ユーザーあたりAPIコスト
- 機能別APIコスト
- live-company-researchの利用回数
- live-company-researchのキャッシュヒット率
- 無料ユーザーから有料ユーザーへの転換率
- 7日後継続率
- クレジット購入率

## 7. 初期API予算

### 開発・自分用テスト

- OpenAI: $10〜20程度
- Tavily: 無料枠で開始
- Stripe: テストモード
- Supabase/Vercel: 無料枠
- 合計目安: 3,000〜6,000円

### 友人・ゼミ向けクローズドβ

- 月上限: 5,000円程度
- OpenAI中心で検証
- Tavilyは無料枠または小額上限
- live-company-researchは月3回/人まで

### 公開初期・収益化検証

- 月上限: 10,000円程度
- OpenAI: 5,000円目安
- Tavily: 3,000円目安
- 予備: 2,000円
- まずは支出上限を固定し、ユーザー数を無理に増やさない

## 8. 初期ユーザー獲得

- 大学の友人
- ゼミ
- 就活Discord
- Xで学習ログ発信
- Qiita / Zennで開発記事
- 「コーディングテスト初心者向けPython問題」記事から流入
- 「Fラン大学生が就活AIアプリを作って運用した記録」として発信

## 9. 収益化の現実ライン

最初から大きな黒字を狙わない。

初期目標:
- 月間利用者: 30人
- 有料購入者: 3人
- API支出: 月5,000円以内
- 売上: 1,000〜3,000円でもよい

就活で語る実績として重要なのは、売上額そのものよりも以下。

- セキュリティ設計をしたこと
- API原価を計算したこと
- 無料枠と課金導線を設計したこと
- 実ユーザーからフィードバックを得たこと
- 改善履歴をGitHubに残したこと

## 10. やってはいけないこと

- Pro無制限
- live-company-research無制限
- 未ログインAI実行
- フロントエンドにAPIキー配置
- localStorageだけで無料枠判定
- ログにES本文・面接回答全文を出す
- Tavily Advanced/Extract/Crawlを無料で開放
- OpenAI/Tavilyの月額上限を決めずに公開
