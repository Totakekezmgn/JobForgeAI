export type TestCase = { input: string; expected: string; note?: string; };
export type JudgeResult = { input: string; expected: string; actual: string; passed: boolean; note?: string; stderr?: string; };

export function simplePythonLikeJudge(code: string, tests: TestCase[]): JudgeResult[] {
  return tests.map((test) => {
    const actual = simulateVerySmallSubset(code, test.input).trim();
    return {
      input: test.input,
      expected: test.expected.trim(),
      actual,
      passed: actual === test.expected.trim(),
      note: test.note
    };
  });
}

function simulateVerySmallSubset(code: string, input: string): string {
  const printLiteral = code.match(/print\((["'`])(.+?)\1\)/s);
  if (printLiteral) return printLiteral[2];

  if (code.includes("Counter") && code.includes("sorted")) return mostFrequentChar(input);
  if (code.includes(".count") && code.includes("max")) return mostFrequentChar(input);
  if (code.includes("len(") && code.includes("print")) return String(input.trim().length);

  return "簡易実行では判定不可";
}

function mostFrequentChar(input: string): string {
  const s = input.trim();
  const map = new Map<string, number>();
  for (const ch of s) map.set(ch, (map.get(ch) || 0) + 1);

  let best = "";
  let bestCount = -1;
  for (const ch of Array.from(map.keys()).sort()) {
    const count = map.get(ch) || 0;
    if (count > bestCount) {
      best = ch;
      bestCount = count;
    }
  }
  return best;
}
