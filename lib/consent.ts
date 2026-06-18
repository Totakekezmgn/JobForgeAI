export type AiConsent = {
  version: "v1";
  agreedAt: string;
  scope: "ai-and-external-api";
};

export const AI_CONSENT_STORAGE_KEY = "jobforge-ai-consent";
export const AI_CONSENT_VERSION = "v1";
export const AI_CONSENT_SCOPE = "ai-and-external-api";
export const AI_CONSENT_REQUIRED_MESSAGE = "AI機能の利用には外部送信への同意が必要です";

export function readAiConsent(): AiConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(AI_CONSENT_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (isValidAiConsent(parsed)) return parsed;
  } catch {
    return null;
  }

  return null;
}

export function hasAiConsent() {
  return readAiConsent() !== null;
}

export function saveAiConsent(): AiConsent | null {
  if (typeof window === "undefined") return null;

  const consent: AiConsent = {
    version: AI_CONSENT_VERSION,
    agreedAt: new Date().toISOString(),
    scope: AI_CONSENT_SCOPE
  };

  window.localStorage.setItem(AI_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

export function resetAiConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AI_CONSENT_STORAGE_KEY);
}

function isValidAiConsent(value: unknown): value is AiConsent {
  if (!value || typeof value !== "object") return false;
  const consent = value as Partial<AiConsent>;
  return consent.version === AI_CONSENT_VERSION && consent.scope === AI_CONSENT_SCOPE && typeof consent.agreedAt === "string";
}
