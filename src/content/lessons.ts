import type { Lesson } from "../domain/types";
export const LESSONS: Lesson[] = [
  {
    id: "groups",
    title: "Из групп — в умножение",
    short: "×1, ×2, ×10",
    description: "Равные группы, ряды и первые опоры",
    prereqs: [],
    a: 2,
    b: 3,
    families: [1, 2, 10],
    split: 1,
    approach:
      "В каждой группе одинаковое количество. Два ряда по три — это 3 + 3. Один ряд оставляет число как есть. Десять рядов удобно считать десятками.",
  },
  {
    id: "turn",
    title: "А если повернуть?",
    short: "Перестановка",
    description: "Места меняются, количество остаётся",
    prereqs: ["groups"],
    a: 3,
    b: 2,
    families: [],
    split: 1,
    approach:
      "Поверни прямоугольник. Три ряда по два превратятся в два ряда по три. Точек столько же, хотя описание рядов изменилось.",
  },
  {
    id: "five",
    title: "Пять — половина десяти",
    short: "×5",
    description: "Две равные части большого массива",
    prereqs: ["groups"],
    a: 5,
    b: 6,
    families: [5],
    split: 2,
    approach:
      "Десять рядов можно разделить поровну: пять и пять. Одна половина — пять рядов. Если делить пополам пока непривычно, считай равными группами.",
  },
  {
    id: "four",
    title: "Удвоим и ещё раз удвоим",
    short: "×4",
    description: "Из двух рядов получаем четыре",
    prereqs: ["groups"],
    a: 4,
    b: 6,
    families: [4],
    split: 2,
    approach:
      "Сначала два ряда, затем ещё столько же. Четыре ряда — две одинаковые части по два ряда.",
  },
  {
    id: "eight",
    title: "Восемь из двух четвёрок",
    short: "×8",
    description: "Знакомую четвёрку берём дважды",
    prereqs: ["four"],
    a: 8,
    b: 6,
    families: [8],
    split: 4,
    approach:
      "Восемь рядов разделяются на четыре и ещё четыре. Разберись с одной половиной и удвой её.",
  },
  {
    id: "three",
    title: "Ещё одна группа",
    short: "×3",
    description: "Два знакомых ряда и один новый",
    prereqs: ["groups"],
    a: 3,
    b: 7,
    families: [3],
    split: 2,
    approach:
      "Три ряда — это два ряда и ещё один. Сначала найди количество в двух, затем добавь одну группу.",
  },
  {
    id: "six",
    title: "Пять и ещё один",
    short: "×6",
    description: "Добавляем одну группу к пяти",
    prereqs: ["five"],
    a: 6,
    b: 7,
    families: [6],
    split: 5,
    approach:
      "Шесть рядов — пять рядов и ещё один. Найди пять групп, затем прибавь количество в одной группе.",
  },
  {
    id: "nine",
    title: "На одну группу меньше",
    short: "×9",
    description: "Десять рядов минус один",
    prereqs: ["groups"],
    a: 9,
    b: 7,
    families: [9],
    split: 5,
    approach:
      "Представь десять рядов. Убери один целый ряд: останется девять. Вычитаем количество в группе, а не единицу.",
  },
  {
    id: "seven",
    title: "Семь: пять плюс два",
    short: "×7",
    description: "Разделим цветочную клумбу на две части",
    prereqs: ["five", "groups"],
    a: 7,
    b: 8,
    families: [7],
    split: 5,
    approach:
      "Семь рядов можно разделить на пять и два. Найдём количество в каждой части, а затем соединим их.",
  },
  {
    id: "squares",
    title: "Квадраты и знакомые соседи",
    short: "Квадраты",
    description: "Когда ряды и столбцы равны",
    prereqs: ["turn", "seven", "eight", "six", "nine", "three"],
    a: 7,
    b: 7,
    families: [],
    split: 5,
    approach:
      "В квадрате рядов столько же, сколько точек в каждом. Можно опереться на соседний факт: 7 × 7 — на семь меньше, чем 7 × 8.",
  },
  {
    id: "zero",
    title: "Если в группе ничего нет",
    short: "×0",
    description: "Короткая история о нуле",
    prereqs: ["groups"],
    a: 3,
    b: 0,
    families: [],
    split: 1,
    approach:
      "Три пустые корзинки: в каждой ноль цветов. Вместе тоже ноль. А ноль корзинок по три цветка — снова ноль. Этот урок не входит в процент таблицы 1–10.",
  },
];
export function strategy(a: number, b: number) {
  if (a === 9)
    return {
      leftA: 10,
      rightA: 1,
      operator: "−",
      left: 10 * b,
      right: b,
      total: a * b,
    };
  const leftA =
    a === 8
      ? 4
      : a === 7 || a === 6
        ? 5
        : a === 4 || a === 3
          ? 2
          : a === 5
            ? 2
            : a === 2
              ? 1
              : a === 1
                ? 1
                : 0;
  const rightA = a - leftA;
  return {
    leftA,
    rightA,
    operator: "+",
    left: leftA * b,
    right: rightA * b,
    total: a * b,
  };
}
export function expression(a: number, b: number) {
  return `${a} × ${b}`;
}
export function explanation(a: number, b: number) {
  const s = strategy(a, b);
  return `${a} × ${b} = ${s.leftA} × ${b} ${s.operator} ${s.rightA} × ${b} = ${s.left} ${s.operator} ${s.right} = ${a * b}`;
}
