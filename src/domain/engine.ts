import type { Attempt, Fact, Profile, State, Status } from "./types";
export const INTERVALS = [1, 3, 7, 14, 30] as const;
export const factId = (a: number, b: number) => `${a}x${b}`;
export const pairId = (a: number, b: number) =>
  `${Math.min(a, b)}:${Math.max(a, b)}`;
export function localDate(now: Date, timezone: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function createState(overrides: Partial<Profile> = {}): State {
  const facts: State["facts"] = {},
    pairs: State["pairs"] = {};
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 10; b++) {
      const id = factId(a, b);
      facts[id] = {
        id,
        a,
        b,
        status: "unseen",
        dueDate: null,
        step: 0,
        currentInterval: 0,
        passedInterval: 0,
        successes: 0,
        errors: 0,
        successDates: [],
        successSessions: [],
        lastAttempt: null,
        lastHint: 0,
      };
      const pid = pairId(a, b);
      pairs[pid] = { id: pid, understood: false, evidence: [] };
    }
  return {
    schemaVersion: 2,
    profile: {
      name: "",
      theme: "cozy",
      pet: "bunny",
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin",
      motion: true,
      mood: "normal",
      onboarded: false,
      diagnosticDone: false,
      ...overrides,
    },
    facts,
    pairs,
    lessons: {},
    attempts: [],
    sessions: [],
    active: null,
    milestones: [],
    rewards: [],
    pendingRewards: [],
  };
}
export function isAssessment(kind: string) {
  return ["baseline", "intermediate", "delayed"].includes(kind);
}
function statusFor(state: State, f: Fact): Status {
  if (
    f.successDates.length >= 4 &&
    f.passedInterval >= 7 &&
    state.pairs[pairId(f.a, f.b)].understood
  )
    return "secure";
  if (f.status === "needsReview") return "needsReview";
  return f.successDates.length >= 2 && f.passedInterval > 0
    ? "review"
    : "learning";
}
export function applyAttempt(original: State, input: Attempt): State {
  if (original.attempts.some((a) => a.id === input.id)) return original;
  const s = structuredClone(original);
  const a = {
    ...input,
    independent:
      input.answer !== null &&
      input.action !== "teaching" &&
      input.first &&
      input.hint === 0 &&
      !input.revealed &&
      input.format !== "array",
  };
  s.attempts.push(a);
  if (isAssessment(a.kind)) return s;
  const f = s.facts[a.factId];
  if (!f) return s; // zero lesson is outside the 100 facts
  f.lastAttempt = a.utc;
  f.lastHint = a.hint;
  if (!a.independent) {
    if (f.status === "unseen") {
      f.status = "learning";
      f.dueDate = addDays(a.date, 1);
      f.currentInterval = 1;
    }
    return s;
  }
  if (!a.correct) {
    f.errors++;
    f.status =
      f.status === "secure" || f.status === "needsReview"
        ? "needsReview"
        : "learning";
    f.step = 0;
    f.dueDate = addDays(a.date, 1);
    f.currentInterval = 1;
    f.passedInterval = 0;
    return s;
  }
  f.successes++;
  if (!f.dueDate || a.date >= f.dueDate) {
    if (f.dueDate)
      f.passedInterval = Math.max(f.passedInterval, f.currentInterval);
    f.currentInterval = INTERVALS[f.step];
    f.dueDate = addDays(a.date, f.currentInterval);
    f.step = Math.min(f.step + 1, 4);
  }
  const last = f.successDates.at(-1);
  if (
    !f.successSessions.includes(a.sessionId) &&
    !f.successDates.includes(a.date) &&
    (!last || a.date >= last)
  ) {
    f.successDates.push(a.date);
    f.successSessions.push(a.sessionId);
  }
  const pair = s.pairs[pairId(f.a, f.b)];
  const reverse = s.facts[factId(f.b, f.a)];
  if (
    ["strategy", "word", "missing"].includes(a.format) ||
    (f.a !== f.b && reverse.successes > 0)
  ) {
    pair.understood = true;
    if (!pair.evidence.includes(a.id)) pair.evidence.push(a.id);
  }
  f.status = statusFor(s, f);
  if (reverse.id !== f.id && reverse.status !== "unseen")
    reverse.status = statusFor(s, reverse);
  return addMilestones(s);
}
export function grantMilestone(s: State, id: string) {
  if (!s.milestones.includes(id)) {
    s.milestones.push(id);
    if (s.rewards.length + s.pendingRewards.length < 16)
      s.pendingRewards.push(id);
  }
}
export function addMilestones(s: State) {
  const secure = Object.values(s.facts).filter(
    (f) => f.status === "secure",
  ).length;
  for (const n of [1, 10, 25])
    if (secure >= n) grantMilestone(s, `secure-${n}`);
  return s;
}
export function independentAccuracy(s: State) {
  const independent = s.attempts.filter(
    (a) => a.independent && !isAssessment(a.kind),
  );
  const supported = s.attempts.filter(
    (a) => !a.independent && a.action !== "teaching" && !isAssessment(a.kind),
  );
  return {
    independent,
    supported,
    accuracy: independent.length
      ? Math.round(
          (independent.filter((a) => a.correct).length / independent.length) *
            100,
        )
      : null,
  };
}
