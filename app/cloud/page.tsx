"use client";

import { useEffect, useState } from "react";
import { authFetch, getCurrentUser } from "@/lib/authFetch";
import { getJobForgeUserKey } from "@/lib/userKey";

const LOGIN_MESSAGE = "ログインが必要です。/login からログインしてください。";

export default function CloudPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [localCompanies, setLocalCompanies] = useState<any[]>([]);
  const [cloudCompanies, setCloudCompanies] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    setLocalCompanies(saved ? JSON.parse(saved) : []);
    getCurrentUser().then((u) => {
      setEmail(u?.email ?? null);
      if (u) fetchCloud();
      else setMessage(LOGIN_MESSAGE);
    });
  }, []);

  async function fetchCloud() {
    const res = await authFetch("/api/companies");
    const data = await res.json();
    if (res.status === 401) { setMessage(LOGIN_MESSAGE); return; }
    if (!data.ok) { setMessage("Supabase未設定です。ローカル保存のみ利用中です。"); return; }
    setCloudCompanies(data.companies || []);
    setMessage("クラウド情報を取得しました。");
  }

  async function syncToCloud() {
    const res = await authFetch("/api/companies/sync", {
      method: "POST",
      body: JSON.stringify({ companies: localCompanies })
    });
    const data = await res.json();
    if (res.status === 401) { setMessage(LOGIN_MESSAGE); return; }
    if (!data.ok) { setMessage("Supabase未設定、または同期に失敗しました。"); return; }
    setMessage(`${data.synced}件をクラウドへ同期しました。`);
    fetchCloud();
  }

  // v2.7: 旧UUID(v2.5以前)で保存したクラウドデータを今のアカウントへ引き継ぐ
  async function migrateLegacy() {
    const legacyId = getJobForgeUserKey();
    const res = await authFetch("/api/migrate-legacy", {
      method: "POST",
      body: JSON.stringify({ legacyId })
    });
    const data = await res.json();
    if (res.status === 401) { setMessage(LOGIN_MESSAGE); return; }
    if (!data.ok) { setMessage(data.error || "引き継ぎに失敗しました。"); return; }
    setMessage(`旧データ${data.migrated}件をこのアカウントへ引き継ぎました。`);
    fetchCloud();
  }

  function importCloudToLocal() {
    const converted = cloudCompanies.map((c) => ({
      id: c.local_id || c.id,
      name: c.name,
      status: c.status || "検討中",
      deadline: c.deadline || "",
      nextAction: c.next_action || "",
      memo: c.memo || "",
      officialUrl: c.official_url || ""
    }));
    window.localStorage.setItem("jobforge-companies", JSON.stringify(converted));
    setLocalCompanies(converted);
    setMessage("クラウド情報をローカルへ復元しました。");
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>クラウド同期</h1>
        <p>ローカルに保存された企業情報をSupabaseへ同期します。クラウド保存はこの画面で明示的に実行した場合のみ行われます。</p>
      </section>

      <section className="card">
        <h2>同期状態</h2>
        <p className="muted">{email ? `ログイン中: ${email}` : "未ログイン(ローカル保存のみ)"}</p>
        <p>ローカル企業数: <strong>{localCompanies.length}</strong></p>
        <p>クラウド企業数: <strong>{cloudCompanies.length}</strong></p>

        <button className="button" onClick={syncToCloud} disabled={localCompanies.length === 0}>
          ローカル企業情報をクラウド保存
        </button>
        <button className="button secondary" onClick={() => fetchCloud()}>
          クラウド情報を再取得
        </button>
        <button className="button secondary" onClick={importCloudToLocal} disabled={cloudCompanies.length === 0}>
          クラウドからローカルへ復元
        </button>
        <button className="button secondary" onClick={migrateLegacy}>
          旧データをこのアカウントへ引き継ぐ
        </button>

        {message && <p className="cloud-status">{message}</p>}
      </section>

      <section className="grid" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>ローカル企業</h2>
          {localCompanies.map((c) => (
            <div className="timeline-item" key={c.id}>
              <strong>{c.name}</strong>
              <p className="muted">{c.status} / {c.deadline || "未設定"}</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h2>クラウド企業</h2>
          {cloudCompanies.map((c) => (
            <div className="timeline-item" key={c.id}>
              <strong>{c.name}</strong>
              <p className="muted">{c.status} / {c.deadline || "未設定"}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
