"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

type LocalHistory = {
  id: string;
  createdAt: string;
  level: string;
  category: string;
  problem: string;
  answer: string;
  review: string;
};

type SummaryItem = {
  category: string;
  count: number;
  weakScore: number;
};

export default function RoadmapPage() {
  const [history, setHistory] = useState<LocalHistory[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [recommended, setRecommended] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("codeforge-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  async function analyze() {
    setLoading(true);

    try {
      const res = await authFetch("/api/analyze-weakness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ history })
      });

      const data = await res.json();

      setSummary(data.summary || []);
      setRecommended(data.recommended || []);
      setRoadmap(data.roadmap || "");
    } finally {
      setLoading(false);
    }
  }

  const maxScore = Math.max(...summary.map((item) => item.weakScore), 1);

  return (
    <main className="container">
      <section className="hero">
        <h1>学習ロードマップ</h1>
        <p>学習履歴から苦手分野を推定し、次にやるべき練習を決めます。</p>
      </section>

      <section className="card">
        <h2>分析対象</h2>
        <p className="muted">ローカル履歴: {history.length}件</p>
        <button className="button" onClick={analyze} disabled={loading}>
          {loading ? "分析中..." : "苦手分野を分析"}
        </button>
      </section>

      {recommended.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>優先して練習すべきカテゴリ</h2>
          {recommended.map((item) => (
            <span className="badge" key={item}>{item}</span>
          ))}
        </section>
      )}

      {summary.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>カテゴリ別スコア</h2>
          {summary.map((item) => (
            <div className="test-row" key={item.category}>
              <strong>{item.category}</strong>
              <p className="muted">履歴数: {item.count} / 苦手推定スコア: {item.weakScore}</p>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${(item.weakScore / maxScore) * 100}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}

      {roadmap && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>7日間ロードマップ</h2>
          <div className="result">{roadmap}</div>
        </section>
      )}
    </main>
  );
}
