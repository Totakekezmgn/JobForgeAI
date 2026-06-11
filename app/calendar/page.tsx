"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

type Company = {
  id: string;
  name: string;
  status: string;
  deadline: string;
  nextAction: string;
  memo: string;
};

export default function CalendarPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    if (saved) {
      const data = JSON.parse(saved);
      setCompanies(data.sort((a: Company, b: Company) => (a.deadline || "").localeCompare(b.deadline || "")));
    }
  }, []);

  function getStatusClass(deadline: string) {
    if (!deadline) return "status-pill";
    const today = new Date();
    const d = new Date(deadline);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 3) return "status-pill status-danger";
    if (diff <= 7) return "status-pill status-warning";
    return "status-pill status-good";
  }

  async function generateAdvice() {
    setLoading(true);
    try {
      const res = await authFetch("/api/schedule-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies })
      });
      const data = await res.json();
      setAdvice(data.advice || "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>締切・予定管理</h1>
        <p>IS、ES、面接、コーディングテストの締切を時系列で管理します。</p>
      </section>

      <section className="card">
        <h2>AIスケジュール助言</h2>
        <p className="muted">登録企業の締切と次アクションから、優先順位を提案します。</p>
        <button className="button" onClick={generateAdvice} disabled={loading}>
          {loading ? "分析中..." : "今日の優先順位を出す"}
        </button>
        {advice && <div className="result" style={{ marginTop: 16 }}>{advice}</div>}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>予定タイムライン</h2>
        {companies.length === 0 && <p className="muted">企業管理から企業と締切を追加してください。</p>}
        {companies.map((c) => (
          <div className="timeline-item" key={c.id}>
            <span className={getStatusClass(c.deadline)}>{c.deadline || "日付未設定"}</span>
            <h3>{c.name}</h3>
            <p className="muted">{c.status}</p>
            <p>{c.nextAction || "次の行動が未設定です。"}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
