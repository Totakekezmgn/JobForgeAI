"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

type DbHistory = { id: string; created_at: string; level: string; category: string; problem: string; answer: string; review: string; score: number | null; };

export default function HistoryPage() {
  const [items, setItems] = useState<DbHistory[]>([]);
  const [message, setMessage] = useState("読み込み中...");

  useEffect(() => {
    authFetch("/api/history").then(async (res) => {
      const data = await res.json();
      if (res.status === 401) { setMessage("ログインが必要です。/login からログインしてください。"); return; }
      if (!data.ok) { setMessage("Supabase未設定、または履歴がありません。"); return; }
      setItems(data.history || []); setMessage("");
    }).catch(() => setMessage("履歴取得に失敗しました。"));
  }, []);

  return (
    <main className="container">
      <section className="hero"><h1>学習履歴</h1><p>Supabaseに保存された直近50件の履歴を表示します。</p></section>
      {message && <p className="notice">{message}</p>}
      {items.map((item) => (
        <section className="card" style={{ marginBottom: 16 }} key={item.id}>
          <span className="badge">{item.level}</span><span className="badge">{item.category}</span>
          <p className="muted">{new Date(item.created_at).toLocaleString("ja-JP")}</p>
          <h2>問題</h2><div className="result">{item.problem}</div>
          <h2>回答</h2><pre>{item.answer}</pre>
          <h2>レビュー</h2><div className="result">{item.review}</div>
        </section>
      ))}
    </main>
  );
}
