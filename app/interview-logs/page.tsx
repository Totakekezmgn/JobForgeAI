"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

export default function InterviewLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    role: "Webエンジニア",
    interviewDate: "",
    questions: "",
    answers: "",
    reflection: "",
    nextActions: ""
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const res = await authFetch("/api/interview-logs");
    const data = await res.json();

    if (!data.ok) {
      const local = window.localStorage.getItem("jobforge-interview-logs");
      setLogs(local ? JSON.parse(local) : []);
      setMessage(res.status === 401 ? "ログインが必要です。/login からログインしてください。未ログインの間はローカル保存で動作します。" : "Supabase未設定です。ローカルログを表示しています。");
      return;
    }

    setLogs(data.logs || []);
    setMessage("クラウド面接ログを取得しました。");
  }

  async function saveLog() {
    const item = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    const res = await authFetch("/api/interview-logs", {
      method: "POST",
      body: JSON.stringify(item)
    });

    const data = await res.json();

    if (!data.ok) {
      const saved = window.localStorage.getItem("jobforge-interview-logs");
      const localLogs = saved ? JSON.parse(saved) : [];
      const next = [item, ...localLogs];
      window.localStorage.setItem("jobforge-interview-logs", JSON.stringify(next));
      setLogs(next);
      setMessage(res.status === 401 ? "ログインが必要です。/login からログインしてください。未ログインの間はローカル保存で動作します。" : "Supabase未設定のため、面接ログをローカル保存しました。");
    } else {
      setMessage("面接ログをクラウド保存しました。");
      fetchLogs();
    }

    setForm({
      companyName: "",
      role: "Webエンジニア",
      interviewDate: "",
      questions: "",
      answers: "",
      reflection: "",
      nextActions: ""
    });
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>面接ログ</h1>
        <p>面接で聞かれたこと、回答、反省、次回改善点を保存します。</p>
      </section>

      <section className="card">
        <h2>ログ追加</h2>

        <label className="label">企業名</label>
        <input className="input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />

        <label className="label">職種</label>
        <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />

        <label className="label">面接日</label>
        <input className="input" type="date" value={form.interviewDate} onChange={(e) => setForm({ ...form, interviewDate: e.target.value })} />

        <label className="label">聞かれた質問</label>
        <textarea className="textarea small" value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} />

        <label className="label">自分の回答</label>
        <textarea className="textarea small" value={form.answers} onChange={(e) => setForm({ ...form, answers: e.target.value })} />

        <label className="label">反省</label>
        <textarea className="textarea small" value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} />

        <label className="label">次回改善</label>
        <textarea className="textarea small" value={form.nextActions} onChange={(e) => setForm({ ...form, nextActions: e.target.value })} />

        <button className="button" onClick={saveLog} disabled={!form.companyName}>
          保存
        </button>

        {message && <p className="cloud-status">{message}</p>}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>保存済みログ</h2>
        {logs.length === 0 && <p className="muted">まだ面接ログがありません。</p>}
        {logs.map((log) => (
          <div className="log-box" key={log.id}>
            <h3>{log.company_name || log.companyName}</h3>
            <p className="muted">{log.role} / {log.interview_date || log.interviewDate || "日付未設定"}</p>
            <h4>質問</h4>
            <div className="result">{log.questions}</div>
            <h4>回答</h4>
            <div className="result">{log.answers}</div>
            <h4>反省</h4>
            <div className="result">{log.reflection}</div>
            <h4>次回改善</h4>
            <div className="result">{log.next_actions || log.nextActions}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
