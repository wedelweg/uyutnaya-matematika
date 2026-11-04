import { FlowerPots } from "../components/FlowerPots";
import { CafeOrder, CookieBoard } from "./Cafe";
import { CAFE_CHAPTERS, cafeCount, finishedCafe } from "../domain/cafe";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context";
import {
  applyAttempt,
  factId,
  grantMilestone,
  isAssessment,
  localDate,
} from "../domain/engine";
import { completeSession, recordResponse } from "../domain/planner";
import { LESSONS, explanation, strategy } from "../content/lessons";
import { S, rowsLabel, wordProblem } from "../content/strings";
import { DotArray, Icon, Mascot } from "../components/Art";
import { Keypad } from "../components/Keypad";
import { RewardChoice, startSession } from "./Home";
import type { Attempt, Lesson, Task } from "../domain/types";
function useActiveTime(initial = 0) {
  const total = useRef(initial),
    since = useRef(document.hidden ? null : performance.now());
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        if (since.current !== null)
          total.current += performance.now() - since.current;
        since.current = null;
      } else since.current = performance.now();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  return () =>
    Math.min(
      86400000,
      Math.round(
        total.current +
          (since.current === null ? 0 : performance.now() - since.current),
      ),
    );
}
export function Activity() {
  const { state, commit, navigate, busy } = useApp();
  const active = state.active;
  if (!active) return <Summary />;
  const lesson = LESSONS.find((l) => l.id === active.lessonId);
  const lessonVisible =
    lesson && !active.lessonDone && active.cursor >= active.lessonAt;
  const task = active.tasks[active.cursor];
  async function finish() {
    if (await commit(completeSession(state, new Date()))) navigate("summary");
  }
  return (
    <section className="activity-shell">
      <div className="activity-top">
        <button className="text-button" onClick={() => navigate("home")}>
          <Icon name="back" />
          {S.exit}
        </button>
        <span>
          {active.mode === "quick"
            ? "Aufgaben → Geschenk"
            : active.kind === "diagnostic"
              ? S.diagnostic
              : isAssessment(active.kind)
                ? S.checks
                : active.game === "cafe"
                  ? "Eine Runde im gemütlichen Café"
                  : S.today}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={S.completedTasks}
        aria-valuenow={active.cursor}
        aria-valuemin={0}
        aria-valuemax={Math.max(active.tasks.length, 1)}
      >
        <span
          style={{
            width: `${active.tasks.length ? (active.cursor / active.tasks.length) * 100 : 0}%`,
          }}
        />
      </div>
      {lessonVisible ? (
        <LessonPlayer key={lesson.id} lesson={lesson} />
      ) : task ? (
        <TaskPlayer key={task.id} task={task} />
      ) : (
        <div className="panel center">
          <Mascot className="intro-mascot" pet={state.profile.pet} />
          <h1>{active.tasks.length ? S.summary : S.empty}</h1>
          <button
            className="primary"
            onClick={() => void finish()}
            disabled={busy}
          >
            {active.tasks.length ? S.done : S.returnRoom}
          </button>
        </div>
      )}
      {active.kind === "mission" &&
        active.activeMs >= 5 * 60 * 1000 &&
        active.cursor < active.tasks.length && (
          <aside className="panel pause-offer">
            <p>{S.pauseOffer}</p>
            <button
              className="secondary"
              onClick={() => void finish()}
              disabled={busy}
            >
              {S.finishNow}
            </button>
          </aside>
        )}
    </section>
  );
}
function LessonPlayer({ lesson: l }: { lesson: Lesson }) {
  const { state, commit, busy } = useApp();
  const session = state.active!,
    step = session.lessonStep;
  const [basis, setBasis] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [byGroups, setByGroups] = useState(false);
  const s = strategy(l.a, l.b);
  useEffect(() => {
    const id = `${session.id}-lesson-${l.id}`;
    if (!state.attempts.some((a) => a.id === id)) {
      const now = new Date();
      void commit(
        applyAttempt(state, {
          id,
          sessionId: session.id,
          factId: factId(l.a, l.b),
          format: "array",
          kind: "mission",
          action: "teaching",
          answer: null,
          correct: false,
          hint: 3,
          revealed: false,
          first: false,
          independent: false,
          activeMs: 0,
          utc: now.toISOString(),
          date: localDate(now, state.profile.timezone),
        }),
      );
    }
  }, [state, l.id]);
  async function advance() {
    const n = structuredClone(state);
    n.active!.lessonStep++;
    setBasis(false);
    await commit(n);
  }
  async function finish(skipped = false) {
    let n = structuredClone(state);
    n.lessons[l.id] = skipped ? "skipped" : "completed";
    n.active!.lessonDone = true;
    if (!skipped) {
      const a: Attempt = {
        id: `${session.id}-lesson-${l.id}`,
        sessionId: session.id,
        factId: factId(l.a, l.b),
        format: "array",
        kind: "mission",
        answer: null,
        correct: false,
        hint: 3,
        revealed: true,
        first: false,
        independent: false,
        activeMs: 0,
        utc: new Date().toISOString(),
        date: localDate(new Date(), state.profile.timezone),
      };
      n = applyAttempt(n, a);
      grantMilestone(n, `lesson-${l.id}`);
    } else {
      const omitted = new Set(n.active!.newFacts);
      n.active!.tasks = n.active!.tasks.filter(
        (t, i) => i < n.active!.cursor || !omitted.has(t.factId),
      );
      n.active!.newFacts = [];
    }
    await commit(n);
  }
  const end = step >= 4;
  return (
    <article className="lesson-card panel">
      <div className="lesson-kicker">
        <span className="pill">{l.short}</span>
        <span>{String(LESSONS.indexOf(l) + 1).padStart(2, "0")} / 11</span>
      </div>
      <h1>{l.title}</h1>
      <p className="learning-step">
        {step === 0
          ? "① Gleiche Gruppen ansehen"
          : step < 3
            ? "② Einen Rechenweg finden"
            : step === 3
              ? "③ Die Teile verbinden"
              : "④ Jetzt üben wir"}
      </p>
      <p className="lesson-approach">
        {step === 0
          ? l.approach
          : step === 1
            ? S.lessonOne
            : step === 2
              ? S.lessonTwo
              : step === 3
                ? S.lessonTogether
                : S.learnNext}
      </p>
      {session.game === "cafe" && step === 0 && (
        <>
          <CafeOrder a={l.a} b={l.b} />
          <CookieBoard
            a={l.a}
            b={l.b}
            served={session.cafePlates ?? 0}
            disabled={busy}
            onServe={() => {
              const n = structuredClone(state);
              n.active!.cafePlates = Math.min(
                l.a,
                (session.cafePlates ?? 0) + 1,
              );
              void commit(n);
            }}
          />
        </>
      )}
      {!(session.game === "cafe" && step === 0) && (
        <div className="lesson-visual">
          <DotArray
            a={l.id === "nine" || (l.id === "five" && !byGroups) ? 10 : l.a}
            b={l.b}
            split={
              step > 0
                ? l.id === "nine"
                  ? 9
                  : l.id === "five" && !byGroups
                    ? 5
                    : l.split
                : 0
            }
            rotate={rotated}
            removedRows={l.id === "nine" && step > 0 ? 1 : 0}
          />
        </div>
      )}
      {l.id === "five" && (
        <button className="text-button" onClick={() => setByGroups(!byGroups)}>
          {byGroups ? S.halfMethod : S.groupsMethod}
        </button>
      )}
      {l.id === "turn" && (
        <button className="secondary" onClick={() => setRotated(!rotated)}>
          {S.turn}
        </button>
      )}
      <div className="lesson-equations" aria-live="polite">
        <strong>
          {l.a} × {l.b}
          {step === 0 ? " = ?" : ""}
        </strong>
        {step >= 1 && l.id !== "five" && (
          <div className="split-labels">
            <span>
              {l.a === 9 ? "10" : l.split} × {l.b}
            </span>
            <span>{l.a === 9 ? "−" : "+"}</span>
            <span>
              {l.a === 9 ? "1" : l.a - l.split} × {l.b}
            </span>
          </div>
        )}
        {step === 1 && l.id !== "five" && (
          <button className="text-button" onClick={() => setBasis(!basis)}>
            {S.basis}: {l.a === 9 ? 10 : l.split} × {l.b}
          </button>
        )}
        {step === 2 && l.id !== "five" && (
          <>
            <div className="math-line">
              {l.a === 9 ? 10 * l.b : l.split * l.b} {l.a === 9 ? "−" : "+"} ?
            </div>
            <button className="text-button" onClick={() => setBasis(!basis)}>
              {S.basis}: {l.a === 9 ? 1 : l.a - l.split} × {l.b}
            </button>
          </>
        )}
        {basis && (
          <div className="basis-panel">
            <DotArray
              a={
                step === 1
                  ? l.a === 9
                    ? 10
                    : l.split
                  : l.a === 9
                    ? 1
                    : l.a - l.split
              }
              b={l.b}
            />
            <p>
              {Array.from(
                {
                  length:
                    step === 1
                      ? l.a === 9
                        ? 10
                        : l.split
                      : l.a === 9
                        ? 1
                        : l.a - l.split,
                },
                () => l.b,
              ).join(" + ")}{" "}
              ={" "}
              {(step === 1
                ? l.a === 9
                  ? 10
                  : l.split
                : l.a === 9
                  ? 1
                  : l.a - l.split) * l.b}
            </p>
          </div>
        )}
        {step >= 3 && l.id !== "five" && (
          <div className="math-line">
            {l.a === 9 ? s.left : l.split * l.b} {l.a === 9 ? "−" : "+"}{" "}
            {l.a === 9 ? s.right : (l.a - l.split) * l.b} = {l.a * l.b}
          </div>
        )}
        {l.id === "five" && step >= 1 && step < 3 && (
          <div className="basis-panel">
            {byGroups ? (
              <p>{Array.from({ length: 5 }, () => l.b).join(" + ")} = ?</p>
            ) : (
              <>
                <p>
                  10 × {l.b} = {10 * l.b}
                </p>
                <p>{10 * l.b} : 2 = ?</p>
                <p>
                  5 × {l.b} + 5 × {l.b} = {10 * l.b}
                </p>
              </>
            )}
          </div>
        )}
        {step >= 3 && l.id === "five" && (
          <p className="basis-panel">
            10 × {l.b} = {10 * l.b}. {10 * l.b} : 2 = {5 * l.b}.<br />
            {rowsLabel(5, l.b)}
          </p>
        )}
        {step >= 3 && l.id === "groups" && (
          <div className="basis-panel">
            <p>
              1 × {l.b} = {l.b}
            </p>
            <p>
              2 × {l.b} = {l.b} + {l.b} = {2 * l.b}
            </p>
            <p>
              10 × {l.b} = {Array.from({ length: 10 }, () => l.b).join(" + ")} ={" "}
              {10 * l.b}
            </p>
          </div>
        )}
        {step >= 3 && l.id === "zero" && <p>{S.zeroEnd}</p>}
      </div>
      <button
        className="primary full"
        disabled={busy}
        onClick={() => void (end ? finish() : advance())}
      >
        {end ? S.hideSupport : step === 0 ? S.split : S.next}
        <Icon name="arrow" />
      </button>
      <button
        className="text-button full"
        disabled={busy}
        onClick={() => void finish(true)}
      >
        {S.lessonSkip}
      </button>
    </article>
  );
}
function TaskPlayer({ task }: { task: Task }) {
  const { state, commit, busy, navigate } = useApp();
  const session = state.active!,
    fact = state.facts[task.factId],
    assessment = isAssessment(session.kind);
  const previous = state.attempts.find((a) => a.id === task.id),
    [answer, setAnswer] = useState(""),
    [strategyStep, setStrategyStep] = useState(0),
    [split, setSplit] = useState(false),
    [partError, setPartError] = useState(false);
  const elapsed = useActiveTime(task.activeMs ?? 0),
    submitting = useRef(false),
    feedbackRef = useRef<HTMLHeadingElement>(null);
  const st = strategy(fact.a, fact.b);
  const visualStory = task.format === "word" && !assessment;
  const quick = session.mode === "quick";
  const support = task.supported || task.format === "array" || visualStory;
  useEffect(() => {
    const persist = () => {
      if (document.hidden || leaving.current) {
        const n = structuredClone(state);
        if (n.active && n.active.id === session.id && !previous) {
          n.active.tasks[n.active.cursor].activeMs = elapsed();
          void commit(n);
        }
      }
    };
    const leaving = { current: false };
    const pause = () => {
      leaving.current = true;
      persist();
      leaving.current = false;
    };
    document.addEventListener("visibilitychange", persist);
    window.addEventListener("cozy-pause", pause);
    window.addEventListener("pagehide", pause);
    return () => {
      document.removeEventListener("visibilitychange", persist);
      window.removeEventListener("cozy-pause", pause);
      window.removeEventListener("pagehide", pause);
    };
  }, [state, previous]);
  const expected =
    task.format === "missing"
      ? fact.a
      : task.format === "strategy" && strategyStep < 2
        ? strategyStep === 0
          ? st.left
          : st.right
        : fact.a * fact.b;
  useEffect(() => {
    if (previous) feedbackRef.current?.focus();
  }, [previous?.id]);
  function withTeaching(error = false) {
    const now = new Date();
    let n = structuredClone(state);
    n.active!.tasks[session.cursor].supported = true;
    if (error) n.active!.tasks[session.cursor].firstError = true;
    if (
      task.purpose === "probe" &&
      n.active!.newFacts.length < 2 &&
      !n.active!.newFacts.includes(task.factId)
    )
      n.active!.newFacts.push(task.factId);
    n = applyAttempt(n, {
      id: `${task.id}-support`,
      sessionId: session.id,
      factId: fact.id,
      format: task.format,
      kind: session.kind,
      answer: null,
      correct: false,
      hint: 2,
      revealed: task.format !== "array",
      first: false,
      independent: false,
      action: "teaching",
      activeMs: 0,
      utc: now.toISOString(),
      date: localDate(now, state.profile.timezone),
    });
    return n;
  }
  async function hint(error = false) {
    await commit(withTeaching(error));
  }
  useEffect(() => {
    if (
      support &&
      !assessment &&
      !previous &&
      !state.attempts.some((a) => a.id === `${task.id}-support`)
    )
      void commit(withTeaching());
  }, [state, task.id]);
  async function submit(unknown = false) {
    if (submitting.current || busy || previous) return;
    submitting.current = true;
    try {
      if (!unknown && task.format === "strategy" && strategyStep < 2) {
        if (Number(answer) !== expected) {
          setPartError(true);
          await hint(true);
        } else {
          setStrategyStep(strategyStep + 1);
          setPartError(false);
          setAnswer("");
        }
        return;
      }
      const now = new Date(),
        correct = !unknown && Number(answer) === expected;
      const a: Attempt = {
        id: task.id,
        sessionId: session.id,
        factId: fact.id,
        format: task.format,
        kind: session.kind,
        answer: unknown ? null : Number(answer),
        correct,
        firstCorrect: correct && !task.firstError,
        action: "answer",
        hint: support ? 2 : 0,
        revealed: support,
        first: task.purpose !== "correction",
        independent: !unknown && !support && task.purpose !== "correction",
        activeMs: elapsed(),
        utc: now.toISOString(),
        date: localDate(now, state.profile.timezone),
      };
      await commit(recordResponse(state, a));
    } finally {
      submitting.current = false;
    }
  }
  const advancing = useRef(false);
  async function next() {
    if (advancing.current || busy) return;
    advancing.current = true;
    const n = structuredClone(state);
    n.active!.cursor++;
    if (n.active!.cursor >= n.active!.tasks.length) {
      if (await commit(completeSession(n, new Date()))) navigate("summary");
      else advancing.current = false;
    } else if (!(await commit(n))) advancing.current = false;
  }
  useEffect(() => {
    if (!quick || !previous?.correct || busy) return;
    const timer = setTimeout(() => {
      if (!document.hidden) void next();
    }, 650);
    return () => clearTimeout(timer);
  }, [previous?.id, busy]);
  const cafe = session.game === "cafe";
  const title =
    task.format === "word"
      ? S.wordTitle
      : task.format === "strategy"
        ? S.strategyTitle
        : task.format === "array"
          ? S.arrayTitle
          : task.format === "missing"
            ? S.missingTitle
            : S.directTitle;
  return (
    <article
      className="task-card panel"
      data-testid="task"
      data-fact={fact.id}
      data-format={task.format}
    >
      <div className="task-kicker">
        <span>
          {S.task} {session.cursor + 1} / {session.tasks.length}
        </span>
        <span className="pill">
          {support ? "Mit Tipp" : quick ? "✿ Zum Geschenk" : S.independent}
        </span>
      </div>
      <h1>
        {quick
          ? "Wie viel ist das?"
          : cafe
            ? "Helfen wir beim Vorbereiten"
            : title}
      </h1>
      {cafe && !quick && !previous && (
        <CafeOrder
          a={fact.a}
          b={fact.b}
          missing={task.format === "missing"}
          independent={!support}
        />
      )}
      {session.adaptation && !quick && !previous && (
        <p className="adaptation-note">{S.adaptation}</p>
      )}
      {task.format === "word" && !cafe && (
        <div className="word-story">
          <p className="word-problem">{wordProblem(fact.a, fact.b)}</p>
          {!assessment && !previous && <FlowerPots a={fact.a} b={fact.b} />}
        </div>
      )}
      {task.format === "strategy" ? (
        <div className="strategy-question">
          <p>
            {fact.a} × {fact.b} = {st.leftA} × {fact.b} {st.operator}{" "}
            {st.rightA} × {fact.b}
          </p>
          <div className="equation">
            {strategyStep === 0
              ? `${st.leftA} × ${fact.b}`
              : strategyStep === 1
                ? `${st.rightA} × ${fact.b}`
                : `${st.left} ${st.operator} ${st.right}`}{" "}
            = <span>?</span>
          </div>
          <p>
            {strategyStep === 0
              ? S.firstPart
              : strategyStep === 1
                ? S.secondPart
                : S.totalPart}
          </p>
        </div>
      ) : (
        <div className="equation">
          {task.format === "missing" ? (
            <>
              <span>?</span> × {fact.b} = {fact.a * fact.b}
            </>
          ) : (
            <>
              {fact.a} × {fact.b} ={" "}
              <span>
                {previous && previous.correct ? previous.answer : "?"}
              </span>
            </>
          )}
        </div>
      )}
      {task.format === "array" && !cafe && !previous && (
        <>
          <DotArray a={fact.a} b={fact.b} split={split ? st.leftA : 0} />
          <button className="secondary" onClick={() => setSplit(!split)}>
            {S.split}
          </button>
        </>
      )}
      {support && cafe && !quick && !previous && (
        <CookieBoard
          a={fact.a}
          b={fact.b}
          served={task.servedPlates ?? 0}
          disabled={busy}
          onServe={() => {
            const n = structuredClone(state);
            n.active!.tasks[session.cursor].servedPlates = Math.min(
              fact.a,
              (task.servedPlates ?? 0) + 1,
            );
            void commit(n);
          }}
        />
      )}
      {support && !assessment && !previous && (
        <div className="support-panel">
          {task.format !== "array" && (!cafe || quick) && !visualStory && (
            <DotArray
              a={fact.a}
              b={fact.b}
              split={Math.min(st.leftA, fact.a)}
            />
          )}
          {(task.format !== "array" || split) && (
            <div className="worked-example">
              <strong>Ein guter Rechenweg</strong>
              <p className="support-equation">{explanation(fact.a, fact.b)}</p>
            </div>
          )}
        </div>
      )}
      {partError && (
        <p role="status">
          {S.strategyError} {strategyStep === 0 ? st.left : st.right}
        </p>
      )}
      {!previous ? (
        <>
          <Keypad
            value={answer}
            onChange={setAnswer}
            onSubmit={() => void submit()}
            disabled={busy}
          />
          <div className="task-tools">
            {!assessment && (
              <button
                className="text-button"
                disabled={busy || support}
                onClick={() => void hint()}
              >
                <Icon name="leaf" size={17} />
                {S.hint}
              </button>
            )}
            {!quick && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void submit(true)}
              >
                {S.unknown}
              </button>
            )}
          </div>
        </>
      ) : (
        <div
          className={`feedback ${previous.correct || assessment ? "success" : "gentle"}`}
        >
          {!assessment && (
            <div
              className={`answer-mascot ${previous.correct ? "answer-happy" : "answer-sad"}`}
              role="img"
              aria-label={`${state.profile.pet === "bunny" ? "Pompompurin" : "My Melody"} ${previous.correct ? "freut sich" : "ist traurig und macht dir Mut"}`}
            >
              <Mascot pet={state.profile.pet} />
              <span aria-hidden="true">{previous.correct ? "♥" : "💧"}</span>
            </div>
          )}
          <h2 ref={feedbackRef} tabIndex={-1}>
            {assessment
              ? S.assessmentRecorded
              : previous.correct
                ? quick
                  ? "Richtig!"
                  : cafe
                    ? "Bestellung fertig!"
                    : S.correct
                : S.correction}
          </h2>
          {!quick && (
            <p>
              {assessment
                ? S.assessmentNote
                : previous.correct
                  ? cafe
                    ? "Danke für die Leckerei! Die nächste Bestellung wartet schon."
                    : S.correctNote
                  : explanation(fact.a, fact.b)}
            </p>
          )}
          {quick && !previous.correct && <p>{explanation(fact.a, fact.b)}</p>}
          {!assessment && !previous.correct && (
            <DotArray
              a={fact.a}
              b={fact.b}
              split={Math.min(st.leftA, fact.a)}
            />
          )}
          <button
            className="primary full"
            disabled={busy}
            onClick={() => void next()}
          >
            {S.next}
            <Icon name="arrow" />
          </button>
        </div>
      )}
    </article>
  );
}
export function Summary() {
  const { state, navigate, commit, busy } = useApp();
  const session = state.sessions.at(-1);
  const attempts = state.attempts.filter(
      (a) => a.sessionId === session?.id && a.first,
    ),
    independent = attempts.filter((a) => a.independent),
    supported = attempts.filter((a) => !a.independent);
  const assessment = session && isAssessment(session.kind);
  if (session?.mode === "quick")
    return (
      <section className="narrow quick-summary">
        <div className="panel center summary-panel">
          <h1>Fertig! ✿</h1>
          <p>
            {session.answered} Aufgaben · {session.correct} richtig
          </p>
        </div>
        <RewardChoice showRoom />
        <button className="primary full" onClick={() => navigate("home")}>
          In mein Zimmer
          <Icon name="arrow" />
        </button>
        <button
          className="text-button full"
          disabled={busy}
          onClick={async () => {
            if (await commit(startSession(state, "mission")))
              navigate("activity");
          }}
        >
          Noch eine Runde
        </button>
      </section>
    );
  return (
    <section className="narrow">
      <div className="panel center summary-panel">
        <Mascot className="summary-mascot" pet={state.profile.pet} />
        <span className="eyebrow">{S.brand}</span>
        <h1>
          {session?.kind === "diagnostic"
            ? S.summaryDiagnostic
            : session && finishedCafe(session)
              ? "Die gemütliche Café-Runde ist geschafft!"
              : S.summary}
        </h1>
        <p>
          {session?.kind === "diagnostic"
            ? S.summaryDiagnosticNote
            : S.summaryNote}
        </p>
        {session && finishedCafe(session) && (
          <div className="cafe-finish">
            <span aria-hidden="true">
              {cafeCount(state) % 3 === 0 ? "☀" : "✿"}
            </span>
            <h2>
              {cafeCount(state) % 3 === 0
                ? "Das Picknick ist gelungen!"
                : "Ein weiteres Kapitel der Geschichte"}
            </h2>
            <p>
              {cafeCount(state) % 3 === 0
                ? "Die Freunde haben zusammen gepicknickt. Nächstes Mal beginnt ein neues Kapitel."
                : `Nächstes Mal: ${CAFE_CHAPTERS[cafeCount(state) % 3].title}.`}
            </p>
            <small>
              Ein Zeichen für eine geschaffte Runde. Fehler und Tipps sind
              erlaubt.
            </small>
          </div>
        )}
        <div className="summary-stats">
          <div>
            <strong>{session?.answered ?? 0}</strong>
            <span>{S.completedTasks}</span>
          </div>
          <div>
            <strong>
              {independent.filter((a) => a.correct).length}/{independent.length}
            </strong>
            <span>{S.independentAnswers}</span>
          </div>
          <div>
            <strong>{supported.length}</strong>
            <span>{S.withHelp}</span>
          </div>
        </div>
        <button className="primary full" onClick={() => navigate("home")}>
          {S.returnRoom}
          <Icon name="arrow" />
        </button>
        <button
          className="text-button full"
          disabled={busy}
          onClick={async () => {
            if (await commit(startSession(state, "mission")))
              navigate("activity");
          }}
        >
          {S.voluntary}
        </button>
      </div>
      <RewardChoice />
      {assessment && (
        <section className="panel">
          <h2>{S.correction}</h2>
          {attempts
            .filter((a) => !a.correct)
            .map((a) => {
              const f = state.facts[a.factId];
              return (
                <div className="assessment-review" key={a.id}>
                  <p>{explanation(f.a, f.b)}</p>
                  <DotArray a={f.a} b={f.b} split={strategy(f.a, f.b).leftA} />
                </div>
              );
            })}
          {attempts.every((a) => a.correct) && <p>{S.correct}</p>}
        </section>
      )}
    </section>
  );
}
