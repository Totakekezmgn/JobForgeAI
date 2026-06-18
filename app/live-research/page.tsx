"use client";

import { useState } from "react";
import { useAiConsentDialog } from "@/components/AiConsentDialog";
import { authFetch } from "@/lib/authFetch";

export default function LiveResearchPage() {
  const [company, setCompany] = useState("Visional");
  const [target, setTarget] = useState("インターンシップ・新卒採用・選考締切");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { consentDialog, consentMessage, runWithConsent } = useAiConsentDialog();

  async function research() {
    setLoading(true);
    setResult("");
    try {
      const res = await authFetch("/api/live-company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, target })
      });
      const data = await res.json();
      const output = data.result || "";
      setResult(output);
      window.localStorage.setItem("jobforge-last-research", JSON.stringify({
        company,
        target,
        result: output,
        savedAt: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>自動企業リサーチ</h1>
        <p>企業名から、選考情報・インターン締切・採用情報を調査し、就活向けに整理します。</p>
      </section>
      {consentDialog}
      {consentMessage && <p className="warning-box">{consentMessage}</p>}
      <section className="warning-box">正確な締切確認には公式採用サイト・マイページの確認が必須です。AIリサーチは補助として使ってください。</section>
      <section className="card">
        <label className="label">企業名</label>
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        <label className="label">調べたい内容</label>
        <input className="input" value={target} onChange={(e) => setTarget(e.target.value)} />
        <button className="button" onClick={() => runWithConsent(research)} disabled={loading}>{loading ? "リサーチ中..." : "自動リサーチ"}</button>
      </section>
      {result && <section className="card" style={{ marginTop: 18 }}><h2>リサーチ結果</h2><div className="result">{result}</div></section>}
    </main>
  );
}
