"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadEvaluations, type StoredEvaluation } from "@/lib/evaluationStore";

const CRITERIA = [
  { key: "structure", label: "構成" },
  { key: "specificity", label: "具体性" },
  { key: "relevance", label: "質問への回答" },
  { key: "company_fit", label: "企業・職種接続" },
  { key: "depth_resistance", label: "深掘り耐性" }
];

type Criterion = (typeof CRITERIA)[number];

export default function GrowthPage() {
  const [evaluations, setEvaluations] = useState<StoredEvaluation[]>([]);

  useEffect(() => {
    setEvaluations(sortByNewest(loadEvaluations()));
  }, []);

  const recent = evaluations.slice(0, 5);
  const keywordRanking = useMemo(() => countMissingKeywords(evaluations), [evaluations]);

  return (
    <main className="container">
      <section className="hero">
        <h1>弱点分析</h1>
        <p>面接採点履歴から、観点別の平均・直近の変化・不足しやすいキーワードを確認します。</p>
      </section>

      {evaluations.length === 0 ? (
        <section className="notice">
          <strong>採点履歴がまだありません。</strong>
          <p>AI面接または音声面接で回答を採点すると、ここに弱点の推移が表示されます。</p>
          <Link className="button" href="/interview">AI面接へ</Link>
          <Link className="button secondary" href="/voice-interview">音声面接へ</Link>
        </section>
      ) : (
        <>
          <section className="dashboard-grid">
            <div className="card">
              <h2>採点履歴</h2>
              <div className="price">{evaluations.length}<span className="muted" style={{ fontSize: 16 }}> / 100件</span></div>
              <p className="muted">テキスト {evaluations.filter((e) => e.source === "text").length}件 / 音声 {evaluations.filter((e) => e.source === "voice").length}件</p>
            </div>
            <div className="card">
              <h2>全期間平均</h2>
              <div className="price">{formatScore(averageTotal(evaluations))}</div>
              <p className="muted">5観点の平均スコア</p>
            </div>
            <div className="card">
              <h2>直近5回平均</h2>
              <div className="price">{formatScore(averageTotal(recent))}</div>
              <p className="muted">{recent.length}件で計算</p>
            </div>
          </section>

          <section className="card" style={{ marginTop: 18 }}>
            <h2>観点別平均</h2>
            {CRITERIA.map((criterion) => {
              const allAverage = averageScore(evaluations, criterion.key);
              const recentAverage = averageScore(recent, criterion.key);
              return (
                <div className="test-row" key={criterion.key}>
                  <p>
                    <strong>{criterion.label}</strong>
                    <span className="badge">全期間 {formatScore(allAverage)}</span>
                    <span className="badge">直近5回 {formatScore(recentAverage)}</span>
                    <span className={trendClass(recentAverage, allAverage)}>{trendLabel(recentAverage, allAverage)}</span>
                  </p>
                  <div className="progress" aria-label={`${criterion.label}の全期間平均`}>
                    <div className="progress-bar" style={{ width: `${scorePercent(allAverage)}%` }} />
                  </div>
                  <p className="muted">全期間平均の進捗バー</p>
                </div>
              );
            })}
          </section>

          <section className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <h2>頻出不足キーワード</h2>
              {keywordRanking.length === 0 && <p className="muted">不足キーワードはまだ記録されていません。</p>}
              {keywordRanking.map((item) => (
                <p key={item.keyword}>
                  <span className="badge ng">{item.count}回</span>
                  {item.keyword}
                </p>
              ))}
            </div>

            <div className="card">
              <h2>直近の採点</h2>
              {recent.map((item) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.company || "企業未設定"}</strong>
                  <span className="badge">{item.source === "voice" ? "音声" : "テキスト"}</span>
                  <p className="muted">{formatDate(item.createdAt)} / {item.role || "職種未設定"}</p>
                  <p>合計: {item.total} / 判定: {item.verdict}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function sortByNewest(items: StoredEvaluation[]) {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function averageScore(items: StoredEvaluation[], key: Criterion["key"]) {
  const scores = items
    .map((item) => item.scores[key])
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function averageTotal(items: StoredEvaluation[]) {
  if (items.length === 0) return 0;
  const averages = CRITERIA.map((criterion) => averageScore(items, criterion.key));
  return averages.reduce((sum, score) => sum + score, 0) / averages.length;
}

function countMissingKeywords(items: StoredEvaluation[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const keyword of item.missing_keywords || []) {
      const normalized = keyword.trim();
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword, "ja"))
    .slice(0, 5);
}

function scorePercent(score: number) {
  return Math.max(0, Math.min(100, (score / 5) * 100));
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function trendLabel(recentAverage: number, allAverage: number) {
  const diff = recentAverage - allAverage;
  if (diff >= 0.1) return ` ↑ 改善 +${diff.toFixed(1)}`;
  if (diff <= -0.1) return ` ↓ 悪化 ${diff.toFixed(1)}`;
  return " → 横ばい";
}

function trendClass(recentAverage: number, allAverage: number) {
  const diff = recentAverage - allAverage;
  if (diff >= 0.1) return "status-pill status-good";
  if (diff <= -0.1) return "status-pill status-danger";
  return "status-pill";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP");
}
