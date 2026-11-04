import { useApp } from "../context";
import { LESSONS } from "../content/lessons";
import { lessonAvailable } from "../domain/planner";
import { S } from "../content/strings";
import { Icon } from "../components/Art";
import { startSession } from "./Home";
export function Workshop() {
  const { state, commit, navigate, busy } = useApp();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{S.lessons}</span>
          <h1>{S.workshopTitle}</h1>
          <p>{S.workshopNote}</p>
        </div>
        <Icon name="book" size={42} />
      </div>
      {state.active && (
        <div className="notice">
          <button className="text-button" onClick={() => navigate("activity")}>
            {S.resume}
          </button>
        </div>
      )}
      <div className="lesson-grid">
        {LESSONS.map((l, i) => {
          const available = lessonAvailable(state, l);
          return (
            <article key={l.id} className="panel lesson-tile">
              <span className={`lesson-number color-${i % 4}`}>{l.short}</span>
              <span className="lesson-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{l.title}</h2>
              <p>{l.description}</p>
              {state.lessons[l.id] && (
                <span className="completion-label">
                  <Icon name="check" size={16} />
                  {state.lessons[l.id] === "completed"
                    ? S.lessonCompleted
                    : S.lessonSkipped}
                </span>
              )}
              {!available && (
                <p className="prerequisite">
                  {S.prerequisite}:{" "}
                  {l.prereqs
                    .filter((p) => !state.lessons[p])
                    .map((p) => LESSONS.find((x) => x.id === p)!.title)
                    .join(", ")}
                </p>
              )}
              <button
                className="secondary full"
                disabled={!available || busy || !!state.active}
                onClick={async () => {
                  // Explicit workshop study is voluntary; automatic missions still obey fatigue/debt limits.
                  const prepared = startSession(
                    { ...state, profile: { ...state.profile, mood: "normal" } },
                    "mission",
                    l.id,
                  );
                  prepared.profile.mood = state.profile.mood;
                  prepared.active!.lessonAt = 0;
                  if (await commit(prepared)) navigate("activity");
                }}
              >
                {S.lessonStart}
                <Icon name="arrow" size={18} />
              </button>
              {available && !state.lessons[l.id] && (
                <button
                  className="text-button full"
                  disabled={busy || !!state.active}
                  onClick={() =>
                    void commit({
                      ...state,
                      lessons: { ...state.lessons, [l.id]: "skipped" },
                    })
                  }
                >
                  {S.lessonSkip}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
