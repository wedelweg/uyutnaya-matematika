import { useState } from "react";
import { useApp } from "../context";
import { S } from "../content/strings";
import { assessmentAvailability, nextLesson } from "../domain/planner";
import { independentAccuracy, isAssessment, localDate } from "../domain/engine";
import { Icon } from "../components/Art";
import { startSession } from "./Home";
import { Backup } from "./Settings";
import type { Kind, Session } from "../domain/types";
export function Parents() {
  const { state, commit, navigate, today, busy } = useApp();
  const [unlocked, setUnlocked] = useState(false),
    [gate, setGate] = useState(""),
    [wrong, setWrong] = useState(false);
  const stats = independentAccuracy(state),
    available = assessmentAvailability(state, today),
    next = nextLesson(state);
  if (!unlocked)
    return (
      <section className="panel narrow">
        <Icon name="heart" size={40} />
        <h1>{S.parentGate}</h1>
        <p>{S.gateNote}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (gate === "21") setUnlocked(true);
            else setWrong(true);
          }}
        >
          <label>
            {S.gateAnswer}
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={gate}
              onChange={(e) => setGate(e.target.value)}
            />
          </label>
          {wrong && <p role="alert">{S.wrongGate}</p>}
          <button className="primary full" type="submit">
            {S.enter}
          </button>
        </form>
      </section>
    );
  const tested = new Set(stats.independent.map((a) => a.factId)).size,
    secure = Object.values(state.facts).filter((f) => f.status === "secure"),
    avg = stats.independent.length
      ? Math.round(
          stats.independent.reduce((sum, a) => sum + a.activeMs, 0) /
            stats.independent.length /
            1000,
        )
      : null;
  const checks: Kind[] = ["baseline", "intermediate", "delayed"];
  const titles = [S.baseline, S.intermediate, S.delayed];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{S.parents}</span>
          <h1>{S.parentTitle}</h1>
          <p>{S.parentNote}</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="panel stat">
          <strong>{tested}/100</strong>
          <span>{S.tested}</span>
        </div>
        <div className="panel stat">
          <strong>{secure.length}/100</strong>
          <span>{S.mastered}</span>
        </div>
        <div className="panel stat">
          <strong>
            {stats.accuracy === null ? "—" : `${stats.accuracy}%`}
          </strong>
          <span>{S.accuracy}</span>
          <small>
            {stats.independent.length} {S.attempts}
          </small>
        </div>
        <div className="panel stat">
          <strong>
            {stats.supported.filter((a) => a.correct).length}/
            {stats.supported.length}
          </strong>
          <span>{S.withHelp}</span>
          <small>
            {stats.supported.length} {S.attempts}
          </small>
        </div>
      </div>
      <section className="panel">
        <h2>{S.nextTopics}</h2>
        <p>{next?.title ?? S.mapTitle}</p>
        <h3>{S.successes}</h3>
        {secure.length ? (
          <p>
            {secure
              .slice(0, 8)
              .map((f) => `${f.a} × ${f.b}`)
              .join(" · ")}{" "}
            — {S.secure.toLowerCase()}
          </p>
        ) : stats.independent.some((a) => a.correct) ? (
          <p>
            {[
              ...new Set(
                stats.independent
                  .filter((a) => a.correct)
                  .map((a) => a.factId.replace("x", " × ")),
              ),
            ]
              .slice(-8)
              .join(" · ")}{" "}
            — richtige Antworten ohne Hilfe
          </p>
        ) : (
          <p>{S.noStats}</p>
        )}
        <p>
          {S.latency}: {avg === null ? "—" : `${avg} s`} (
          {stats.independent.length} {S.attempts})
        </p>
        <small>{S.latencyNote}</small>
      </section>
      <section className="panel">
        <h2>{S.checks}</h2>
        <p>{S.checksNote}</p>
        {state.active && (
          <button className="secondary" onClick={() => navigate("activity")}>
            {S.resume}
          </button>
        )}
        <div className="check-grid">
          {checks.map((kind, i) => {
            const completed = state.sessions.find((x) => x.kind === kind),
              can = available[kind as "baseline" | "intermediate" | "delayed"];
            return (
              <article className="check-card" key={kind}>
                <span className="eyebrow">0{i + 1}</span>
                <h3>{titles[i]}</h3>
                <p>{completed ? S.taken : can ? S.available : S.notYet}</p>
                {kind === "baseline" && !state.profile.diagnosticDone && (
                  <button
                    className="text-button"
                    disabled={!!state.active}
                    onClick={() => navigate("intro")}
                  >
                    {S.diagnosticStart}
                  </button>
                )}
                {kind === "delayed" && available.delayedWindow && (
                  <small>{available.delayedWindow}</small>
                )}
                {kind === "delayed" && available.delayedLate && !completed && (
                  <p>{S.lateCheck}</p>
                )}
                {completed ? (
                  <AssessmentResult session={completed} />
                ) : (
                  <button
                    className="secondary"
                    disabled={!can || busy || !!state.active}
                    onClick={async () => {
                      if (await commit(startSession(state, kind)))
                        navigate("activity");
                    }}
                  >
                    {S.assessmentStart}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <Backup />
      <section className="panel prose">
        <h2>{S.method}</h2>
        <p>{S.methodText}</p>
        <p>{S.care}</p>
        <ul>
          <li>
            <a
              href="https://ies.ed.gov/ncee/wwc/practiceguide/26"
              target="_blank"
              rel="noreferrer"
            >
              IES / WWC: Mathematik lernen, 2021
            </a>
          </li>
          <li>
            <a
              href="https://ies.ed.gov/ncee/wwc/PracticeGuide/1"
              target="_blank"
              rel="noreferrer"
            >
              IES / WWC: Unterricht gestalten und üben, 2007
            </a>
          </li>
          <li>
            <a
              href="https://educationendowmentfoundation.org.uk/newsletter/improving-mathematics-in-key-stages-2-and-3-email-course-2"
              target="_blank"
              rel="noreferrer"
            >
              EEF: Modelle und Darstellungen
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
function AssessmentResult({ session }: { session: Session }) {
  const { state } = useApp();
  const attempts = state.attempts.filter(
      (a) => a.sessionId === session.id && isAssessment(a.kind),
    ),
    words = attempts.filter((a) => a.format === "word");
  const intermediate = state.sessions.find((s) => s.kind === "intermediate"),
    prior = state.attempts.filter(
      (a) =>
        a.sessionId === intermediate?.id && a.correct && a.format === "direct",
    ),
    common = prior.filter((a) =>
      attempts.some((b) => b.factId === a.factId && b.format === "direct"),
    ),
    retained = common.filter((a) =>
      attempts.some((b) => b.factId === a.factId && b.correct),
    );
  return (
    <div className="check-result">
      <p>
        {session.completedAt
          ? localDate(new Date(session.completedAt), state.profile.timezone)
          : session.date}
      </p>
      <p>
        {S.accuracy}: {attempts.filter((a) => a.correct).length}/
        {attempts.length} (
        {attempts.length
          ? Math.round(
              (attempts.filter((a) => a.correct).length / attempts.length) *
                100,
            )
          : 0}
        %)
      </p>
      <p>
        {S.transfer}: {words.filter((a) => a.correct).length}/{words.length} (
        {words.length} {S.attempts})
      </p>
      {session.kind === "delayed" && (
        <p>
          {intermediate?.completedAt && session.completedAt && (
            <>
              Vergangene Kalendertage:{" "}
              {Math.round(
                (Date.parse(
                  localDate(
                    new Date(session.completedAt),
                    state.profile.timezone,
                  ),
                ) -
                  Date.parse(
                    localDate(
                      new Date(intermediate.completedAt),
                      state.profile.timezone,
                    ),
                  )) /
                  86400000,
              )}
              <br />
            </>
          )}
          {S.retention}: {retained.length}/{common.length}{" "}
          {common.length
            ? `(${Math.round((retained.length / common.length) * 100)}%)`
            : "— keine vergleichbaren richtigen Aufgaben"}
          <br />
          <small>
            Von den Aufgaben, die bei der Zwischenprüfung richtig waren und
            jetzt erneut geprüft wurden.
          </small>
        </p>
      )}
      <details>
        <summary>{S.correction}</summary>
        {attempts
          .filter((a) => !a.correct)
          .map((a) => {
            const f = state.facts[a.factId];
            return (
              <p key={a.id}>
                {f.a} × {f.b} = {f.a * f.b}
              </p>
            );
          })}
      </details>
    </div>
  );
}
