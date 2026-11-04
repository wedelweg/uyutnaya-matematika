import type { Session, State } from "./types";
export const ROOM_PLACES = [
  "Auf dem Sofa",
  "Am Fenster",
  "Im Regal",
  "Auf dem Kissen",
  "Beim Teppich",
  "An der Wand",
  "In der Kuschelecke",
  "Neben der Pflanze",
];
export const CAFE_CHAPTERS = [
  {
    title: "Wir eröffnen das Café",
    note: "Backen wir Kekse für die ersten Gäste.",
    icon: "☕",
  },
  {
    title: "Tee mit Freunden",
    note: "Decken wir den Tisch und üben bekannte Bestellungen.",
    icon: "✿",
  },
  {
    title: "Picknick im Garten",
    note: "Packen wir Leckereien für ein kleines Fest ein.",
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
