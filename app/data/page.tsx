"use client";

import { useEffect, useState } from "react";

export default function DataPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => { load(); }, []);

  function load() {
    const saved = window.localStorage.getItem("jobforge-companies");
    setCompanies(saved ? JSON.parse(saved) : []);
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), app: "JobForge AI", version: "2.1", companies };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("バックアップを書き出しました。");
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedCompanies = Array.isArray(parsed) ? parsed : parsed.companies;
        if (!Array.isArray(importedCompanies)) {
          setMessage("読み込みに失敗しました。companies配列が見つかりません。");
          return;
        }
        window.localStorage.setItem("jobforge-companies", JSON.stringify(importedCompanies));
        setCompanies(importedCompanies);
        setMessage("バックアップを復元しました。");
      } catch {
        setMessage("JSONの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  }

  function clearData() {
    if (!confirm("企業管理データを削除しますか？")) return;
    window.localStorage.removeItem("jobforge-companies");
    setCompanies([]);
    setMessage("企業管理データを削除しました。");
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>データ管理</h1>
        <p>登録した企業情報をバックアップ・復元します。</p>
      </section>

      <section className="warning-box">
        現在のv2.1はブラウザ保存です。別PC・別ブラウザ・キャッシュ削除では情報が消える可能性があります。
        本格運用ではSupabaseなどのクラウドDB保存が必要です。
      </section>

      <section className="card">
        <h2>保存状態</h2>
        <p>登録企業数: <strong>{companies.length}</strong></p>
        <button className="button" onClick={exportData} disabled={companies.length === 0}>JSONでバックアップ</button>

        <label className="label">バックアップを復元</label>
        <input className="input" type="file" accept="application/json" onChange={importData} />

        <button className="button secondary" onClick={clearData}>企業データを削除</button>
        {message && <p className="success-box">{message}</p>}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>現在の企業データ</h2>
        {companies.length === 0 && <p className="muted">保存データはありません。</p>}
        {companies.map((c) => (
          <div className="timeline-item" key={c.id}>
            <strong>{c.name}</strong>
            <p className="muted">{c.status} / {c.deadline || "締切未設定"}</p>
            <p>{c.nextAction}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
