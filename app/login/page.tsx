"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    if (!supabase) {
      setMessage("Supabase未設定です。.env.localを設定してください。");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
    setMessage(error ? error.message : "ログイン用メールを送信しました。");
  }

  return (
    <main className="container">
      <section className="hero"><h1>ログイン</h1><p>学習履歴をクラウド保存するためのログイン画面です。</p></section>
      <section className="card">
        <label className="label">メールアドレス</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <button className="button" onClick={handleLogin}>ログインリンクを送信</button>
        {message && <p className="muted">{message}</p>}
      </section>
    </main>
  );
}
