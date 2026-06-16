export type EvaluationSource = "text" | "voice";

export type StoredEvaluation = {
  id: string;
  createdAt: string;
  company: string;
  role: string;
  question: string;
  scores: Record<string, number>;
  total: number;
  verdict: string;
  missing_keywords: string[];
  source: EvaluationSource;
};

type EvaluationResult = {
  scores?: Record<string, number>;
  total?: number;
  verdict?: string;
  missing_keywords?: string[];
};

const STORAGE_KEY = "jobforge-evaluations";
const MAX_EVALUATION_HISTORY = 100;

export function loadEvaluations(): StoredEvaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvaluation(input: {
  company: string;
  role: string;
  question: string;
  evaluation: EvaluationResult | null | undefined;
  source: EvaluationSource;
}): StoredEvaluation | null {
  if (!input.evaluation?.scores || typeof window === "undefined") return null;

  const item: StoredEvaluation = {
    id: createId(),
    createdAt: new Date().toISOString(),
    company: input.company,
    role: input.role,
    question: input.question,
    scores: input.evaluation.scores,
    total: input.evaluation.total ?? sumScores(input.evaluation.scores),
    verdict: input.evaluation.verdict ?? "borderline",
    missing_keywords: Array.isArray(input.evaluation.missing_keywords) ? input.evaluation.missing_keywords : [],
    source: input.source
  };

  const next = [item, ...loadEvaluations()].slice(0, MAX_EVALUATION_HISTORY);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return item;
}

export function deleteEvaluation(id: string): StoredEvaluation[] {
  const next = loadEvaluations().filter((item) => item.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearEvaluations() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sumScores(scores: Record<string, number>) {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}
