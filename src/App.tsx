import { upgradeActivePractice } from "./domain/planner";
import { useEffect, useRef, useState } from "react";
import { AppContext, type Screen } from "./context";
import type { State } from "./domain/types";
import { localDate } from "./domain/engine";
import { readState, writeState } from "./storage/store";
import { registerPwa } from "./pwa/client";
import { S } from "./content/strings";
import { Icon, Mascot } from "./components/Art";
import { Home, Intro, Welcome } from "./features/Home";
import { Activity, Summary } from "./features/Activity";
import { Workshop } from "./features/Workshop";
import { KnowledgeMap } from "./features/KnowledgeMap";
import { Parents } from "./features/Parents";
import { Install, Settings } from "./features/Settings";
export default function App() {
  const [state, setState] = useState<State | null>(null),
    [screen, setScreen] = useState<Screen>("home"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [offline, setOffline] = useState(false),
    [registration, setRegistration] =
      useState<ServiceWorkerRegistration | null>(null),
    [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null),
    [, tick] = useState(0);
  const revision = useRef(0),
    writing = useRef(false);
  async function load() {
    setError("");
    try {
      const row = await readState();
      const upgraded = upgradeActivePractice(row.state);
      const rev =
        upgraded === row.state
          ? row.revision
          : await writeState(upgraded, row.revision);
      setState(upgraded);
      revision.current = rev;
      setScreen(
        !row.state.profile.onboarded
          ? "welcome"
          : row.state.active
            ? "activity"
            : "home",
      );
    } catch {
      setError(S.saveError);
    }
  }
  useEffect(() => {
    void load();
    void registerPwa(setOffline, setUpdate).then((r) => {
      if (r) setRegistration(r);
    });
    const visibility = () => {
      if (!document.hidden) tick((x) => x + 1);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  function navigate(s: Screen) {
    if (screen === "activity" && s !== "activity")
      window.dispatchEvent(new Event("cozy-pause"));
    setScreen(s);
    window.scrollTo({ top: 0 });
  }
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [screen]);
  async function commit(next: State) {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      revision.current = await writeState(next, revision.current);
      setState(next);
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.message === "CONFLICT"
          ? S.conflict
          : S.saveError,
      );
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  if (!state)
    return (
      <main className="loading-screen">
        <Mascot className="intro-mascot" />
        <h1>{error || S.loading}</h1>
        {error && (
          <button className="primary" onClick={() => void load()}>
            {S.retry}
          </button>
        )}
      </main>
    );
  const nav: [Screen, string, string][] = [
    ["home", S.home, "home"],
    ["workshop", S.lessons, "book"],
    ["map", S.map, "map"],
    ["parents", S.parents, "heart"],
  ];
  const screens = {
    home: <Home />,
    welcome: <Welcome />,
    intro: <Intro />,
    activity: <Activity />,
    summary: <Summary />,
    workshop: <Workshop />,
    map: <KnowledgeMap />,
    parents: <Parents />,
    settings: <Settings />,
    install: <Install />,
  };
  return (
    <AppContext.Provider
      value={{
        state,
        commit,
        navigate,
        busy,
        today: localDate(new Date(), state.profile.timezone),
        offline,
        registration,
        update,
      }}
    >
      <div
        className={`app pet-${state.profile.pet} ${state.profile.theme} ${state.profile.motion ? "" : "no-motion"} ${screen === "activity" ? "in-activity" : ""}`}
      >
        <a className="skip-link" href="#main-content">
          К содержимому
        </a>
        <header className="header">
          <button
            className="brand"
            onClick={() =>
              navigate(state.profile.onboarded ? "home" : "welcome")
            }
            aria-label={S.brand}
          >
            <span className="brand-icon">
              <Mascot pet={state.profile.pet} />
            </span>
            <span>
              <strong>{S.brand}</strong>
              <small>{S.brandNote}</small>
            </span>
          </button>
          {state.profile.onboarded && (
            <nav className="desktop-nav" aria-label="Главное меню">
              {nav.map(([id, label, icon]) => (
                <button
                  key={id}
                  className={screen === id ? "active" : ""}
                  aria-current={screen === id ? "page" : undefined}
                  onClick={() => navigate(id)}
                >
                  <Icon name={icon} size={18} />
                  {label}
                </button>
              ))}
            </nav>
          )}
          <button
            className="icon-button"
            aria-label={S.settings}
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" />
          </button>
        </header>
        <main id="main-content" className="main-content">
          {error && (
            <div role="alert" className="error-banner">
              {error}
              {error === S.conflict && (
                <button className="secondary" onClick={() => void load()}>
                  {S.retry}
                </button>
              )}
            </div>
          )}
          {update && !state.active && (
            <aside className="update-banner">
              <span>
                {S.update}. {S.updateNote}
              </span>
              <button
                className="secondary"
                onClick={() => {
                  navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    () => location.reload(),
                    { once: true },
                  );
                  update.waiting?.postMessage({ type: "SKIP_WAITING" });
                }}
              >
                {S.updateAction}
              </button>
            </aside>
          )}
          {screens[screen]}
        </main>
        <footer className="footer">
          <span>Уютная математика</span>
          <span className="dad-dedication">
            Учимся маленькими шагами. <span aria-hidden="true">♥</span>
          </span>
          <Icon name="flower" size={17} />
        </footer>
        {state.profile.onboarded && screen !== "activity" && (
          <nav className="mobile-nav" aria-label="Главное меню">
            {nav.map(([id, label, icon]) => (
              <button
                key={id}
                className={screen === id ? "active" : ""}
                aria-current={screen === id ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon name={icon} size={21} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </AppContext.Provider>
  );
}
