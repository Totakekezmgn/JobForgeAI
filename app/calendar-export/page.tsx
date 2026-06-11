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

function formatDateForICS(date: string) {
  return date.replaceAll("-", "");
}

function escapeICS(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export default function CalendarExportPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("jobforge-companies");
    setCompanies(saved ? JSON.parse(saved) : []);
  }, []);

  function createICS() {
    const items = companies.filter((c) => c.deadline);

    if (items.length === 0) {
      setMessage("締切日が登録された企業がありません。");
      return;
    }

    const events = items.map((c) => {
      const date = formatDateForICS(c.deadline);
      const summary = escapeICS(`【就活締切】${c.name}`);
      const description = escapeICS(`状況: ${c.status || ""}\n次にやること: ${c.nextAction || ""}\nメモ: ${c.memo || ""}`);

      return [
        "BEGIN:VEVENT",
        `UID:${c.id || crypto.randomUUID()}@jobforge-ai`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT"
      ].join("\r\n");
    });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JobForge AI//Career Calendar//JA",
      "CALSCALE:GREGORIAN",
      ...events,
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobforge-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);

    setMessage(`${items.length}件の予定を書き出しました。`);
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>カレンダー出力</h1>
        <p>企業管理に登録した締切を、Google Calendarなどに取り込める .ics ファイルとして書き出します。</p>
      </section>

      <section className="warning-box">
        Google Calendar APIの直接連携ではありません。まずは低コスト運用のため、.ics書き出しで予定反映します。
      </section>

      <section className="card">
        <h2>書き出し対象</h2>
        <p>登録企業数: {companies.length}</p>
        <p>締切あり: {companies.filter((c) => c.deadline).length}</p>
        <button className="button" onClick={createICS}>.ics を書き出す</button>
        {message && <p className="success-box">{message}</p>}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>締切一覧</h2>
        {companies.filter((c) => c.deadline).length === 0 && <p className="muted">締切日が登録された企業がありません。</p>}
        {companies.filter((c) => c.deadline).map((c) => (
          <div className="timeline-item" key={c.id}>
            <strong>{c.name}</strong>
            <p className="muted">{c.deadline} / {c.status}</p>
            <p>{c.nextAction}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
