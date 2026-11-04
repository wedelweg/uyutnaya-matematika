import type { Lesson } from "../domain/types";
export const LESSONS: Lesson[] = [
  {
    id: "groups",
    title: "Von Gruppen zum Malnehmen",
    short: "×1, ×2, ×10",
    description: "Gleiche Gruppen, Reihen und erste Hilfen",
    prereqs: [],
    a: 2,
    b: 3,
    families: [1, 2, 10],
    split: 1,
    approach:
      "In jeder Gruppe ist gleich viel. Zwei Reihen mit je drei Punkten sind 3 + 3. Bei einer Reihe bleibt die Zahl gleich. Zehn Reihen kannst du in Zehnerschritten zählen.",
  },
  {
    id: "turn",
    title: "Was passiert beim Drehen?",
    short: "Tauschaufgaben",
    description: "Die Anordnung ändert sich, die Anzahl bleibt gleich",
    prereqs: ["groups"],
    a: 3,
    b: 2,
    families: [],
    split: 1,
    approach:
      "Drehe das Punktefeld. Aus drei Reihen mit je zwei Punkten werden zwei Reihen mit je drei Punkten. Die Anzahl der Punkte bleibt gleich.",
  },
  {
    id: "five",
    title: "Fünf ist die Hälfte von zehn",
    short: "×5",
    description: "Zwei gleiche Hälften eines Punktefelds",
    prereqs: ["groups"],
    a: 5,
    b: 6,
    families: [5],
    split: 2,
    approach:
      "Zehn Reihen lassen sich in zwei gleiche Hälften teilen: fünf und fünf. Eine Hälfte hat fünf Reihen. Wenn das noch schwierig ist, zähle gleiche Gruppen.",
  },
  {
    id: "four",
    title: "Zweimal verdoppeln",
    short: "×4",
    description: "Aus zwei Reihen werden vier",
    prereqs: ["groups"],
    a: 4,
    b: 6,
    families: [4],
    split: 2,
    approach:
      "Nimm zuerst zwei Reihen und dann noch einmal so viele. Vier Reihen bestehen aus zwei gleichen Teilen mit je zwei Reihen.",
  },
  {
    id: "eight",
    title: "Acht aus zwei Vierern",
    short: "×8",
    description: "Eine bekannte Vierergruppe zweimal nehmen",
    prereqs: ["four"],
    a: 8,
    b: 6,
    families: [8],
    split: 4,
    approach:
      "Acht Reihen sind vier Reihen und noch einmal vier. Rechne eine Hälfte aus und verdopple sie.",
  },
  {
    id: "three",
    title: "Eine Gruppe mehr",
    short: "×3",
    description: "Zwei bekannte Reihen und eine weitere",
    prereqs: ["groups"],
    a: 3,
    b: 7,
    families: [3],
    split: 2,
    approach:
      "Drei Reihen sind zwei Reihen plus eine weitere. Finde zuerst die Anzahl in zwei Reihen und addiere dann eine Gruppe.",
  },
  {
    id: "six",
    title: "Fünf und noch eine Reihe",
    short: "×6",
    description: "Zu fünf Gruppen kommt eine dazu",
    prereqs: ["five"],
    a: 6,
    b: 7,
    families: [6],
    split: 5,
    approach:
      "Sechs Reihen sind fünf Reihen plus eine. Rechne erst fünf Gruppen aus und addiere dann eine Gruppe.",
  },
  {
    id: "nine",
    title: "Eine Gruppe weniger",
    short: "×9",
    description: "Zehn Reihen minus eine",
    prereqs: ["groups"],
    a: 9,
    b: 7,
    families: [9],
    split: 5,
    approach:
      "Stell dir zehn Reihen vor. Nimm eine ganze Reihe weg: Neun bleiben übrig. Du ziehst die Anzahl einer ganzen Gruppe ab, nicht nur eins.",
  },
  {
    id: "seven",
    title: "Sieben: fünf plus zwei",
    short: "×7",
    description: "Wir teilen das Blumenbeet in zwei Teile",
    prereqs: ["five", "groups"],
    a: 7,
    b: 8,
    families: [7],
    split: 5,
    approach:
      "Sieben Reihen kannst du in fünf und zwei Reihen zerlegen. Finde die Anzahl in beiden Teilen und zähle sie zusammen.",
  },
  {
    id: "squares",
    title: "Quadratzahlen und Nachbaraufgaben",
    short: "Quadratzahlen",
    description: "Gleich viele Reihen und Spalten",
    prereqs: ["turn", "seven", "eight", "six", "nine", "three"],
    a: 7,
    b: 7,
    families: [],
    split: 5,
    approach:
      "Bei einer Quadratzahl gibt es so viele Reihen wie Punkte pro Reihe. Eine Nachbaraufgabe hilft: 7 × 7 ist um sieben kleiner als 7 × 8.",
  },
  {
    id: "zero",
    title: "Wenn eine Gruppe leer ist",
    short: "×0",
    description: "Eine kurze Geschichte über die Null",
    prereqs: ["groups"],
    a: 3,
    b: 0,
    families: [],
    split: 1,
    approach:
      "Drei leere Körbe: In jedem sind null Blumen. Zusammen sind es null. Und null Körbe mit je drei Blumen ergeben auch null. Diese Lektion zählt nicht zur Einmaleinstafel von 1 bis 10.",
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
