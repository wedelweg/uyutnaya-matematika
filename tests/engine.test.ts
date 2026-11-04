import { describe, expect, it } from "vitest";
import {
  addDays,
  applyAttempt,
  createState,
  factId,
  localDate,
  pairId,
} from "../src/domain/engine";
import { LESSONS, strategy } from "../src/content/lessons";
import {
  assessmentAvailability,
  completeSession,
  createSession,
  recordResponse,
} from "../src/domain/planner";
import type { Attempt } from "../src/domain/types";
let serial = 0;
function answer(date = "2026-01-01", options: Partial<Attempt> = {}): Attempt {
  const n = ++serial;
  return {
    id: `a${n}`,
    sessionId: `s${n}`,
    factId: "7x8",
    format: "direct",
    kind: "mission",
    answer: 56,
    correct: true,
    hint: 0,
    revealed: false,
    first: true,
    activeMs: 1000,
    utc: `${date}T12:00:00Z`,
    date,
    independent: true,
    ...options,
  };
}
function secureState() {
  let s = createState();
  for (const date of ["2026-01-01", "2026-01-02", "2026-01-05", "2026-01-12"])
    s = applyAttempt(s, answer(date, { format: "word" }));
  return s;
}
describe("mathematical content", () => {
  it("contains 100 directed facts, 55 pairs and exactly 11 lessons", () => {
    const s = createState();
    expect(Object.keys(s.facts)).toHaveLength(100);
    expect(Object.keys(s.pairs)).toHaveLength(55);
    expect(LESSONS).toHaveLength(11);
  });
  it("every product and strategy is exact, including zero", () => {
    for (let a = 0; a <= 10; a++)
      for (let b = 0; b <= 10; b++) {
        const s = strategy(a, b);
        expect(s.total).toBe(a * b);
        expect(s.left).toBe(s.leftA * b);
        expect(s.right).toBe(s.rightA * b);
        expect(s.operator === "+" ? s.left + s.right : s.left - s.right).toBe(
          a * b,
        );
        if (a && b) expect(createState().facts[factId(a, b)].a * b).toBe(a * b);
      }
  });
  it("all prerequisites refer to earlier lessons and all lesson splits preserve products", () => {
    LESSONS.forEach((l, i) => {
      expect(
        l.prereqs.every((p) => LESSONS.slice(0, i).some((x) => x.id === p)),
      ).toBe(true);
      expect(l.split * l.b + (l.a - l.split) * l.b).toBe(l.a * l.b);
    });
  });
});
describe("independent retrieval and intervals", () => {
  it("uses the full 1, 3, 7, 14, 30 sequence", () => {
    let s = createState();
    let d = "2026-01-01";
    for (const interval of [1, 3, 7, 14, 30, 30]) {
      s = applyAttempt(s, answer(d));
      expect(s.facts["7x8"].currentInterval).toBe(interval);
      expect(s.facts["7x8"].dueDate).toBe(addDays(d, interval));
      d = addDays(d, interval);
    }
  });
  it("cannot master a fact with four successes on one day/session", () => {
    let s = createState();
    for (let i = 0; i < 4; i++)
      s = applyAttempt(s, answer("2026-01-01", { sessionId: "one" }));
    expect(s.facts["7x8"].successDates).toHaveLength(1);
    expect(s.facts["7x8"].status).toBe("learning");
  });
  it("does not count another success day after clock/timezone shift within a session", () => {
    let s = createState();
    for (const date of ["2026-01-01", "2026-01-02", "2026-01-05", "2026-01-12"])
      s = applyAttempt(s, answer(date, { sessionId: "one", format: "word" }));
    expect(s.facts["7x8"].successDates).toHaveLength(1);
    expect(s.facts["7x8"].status).not.toBe("secure");
  });
  it("refuses backwards successful dates", () => {
    let s = applyAttempt(createState(), answer("2026-01-03"));
    s = applyAttempt(s, answer("2026-01-02"));
    expect(s.facts["7x8"].successDates).toEqual(["2026-01-03"]);
  });
  it("early answers add a day but do not move the due date or interval", () => {
    let s = applyAttempt(createState(), answer());
    s = applyAttempt(s, answer("2026-01-02"));
    const before = structuredClone(s.facts["7x8"]);
    s = applyAttempt(s, answer("2026-01-03"));
    expect(s.facts["7x8"].dueDate).toBe(before.dueDate);
    expect(s.facts["7x8"].step).toBe(before.step);
    expect(s.facts["7x8"].successDates).toHaveLength(3);
  });
  it("requires four dates, a scheduled long interval, and understanding", () => {
    let s = createState();
    for (const d of ["2026-01-01", "2026-01-02", "2026-01-05", "2026-01-12"])
      s = applyAttempt(s, answer(d));
    expect(s.facts["7x8"].status).toBe("review");
    s = applyAttempt(s, answer("2026-01-13", { factId: "8x7" }));
    expect(s.facts["7x8"].status).toBe("secure");
    expect(s.pairs[pairId(7, 8)].understood).toBe(true);
  });
  it("one diagnostic answer is one day, never secure; a miss schedules tomorrow", () => {
    let s = applyAttempt(
      createState(),
      answer("2026-01-01", { kind: "diagnostic" }),
    );
    expect(s.facts["7x8"].successDates).toHaveLength(1);
    expect(s.facts["7x8"].status).toBe("learning");
    s = applyAttempt(
      s,
      answer("2026-01-01", {
        factId: "6x7",
        correct: false,
        answer: 48,
        kind: "diagnostic",
      }),
    );
    expect(s.facts["6x7"].dueDate).toBe("2026-01-02");
  });
  it.each([
    { hint: 1 },
    { revealed: true },
    { first: false },
    { format: "array" as const },
  ])("support never advances intervals: %j", (flags) => {
    const s = applyAttempt(createState(), answer("2026-01-01", flags));
    expect(s.facts["7x8"].successes).toBe(0);
    expect(s.facts["7x8"].status).toBe("learning");
    expect(s.facts["7x8"].dueDate).toBe("2026-01-02");
  });
  it("tracks orientations separately and does not self-confirm a square", () => {
    const s = applyAttempt(
      createState(),
      answer("2026-01-01", { factId: "7x7", answer: 49 }),
    );
    expect(s.pairs["7:7"].understood).toBe(false);
    expect(s.facts["8x7"].status).toBe("unseen");
  });
  it("a repeated attempt ID is a no-op", () => {
    const a = answer(),
      s = applyAttempt(createState(), a);
    expect(applyAttempt(s, a)).toBe(s);
  });
  it("an omitted numeric answer is not independent retrieval", () => {
    const s = applyAttempt(
      createState(),
      answer("2026-01-01", { answer: null, correct: false }),
    );
    expect(s.attempts[0].independent).toBe(false);
    expect(s.facts["7x8"].dueDate).toBe("2026-01-02");
    expect(s.facts["7x8"].successDates).toHaveLength(0);
  });
  it("secure errors stay needsReview across further errors; correction is not recovery", () => {
    let s = secureState();
    expect(s.facts["7x8"].status).toBe("secure");
    s = applyAttempt(s, answer("2026-01-13", { correct: false }));
    s = applyAttempt(s, answer("2026-01-14", { correct: false }));
    expect(s.facts["7x8"].status).toBe("needsReview");
    expect(s.facts["7x8"].passedInterval).toBe(0);
    s = applyAttempt(s, answer("2026-01-14", { hint: 2, first: false }));
    expect(s.facts["7x8"].status).toBe("needsReview");
    expect(s.facts["7x8"].dueDate).toBe("2026-01-15");
  });
  it("requires a new seven-day repeat after a secure error", () => {
    let s = applyAttempt(
      secureState(),
      answer("2026-01-13", { correct: false }),
    );
    for (const d of ["2026-01-14", "2026-01-15", "2026-01-18"]) {
      s = applyAttempt(s, answer(d));
      expect(s.facts["7x8"].status).toBe("needsReview");
    }
    s = applyAttempt(s, answer("2026-01-25"));
    expect(s.facts["7x8"].status).toBe("secure");
  });
  it("does not mutate the previous state", () => {
    const s = createState();
    applyAttempt(s, answer());
    expect(s.attempts).toHaveLength(0);
    expect(s.facts["7x8"].status).toBe("unseen");
  });
});
describe("calendar dates", () => {
  it("handles both DST changes without elapsed-hour arithmetic", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("maps midnight to the profile timezone", () => {
    expect(localDate(new Date("2026-10-24T22:30:00Z"), "Europe/Berlin")).toBe(
      "2026-10-25",
    );
    expect(localDate(new Date("2026-10-25T23:30:00Z"), "Europe/Berlin")).toBe(
      "2026-10-26",
    );
  });
});
function familiarState() {
  let s = createState();
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 5; b++)
      s = applyAttempt(
        s,
        answer("2026-10-01", { factId: factId(a, b), answer: a * b }),
      );
  return s;
}
describe("bounded missions and adaptation", () => {
  it.each([
    ["easy", 8],
    ["normal", 6],
    ["tired", 4],
  ] as const)("sets %s length to %i", (mood, count) => {
    const s = familiarState();
    s.profile.mood = mood;
    expect(
      createSession(s, "mission", new Date("2026-10-01T12:00:00Z"), 1, "s")
        .tasks,
    ).toHaveLength(count);
  });
  it("handles a fresh profile without an infinite queue or adjacent identical facts", () => {
    for (let seed = 0; seed < 100; seed++) {
      const m = createSession(
        createState(),
        "mission",
        new Date("2026-10-22T12:00:00Z"),
        seed,
        "s",
      );
      expect(m.tasks.length).toBe(6);
      expect(m.newFacts.length).toBeLessThanOrEqual(2);
      expect(m.probes.length).toBeLessThanOrEqual(4);
      for (let i = 1; i < m.tasks.length; i++)
        expect(m.tasks[i].factId).not.toBe(m.tasks[i - 1].factId);
    }
  });
  it("tired and debt missions contain no new facts or probes", () => {
    const s = familiarState();
    for (const tired of [true, false]) {
      s.profile.mood = tired ? "tired" : "normal";
      const m = createSession(
        s,
        "mission",
        new Date("2026-10-22T12:00:00Z"),
        4,
        "s",
      );
      expect(m.lessonId).toBeNull();
      expect(m.probes).toHaveLength(0);
      expect(m.newFacts).toHaveLength(0);
      expect(m.tasks.every((t) => t.purpose === "review")).toBe(true);
    }
  });
  it("a tired fresh profile still gets a short playable round", () => {
    const s = createState();
    s.profile.mood = "tired";
    s.active = createSession(s, "mission", new Date(), 1, "s");
    expect(s.active.tasks).toHaveLength(4);
    expect(completeSession(s, new Date()).active).toBeNull();
  });
  it("two errors simplify the queue without forcing pictures", () => {
    let s = familiarState();
    s.lessons.groups = "completed";
    s.active = createSession(
      s,
      "mission",
      new Date("2026-10-01T12:00:00Z"),
      6,
      "s",
    );
    for (let i = 0; i < 2; i++) {
      s.active!.cursor = i;
      const task = s.active!.tasks[i];
      s = recordResponse(
        s,
        answer("2026-10-01", {
          id: task.id,
          sessionId: "s",
          factId: task.factId,
          correct: false,
        }),
      );
    }
    expect(s.active!.adaptation).toBe(true);
    expect(s.active!.tasks.slice(2).every((t) => t.purpose !== "probe")).toBe(
      true,
    );
    for (let i = 0; i < s.active!.tasks.length; i++)
      if (s.active!.tasks[i].purpose === "correction") {
        expect(i).toBeGreaterThanOrEqual(4);
        expect(s.active!.tasks[i].supported).toBe(false);
      }
  });
  it("duplicate session response does not inflate totals", () => {
    const s = familiarState();
    s.active = createSession(s, "mission", new Date(), 1, "s");
    const a = answer("2026-01-01", { id: s.active.tasks[0].id });
    const n = recordResponse(s, a);
    expect(recordResponse(n, a).active!.answered).toBe(1);
  });
  it("rewards a milestone once, never removes rewards", () => {
    let s = familiarState();
    s.rewards = [0, 1];
    for (let i = 0; i < 3; i++) {
      s.active = createSession(s, "mission", new Date(), 1, `s${i}`);
      s.active.answered = 1;
      s = completeSession(s, new Date());
    }
    expect(s.rewards).toEqual([0, 1]);
    expect(s.milestones.filter((x) => x === "first-mission")).toHaveLength(1);
  });
});
describe("parallel assessments", () => {
  it("has eight facts and two transfer problems; forms share retention anchors", () => {
    const s = createState(),
      a = createSession(s, "intermediate", new Date(), 1, "a"),
      b = createSession(s, "delayed", new Date(), 2, "b");
    expect(a.tasks.filter((t) => t.format === "word")).toHaveLength(2);
    expect(a.tasks.filter((t) => t.format === "direct")).toHaveLength(8);
    expect(
      a.tasks
        .filter((t) => t.format === "direct")
        .map((t) => t.factId)
        .sort(),
    ).toEqual(
      b.tasks
        .filter((t) => t.format === "direct")
        .map((t) => t.factId)
        .sort(),
    );
    expect(a.tasks.map((t) => t.factId)).not.toEqual(
      b.tasks.map((t) => t.factId),
    );
  });
  it("assessment results do not change teaching facts or reward mastery", () => {
    const s = createState(),
      n = applyAttempt(s, answer("2026-01-01", { kind: "baseline" }));
    expect(n.facts).toEqual(s.facts);
    expect(n.pairs).toEqual(s.pairs);
    expect(n.attempts).toHaveLength(1);
  });
  it("offers the three checkpoints at the specified dates", () => {
    const s = createState();
    s.profile.diagnosticDone = true;
    expect(assessmentAvailability(s, "2026-01-01").baseline).toBe(true);
    for (let i = 0; i < 5; i++) {
      const m = createSession(s, "mission", new Date("2026-01-01"), i, `m${i}`);
      m.completedAt = "2026-01-01T12:00:00Z";
      s.sessions.push(m);
    }
    expect(assessmentAvailability(s, "2026-01-01").intermediate).toBe(true);
    const m = createSession(
      s,
      "intermediate",
      new Date("2026-01-01"),
      2,
      "check",
    );
    m.completedAt = "2026-01-01T12:00:00Z";
    s.sessions.push(m);
    expect(assessmentAvailability(s, "2026-01-07").delayed).toBe(false);
    expect(assessmentAvailability(s, "2026-01-08").delayed).toBe(true);
    expect(assessmentAvailability(s, "2026-01-16").delayedLate).toBe(true);
  });
});
