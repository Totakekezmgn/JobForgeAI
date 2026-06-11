"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

type CompanyDraft = {
  name: string;
  status: string;
  deadline: string;
  nextAction: string;
  memo: string;
  officialUrl: string;
};

export default function ImportCompanyPage() {
  const [companyHint, setCompanyHint] = useState("");
  const [researchText, setResearchText] = useState("");
  const [draft, setDraft] = useState<CompanyDraft | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-last-research");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompanyHint(parsed.company || "");
        setResearchText(parsed.result || "");
      } catch {}
    }
  }, []);

  async function parseResearch() {
    setLoading(true);
    setMessage("");

    try {
      const res = await authFetch("/api/parse-research-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ researchText, companyHint })
      });

      const data = await res.json();
      setDraft(data.company);
    } finally {
      setLoading(false);
    }
  }

  function saveCompany() {
    if (!draft?.name) return;

    const saved = window.localStorage.getItem("jobforge-companies");
    const companies = saved ? JSON.parse(saved) : [];

    const item = {
      id: crypto.randomUUID(),
      name: draft.name,
      status: draft.status || "検討中",
      deadline: draft.deadline || "",
      nextAction: draft.nextAction || "",
      memo: draft.memo || "",
      officialUrl: draft.officialUrl || ""
    };

    window.localStorage.setItem("jobforge-companies", JSON.stringify([item, ...companies]));
    setMessage(`${draft.name} を企業管理に追加しました。`);
  }

  function updateDraft(key: keyof CompanyDraft, value: string) {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>企業追加AI</h1>
        <p>自動リサーチ結果や採用情報メモから、企業管理に登録する情報を抽出します。</p>
      </section>

      <section className="warning-box">
        締切日はAIが誤る可能性があります。保存前に必ず公式採用サイト・マイページで確認してください。
      </section>

      <section className="card">
        <h2>リサーチ結果を貼り付け</h2>

        <label className="label">企業名ヒント</label>
        <input className="input" value={companyHint} onChange={(e) => setCompanyHint(e.target.value)} />

        <label className="label">リサーチ本文</label>
        <textarea
          className="textarea"
          value={researchText}
          onChange={(e) => setResearchText(e.target.value)}
          placeholder="自動企業リサーチ結果、採用ページのメモ、説明会メモなどを貼り付け"
        />

        <button className="button" onClick={parseResearch} disabled={!researchText || loading}>
          {loading ? "抽出中..." : "企業データを抽出"}
        </button>
      </section>

      {draft && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>登録プレビュー</h2>

          <div className="import-preview">
            <label className="label">企業名</label>
            <input className="input" value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} />

            <label className="label">選考状況</label>
            <select className="select" value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}>
              <option>検討中</option>
              <option>IS応募予定</option>
              <option>ES作成中</option>
              <option>ES提出済み</option>
              <option>一次面接</option>
              <option>二次面接</option>
              <option>最終面接</option>
              <option>内定</option>
              <option>見送り</option>
            </select>

            <label className="label">締切候補</label>
            <input className="input" type="date" value={draft.deadline || ""} onChange={(e) => updateDraft("deadline", e.target.value)} />

            <label className="label">次にやること</label>
            <input className="input" value={draft.nextAction} onChange={(e) => updateDraft("nextAction", e.target.value)} />

            <label className="label">公式URL</label>
            <input className="input" value={draft.officialUrl} onChange={(e) => updateDraft("officialUrl", e.target.value)} />

            <label className="label">メモ</label>
            <textarea className="textarea small" value={draft.memo} onChange={(e) => updateDraft("memo", e.target.value)} />

            <button className="button" onClick={saveCompany}>企業管理に追加</button>
          </div>

          {message && <p className="success-box">{message}</p>}
        </section>
      )}
    </main>
  );
}
