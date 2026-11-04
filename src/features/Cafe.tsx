import { cookies, plates } from "../content/numbers";
import { useState } from "react";
import { useApp } from "../context";
import {
  CAFE_CHAPTERS,
  cafeCount,
  placeItem,
  ROOM_PLACES,
  roomSlots,
} from "../domain/cafe";
import { ITEM_NAMES } from "../content/strings";
import { Icon, Item, Mascot } from "../components/Art";

export function CafeStory() {
  const { state } = useApp(),
    count = cafeCount(state),
    chapter = CAFE_CHAPTERS[count % 3];
  return (
    <section className="cafe-story" aria-label="Café-Geschichte">
      <div className="cafe-story-heading">
        <span className="cafe-sign" aria-hidden="true">
          {chapter.icon}
        </span>
        <div>
          <span className="eyebrow">
            Café der kleinen Entdeckungen · Kapitel {Math.floor(count / 3) + 1}
          </span>
          <h2>{chapter.title}</h2>
          <p>{chapter.note}</p>
        </div>
      </div>
      <ol className="cafe-stamps">
        {CAFE_CHAPTERS.map((c, i) => (
          <li
            key={c.title}
            className={
              i < count % 3 ? "complete" : i === count % 3 ? "current" : ""
            }
          >
            <span aria-hidden="true">{i < count % 3 ? "✓" : c.icon}</span>
            <span>
              {c.title}
              {i === count % 3 && <small>Heute</small>}
            </span>
          </li>
        ))}
      </ol>
      <p className="cafe-story-note">
        {count ? `Geschaffte Runden: ${count}. ` : ""}Die Geschichte wartet,
        wenn du eine Pause brauchst.
      </p>
    </section>
  );
}
export function CafeOrder({
  a,
  b,
  missing = false,
  independent = false,
}: {
  a: number;
  b: number;
  missing?: boolean;
  independent?: boolean;
}) {
  const { state } = useApp();
  return (
    <div className="cafe-order">
      <Mascot pet={state.profile.pet} />
      <div>
        <span className="eyebrow">Bestellung für Freunde</span>
        <p>
          {missing
            ? `Du hast ${cookies(a * b)}. Auf jeden Teller kommen ${cookies(b)}. Wie viele Teller brauchst du?`
            : `Für die Gäste stehen ${plates(a)} bereit. Auf jeden Teller kommen ${cookies(b)}. Wie viele Kekse brauchst du insgesamt?`}
        </p>
        {independent && (
          <small>
            Versuche es zuerst ohne die Teller. Ein Tipp ist immer da.
          </small>
        )}
      </div>
    </div>
  );
}
export function CookieBoard({
  a,
  b,
  served,
  onServe,
  disabled = false,
}: {
  a: number;
  b: number;
  served: number;
  onServe: () => void;
  disabled?: boolean;
}) {
  const ready = Math.min(a, served);
  return (
    <div className="cookie-board" aria-label="Kekse auf Teller verteilen">
      <div className="cookie-plates">
        {Array.from({ length: a }, (_, i) => (
          <div
            className={`cookie-plate ${i < ready ? "filled" : ""}`}
            key={i}
            role="img"
            aria-label={`Teller ${i + 1}: ${cookies(i < ready ? b : 0)}`}
          >
            <span className="plate-number">{i + 1}</span>
            <span className="cookie-group">
              {i < ready &&
                Array.from({ length: b }, (_, j) => (
                  <span className="cookie" key={j} aria-hidden="true">
                    ·
                  </span>
                ))}
            </span>
          </div>
        ))}
      </div>
      <p role="status">
        {ready} von {a} Tellern · {cookies(ready * b)} auf dem Tisch
      </p>
      {ready < a ? (
        <button
          className="secondary full"
          disabled={disabled}
          onClick={onServe}
        >
          Lege {cookies(b)} auf den nächsten Teller
        </button>
      ) : (
        <p className="cafe-ready">
          Alle Teller sind fertig: {a} × {b} = {a * b}
        </p>
      )}
      <small>Jeder Teller ist eine gleich große Gruppe.</small>
    </div>
  );
}
export function RoomEditor() {
  const { state, commit, busy } = useApp(),
    [selected, setSelected] = useState<number | null>(null),
    [message, setMessage] = useState("");
  const slots = roomSlots(state);
  async function place(position: number | null) {
    if (selected === null) return;
    if (await commit(placeItem(state, selected, position)))
      setMessage(
        position === null
          ? "Die Dekoration ist wieder in der Sammlung."
          : `${ITEM_NAMES[selected]}: ${ROOM_PLACES[position]}. Gespeichert.`,
      );
  }
  return (
    <section className="panel room-editor" aria-label="Zimmer gestalten">
      <span className="eyebrow">Deine kleine Werkstatt</span>
      <h2>Gestalte dein Zimmer</h2>
      <p>
        Wähle eine Dekoration und dann einen Platz. Du kannst alles jederzeit
        umstellen.
      </p>
      {state.rewards.length === 0 ? (
        <p className="notice">
          Die erste Dekoration bekommst du nach einem Lernschritt. Sie bleibt
          bei dir, auch wenn du Fehler machst oder Pausen einlegst.
        </p>
      ) : (
        <>
          <div className="furniture-picker">
            {state.rewards.map((id) => (
              <button
                key={id}
                aria-label={ITEM_NAMES[id]}
                aria-pressed={selected === id}
                disabled={busy}
                onClick={() => {
                  setSelected(id);
                  setMessage("");
                }}
              >
                <Item id={id} />
                <span>{ITEM_NAMES[id]}</span>
                <small>
                  {slots.includes(id) ? "Im Zimmer" : "In der Sammlung"}
                </small>
              </button>
            ))}
          </div>
          {selected !== null && (
            <div className="placement-panel">
              <h3>Wohin mit: {ITEM_NAMES[selected]}?</h3>
              <p>
                Ein besetzter Platz kann getauscht werden. Ist die gewählte
                Dekoration schon im Zimmer, tauschen beide ihren Platz.
              </p>
              <div className="place-picker">
                {ROOM_PLACES.map((name, i) => (
                  <button
                    className="secondary"
                    key={name}
                    disabled={busy}
                    aria-pressed={slots[i] === selected}
                    onClick={() => void place(i)}
                  >
                    <span>
                      {name}
                      <small>
                        {slots[i] === null ? "Frei" : ITEM_NAMES[slots[i]!]}
                      </small>
                    </span>
                    {slots[i] === selected && <Icon name="check" size={18} />}
                  </button>
                ))}
              </div>
              <button
                className="text-button"
                disabled={busy || !slots.includes(selected)}
                onClick={() => void place(null)}
              >
                Zurück in die Sammlung
              </button>
            </div>
          )}
          <p role="status">{message}</p>
        </>
      )}
    </section>
  );
}
