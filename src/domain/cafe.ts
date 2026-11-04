import type { Session, State } from "./types";
export const ROOM_PLACES = [
  "На диване",
  "У окна",
  "На полке",
  "На подушке",
  "У коврика",
  "На стене",
  "В уютном уголке",
  "Возле растения",
];
export const CAFE_CHAPTERS = [
  {
    title: "Открываем кафе",
    note: "Приготовим печенье для первых гостей.",
    icon: "☕",
  },
  {
    title: "Чаепитие с друзьями",
    note: "Накроем стол и потренируем знакомые заказы.",
    icon: "✿",
  },
  {
    title: "Пикник в саду",
    note: "Соберём угощения для маленького праздника.",
    icon: "☀",
  },
];
export const finishedCafe = (s: Session) =>
  s.game === "cafe" &&
  !!s.completedAt &&
  s.tasks.length > 0 &&
  s.cursor >= s.tasks.length &&
  s.answered === s.tasks.length;
export const cafeCount = (s: State) => s.sessions.filter(finishedCafe).length;
export function roomSlots(s: State): (number | null)[] {
  return (
    s.room?.slots ??
    Array.from({ length: 8 }, (_, i) => s.rewards.slice(-8)[i] ?? null)
  );
}
export function placeItem(
  s: State,
  item: number,
  position: number | null,
): State {
  if (
    !s.rewards.includes(item) ||
    (position !== null &&
      (!Number.isInteger(position) || position < 0 || position >= 8))
  )
    return s;
  const slots = [...roomSlots(s)],
    old = slots.indexOf(item),
    displaced = position === null ? null : slots[position];
  if (old >= 0) slots[old] = null;
  if (position !== null) {
    slots[position] = item;
    if (old >= 0 && old !== position) slots[old] = displaced;
  }
  return { ...s, room: { slots } };
}
export function collectItem(s: State, item: number): State {
  if (
    !s.pendingRewards.length ||
    s.rewards.includes(item) ||
    !Number.isInteger(item) ||
    item < 0 ||
    item > 15
  )
    return s;
  const slots = [...roomSlots(s)],
    empty = slots.indexOf(null);
  slots[empty >= 0 ? empty : 7] = item;
  return {
    ...s,
    rewards: [...s.rewards, item],
    pendingRewards: s.pendingRewards.slice(1),
    room: { slots },
  };
}
