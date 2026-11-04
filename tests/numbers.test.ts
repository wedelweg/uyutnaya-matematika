import { expect, it } from "vitest";
import {
  cookies,
  flowers,
  plates,
  pots,
  perFlowers,
} from "../src/content/numbers";
import { wordProblem } from "../src/content/strings";
it("uses correct Russian forms, including teens and zero", () => {
  for (const [n, p, f, c, t] of [
    [0, "горшочков", "цветков", "печений", "тарелок"],
    [1, "горшочек", "цветок", "печенье", "тарелка"],
    [2, "горшочка", "цветка", "печенья", "тарелки"],
    [3, "горшочка", "цветка", "печенья", "тарелки"],
    [5, "горшочков", "цветков", "печений", "тарелок"],
    [11, "горшочков", "цветков", "печений", "тарелок"],
    [14, "горшочков", "цветков", "печений", "тарелок"],
    [21, "горшочек", "цветок", "печенье", "тарелка"],
    [22, "горшочка", "цветка", "печенья", "тарелки"],
    [100, "горшочков", "цветков", "печений", "тарелок"],
  ] as const) {
    expect(pots(n).endsWith(p)).toBe(true);
    expect(flowers(n)).toBe(`${n} ${f}`);
    expect(cookies(n)).toBe(`${n} ${c}`);
    expect(plates(n)).toBe(`${n} ${t}`);
  }
  expect(perFlowers(1)).toBe("по одному цветку");
  expect(wordProblem(2, 3)).toBe(
    "На подоконнике 2 одинаковых горшочка. В каждом по 3 цветка. Сколько цветков всего?",
  );
});
