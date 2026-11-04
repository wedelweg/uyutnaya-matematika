import { openDB, type DBSchema } from "idb";
import { createState, localDate } from "../domain/engine";
import { LESSONS } from "../content/lessons";
import type { State } from "../domain/types";
const DB_NAME = "cozy-math";
export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
interface Database extends DBSchema {
  app: { key: string; value: { state: State; revision: number } };
}
export const openStore = () =>
  openDB<Database>(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("app")) db.createObjectStore("app");
    },
  });
export async function readState() {
  const db = await openStore();
  try {
    const row = await db.get("app", "profile");
    return row
      ? { state: validateState(migrate(row.state)), revision: row.revision }
      : { state: createState(), revision: 0 };
  } finally {
    db.close();
  }
}
export async function writeState(state: State, expectedRevision: number) {
  const db = await openStore();
  try {
    const tx = db.transaction("app", "readwrite");
    const row = await tx.store.get("profile");
    if ((row?.revision ?? 0) !== expectedRevision) {
      tx.abort();
      await tx.done.catch(() => {});
      throw new Error("CONFLICT");
    }
    await tx.store.put({ state, revision: expectedRevision + 1 }, "profile");
    await tx.done;
    return expectedRevision + 1;
  } finally {
    db.close();
  }
}
type Obj = Record<string, unknown>;
function object(x: unknown): asserts x is Obj {
  if (!x || typeof x !== "object" || Array.isArray(x))
    throw new Error("Ungültiges Objekt");
}
function check(x: unknown, message = "Ungültige Daten"): asserts x {
  if (!x) throw new Error(message);
}
const str = (x: unknown, max = 200) => typeof x === "string" && x.length <= max;
const num = (x: unknown, min = 0, max = 1e9) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
const integer = (x: unknown, min = 0, max = 1e9) =>
  num(x, min, max) && Number.isInteger(x);
const strings = (x: unknown, max = 100000): x is string[] =>
  Array.isArray(x) && x.length <= max && x.every((v) => str(v));
const bool = (x: unknown) => typeof x === "boolean";
const date = (x: unknown) =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  !Number.isNaN(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
const utc = (x: unknown) =>
  str(x, 50) && !Number.isNaN(Date.parse(x as string));
const formats = ["direct", "array", "strategy", "word", "missing"];
const kinds = ["mission", "diagnostic", "baseline", "intermediate", "delayed"];
export function migrate(input: unknown): unknown {
  object(input);
  if (input.schemaVersion !== 1) return input;
  const n = structuredClone(input);
  object(n.profile);
  object(n.facts);
  const tz = String(n.profile.timezone || "Europe/Berlin");
  for (const f of Object.values(n.facts)) {
    object(f);
    if ("dueAt" in f) {
      f.dueDate = f.dueAt
        ? localDate(new Date(f.dueAt as string | number), tz)
        : null;
      delete f.dueAt;
    }
    f.successSessions ??= [];
  }
  n.schemaVersion = 2;
  return n;
}
export function validateState(input: unknown): State {
  object(input);
  check(input.schemaVersion === 2, "Nicht unterstützte Version");
  const {
    profile: p,
    facts,
    pairs,
    lessons,
    attempts,
    sessions,
    active,
  } = input;
  object(p);
  check(
    str(p.name, 40) &&
      ["cozy", "calm"].includes(String(p.theme)) &&
      ["cat", "bunny"].includes(String(p.pet)) &&
      str(p.timezone, 80) &&
      bool(p.motion) &&
      bool(p.onboarded) &&
      bool(p.diagnosticDone) &&
      ["easy", "normal", "tired"].includes(String(p.mood)),
  );
  new Intl.DateTimeFormat("de", { timeZone: p.timezone as string }).format();
  object(facts);
  check(Object.keys(facts).length === 100);
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 10; b++) {
      const id = `${a}x${b}`,
        f = facts[id];
      object(f);
      check(
        f.id === id &&
          f.a === a &&
          f.b === b &&
          ["unseen", "learning", "review", "secure", "needsReview"].includes(
            String(f.status),
          ),
      );
      check(f.dueDate === null || date(f.dueDate));
      check(
        integer(f.step, 0, 4) &&
          [0, 1, 3, 7, 14, 30].includes(Number(f.currentInterval)) &&
          [0, 1, 3, 7, 14, 30].includes(Number(f.passedInterval)) &&
          integer(f.successes) &&
          integer(f.errors),
      );
      check(
        strings(f.successDates) &&
          f.successDates.every(date) &&
          new Set(f.successDates).size === f.successDates.length &&
          [...f.successDates].sort().join() === f.successDates.join(),
      );
      check(
        strings(f.successSessions) &&
          new Set(f.successSessions).size === f.successSessions.length,
      );
      check(f.lastAttempt === null || utc(f.lastAttempt));
      check(integer(f.lastHint, 0, 3));
    }
  object(pairs);
  check(Object.keys(pairs).length === 55);
  for (let a = 1; a <= 10; a++)
    for (let b = a; b <= 10; b++) {
      const p = pairs[`${a}:${b}`];
      object(p);
      check(p.id === `${a}:${b}` && bool(p.understood) && strings(p.evidence));
    }
  object(lessons);
  check(
    Object.entries(lessons).every(
      ([id, status]) =>
        LESSONS.some((l) => l.id === id) &&
        ["completed", "skipped"].includes(String(status)),
    ),
  );
  check(Array.isArray(attempts) && attempts.length <= 100000);
  const attemptIds = new Set();
  for (const a of attempts) {
    object(a);
    check(str(a.id) && str(a.sessionId) && !attemptIds.has(a.id));
    attemptIds.add(a.id);
    check(
      str(a.factId) &&
        ((a.factId as string) in facts || /^\d+x0$/.test(a.factId as string)),
    );
    check(formats.includes(String(a.format)) && kinds.includes(String(a.kind)));
    check(
      a.action === undefined ||
        ["answer", "teaching"].includes(String(a.action)),
    );
    check(a.firstCorrect === undefined || bool(a.firstCorrect));
    check(a.answer === null || integer(a.answer, 0, 10000));
    check(
      bool(a.correct) &&
        bool(a.revealed) &&
        bool(a.first) &&
        bool(a.independent) &&
        integer(a.hint, 0, 3) &&
        num(a.activeMs, 0, 86400000) &&
        utc(a.utc) &&
        date(a.date),
    );
    check(
      !a.independent ||
        (a.answer !== null &&
          a.first &&
          a.hint === 0 &&
          !a.revealed &&
          a.format !== "array"),
    );
  }
  const validateSession = (session: unknown) => {
    object(session);
    check(
      session.mode === undefined ||
        (session.mode === "quick" && session.kind === "mission"),
    );
    check(
      session.game === undefined ||
        (session.game === "cafe" && session.kind === "mission"),
    );
    check(
      session.cafePlates === undefined || integer(session.cafePlates, 0, 10),
    );
    check(
      str(session.id) &&
        kinds.includes(String(session.kind)) &&
        integer(session.seed, 0, 4294967295) &&
        date(session.date),
    );
    check(Array.isArray(session.tasks) && session.tasks.length <= 20);
    const ids = new Set();
    for (const t of session.tasks) {
      object(t);
      check(str(t.id) && !ids.has(t.id));
      ids.add(t.id);
      check(t.activeMs === undefined || num(t.activeMs, 0, 86400000));
      check(t.firstError === undefined || bool(t.firstError));
      check(
        t.servedPlates === undefined ||
          (integer(t.servedPlates, 0, 10) &&
            t.supported &&
            Number(t.servedPlates) <= Number(String(t.factId).split("x")[0])),
      );
      check(
        typeof t.factId === "string" &&
          t.factId in facts &&
          formats.includes(String(t.format)) &&
          [
            "warmup",
            "review",
            "new",
            "probe",
            "familiar",
            "correction",
          ].includes(String(t.purpose)) &&
          bool(t.supported),
      );
    }
    check(
      integer(session.cursor, 0, session.tasks.length) &&
        integer(session.lessonAt, 0, 2) &&
        integer(session.lessonStep, 0, 20) &&
        bool(session.lessonDone),
    );
    check(
      session.lessonId === null ||
        LESSONS.some((l) => l.id === session.lessonId),
    );
    check(
      strings(session.newFacts, 2) &&
        session.newFacts.every((f) => f in facts) &&
        strings(session.probes, 4) &&
        session.probes.every((f) => f in facts),
    );
    check(
      bool(session.adaptation) &&
        utc(session.startedAt) &&
        (session.completedAt === null || utc(session.completedAt)) &&
        integer(session.correct, 0, 20) &&
        integer(session.answered, 0, 20) &&
        num(session.activeMs, 0, 86400000),
    );
  };
  check(Array.isArray(sessions) && sessions.length <= 10000);
  sessions.forEach(validateSession);
  if (active !== null) validateSession(active);
  check(
    strings(input.milestones, 64) &&
      strings(input.pendingRewards, 16) &&
      Array.isArray(input.rewards) &&
      input.rewards.length <= 16 &&
      input.rewards.every((x) => integer(x, 0, 15)) &&
      new Set(input.rewards).size === input.rewards.length,
  );
  check(input.rewards.length + input.pendingRewards.length <= 16);
  if (input.room !== undefined) {
    object(input.room);
    const slots = input.room.slots;
    check(Array.isArray(slots) && slots.length === 8);
    const placed = slots.filter((x) => x !== null);
    check(
      placed.every(
        (x) =>
          integer(x, 0, 15) &&
          (input.rewards as number[]).includes(x as number),
      ) && new Set(placed).size === placed.length,
    );
  }
  // Reconstruct through JSON to strip accessors/prototypes from caller-supplied objects.
  return JSON.parse(JSON.stringify(input)) as State;
}
export function exportBackup(s: State, now = new Date()) {
  return JSON.stringify(
    { format: "cozy-math", version: 2, exportedAt: now.toISOString(), data: s },
    null,
    2,
  );
}
export function parseBackup(text: string) {
  check(
    new TextEncoder().encode(text).length <= MAX_BACKUP_BYTES,
    "Datei ist größer als 8 MB",
  );
  const file: unknown = JSON.parse(text);
  object(file);
  check(
    file.format === "cozy-math" && [1, 2].includes(Number(file.version)),
    "Das ist keine Sicherung dieser App",
  );
  return validateState(migrate(file.data));
}
