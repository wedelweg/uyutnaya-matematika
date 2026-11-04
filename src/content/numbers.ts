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
export const flowers = (n: number) =>
  `${n} ${plural(n, "цветок", "цветка", "цветков")}`;
export const cookies = (n: number) =>
  `${n} ${plural(n, "печенье", "печенья", "печений")}`;
export const plates = (n: number) =>
  `${n} ${plural(n, "тарелка", "тарелки", "тарелок")}`;
export const pots = (n: number) =>
  `${n} ${plural(n, "одинаковый горшочек", "одинаковых горшочка", "одинаковых горшочков")}`;
export const perFlowers = (n: number) =>
  `по ${n === 1 ? "одному цветку" : flowers(n)}`;
export const perCookies = (n: number) =>
  `по ${n === 1 ? "одному печенью" : cookies(n)}`;
