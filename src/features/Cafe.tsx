import { cookies, plates, perCookies } from "../content/numbers";
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
    <section className="cafe-story" aria-label="История кафе">
      <div className="cafe-story-heading">
        <span className="cafe-sign" aria-hidden="true">
          {chapter.icon}
        </span>
        <div>
          <span className="eyebrow">
            Кафе маленьких открытий · глава {Math.floor(count / 3) + 1}
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
              {i === count % 3 && <small>Сегодня</small>}
            </span>
          </li>
        ))}
      </ol>
      <p className="cafe-story-note">
        {count ? `Завершено смен: ${count}. ` : ""}История подождёт, если
        захочется отдохнуть.
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
        <span className="eyebrow">Заказ для друзей</span>
        <p>
          {missing
            ? `Нужно разложить ${cookies(a * b)}, ${perCookies(b)} на тарелку. Сколько тарелок понадобится?`
            : `Для гостей приготовлено: ${plates(a)}. На каждой — ${perCookies(b)}. Сколько печений приготовить?`}
        </p>
        {independent && (
          <small>Попробуй вспомнить без тарелок. Подсказка всегда рядом.</small>
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
    <div className="cookie-board" aria-label="Раскладываем печенье по тарелкам">
      <div className="cookie-plates">
        {Array.from({ length: a }, (_, i) => (
          <div
            className={`cookie-plate ${i < ready ? "filled" : ""}`}
            key={i}
            role="img"
            aria-label={`Тарелка ${i + 1}: ${cookies(i < ready ? b : 0)}`}
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
        {ready} из {a} тарелок · {cookies(ready * b)} на столе
      </p>
      {ready < a ? (
        <button
          className="secondary full"
          disabled={disabled}
          onClick={onServe}
        >
          Положить по {b} на следующую тарелку
        </button>
      ) : (
        <p className="cafe-ready">
          Все тарелки готовы: {a} × {b} = {a * b}
        </p>
      )}
      <small>Каждая тарелка — одна равная группа.</small>
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
          ? "Украшение убрано в коллекцию."
          : `${ITEM_NAMES[selected]}: ${ROOM_PLACES[position].toLowerCase()}. Сохранено.`,
      );
  }
  return (
    <section className="panel room-editor" aria-label="Обустройство комнаты">
      <span className="eyebrow">Твоя маленькая мастерская</span>
      <h2>Обустроим комнату</h2>
      <p>
        Выбери украшение, затем место. Можно переставлять сколько захочется.
      </p>
      {state.rewards.length === 0 ? (
        <p className="notice">
          Первое украшение появится после учебного шага. Оно останется с тобой,
          даже если ошибаться или делать перерывы.
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
                  {slots.includes(id) ? "В комнате" : "В коллекции"}
                </small>
              </button>
            ))}
          </div>
          {selected !== null && (
            <div className="placement-panel">
              <h3>Куда поставить: {ITEM_NAMES[selected]}?</h3>
              <p>
                Занятое место можно заменить. Если выбранный предмет уже в
                комнате, украшения поменяются местами.
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
                        {slots[i] === null ? "Свободно" : ITEM_NAMES[slots[i]!]}
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
                Убрать в коллекцию
              </button>
            </div>
          )}
          <p role="status">{message}</p>
        </>
      )}
    </section>
  );
}
