import { describe, expect, it } from "vitest";
import { createState } from "../src/domain/engine";
import { createSession, completeSession } from "../src/domain/planner";
import {
  cafeCount,
  collectItem,
  placeItem,
  roomSlots,
} from "../src/domain/cafe";
import { exportBackup, parseBackup, validateState } from "../src/storage/store";
describe("cafe story and rewards", () => {
  it("rewards a finished shift regardless of accuracy, once, without changing mastery", () => {
    let s = createState();
    s.active = createSession(s, "mission", new Date(), 1, "shift");
    s.active.game = "cafe";
    s.active.cursor = s.active.tasks.length;
    s.active.answered = s.active.tasks.length;
    s.active.correct = 0;
    const before = structuredClone(s.facts);
    s = completeSession(s, new Date());
    expect(cafeCount(s)).toBe(1);
    expect(s.pendingRewards).toContain("cafe-1");
    expect(s.facts).toEqual(before);
    expect(completeSession(s, new Date())).toEqual(s);
  });
  it("does not advance the story for partial, empty or non-cafe sessions", () => {
    for (const mode of ["partial", "empty", "plain"]) {
      let s = createState();
      s.active = createSession(s, "mission", new Date(), 1, "shift");
      if (mode !== "plain") s.active.game = "cafe";
      if (mode === "empty") s.active.tasks = [];
      s.active.answered = mode === "partial" ? 1 : s.active.tasks.length;
      s.active.cursor = mode === "partial" ? 1 : s.active.tasks.length;
      s = completeSession(s, new Date());
      expect(cafeCount(s)).toBe(0);
      expect(s.milestones).not.toContain("cafe-1");
    }
  });
  it("caps collection rewards and keeps long play history valid", () => {
    let s = createState();
    for (let i = 0; i < 40; i++) {
      s.active = createSession(s, "mission", new Date(), i, `shift-${i}`);
      s.active.game = "cafe";
      s.active.cursor = s.active.tasks.length;
      s.active.answered = s.active.tasks.length;
      s = completeSession(s, new Date());
    }
    expect(cafeCount(s)).toBe(40);
    expect(s.pendingRewards.length).toBeLessThanOrEqual(16);
    expect(() => validateState(s)).not.toThrow();
  });
});
describe("room furniture and backups", () => {
  it("keeps the legacy layout, swaps occupied places, and never loses owned items", () => {
    const s = createState();
    s.rewards = [0, 1, 2];
    const slots = roomSlots(s);
    let n = placeItem(s, 0, 1);
    expect(roomSlots(n).slice(0, 3)).toEqual([1, 0, 2]);
    expect(roomSlots(s)).toEqual(slots);
    n = placeItem(n, 0, null);
    expect(n.rewards).toEqual([0, 1, 2]);
    expect(roomSlots(n)[1]).toBeNull();
    expect(placeItem(n, 15, 1)).toBe(n);
    expect(placeItem(n, 1, 8)).toBe(n);
  });
  it("shows a new gift immediately in a full room without losing the displaced item", () => {
    const s = createState();
    s.rewards = [0, 1, 2, 3, 4, 5, 6, 7];
    s.pendingRewards = ["gift"];
    const n = collectItem(s, 8);
    expect(n.rewards).toContain(8);
    expect(roomSlots(n)).toEqual([0, 1, 2, 3, 4, 5, 6, 8]);
    expect(n.rewards).toContain(7);
    expect(collectItem(n, 8)).toBe(n);
  });
  it("round trips layout and cafe interactions; old backups still load", () => {
    const s = createState();
    s.rewards = [1, 2];
    s.room = { slots: [null, 2, null, 1, null, null, null, null] };
    s.active = createSession(s, "mission", new Date(), 1, "shift");
    s.active.game = "cafe";
    s.active.tasks[0].supported = true;
    s.active.tasks[0].servedPlates = 1;
    expect(parseBackup(exportBackup(s))).toEqual(s);
    delete s.room;
    delete s.active.game;
    delete s.active.tasks[0].servedPlates;
    expect(parseBackup(exportBackup(s))).toEqual(s);
  });
  it("rejects unowned or duplicate furniture and unsupported plate reveals", () => {
    for (const slots of [
      [1, null, null, null, null, null, null, null],
      [0, 0, null, null, null, null, null, null],
    ]) {
      const s = createState();
      s.rewards = [0];
      s.room = { slots };
      expect(() => validateState(s)).toThrow();
    }
    const s = createState();
    s.active = createSession(s, "diagnostic", new Date(), 1, "d");
    s.active.tasks[0].servedPlates = 1;
    expect(() => validateState(s)).toThrow();
  });
});
