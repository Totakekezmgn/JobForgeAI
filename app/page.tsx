"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  status: string;
  deadline: string;
  nextAction: string;
};

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    if (saved) {
      setCompanies(JSON.parse(saved));
    }
  }, []);

  const today = new Date();
  const urgent = companies.filter((c) => {
    if (!c.deadline) return false;
    const d = new Date(c.deadline);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  });

  return (
    <main className="container">
      <section className="hero">
        <h1>JobForge AI</h1>
        <p>IT就活の企業管理、締切、面接、企業研究、コーディングテスト対策を一元管理するAI就活OS。</p>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <h2>管理企業</h2>
          <div className="price">{companies.length}</div>
          <p className="muted">応募・検討中の企業</p>
          <Link className="button" href="/companies">企業を管理</Link>
        </div>

        <div className="card">
          <h2>直近締切</h2>
          <div className="price">{urgent.length}</div>
          <p className="muted">7日以内の締切</p>
          <Link className="button" href="/calendar">予定を見る</Link>
        </div>

        <div className="card">
          <h2>次の対策</h2>
          <div className="price">AI</div>
          <p className="muted">面接・企業研究・Code対策</p>
          <Link className="button" href="/interview">面接練習</Link>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>今日やるべきこと</h2>
          {urgent.length === 0 && <p className="muted">直近7日以内の締切はありません。企業管理から予定を追加してください。</p>}
          {urgent.map((c) => (
            <div className="timeline-item" key={c.id}>
              <strong>{c.name}</strong>
              <p className="muted">締切: {c.deadline}</p>
              <p>{c.nextAction || "次の行動を設定してください。"}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>主要機能</h2>
          <p><Link href="/companies">企業管理</Link></p>
          <p><Link href="/import-company">企業追加AI</Link></p>
          <p><Link href="/es">ES管理</Link></p>
          <p><Link href="/calendar">締切・予定管理</Link></p>
          <p><Link href="/tasks">タスク管理</Link></p>
          <p><Link href="/calendar-export">カレンダー出力</Link></p>
          <p><Link href="/research">AI企業研究</Link></p>
          <p><Link href="/live-research">自動企業リサーチ</Link></p>
          <p><Link href="/interview">AI面接シミュレーター</Link></p>
          <p><Link href="/voice-interview">音声面接練習</Link></p>
          <p><Link href="/interview-logs">面接ログ</Link></p>
          <p><Link href="/company">企業別コーディングテスト対策</Link></p>
          <p><Link href="/roadmap">Code学習ロードマップ</Link></p>
          <p><Link href="/data">データ管理・バックアップ</Link></p>
          <p><Link href="/cloud">クラウド同期</Link></p>
        </div>
      </section>
    </main>
  );
}
