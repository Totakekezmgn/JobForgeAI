"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { useAiConsentDialog } from "@/components/AiConsentDialog";

type Company = {
  id: string;
  name: string;
  status: string;
  deadline: string;
  nextAction: string;
  memo: string;
};

export default function TasksPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const { consentDialog, consentMessage, runWithConsent } = useAiConsentDialog();

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    const data = saved ? JSON.parse(saved) : [];
    setCompanies(data);
  }, []);

  const tasks = companies
    .filter((c) => c.nextAction || c.deadline)
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));

  async function suggest() {
    setLoading(true);
    try {
      const res = await authFetch("/api/suggest-next-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ companies })
      });
      const data = await res.json();
      setAdvice(data.advice || "");
    } finally {
      setLoading(false);
    }
  }

  function daysLeft(deadline: string) {
    if (!deadline) return null;
    const today = new Date();
    const d = new Date(deadline);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>タスク管理</h1>
        <p>企業ごとの次アクションを一覧化し、今日やるべきことを整理します。</p>
      </section>
      {consentDialog}
      {consentMessage && <p className="warning-box">{consentMessage}</p>}

      <section className="card">
        <h2>AI次アクション提案</h2>
        <p className="muted">登録企業の選考状況と締切から、今日やるべきことを提案します。</p>
        <button className="button" onClick={() => runWithConsent(suggest)} disabled={loading}>
          {loading ? "提案中..." : "今日のタスクを提案"}
        </button>
        {advice && <div className="result" style={{ marginTop: 16 }}>{advice}</div>}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>タスク一覧</h2>
        {tasks.length === 0 && <p className="muted">企業管理で「次にやること」を登録してください。</p>}
        {tasks.map((c) => {
          const left = daysLeft(c.deadline);
          return (
            <div className="task-item" key={c.id}>
              <strong>{c.name}</strong>
              <p className="task-meta">
                {c.status} / 締切: {c.deadline || "未設定"}
                {left !== null && ` / あと${left}日`}
              </p>
              <p>{c.nextAction || "次アクション未設定"}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
