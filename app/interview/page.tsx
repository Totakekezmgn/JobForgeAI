"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";

type Evaluation = {
  scores?: Record<string, number>;
  total?: number;
  verdict?: string;
  covered_keywords?: string[];
  missing_keywords?: string[];
  weakest_point?: string;
  probing_question?: string;
  raw?: string;
};

export default function InterviewPage() {
  const [company, setCompany] = useState("Visional");
  const [role, setRole] = useState("Webエンジニア");
  const [mode, setMode] = useState("一次面接");
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [keywords, setKeywords] = useState("");
  const [prep, setPrep] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);

  // ステップ1: 想定質問の生成(生成専用ルート)
  async function generatePrep() {
    setLoadingPrep(true);
    setError("");
    try {
      const res = await authFetch("/api/interview-sim", {
        method: "POST",
        body: JSON.stringify({ company, role, mode })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインが必要です。/login からログインしてください。");
        return;
      }
      setPrep(data.result || "");
    } finally {
      setLoadingPrep(false);
    }
  }

  // ステップ2: 回答の独立評価(検証分離: 生成とは別コンテキストで採点)
  async function evaluateAnswer() {
    if (!question || !answer) {
      setError("評価には「質問」と「あなたの回答」の両方が必要です。");
      return;
    }
    setLoadingEval(true);
    setError("");
    try {
      const res = await authFetch("/api/interview-evaluate", {
        method: "POST",
        body: JSON.stringify({
          company,
          role,
          question,
          answer,
          keywords: keywords.split(/[、,\s]+/).filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインが必要です。/login からログインしてください。");
        return;
      }
      setEvaluation(data.evaluation ?? null);
    } finally {
      setLoadingEval(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>AI面接シミュレーター</h1>
        <p>ステップ1で想定質問を生成し、ステップ2で回答を独立した採点AIが評価します。</p>
      </section>

      <section className="card">
        <h2>ステップ1: 面接条件と想定質問</h2>
        <label className="label">企業名</label>
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        <label className="label">職種</label>
        <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
        <label className="label">面接段階</label>
        <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>一次面接</option>
          <option>二次面接</option>
          <option>最終面接</option>
          <option>インターン面接</option>
          <option>人事面接</option>
          <option>技術面接</option>
        </select>
        <button className="button" onClick={generatePrep} disabled={loadingPrep}>
          {loadingPrep ? "生成中..." : "想定質問を生成"}
        </button>
      </section>

      {prep && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>想定質問と準備ポイント</h2>
          <div className="result">{prep}</div>
        </section>
      )}

      <section className="card" style={{ marginTop: 18 }}>
        <h2>ステップ2: 回答を採点する</h2>
        <label className="label">質問(想定質問から1つコピー、または実際に聞かれた質問)</label>
        <textarea className="textarea small" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <label className="label">あなたの回答</label>
        <textarea className="textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="実際に口に出すつもりで書いてください。" />
        <label className="label">含めたいキーワード(任意・読点区切り)</label>
        <input className="input" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="例: 個人開発、React、課題発見" />
        <button className="button" onClick={evaluateAnswer} disabled={loadingEval}>
          {loadingEval ? "採点中..." : "独立AIで採点"}
        </button>
        {error && <p className="muted" style={{ color: "#e25555" }}>{error}</p>}
      </section>

      {evaluation && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>採点結果</h2>
          {evaluation.raw ? (
            <div className="result">{evaluation.raw}</div>
          ) : (
            <div className="result">
              {evaluation.scores && (
                <>
                  {Object.entries(evaluation.scores).map(([k, v]) => (
                    <p key={k}>{k}: {v} / 5</p>
                  ))}
                  <p><strong>合計: {evaluation.total}</strong>(判定: {evaluation.verdict})</p>
                </>
              )}
              {evaluation.missing_keywords && evaluation.missing_keywords.length > 0 && (
                <p>不足キーワード: {evaluation.missing_keywords.join("、")}</p>
              )}
              {evaluation.weakest_point && <p>最弱ポイント: {evaluation.weakest_point}</p>}
              {evaluation.probing_question && <p>次の深掘り質問: {evaluation.probing_question}</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
