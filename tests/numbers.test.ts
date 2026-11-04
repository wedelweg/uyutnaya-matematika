import { expect, it } from "vitest";
import {
  cookies,
  flowers,
  plates,
  pots,
  perFlowers,
} from "../src/content/numbers";
import { wordProblem } from "../src/content/strings";
it("uses German singular and plural forms in visual word problems", () => {
  expect(pots(1)).toBe("ein Blumentopf");
  expect(pots(2)).toBe("2 gleiche Blumentöpfe");
  expect(flowers(1)).toBe("1 Blume");
  expect(flowers(3)).toBe("3 Blumen");
  expect(cookies(1)).toBe("1 Keks");
  expect(cookies(11)).toBe("11 Kekse");
  expect(plates(1)).toBe("1 Teller");
  expect(plates(5)).toBe("5 Teller");
  expect(perFlowers(1)).toBe("eine Blume");
  expect(wordProblem(1, 1)).toBe(
    "Auf der Fensterbank steht ein Blumentopf. In jedem wächst eine Blume. Wie viele Blumen sind es zusammen?",
  );
  expect(wordProblem(2, 3)).toBe(
    "Auf der Fensterbank stehen 2 gleiche Blumentöpfe. In jedem wachsen 3 Blumen. Wie viele Blumen sind es zusammen?",
  );
});
