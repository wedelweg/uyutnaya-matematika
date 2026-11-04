import { expect, it } from "vitest";
import { createState } from "../src/domain/engine";
import {
  createSession,
  upgradeActivePractice,
  completeSession,
} from "../src/domain/planner";
import { exportBackup, parseBackup } from "../src/storage/store";

it("starts with recall; explicit study still has a lesson", () => {
  const s = createState();
  const quick = createSession(s, "mission", new Date(), 4, "q");
  expect(quick.mode).toBe("quick");
  expect(quick.lessonId).toBeNull();
  expect(quick.tasks.every((t) => t.format === "direct" && !t.supported)).toBe(
    true,
  );
  expect(
    createSession(s, "mission", new Date(), 4, "l", "groups").lessonId,
  ).toBe("groups");
  s.active = quick;
  expect(parseBackup(exportBackup(s))).toEqual(s);
});
it("converts an unfinished cafe without losing responses or revealed-help evidence", () => {
  const s = createState();
  s.active = createSession(s, "mission", new Date(), 4, "old", "groups");
  s.active.game = "cafe";
  s.active.cursor = 1;
  s.active.answered = 1;
  const before = structuredClone(s);
  const n = upgradeActivePractice(s);
  expect(s).toEqual(before);
  expect(n.active!.mode).toBe("quick");
  expect(n.active!.lessonDone).toBe(true);
  expect(n.active!.tasks[0]).toEqual(s.active.tasks[0]);
  expect(n.active!.answered).toBe(1);
  expect(
    n
      .active!.tasks.slice(1)
      .every((t) => t.format === "direct" && !t.supported),
  ).toBe(true);
  expect(n.facts).toEqual(s.facts);
  expect(upgradeActivePractice(n)).toBe(n);
});
it("every complete calm round can earn decoration without altering mastery", () => {
  let s = createState({ theme: "calm" });
  for (let i = 1; i <= 3; i++) {
    s.active = createSession(s, "mission", new Date(), i, `q${i}`);
    s.active.cursor = s.active.tasks.length;
    s.active.answered = s.active.tasks.length;
    s = completeSession(s, new Date());
    expect(s.pendingRewards).toContain(`round-${i}`);
  }
  expect(Object.values(s.facts).every((f) => f.successes === 0)).toBe(true);
});
