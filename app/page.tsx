"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  status: string;
  deadline: string;
  nextAction: string;
  memo?: string;
};

// 企業管理ページ(/companies)と同じステータス一覧。順序は選考の進行順
const STATUSES = ["検討中", "IS応募予定", "ES作成中", "ES提出済み", "一次面接", "二次面接", "最終面接", "内定", "見送り"];

function statusControlId(id: string) {
  return `company-status-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [esCount, setEsCount] = useState(0);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    if (saved) setCompanies(JSON.parse(saved));

    const es = window.localStorage.getItem("jobforge-es-documents");
    setEsCount(es ? JSON.parse(es).length : 0);

    const logs = window.localStorage.getItem("jobforge-interview-logs");
    setLogCount(logs ? JSON.parse(logs).length : 0);
  }, []);

  // ダッシュボード上で選考状況を直接変更できるようにする(企業管理と同じ保存先)
  function updateStatus(id: string, status: string) {
    const next = companies.map((c) => (c.id === id ? { ...c, status } : c));
    setCompanies(next);
    window.localStorage.setItem("jobforge-companies", JSON.stringify(next));
  }

  function daysLeft(deadline: string): number | null {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function deadlineBadge(deadline: string) {
    const days = daysLeft(deadline);
    if (days === null) return null;
    if (days < 0) return <span className="status-pill status-danger">期限切れ {Math.abs(days)}日</span>;
    if (days === 0) return <span className="status-pill status-danger">今日締切</span>;
    if (days <= 3) return <span className="status-pill status-danger">あと{days}日</span>;
    if (days <= 7) return <span className="status-pill status-warning">あと{days}日</span>;
    return <span className="status-pill status-good">あと{days}日</span>;
  }

  function deadlineWarningLabel(deadline: string) {
    const days = daysLeft(deadline);
    if (days === null) return "";
    if (days < 0) return `期限切れ ${Math.abs(days)}日`;
    if (days === 0) return "今日締切";
    return `あと${days}日`;
  }

  function scrollToStatus(id: string) {
    const target = document.getElementById(statusControlId(id));
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus();
  }

  // 選考中(内定・見送り以外)の企業だけを締切順に並べる
  const active = companies.filter((c) => c.status !== "内定" && c.status !== "見送り");
  const withDeadline = [...active]
    .filter((c) => c.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const urgent = withDeadline.filter((c) => {
    const d = daysLeft(c.deadline);
    return d !== null && d >= 0 && d <= 7;
  });
  const overdue = withDeadline.filter((c) => {
    const d = daysLeft(c.deadline);
    return d !== null && d < 0;
  });
  const deadlineWarnings = withDeadline.filter((c) => {
    const d = daysLeft(c.deadline);
    return d !== null && d <= 3;
  });
  const visibleDeadlineCount = Math.max(8, deadlineWarnings.length);

  // ステータス別の件数(0件のものは表示しない)
  const statusCounts = STATUSES.map((s) => ({ status: s, count: companies.filter((c) => c.status === s).length }))
    .filter((s) => s.count > 0);

  return (
    <main className="container">
      <section className="hero">
        <h1>JobForge AI</h1>
        <p>IT就活の企業管理、締切、面接、企業研究、コーディングテスト対策を一元管理するAI就活OS。</p>
      </section>

      {deadlineWarnings.length > 0 && (
        <section className="warning-box" aria-label="締切リマインダー">
          <strong>締切リマインダー</strong>
          <p>対応が必要な企業があります。ステータスを更新する場合は企業名を選んでください。</p>
          <div className="warning-actions">
            {deadlineWarnings.map((c) => (
              <button className="button secondary" key={c.id} type="button" onClick={() => scrollToStatus(c.id)}>
                {c.name} / {deadlineWarningLabel(c.deadline)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-grid">
        <div className="card">
          <h2>選考中</h2>
          <div className="price">{active.length}<span className="muted" style={{ fontSize: 16 }}> / {companies.length}社</span></div>
          <p className="muted">内定 {companies.filter((c) => c.status === "内定").length} / 見送り {companies.filter((c) => c.status === "見送り").length}</p>
          <Link className="button" href="/companies">企業を管理</Link>
        </div>

        <div className="card">
          <h2>直近締切</h2>
          <div className="price">{urgent.length}</div>
          <p className="muted">7日以内の締切{overdue.length > 0 ? `(期限切れ ${overdue.length}件)` : ""}</p>
          <Link className="button" href="/calendar">予定を見る</Link>
        </div>

        <div className="card">
          <h2>対策の蓄積</h2>
          <div className="price">{esCount + logCount}</div>
          <p className="muted">ES {esCount}件 / 面接ログ {logCount}件</p>
          <Link className="button" href="/interview">面接練習</Link>
          <Link className="button secondary" href="/growth">弱点分析</Link>
        </div>
      </section>

      {statusCounts.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>選考ステータス</h2>
          <p>
            {statusCounts.map((s) => (
              <span className="badge" key={s.status}>{s.status} {s.count}</span>
            ))}
          </p>
        </section>
      )}

      <section className="grid" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>締切タイムライン</h2>
          {withDeadline.length === 0 && <p className="muted">締切が設定された企業はありません。企業管理から追加してください。</p>}
          {withDeadline.slice(0, visibleDeadlineCount).map((c) => (
            <div className="timeline-item" key={c.id}>
              <strong>{c.name}</strong> {deadlineBadge(c.deadline)}
              <p className="muted">{c.deadline} / {c.nextAction || "次の行動を設定してください"}</p>
              <select
                id={statusControlId(c.id)}
                className="select"
                style={{ maxWidth: 200, padding: 8 }}
                value={c.status}
                onChange={(e) => updateStatus(c.id, e.target.value)}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>主要機能</h2>
          <p><Link href="/companies">企業管理</Link> / <Link href="/import-company">企業追加AI</Link></p>
          <p><Link href="/es">ES管理</Link> / <Link href="/calendar">締切・予定管理</Link> / <Link href="/tasks">タスク管理</Link></p>
          <p><Link href="/research">AI企業研究</Link> / <Link href="/live-research">自動リサーチ</Link></p>
          <p><Link href="/interview">AI面接シミュレーター</Link> / <Link href="/voice-interview">音声面接練習</Link> / <Link href="/interview-logs">面接ログ</Link> / <Link href="/growth">弱点分析</Link></p>
          <p><Link href="/company">企業別Code対策</Link> / <Link href="/roadmap">Code学習ロードマップ</Link></p>
          <p><Link href="/data">データ管理</Link> / <Link href="/cloud">クラウド同期</Link> / <Link href="/calendar-export">カレンダー出力</Link></p>
        </div>
      </section>
    </main>
  );
}
