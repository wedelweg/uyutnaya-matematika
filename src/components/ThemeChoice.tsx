import { S } from "../content/strings";
import { Icon, Room } from "./Art";
import type { Profile } from "../domain/types";

export function ThemePreview({ theme, pet }: Pick<Profile, "theme" | "pet">) {
  return (
    <div className={`theme-preview pet-${pet}`} aria-live="polite">
      {theme === "cozy" ? (
        <Room pet={pet} rewards={[0, 1, 13]} />
      ) : (
        <div className="calm-room calm-preview">
          <Icon name="leaf" size={42} />
          <span>Спокойный тренажёр</span>
          <strong>2 × 3 = ?</strong>
          <p>
            Понятные примеры и подсказки.
            <br />
            Без комнаты и сюжета кафе.
          </p>
        </div>
      )}
    </div>
  );
}

export function ThemeChoice({
  value,
  onChange,
}: {
  value: Profile["theme"];
  onChange: (value: Profile["theme"]) => void;
}) {
  return (
    <fieldset className="theme-choice">
      <legend>{S.appearance}</legend>
      <div className="segmented">
        {(["cozy", "calm"] as const).map((t) => (
          <button
            type="button"
            key={t}
            aria-pressed={value === t}
            onClick={() => onChange(t)}
          >
            {S[t]}
          </button>
        ))}
      </div>
      <p className="theme-description" aria-live="polite">
        {value === "cozy"
          ? "Любимый персонаж, короткие раунды и подарки для комнаты."
          : "Короткие раунды и подсказки без комнаты и сюжета кафе."}
      </p>
      <small>
        Можно переключать в любой момент. Имя, знания и подарки сохранятся.
      </small>
    </fieldset>
  );
}
