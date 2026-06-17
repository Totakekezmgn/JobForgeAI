"use client";

import { useEffect, useState } from "react";

const DATA_KEYS = [
  { key: "jobforge-companies", label: "企業" },
  { key: "jobforge-es-documents", label: "ES" },
  { key: "jobforge-interview-logs", label: "面接ログ" },
  { key: "jobforge-evaluations", label: "採点履歴" }
];

export default function DataPage() {
  const [storedData, setStoredData] = useState<Record<string, any[]>>({});
  const [message, setMessage] = useState("");

  useEffect(() => { load(); }, []);

  function load() {
    setStoredData(readAllData());
  }

  function exportData() {
    const payload = {
      app: "JobForge AI",
      version: "3.0",
      exportedAt: new Date().toISOString(),
      ...readAllData()
    };
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
        const imported = extractBackupData(parsed);
        if (Object.keys(imported).length === 0) {
          setMessage("読み込みに失敗しました。復元できるデータが見つかりません。");
          return;
        }
        for (const item of DATA_KEYS) {
          if (Array.isArray(imported[item.key])) {
            window.localStorage.setItem(item.key, JSON.stringify(imported[item.key]));
          }
        }
        load();
        setMessage(`バックアップを復元しました。${summaryText(readAllData())}`);
      } catch {
        setMessage("JSONの読み込みに失敗しました。");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function clearData() {
    if (!confirm("JobForge AIのローカル保存データ4種類をすべて削除しますか？")) return;
    if (!confirm("この操作は元に戻せません。バックアップ済みでなければキャンセルしてください。")) return;
    for (const item of DATA_KEYS) window.localStorage.removeItem(item.key);
    setStoredData(readAllData());
    setMessage("ローカル保存データをすべて削除しました。");
  }

  const companies = storedData["jobforge-companies"] || [];
  const hasAnyData = DATA_KEYS.some((item) => (storedData[item.key] || []).length > 0);

  return (
    <main className="container">
      <section className="hero">
        <h1>データ管理</h1>
        <p>企業・ES・面接ログ・採点履歴をまとめてバックアップ・復元します。</p>
      </section>

      <section className="warning-box">
        現在のv3.0は主要データをブラウザに保存します。別PC・別ブラウザ・キャッシュ削除では情報が消える可能性があります。
        本格運用ではSupabaseなどのクラウドDB保存が必要です。
      </section>

      <section className="card">
        <h2>保存状態</h2>
        {DATA_KEYS.map((item) => (
          <p key={item.key}>{item.label}: <strong>{(storedData[item.key] || []).length}</strong>件</p>
        ))}
        <button className="button" onClick={exportData} disabled={!hasAnyData}>JSONでバックアップ</button>

        <label className="label">バックアップを復元</label>
        <input className="input" type="file" accept="application/json" onChange={importData} />

        <button className="button secondary" onClick={clearData} disabled={!hasAnyData}>全データを削除</button>
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

function readAllData() {
  const data: Record<string, any[]> = {};
  for (const item of DATA_KEYS) {
    data[item.key] = readArray(item.key);
  }
  return data;
}

function readArray(key: string) {
  try {
    const saved = window.localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function extractBackupData(parsed: any) {
  const imported: Record<string, any[]> = {};

  if (Array.isArray(parsed)) {
    imported["jobforge-companies"] = parsed;
    return imported;
  }

  if (Array.isArray(parsed?.companies)) {
    imported["jobforge-companies"] = parsed.companies;
  }

  for (const item of DATA_KEYS) {
    if (Array.isArray(parsed?.[item.key])) imported[item.key] = parsed[item.key];
  }

  return imported;
}

function summaryText(data: Record<string, any[]>) {
  return DATA_KEYS.map((item) => `${item.label}${(data[item.key] || []).length}件`).join(" / ");
}
