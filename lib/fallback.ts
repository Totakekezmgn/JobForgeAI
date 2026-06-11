export const fallbackProblem = `【問題】文字列Sが与えられます。Sに含まれる各文字の出現回数を数え、最も多く出現した文字を1つ出力してください。

【入力例】
banana

【出力例】
a

【条件】
- 1 <= |S| <= 100000
- Sは英小文字のみ
- 最頻文字が複数ある場合は、辞書順で最も小さい文字を出力してください。

【考え方】
辞書または配列を使って文字数をカウントし、最大回数の文字を探します。`;

export const fallbackTests = [
  { input: "banana", expected: "a", note: "基本ケース" },
  { input: "abc", expected: "a", note: "同数なら辞書順最小" },
  { input: "zzzaa", expected: "z", note: "最大出現回数が明確" }
];

export const fallbackReview = `【採点】70点

【良い点】
- 方針は大きく外れていません。

【改善点】
- 最頻文字が複数ある場合に辞書順で小さい文字を返す処理が必要です。

【模範解答】
from collections import Counter

S = input().strip()
cnt = Counter(S)

best_char = None
best_count = -1

for c in sorted(cnt.keys()):
    if cnt[c] > best_count:
        best_char = c
        best_count = cnt[c]

print(best_char)`;
