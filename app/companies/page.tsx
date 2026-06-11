"use client";

import { useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  status: string;
  deadline: string;
  nextAction: string;
  memo: string;
};

const initial: Company = {
  id: "",
  name: "",
  status: "検討中",
  deadline: "",
  nextAction: "",
  memo: ""
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<Company>(initial);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    if (saved) setCompanies(JSON.parse(saved));
  }, []);

  function save(next: Company[]) {
    setCompanies(next);
    window.localStorage.setItem("jobforge-companies", JSON.stringify(next));
  }

  function addCompany() {
    if (!form.name.trim()) return;

    const item = {
      ...form,
      id: crypto.randomUUID()
    };

    save([item, ...companies]);
    setForm(initial);
  }

  function removeCompany(id: string) {
    save(companies.filter((c) => c.id !== id));
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>企業管理</h1>
        <p>応募企業、選考状況、締切、次にやることを一元管理します。</p>
      </section>

      <section className="card">
        <h2>企業を追加</h2>

        <label className="label">企業名</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例: Visional" />

        <label className="label">選考状況</label>
        <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
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

        <label className="label">締切・次回予定日</label>
        <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />

        <label className="label">次にやること</label>
        <input className="input" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="例: 志望動機を作る / 面接練習する" />

        <label className="label">メモ</label>
        <textarea className="textarea small" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />

        <button className="button" onClick={addCompany}>追加</button>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>企業一覧</h2>
        {companies.length === 0 && <p className="muted">まだ企業が登録されていません。</p>}
        {companies.map((c) => (
          <div className="timeline-item" key={c.id}>
            <span className="status-pill">{c.status}</span>
            <h3>{c.name}</h3>
            <p className="muted">締切・予定: {c.deadline || "未設定"}</p>
            <p>次にやること: {c.nextAction || "未設定"}</p>
            {c.memo && <pre>{c.memo}</pre>}
            <button className="button secondary" onClick={() => removeCompany(c.id)}>削除</button>
          </div>
        ))}
      </section>
    </main>
  );
}
