import { S } from "../content/strings";
export function Keypad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  label = S.answer,
}: {
  value: string;
  onChange: (s: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="answer-area">
      <label className="answer-label" htmlFor="answer-input">
        {label}
      </label>
      <input
        id="answer-input"
        aria-label={label}
        className="answer-input"
        type="text"
        inputMode="none"
        pattern="[0-9]*"
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 4))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (value) onSubmit();
          }
        }}
      />
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "→"].map(
          (k) => (
            <button
              type="button"
              key={k}
              disabled={disabled || (k === "→" && !value)}
              className={k === "→" ? "key-submit" : ""}
              aria-label={k === "⌫" ? S.erase : k === "→" ? S.check : k}
              onClick={() =>
                k === "⌫"
                  ? onChange(value.slice(0, -1))
                  : k === "→"
                    ? onSubmit()
                    : onChange((value + k).slice(0, 4))
              }
            >
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
