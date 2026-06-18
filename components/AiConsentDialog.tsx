"use client";

import { useRef, useState } from "react";
import { AI_CONSENT_REQUIRED_MESSAGE, hasAiConsent, saveAiConsent } from "@/lib/consent";

type PendingAction = (() => Promise<void> | void) | null;

export function useAiConsentDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const pendingActionRef = useRef<PendingAction>(null);

  async function runWithConsent(action: () => Promise<void> | void) {
    setMessage("");
    if (hasAiConsent()) {
      await action();
      return;
    }

    pendingActionRef.current = action;
    setOpen(true);
  }

  async function agree() {
    saveAiConsent();
    setOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) await action();
  }

  function reject() {
    pendingActionRef.current = null;
    setOpen(false);
    setMessage(AI_CONSENT_REQUIRED_MESSAGE);
  }

  return {
    consentMessage: message,
    runWithConsent,
    consentDialog: <AiConsentDialog open={open} onAgree={agree} onReject={reject} />
  };
}

function AiConsentDialog({ open, onAgree, onReject }: { open: boolean; onAgree: () => void; onReject: () => void }) {
  if (!open) return null;

  return (
    <section className="card" style={{ marginTop: 18 }} aria-label="AI外部送信への同意">
      <h2>AI外部送信への同意</h2>
      <p className="notice">
        入力内容は、回答生成・検索・コード実行のために OpenAI / Tavily / Piston 等の外部サービスへ送信される可能性があります。
        個人情報・機密情報は書かないでください。
      </p>
      <p className="muted">同意すると、AI機能・外部API機能を実行します。同意は全AI機能・外部API機能に共通です。</p>
      <button className="button" type="button" onClick={onAgree}>同意して実行</button>
      <button className="button secondary" type="button" onClick={onReject}>同意しない</button>
    </section>
  );
}
