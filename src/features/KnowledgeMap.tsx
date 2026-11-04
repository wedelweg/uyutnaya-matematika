import { useState } from "react";
import { useApp } from "../context";
import { pairId } from "../domain/engine";
import { S, STATUS_LABEL, STATUS_SYMBOL } from "../content/strings";
import type { Status } from "../domain/types";
export function KnowledgeMap() {
  const { state } = useApp();
  const [view, setView] = useState<"facts" | "pairs">("facts"),
    [selected, setSelected] = useState<string | null>(null);
  const f = selected ? state.facts[selected] : null;
  const secure = Object.values(state.facts).filter(
      (x) => x.status === "secure",
    ).length,
    securePairs = Object.values(state.pairs).filter((p) => {
      const [a, b] = p.id.split(":");
      return (
        state.facts[`${a}x${b}`].status === "secure" &&
        state.facts[`${b}x${a}`].status === "secure"
      );
    }).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{S.map}</span>
          <h1>{S.mapTitle}</h1>
          <p>{S.mapNote}</p>
        </div>
      </div>
      <section className="panel map-panel">
        <div className="map-toolbar">
          <div className="segmented">
            <button
              aria-pressed={view === "facts"}
              onClick={() => setView("facts")}
            >
              {S.factsView}
            </button>
            <button
              aria-pressed={view === "pairs"}
              onClick={() => setView("pairs")}
            >
              {S.pairsView}
            </button>
          </div>
          <strong>
            {view === "facts" ? `${secure}/100` : `${securePairs}/55`}{" "}
            {S.secure.toLowerCase()}
          </strong>
        </div>
        <p>{view === "pairs" ? S.pairHelp : S.mapHelp}</p>
        <div className="knowledge-grid" role="group" aria-label={S.map}>
          <span className="grid-axis">×</span>
          {Array.from({ length: 10 }, (_, i) => (
            <span className="grid-axis" key={`c${i}`}>
              {i + 1}
            </span>
          ))}
          {Array.from({ length: 10 }, (_, a) => (
            <div className="grid-row" key={a}>
              <span className="grid-axis">{a + 1}</span>
              {Array.from({ length: 10 }, (_, b) => {
                const f = state.facts[`${a + 1}x${b + 1}`],
                  r = state.facts[`${b + 1}x${a + 1}`];
                let status: Status = f.status;
                if (view === "pairs") {
                  if (a > b) return <span key={b} />;
                  status =
                    f.status === "secure" && r.status === "secure"
                      ? "secure"
                      : f.status === "unseen" && r.status === "unseen"
                        ? "unseen"
                        : f.status === "needsReview" ||
                            r.status === "needsReview"
                          ? "needsReview"
                          : f.status === "review" && r.status === "review"
                            ? "review"
                            : "learning";
                }
                return (
                  <button
                    key={b}
                    className={`knowledge-cell ${status}`}
                    aria-label={`${a + 1} × ${b + 1}: ${STATUS_LABEL[status]}`}
                    onClick={() => setSelected(f.id)}
                  >
                    <span className="cell-label">
                      {a + 1} × {b + 1}
                    </span>
                    {STATUS_SYMBOL[status]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="map-legend">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <span key={s}>
              <span className={`legend-dot ${s}`}>{STATUS_SYMBOL[s]}</span>
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </section>
      {f && (
        <section className="panel fact-detail" aria-live="polite">
          <button
            className="text-button float-right"
            onClick={() => setSelected(null)}
          >
            {S.close}
          </button>
          <span className="eyebrow">{S.factDetails}</span>
          <h2>
            {f.a} × {f.b} = {f.a * f.b}
          </h2>
          <p>
            {STATUS_LABEL[f.status]} · {S.successDays}: {f.successDates.length}
          </p>
          <p>
            {S.due}: {f.dueDate ?? S.notScheduled}
          </p>
          <p>
            {state.pairs[pairId(f.a, f.b)].understood
              ? S.understood
              : S.notUnderstood}
          </p>
          {view === "pairs" && f.a !== f.b && (
            <p>
              {f.b} × {f.a}: {STATUS_LABEL[state.facts[`${f.b}x${f.a}`].status]}
            </p>
          )}
        </section>
      )}
    </>
  );
}
