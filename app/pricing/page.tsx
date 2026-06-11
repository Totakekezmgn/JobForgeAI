"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";

export default function PricingPage() {
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    authFetch("/api/me").then((res) => res.json()).then((data) => setPlan(data.plan || "free")).catch(() => setPlan("free"));
  }, []);

  async function startCheckout() {
    setMessage("");
    const res = await authFetch("/api/create-checkout-session", { method: "POST", body: JSON.stringify({}) });
    const data = await res.json();
    if (res.status === 401) { setMessage("ログインが必要です。/login からログインしてください。"); return; }
    if (!res.ok || !data.url) {
      setMessage(data.message || "Checkout作成に失敗しました。");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <main className="container">
      <section className="hero"><h1>料金プラン</h1><p>最初は無料で試し、必要になったらProへ。</p><p style={{ marginTop: 12 }}>現在の状態: <span className={plan === "pro" ? "badge pro" : "badge"}>{plan.toUpperCase()}</span></p></section>
      <div className="grid">
        <section className="card"><h2>Free</h2><div className="price">¥0</div><p className="muted">1日5回まで</p><ul><li>問題生成</li><li>AI採点</li><li>簡易テスト判定</li></ul></section>
        <section className="card"><h2>Pro</h2><div className="price">¥480/月</div><p className="muted">就活期の集中対策向け</p><ul><li>無制限利用</li><li>外部実行API連携</li><li>苦手分野分析</li><li>クラウド履歴保存</li></ul><button className="button" onClick={startCheckout}>{plan === "pro" ? "Pro利用中" : "Proを開始"}</button>{message && <p className="notice">{message}</p>}</section>
      </div>
    </main>
  );
}
