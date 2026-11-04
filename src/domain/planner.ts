import { LESSONS } from "../content/lessons";
import { cafeCount, finishedCafe } from "./cafe";
import {
  addDays,
  applyAttempt,
  factId,
  grantMilestone,
  isAssessment,
  localDate,
} from "./engine";
import type {
  Attempt,
  Fact,
  Format,
  Kind,
  Lesson,
  Session,
  State,
  Task,
} from "./types";
export function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function lessonAvailable(s: State, l: Lesson) {
  return l.prereqs.every((id) => !!s.lessons[id]);
}
export function nextLesson(s: State) {
  return LESSONS.find((l) => !s.lessons[l.id] && lessonAvailable(s, l));
}
export function overdue(s: State, date: string) {
  return Object.values(s.facts).filter(
    (f) => f.dueDate !== null && f.dueDate < date,
  );
}
export function upgradeActivePractice(s: State): State {
  if (
    !s.active ||
    s.active.kind !== "mission" ||
    s.active.game !== "cafe" ||
    s.active.mode === "quick"
  )
    return s;
  const n = structuredClone(s),
    session = n.active!;
  session.mode = "quick";
  session.lessonDone = true;
  session.tasks = session.tasks.slice(0, session.cursor + 6);
  session.tasks.forEach((t, i) => {
    if (i < session.cursor || n.attempts.some((a) => a.id === t.id)) return;
    t.format = "direct";
    // Preserve already revealed help, but do not force help on future tasks.
    t.supported = n.attempts.some((a) => a.id === `${t.id}-support`);
    if (!t.supported) delete t.servedPlates;
  });
  return n;
}
export function createSession(
  s: State,
  kind: Kind,
  now: Date,
  seed: number,
  id: string,
  chosenLesson?: string,
): Session {
  const date = localDate(now, s.profile.timezone),
    random = rng(seed);
  const session: Session = {
    id,
    kind,
    seed,
    date,
    tasks: [],
    cursor: 0,
    lessonId: null,
    lessonAt: 2,
    lessonStep: 0,
    lessonDone: false,
    newFacts: [],
    probes: [],
    adaptation: false,
    startedAt: now.toISOString(),
    completedAt: null,
    correct: 0,
    answered: 0,
    activeMs: 0,
  };
  const task = (
    fid: string,
    format: Format,
    purpose: Task["purpose"],
    supported = false,
  ) => ({
    id: `${id}-${session.tasks.length}`,
    factId: fid,
    format,
    purpose,
    supported,
  });
  if (kind === "diagnostic") {
    const facts = [
      [2, 3],
      [1, 8],
      [10, 4],
      [5, 6],
      [4, 3],
      [3, 7],
      [6, 7],
      [8, 4],
      [7, 8],
      [9, 6],
    ];
    facts.forEach(([a, b], i) =>
      session.tasks.push(
        task(factId(a, b), i === 0 ? "word" : "direct", "probe"),
      ),
    );
    return session;
  }
  if (isAssessment(kind)) {
    // Eight anchors shared across forms for a meaningful retention denominator;
    // seed changes orientation and order, and transfer stories use different facts.
    const pairs = [
      [2, 6],
      [3, 7],
      [4, 8],
      [5, 9],
      [6, 8],
      [7, 8],
      [7, 9],
      [9, 9],
    ];
    const form = kind === "baseline" ? 0 : kind === "intermediate" ? 1 : 2;
    shuffle(pairs, random).forEach(([a, b]) =>
      session.tasks.push(task(factId(a, b), "direct", "review")),
    );
    const stories = [
      [
        [3, 6],
        [4, 7],
      ],
      [
        [3, 7],
        [4, 6],
      ],
      [
        [3, 8],
        [4, 5],
      ],
    ][form];
    stories.forEach(([a, b]) =>
      session.tasks.push(task(factId(a, b), "word", "review")),
    );
    return session;
  }
  if (!chosenLesson) {
    session.mode = "quick";
    session.lessonDone = true;
    const target =
      s.profile.mood === "tired" ? 4 : s.profile.mood === "easy" ? 8 : 6;
    const facts = Object.values(s.facts);
    const due = shuffle(
      facts.filter((f) => f.dueDate && f.dueDate <= date),
      random,
    ).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
    const known = shuffle(
      facts.filter((f) => f.status !== "unseen"),
      random,
    );
    // Broaden practice without making a child sit through an unsolicited lesson.
    const families = [2, 5, 10, 3, 4, 6, 7, 8, 9, 1];
    const unseen = families.flatMap((a) =>
      shuffle(
        facts.filter((f) => f.a === a && f.status === "unseen"),
        random,
      ),
    );
    const fresh =
      (s.profile.mood === "tired" && known.length) ||
      overdue(s, date).length > 20
        ? []
        : unseen.slice(0, known.length ? 2 : target);
    const pool = [...due, ...fresh, ...known].filter(
      (f, i, all) => all.findIndex((x) => x.id === f.id) === i,
    );
    for (let i = 0; i < target && pool.length; i++) {
      const last = session.tasks.at(-1)?.factId;
      const chosen =
        pool.find(
          (f) => f.id !== last && !session.tasks.some((t) => t.factId === f.id),
        ) ??
        pool.find((f) => f.id !== last) ??
        pool[0];
      session.tasks.push(
        task(
          chosen.id,
          "direct",
          chosen.status === "unseen" ? "probe" : "review",
        ),
      );
    }
    return session;
  }
  const target =
    s.profile.mood === "tired" ? 8 : s.profile.mood === "easy" ? 14 : 12;
  const debt = overdue(s, date).length > 20;
  const due = shuffle(
    Object.values(s.facts).filter((f) => f.dueDate && f.dueDate <= date),
    random,
  ).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const known = shuffle(
    Object.values(s.facts).filter((f) => f.successes > 0),
    random,
  );
  const familiar = known.length
    ? known
    : shuffle(
        Object.values(s.facts).filter((f) => f.status !== "unseen"),
        random,
      );
  const lesson = chosenLesson
    ? LESSONS.find((l) => l.id === chosenLesson)
    : !debt && s.profile.mood !== "tired"
      ? nextLesson(s)
      : undefined;
  if (lesson) {
    session.lessonId = lesson.id;
    session.lessonAt = familiar.length ? 2 : 0;
    if (lesson.b > 0 && s.facts[factId(lesson.a, lesson.b)].status === "unseen")
      session.newFacts.push(factId(lesson.a, lesson.b));
  }
  const families = LESSONS.filter(
    (l) => s.lessons[l.id] || l.id === lesson?.id,
  ).flatMap((l) => l.families);
  const newSlots =
    due.length >= 4
      ? Math.max(1, Math.round((target - 4) * 0.25) - (lesson ? 1 : 0))
      : 4;
  const probes =
    !debt && s.profile.mood !== "tired"
      ? shuffle(
          Object.values(s.facts).filter(
            (f) =>
              f.status === "unseen" &&
              families.includes(f.a) &&
              !session.newFacts.includes(f.id),
          ),
          random,
        ).slice(0, Math.min(4, newSlots))
      : [];
  const learned =
    lesson && lesson.b > 0 ? [s.facts[factId(lesson.a, lesson.b)]] : [];
  if (lesson && lesson.b > 0 && !familiar.length) {
    const second =
      s.facts[factId(lesson.a, lesson.b === 10 ? 9 : lesson.b + 1)];
    learned.push(second);
    if (second.status === "unseen" && !session.newFacts.includes(second.id))
      session.newFacts.push(second.id);
  }
  for (let i = probes.length - 1; i >= 0; i--)
    if (session.newFacts.includes(probes[i].id)) probes.splice(i, 1);
  const pool = debt && !chosenLesson ? due : [...due, ...familiar, ...learned];
  if (!pool.length && !probes.length) return session;
  for (let i = 0; i < target; i++) {
    const last = session.tasks.at(-1)?.factId;
    let chosen: Fact | undefined,
      purpose: Task["purpose"] = "familiar",
      supported = false;
    if (debt) {
      chosen =
        due.find(
          (f) => f.id !== last && !session.tasks.some((t) => t.factId === f.id),
        ) || due.find((f) => f.id !== last);
      purpose = "review";
    } else if (i < 2 && familiar.length) {
      chosen = familiar.find((f) => f.id !== last);
      purpose = "warmup";
    } else if (i >= target - 2) {
      chosen =
        familiar.find((f) => f.id !== last) ||
        learned.find((f) => f.id !== last);
    } else if (learned.length && i === Math.max(session.lessonAt, 2)) {
      chosen = learned[0];
      purpose = "new";
      supported = true;
    } else if ([3, 5, 7, 9].includes(i) && probes.length) {
      chosen = probes.shift();
      purpose = "probe";
      if (chosen) session.probes.push(chosen.id);
    } else {
      chosen = due.find(
        (f) => f.id !== last && !session.tasks.some((t) => t.factId === f.id),
      );
      purpose = "review";
    }
    chosen ??=
      pool.find(
        (f) => f.id !== last && !session.tasks.some((t) => t.factId === f.id),
      ) || pool.find((f) => f.id !== last);
    if (!chosen) break;
    if (
      (i >= target - 2 || session.newFacts.includes(chosen.id)) &&
      !known.some((f) => f.id === chosen!.id)
    )
      supported = true;
    if (session.newFacts.includes(chosen.id) && purpose !== "probe")
      purpose = "new";
    const formats: Format[] = [
      "direct",
      "word",
      "strategy",
      "array",
      "missing",
    ];
    let format =
      debt || purpose === "probe" || i < 2 || i >= target - 2
        ? "direct"
        : formats[i % 5];
    if (format === "missing" && !chosen.successes) format = "direct";
    if (format === "array") supported = true;
    session.tasks.push(task(chosen.id, format, purpose, supported));
  }
  // Independent retrieval of the taught fact is placed only after three intervening tasks.
  if (learned.length) {
    const first = session.tasks.findIndex((t) => t.factId === learned[0].id);
    const at = Math.max(session.lessonAt + 3, first + 4);
    if (
      at < session.tasks.length - 2 &&
      session.tasks[at - 1].factId !== learned[0].id &&
      session.tasks[at + 1]?.factId !== learned[0].id
    )
      session.tasks[at] = {
        ...session.tasks[at],
        factId: learned[0].id,
        format: "direct",
        purpose: "review",
        supported: false,
      };
  }
  return session;
}
export function recordResponse(s: State, a: Attempt): State {
  if (s.attempts.some((x) => x.id === a.id)) return s;
  const next = applyAttempt(s, a);
  const session = next.active;
  if (!session) return next;
  session.answered++;
  if (a.correct) session.correct++;
  session.activeMs += a.activeMs;
  if (session.kind !== "mission") return next;
  const current = session.tasks[session.cursor];
  if (!a.correct && current.purpose === "probe" && session.newFacts.length < 2)
    session.newFacts.push(a.factId);
  if (!a.correct && a.independent) {
    const mayRepeat =
      current.purpose !== "probe" || session.newFacts.includes(a.factId);
    const at = session.cursor + 4;
    if (
      mayRepeat &&
      at < session.tasks.length - 2 &&
      session.tasks[at - 1].factId !== a.factId &&
      session.tasks[at + 1]?.factId !== a.factId
    ) {
      session.tasks[at] = {
        id: `${session.id}-correction-${session.cursor}`,
        factId: a.factId,
        format: "direct",
        purpose: "correction",
        supported: session.mode !== "quick",
      };
    }
  }
  const recent = next.attempts
    .filter((x) => x.sessionId === session.id && x.independent)
    .slice(-4);
  if (recent.filter((x) => !x.correct).length >= 2) {
    session.adaptation = true;
    const safe = Object.values(next.facts).filter((f) => f.status !== "unseen");
    for (let i = session.cursor + 1; i < session.tasks.length; i++) {
      const t = session.tasks[i];
      if (
        t.purpose === "probe" ||
        (t.purpose === "new" && next.facts[t.factId]?.status === "unseen")
      ) {
        const replacement = safe.find(
          (f) =>
            f.id !== session.tasks[i - 1].factId &&
            f.id !== session.tasks[i + 1]?.factId,
        );
        if (replacement) {
          t.factId = replacement.id;
          t.purpose = "review";
        } else {
          session.tasks.splice(i--, 1);
          continue;
        }
      }
      if (session.mode !== "quick" && next.facts[t.factId]?.status !== "secure")
        t.supported = true;
    }
    if (session.cursor < session.lessonAt) session.lessonDone = true;
  }
  return next;
}
export function completeSession(s: State, now: Date): State {
  const n = structuredClone(s),
    session = n.active;
  if (!session) return n;
  session.completedAt = now.toISOString();
  n.sessions.push(session);
  n.active = null;
  if (session.kind === "diagnostic") {
    n.profile.diagnosticDone = true;
    grantMilestone(n, "diagnostic");
  }
  if (session.kind === "mission" && session.answered > 0)
    grantMilestone(n, "first-mission");
  if (finishedCafe(session)) {
    const count = cafeCount(n);
    if (count <= 16) grantMilestone(n, `cafe-${count}`);
  } else if (
    session.kind === "mission" &&
    session.tasks.length > 0 &&
    session.cursor >= session.tasks.length &&
    session.answered === session.tasks.length
  ) {
    const count = n.sessions.filter(
      (x) =>
        x.kind === "mission" &&
        x.tasks.length > 0 &&
        x.cursor >= x.tasks.length &&
        x.answered === x.tasks.length,
    ).length;
    if (count <= 16) grantMilestone(n, `round-${count}`);
  }
  return n;
}
export function assessmentAvailability(s: State, today: string) {
  const has = (kind: Kind) => s.sessions.find((x) => x.kind === kind);
  const intermediate = has("intermediate"),
    delayedStart = intermediate?.completedAt
      ? localDate(new Date(intermediate.completedAt), s.profile.timezone)
      : null;
  return {
    baseline: s.profile.diagnosticDone && !has("baseline"),
    intermediate:
      s.sessions.filter((x) => x.kind === "mission").length >= 5 &&
      !intermediate,
    delayed:
      !!delayedStart && today >= addDays(delayedStart, 7) && !has("delayed"),
    delayedWindow: delayedStart
      ? `${addDays(delayedStart, 7)} — ${addDays(delayedStart, 14)}`
      : null,
    delayedLate: !!delayedStart && today > addDays(delayedStart, 14),
  };
}
