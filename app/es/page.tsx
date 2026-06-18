"use client";

import { useEffect, useMemo, useState } from "react";
import { useAiConsentDialog } from "@/components/AiConsentDialog";
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
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const { consentDialog, consentMessage, runWithConsent } = useAiConsentDialog();

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
    const versionNumber = getVersionCount(documents, companyName, documentType) + 1;
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
      setMessage(res.status === 401 ? `ログインが必要です。/login からログインしてください。未ログインの間はローカル保存で動作します。v${versionNumber}として保存しました。` : `Supabase未設定のため、ESをローカル保存しました。v${versionNumber}として保存しました。`);
    } else {
      setDocuments([data.document, ...documents]);
      setMessage(`ESをクラウド保存しました。v${versionNumber}として保存しました。`);
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

  function previewVersion(doc: any) {
    setPreviewDocument(doc);
  }

  function restoreVersion(doc: any, versionLabel: string) {
    loadDocument(doc);
    setPreviewDocument(doc);
    setMessage(`${versionLabel}を編集欄に復元しました。保存すると新しい版として追加されます。`);
  }

  const count = content.length;
  const limitNum = Number(limit || 0);
  const over = limitNum > 0 && count > limitNum;
  const documentGroups = useMemo(() => groupDocuments(documents), [documents]);

  return (
    <main className="container">
      <section className="hero">
        <h1>ES管理</h1>
        <p>企業ごとの志望動機・自己PR・ガクチカ・逆質問を保存し、AIで改善します。</p>
      </section>
      {consentDialog}
      {consentMessage && <p className="warning-box">{consentMessage}</p>}

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

          <button className="button" onClick={() => runWithConsent(reviewES)} disabled={!content || loadingReview}>
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
        {documentGroups.map((group) => (
          <div className="log-box" key={group.key}>
            <span className="badge">{group.documentType}</span>
            <strong>{group.companyName}</strong>
            <p className="muted">{group.versions.length}版 / 最新: {formatDate(group.latestAt)}</p>
            {group.versions.map((version) => (
              <div className="test-row" key={version.doc.id || `${group.key}-${version.version}`}>
                <span className="badge">v{version.version}</span>
                <strong>{version.title || `${group.companyName}_${group.documentType}`}</strong>
                <p className="muted">{formatDate(version.createdAt)}</p>
                <div className="result">{String(version.content || "").slice(0, 180)}...</div>
                <button className="button secondary" onClick={() => previewVersion(version.doc)}>閲覧</button>
                <button className="button" onClick={() => restoreVersion(version.doc, `v${version.version}`)}>この版を復元</button>
              </div>
            ))}
          </div>
        ))}
      </section>

      {previewDocument && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>版の閲覧</h2>
          <span className="badge">{getDocumentType(previewDocument)}</span>
          <strong>{getCompanyName(previewDocument)}</strong>
          <p className="muted">{getTitle(previewDocument)} / {formatDate(getCreatedAt(previewDocument))}</p>
          <div className="result">{getContent(previewDocument)}</div>
          {(previewDocument.ai_review || previewDocument.aiReview) && (
            <>
              <h2>この版のAI添削</h2>
              <div className="result">{previewDocument.ai_review || previewDocument.aiReview}</div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function groupDocuments(documents: any[]) {
  const map = new Map<string, { key: string; companyName: string; documentType: string; latestAt: string; docs: any[] }>();
  for (const doc of documents) {
    const companyName = getCompanyName(doc);
    const documentType = getDocumentType(doc);
    const key = `${companyName}__${documentType}`;
    const createdAt = getCreatedAt(doc);
    const group = map.get(key);
    if (!group) {
      map.set(key, { key, companyName, documentType, latestAt: createdAt, docs: [doc] });
      continue;
    }
    group.docs.push(doc);
    if (Date.parse(createdAt) > Date.parse(group.latestAt)) group.latestAt = createdAt;
  }

  return Array.from(map.values())
    .map((group) => {
      const oldestFirst = [...group.docs].sort((a, b) => Date.parse(getCreatedAt(a)) - Date.parse(getCreatedAt(b)));
      return {
        ...group,
        versions: oldestFirst.map((doc, index) => ({
          doc,
          version: index + 1,
          title: getTitle(doc),
          content: getContent(doc),
          createdAt: getCreatedAt(doc)
        })).reverse()
      };
    })
    .sort((a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt));
}

function getVersionCount(documents: any[], companyName: string, documentType: string) {
  return documents.filter((doc) => getCompanyName(doc) === normalizeCompanyName(companyName) && getDocumentType(doc) === normalizeDocumentType(documentType)).length;
}

function getCompanyName(doc: any) {
  return normalizeCompanyName(doc.company_name || doc.companyName || "");
}

function getDocumentType(doc: any) {
  return normalizeDocumentType(doc.document_type || doc.documentType || "");
}

function getTitle(doc: any) {
  return doc.title || "";
}

function getContent(doc: any) {
  return String(doc.content || "");
}

function getCreatedAt(doc: any) {
  return doc.created_at || doc.createdAt || doc.updated_at || doc.updatedAt || "";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "日付未設定";
  return date.toLocaleDateString("ja-JP");
}

function normalizeCompanyName(value: string) {
  return value.trim() || "企業未設定";
}

function normalizeDocumentType(value: string) {
  return value.trim() || "その他";
}
