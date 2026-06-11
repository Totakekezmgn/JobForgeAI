"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";

export default function ResearchPage() {
  const [company, setCompany] = useState("Visional");
  const [memo, setMemo] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function research() {
    setLoading(true);
    try {
      const res = await authFetch("/api/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, memo })
      });
      const data = await res.json();
      setResult(data.result || "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>AI企業研究</h1>
        <p>企業名と自分のメモから、志望動機・面接対策に使える企業研究を整理します。</p>
      </section>

      <section className="card">
        <label className="label">企業名</label>
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />

        <label className="label">説明会メモ・気になった点</label>
        <textarea className="textarea" value={memo} onChange={(e) => setMemo(e.target.value)} />

        <button className="button" onClick={research} disabled={loading}>
          {loading ? "分析中..." : "企業研究を生成"}
        </button>
      </section>

      {result && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>企業研究結果</h2>
          <div className="result">{result}</div>
        </section>
      )}
    </main>
  );
}
