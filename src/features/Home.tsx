import { ThemeChoice, ThemePreview } from "../components/ThemeChoice";
import { RoomEditor } from "./Cafe";
import { collectItem, roomSlots } from "../domain/cafe";
import { useState } from "react";
import { useApp } from "../context";
import { createSession } from "../domain/planner";
import { S, greeting, ITEM_NAMES } from "../content/strings";
import { Icon, Item, Mascot, Room } from "../components/Art";
import type { Mood, State } from "../domain/types";
export function startSession(
  state: State,
  kind: Parameters<typeof createSession>[1],
  lessonId?: string,
) {
  const n = structuredClone(state);
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  n.active = createSession(
    n,
    kind,
    new Date(),
    seed,
    crypto.randomUUID(),
    lessonId,
  );
  if (kind === "mission" && !lessonId && state.profile.theme === "cozy")
    n.active.game = "cafe";
  return n;
}
export function Home() {
  const { state, commit, navigate, busy, offline } = useApp();
  const [showCollection, setShowCollection] = useState(false);
  const secure = Object.values(state.facts).filter(
    (f) => f.status === "secure",
  ).length;
  async function launch() {
    if (state.active) {
      navigate("activity");
      return;
    }
    if (await commit(startSession(state, "mission"))) navigate("activity");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{S.hello}</span>
          <h1>{greeting(state.profile.name)}</h1>
        </div>
        <span className="tiny-bloom" aria-hidden="true">
          ✿
        </span>
      </div>
      <div className="home-grid">
        <section className="room-panel">
          {state.profile.theme === "cozy" ? (
            <Room
              pet={state.profile.pet}
              rewards={state.rewards}
              slots={roomSlots(state)}
            />
          ) : (
            <div className="calm-room">
              <Icon name="leaf" size={70} />
              <h2>{S.noPressure}</h2>
              <p>{S.missionNote}</p>
            </div>
          )}
          <div className="room-footer">
            <span>
              <Icon name="heart" />
              {S.home}
            </span>
            <button
              className="text-button"
              onClick={() => setShowCollection(!showCollection)}
            >
              Обустройство · {state.rewards.length}/16{" "}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
        <button
          className="primary full mobile-start"
          disabled={busy}
          onClick={() => void launch()}
        >
          {state.active ? S.resume : S.startMission}
          <Icon name="arrow" />
        </button>
        <section className="mission-card">
          <span className="pill">
            <Icon name="leaf" size={16} />
            {S.today}
          </span>
          <h2>Новый раунд</h2>
          <p>Реши примеры — выбери украшение.</p>
          <fieldset className="mood-picker" disabled={busy || !!state.active}>
            <legend>{S.mood}</legend>
            <div>
              {(["easy", "normal", "tired"] as Mood[]).map((m, i) => (
                <button
                  key={m}
                  aria-pressed={state.profile.mood === m}
                  onClick={() =>
                    void commit({
                      ...state,
                      profile: { ...state.profile, mood: m },
                    })
                  }
                >
                  <span aria-hidden="true">{["☀", "❀", "☾"][i]}</span>
                  {S[m]}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mission-length">{S[`${state.profile.mood}Note`]}</p>
          <button
            className="primary full desktop-start"
            disabled={busy}
            onClick={() => void launch()}
          >
            {state.active ? S.resume : S.startMission}
            <Icon name="arrow" />
          </button>
          <div className="quiet-note">
            {S.duration}
            <span>·</span>
            {S.noPressure}
          </div>
        </section>
      </div>

      <div className="home-bottom">
        <button
          className="feature-tile lavender"
          onClick={() => navigate("workshop")}
        >
          <span className="tile-icon">
            <Icon name="book" size={29} />
          </span>
          <span>
            <strong>Хочу поучиться</strong>
            <small>Картинки и способы счёта</small>
          </span>
          <Icon name="arrow" />
        </button>
        <button className="feature-tile mint" onClick={() => navigate("map")}>
          <span className="tile-icon">
            <Icon name="flower" size={29} />
          </span>
          <span>
            <small>{S.map}</small>
            <strong>
              {secure} из 100 — {S.secure.toLowerCase()}
            </strong>
          </span>
          <Icon name="arrow" />
        </button>
      </div>
      <div className="home-foot">
        <span className={offline ? "offline-state" : "muted"}>
          <Icon name={offline ? "check" : "cloud"} size={17} />
          {import.meta.env.DEV
            ? S.offlineDev
            : offline
              ? S.offline
              : S.offlinePending}
        </span>
        <button className="text-button" onClick={() => navigate("install")}>
          {S.install} <span aria-hidden="true">↗</span>
        </button>
      </div>
      {showCollection && <RoomEditor />}
      <RewardChoice />
    </>
  );
}
export function RewardChoice({ showRoom = false }: { showRoom?: boolean }) {
  const { state, commit, busy } = useApp();
  const [chosen, setChosen] = useState<number | null>(null);
  if (!state.pendingRewards.length && !showRoom) return null;
  const available = ITEM_NAMES.map((_, i) => i)
    .filter((i) => !state.rewards.includes(i))
    .slice(0, 2);
  return (
    <section className="reward-panel panel" aria-label={S.chooseGift}>
      {showRoom && (
        <Room
          pet={state.profile.pet}
          rewards={state.rewards}
          slots={roomSlots(state)}
        />
      )}
      {chosen !== null && (
        <p className="gift-arrived" role="status">
          {ITEM_NAMES[chosen]} теперь в твоей комнате! ♥
        </p>
      )}
      {state.pendingRewards.length > 0 ? (
        <>
          <h2>{S.chooseGift}</h2>
          <div className="reward-options">
            {available.map((i) => (
              <button
                aria-label={ITEM_NAMES[i]}
                key={i}
                disabled={busy}
                onClick={async () => {
                  if (await commit(collectItem(state, i))) setChosen(i);
                }}
              >
                <Item id={i} />
                <strong>{ITEM_NAMES[i]}</strong>
              </button>
            ))}
          </div>
        </>
      ) : (
        chosen === null && (
          <p>
            {state.rewards.length === 16
              ? "Все 16 украшений собраны! Можно переставить их в комнате."
              : "Твоя комната становится уютнее."}
          </p>
        )
      )}
    </section>
  );
}
export function Welcome() {
  const { state, commit, navigate, busy } = useApp();
  const [profile, setProfile] = useState(state.profile);
  return (
    <section className="welcome-layout">
      <div className="welcome-art">
        <ThemePreview theme={profile.theme} pet={profile.pet} />
      </div>
      <div className="panel welcome-form">
        <span className="eyebrow">{S.brand}</span>
        <h1>{S.welcome}</h1>
        <p>{S.welcomeNote}</p>
        <label>
          {S.name}
          <input
            value={profile.name}
            maxLength={40}
            placeholder={S.optionalName}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </label>
        <ThemeChoice
          value={profile.theme}
          onChange={(theme) => setProfile({ ...profile, theme })}
        />
        <fieldset>
          <legend>{S.chooseFriend}</legend>
          <div className="pet-options">
            {(["bunny", "cat"] as const).map((p) => (
              <button
                aria-label={S[p]}
                aria-pressed={profile.pet === p}
                key={p}
                onClick={() => setProfile({ ...profile, pet: p })}
              >
                <Mascot pet={p} />
                {S[p]}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          className="primary full"
          disabled={busy}
          onClick={async () => {
            if (
              await commit({
                ...state,
                profile: { ...profile, onboarded: true },
              })
            )
              navigate("intro");
          }}
        >
          {S.start}
          <Icon name="arrow" />
        </button>
      </div>
    </section>
  );
}
export function Intro() {
  const { state, commit, navigate, busy } = useApp();
  return (
    <section className="panel narrow center">
      <Mascot pet={state.profile.pet} className="intro-mascot" />
      <h1>Поиграем?</h1>
      <p>6 примеров — и подарок для комнаты.</p>
      <button
        className="primary full"
        disabled={busy}
        onClick={async () => {
          if (await commit(startSession(state, "mission")))
            navigate("activity");
        }}
      >
        Играть
        <Icon name="arrow" />
      </button>
      <button className="secondary full" onClick={() => navigate("workshop")}>
        Хочу поучиться
      </button>
      <button
        className="text-button full"
        disabled={busy}
        onClick={async () => {
          if (await commit(startSession(state, "diagnostic")))
            navigate("activity");
        }}
      >
        {S.diagnosticStart}
      </button>
      <button className="text-button full" onClick={() => navigate("home")}>
        {S.skipDiagnostic}
      </button>
    </section>
  );
}
