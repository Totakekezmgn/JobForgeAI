/**
 * 入力バリデーション(v2.7)
 *
 * 目的:
 * 1. 極端に長い入力でOpenAI APIを無駄打ちしない(コスト防衛)
 * 2. 空入力でのAPI呼び出しを弾く
 *
 * なぜ必要か:
 * OpenAI APIは入力トークン数で課金される。上限のないtextareaから
 * 巨大な文字列が送られると、1リクエストで無料枠数日分のコストが飛ぶ。
 * 収益化(v4.0)の前提として、コストの上限をサーバー側で保証する。
 */

export const LIMITS = {
  shortText: 200,      // 企業名・職種など
  question: 1000,      // 面接の質問
  answer: 4000,        // 面接回答・ES本文(日本語で約2000字相当を許容)
  longText: 8000       // リサーチ本文など
};

/** 文字列を検証し、問題があればエラーメッセージを返す(nullなら合格) */
export function validateText(
  value: unknown,
  { required = false, max = LIMITS.answer, label = "入力" }: { required?: boolean; max?: number; label?: string } = {}
): string | null {
  if (value == null || value === "") {
    return required ? `${label}が未入力です。` : null;
  }
  if (typeof value !== "string") return `${label}の形式が不正です。`;
  if (value.length > max) return `${label}が長すぎます(上限${max}文字)。`;
  return null;
}

/** 上限を超えた分を切り捨てる(エラーにせず丸めたい場合用) */
export function capText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.length > max ? value.slice(0, max) : value;
}
