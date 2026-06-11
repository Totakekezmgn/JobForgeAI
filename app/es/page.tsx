"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

const types = ["志望動機", "自己PR", "ガクチカ", "逆質問", "その他"];

export default function ESPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [documentType, setDocumentType] = useState("志望動機");
  const [title, setTitle] = useState("");
  const [limit, setLimit] = useState("400");
  const [content, setContent] = useState("");
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    const savedCompanies = window.localStorage.getItem("jobforge-companies");
    const localCompanies = savedCompanies ? JSON.parse(savedCompanies) : [];
    setCompanies(localCompanies);
    if (localCompanies[0]?.name) setCompanyName(localCompanies[0].name);

    const savedDocs = window.localStorage.getItem("jobforge-es-documents");
    setDocuments(savedDocs ? JSON.parse(savedDocs) : []);

    authFetch("/api/es-documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.documents?.length) setDocuments(data.documents);
      })
      .catch(() => {});
  }, []);

  function saveLocal(next: any[]) {
    setDocuments(next);
    window.localStorage.setItem("jobforge-es-documents", JSON.stringify(next));
  }

  async function saveDocument() {
    const item = {
      id: crypto.randomUUID(),
      companyName,
      documentType,
      title: title || `${companyName}_${documentType}`,
      content,
      aiReview: review,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await authFetch("/api/es-documents", {
      method: "POST",
      body: JSON.stringify(item)
    });

    const data = await res.json();

    if (!data.ok) {
      saveLocal([item, ...documents]);
      setMessage(res.status === 401 ? "ログインが必要です。/login からログインしてください。未ログインの間はローカル保存で動作します。" : "Supabase未設定のため、ESをローカル保存しました。");
    } else {
      setDocuments([data.document, ...documents]);
      setMessage("ESをクラウド保存しました。");
    }
  }

  async function reviewES() {
    setLoadingReview(true);
    try {
      const res = await authFetch("/api/es-review", {
        method: "POST",
        body: JSON.stringify({ companyName, documentType, content, limit })
      });
      const data = await res.json();
      if (res.status === 401) { setMessage("ログインが必要です。/login からログインしてください。未ログインの間はローカル保存で動作します。"); return; }
      setReview(data.review || data.error || "");
    } finally {
      setLoadingReview(false);
    }
  }

  function loadDocument(doc: any) {
    setCompanyName(doc.company_name || doc.companyName || "");
    setDocumentType(doc.document_type || doc.documentType || "志望動機");
    setTitle(doc.title || "");
    setContent(doc.content || "");
    setReview(doc.ai_review || doc.aiReview || "");
  }

  const count = content.length;
  const limitNum = Number(limit || 0);
  const over = limitNum > 0 && count > limitNum;

  return (
    <main className="container">
      <section className="hero">
        <h1>ES管理</h1>
        <p>企業ごとの志望動機・自己PR・ガクチカ・逆質問を保存し、AIで改善します。</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>文書作成</h2>

          <label className="label">企業名</label>
          <input
            className="input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            list="company-list"
          />
          <datalist id="company-list">
            {companies.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>

          <label className="label">文書タイプ</label>
          <div className="es-tabs">
            {types.map((t) => (
              <button
                className={documentType === t ? "es-tab active" : "es-tab"}
                key={t}
                onClick={() => setDocumentType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="label">タイトル</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label className="label">文字数目安</label>
          <input className="input" value={limit} onChange={(e) => setLimit(e.target.value)} />

          <label className="label">本文</label>
          <textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="es-counter" style={{ color: over ? "#fecaca" : undefined }}>
            {count} / {limit || "指定なし"}文字
          </div>

          <button className="button" onClick={reviewES} disabled={!content || loadingReview}>
            {loadingReview ? "添削中..." : "AI添削"}
          </button>
          <button className="button secondary" onClick={saveDocument} disabled={!content}>
            保存
          </button>

          {message && <p className="success-box">{message}</p>}
        </div>

        <div className="card">
          <h2>AI添削結果</h2>
          <div className="result">{review || "ここにAI添削結果が表示されます。"}</div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>保存済みES</h2>
        {documents.length === 0 && <p className="muted">まだ保存されたESはありません。</p>}
        {documents.map((doc) => (
          <div className="log-box" key={doc.id}>
            <span className="badge">{doc.document_type || doc.documentType}</span>
            <strong>{doc.company_name || doc.companyName || "企業未設定"}</strong>
            <p className="muted">{doc.title}</p>
            <div className="result">{String(doc.content || "").slice(0, 180)}...</div>
            <button className="button secondary" onClick={() => loadDocument(doc)}>編集欄に読み込む</button>
          </div>
        ))}
      </section>
    </main>
  );
}
