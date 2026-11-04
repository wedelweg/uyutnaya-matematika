import { expect, it } from "vitest";
function luminance(hex: string) {
  const values = hex
    .match(/\w\w/g)!
    .map((n) => parseInt(n, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
it("normal-size text palettes meet WCAG AA 4.5:1", () => {
  const pairs = [
    ["39302e", "fff5fa"],
    ["716357", "fff5fa"],
    ["39302e", "f6dce9"],
    ["705b3d", "f6dce9"],
    ["39302e", "fff4fa"],
    ["39302e", "fffaf0"],
    ["716357", "fffaf0"],
    ["39302e", "fff9e8"],
    ["fffdf6", "74543f"],
    ["39302e", "efe8f1"],
    ["39302e", "eaf0e4"],
    ["725b25", "f8e7b6"],
    ["654d76", "e8dcef"],
    ["456135", "dcebd3"],
    ["795442", "f2ddd4"],
    ["716657", "f2eee6"],
    ["705b3d", "f0e5c8"],
    ["826a50", "fffaf0"],
    ["7f6c5a", "fffaf0"],
    ["68533c", "ead8bb"],
  ];
  for (const [fg, bg] of pairs)
    expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
});
