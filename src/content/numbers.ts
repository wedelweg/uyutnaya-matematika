export function plural(n: number, one: string, few: string, many: string) {
  const x = Math.abs(n) % 100;
  return x >= 11 && x <= 14
    ? many
    : x % 10 === 1
      ? one
      : x % 10 >= 2 && x % 10 <= 4
        ? few
        : many;
}
export const flowers = (n: number) => `${n} ${n === 1 ? "Blume" : "Blumen"}`;
export const cookies = (n: number) => `${n} ${n === 1 ? "Keks" : "Kekse"}`;
export const plates = (n: number) => `${n} Teller`;
export const pots = (n: number) =>
  n === 1 ? "ein Blumentopf" : `${n} gleiche Blumentöpfe`;
export const perFlowers = (n: number) =>
  `${n === 1 ? "eine Blume" : flowers(n)}`;
export const perCookies = (n: number) =>
  `je ${n === 1 ? "ein Keks" : cookies(n)}`;
