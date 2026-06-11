"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";

export default function CompanyPage() {
  const [company, setCompany] = useState("Visional");
  const [role, setRole] = useState("Webエンジニア");
  const [level, setLevel] = useState("初級");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePlan() {
    setLoading(true);

    try {
      const res = await authFetch("/api/company-prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ company, role, level })
      });

      const data = await res.json();
      setPlan(data.plan || "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>企業別コーディングテスト対策</h1>
        <p>企業名と職種から、対策カテゴリ・模擬問題・学習スケジュールを生成します。</p>
      </section>

      <section className="card">
        <h2>対策条件</h2>

        <label className="label">企業名</label>
        <input
          className="input"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="例: Visional, Sky, TOPPAN"
        />

        <label className="label">職種</label>
        <input
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="例: Webエンジニア, 開発職, SIer"
        />

        <label className="label">現在レベル</label>
        <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option>初級</option>
          <option>中級</option>
          <option>上級</option>
        </select>

        <button className="button" onClick={generatePlan} disabled={loading}>
          {loading ? "生成中..." : "企業別対策を生成"}
        </button>
      </section>

      {plan && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>対策プラン</h2>
          <div className="result">{plan}</div>
        </section>
      )}
    </main>
  );
}
