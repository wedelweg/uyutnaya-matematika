import { ThemeChoice, ThemePreview } from "../components/ThemeChoice";
import { useState, type ChangeEvent } from "react";
import { useApp } from "../context";
import { S } from "../content/strings";
import { createState } from "../domain/engine";
import { exportBackup, MAX_BACKUP_BYTES, parseBackup } from "../storage/store";
import { verifyOffline } from "../pwa/client";
import { Icon } from "../components/Art";
import type { State } from "../domain/types";
export function Settings() {
  const { state, commit, busy } = useApp();
  const [p, setP] = useState(state.profile),
    [message, setMessage] = useState("");
  return (
    <section className="panel narrow">
      <span className="eyebrow">{S.settings}</span>
      <h1>Deine Einstellungen</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            new Intl.DateTimeFormat("de", { timeZone: p.timezone }).format();
            if (await commit({ ...state, profile: p }))
              setMessage(S.profileSaved);
          } catch {
            setMessage(
              "Prüfe den Namen der Zeitzone, zum Beispiel Europe/Berlin.",
            );
          }
        }}
      >
        <label>
          {S.name}
          <input
            value={p.name}
            maxLength={40}
            onChange={(e) => setP({ ...p, name: e.target.value })}
          />
        </label>
        <div className="settings-preview">
          <ThemePreview theme={p.theme} pet={p.pet} />
        </div>
        <ThemeChoice
          value={p.theme}
          onChange={(theme) => setP({ ...p, theme })}
        />
        <fieldset>
          <legend>{S.chooseFriend}</legend>
          <div className="segmented">
            {(["bunny", "cat"] as const).map((t) => (
              <button
                type="button"
                key={t}
                aria-pressed={p.pet === t}
                onClick={() => setP({ ...p, pet: t })}
              >
                {S[t]}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={p.motion}
            onChange={(e) => setP({ ...p, motion: e.target.checked })}
          />
          {S.motion}
        </label>
        <label>
          {S.timezone}
          <input
            value={p.timezone}
            maxLength={80}
            onChange={(e) => setP({ ...p, timezone: e.target.value })}
            list="zones"
          />
          <datalist id="zones">
            {[
              "Europe/Berlin",
              "Europe/Moscow",
              "Europe/London",
              "Asia/Almaty",
              "Asia/Tbilisi",
              "America/New_York",
              "UTC",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </datalist>
        </label>
        <small>{S.timezoneNote}</small>
        <button type="submit" disabled={busy} className="primary full">
          {S.save}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
export function Backup() {
  const { state, commit, navigate, busy } = useApp();
  const [preview, setPreview] = useState<State | null>(null),
    [message, setMessage] = useState(""),
    [reset, setReset] = useState(false);
  async function exportFile() {
    const blob = new Blob([exportBackup(state)], { type: "application/json" }),
      name = `cozy-math-${new Date().toISOString().slice(0, 10)}.json`,
      file = new File([blob], name, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: S.brand });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPreview(null);
    setMessage("");
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("8 MB");
      setPreview(parseBackup(await file.text()));
    } catch {
      setMessage(S.importError);
    }
  }
  return (
    <section className="panel backup-panel">
      <h2>{S.backupTitle}</h2>
      <p>{S.backupWarning}</p>
      <div className="button-row">
        <button className="secondary" onClick={() => void exportFile()}>
          <Icon name="download" />
          {S.export}
        </button>
        <label className="secondary file-label">
          {S.import}
          <input
            aria-label={S.import}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void importFile(e)}
            disabled={busy}
          />
        </label>
      </div>
      {message && <p role="status">{message}</p>}
      {preview && (
        <div className="import-preview">
          <h3>{S.importPreview}</h3>
          <p>
            {preview.profile.name || "Ohne Namen"} · {preview.sessions.length}{" "}
            Übungen · {preview.attempts.length} {S.attempts} ·{" "}
            {preview.rewards.length} Dekorationen
          </p>
          <p>{S.replaceNote}</p>
          <div className="button-row">
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                if (await commit(preview)) {
                  setPreview(null);
                  navigate(
                    preview.active
                      ? "activity"
                      : preview.profile.onboarded
                        ? "home"
                        : "welcome",
                  );
                }
              }}
            >
              {S.replace}
            </button>
            <button className="secondary" onClick={() => setPreview(null)}>
              {S.cancel}
            </button>
          </div>
        </div>
      )}
      <button
        className="text-button reset-link"
        onClick={() => setReset(!reset)}
      >
        {S.reset}
      </button>
      {reset && (
        <div className="import-preview">
          <h3>{S.resetTitle}</h3>
          <p>{S.resetNote}</p>
          <div className="button-row">
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                if (await commit(createState())) navigate("welcome");
              }}
            >
              {S.resetConfirm}
            </button>
            <button className="text-button" onClick={() => setReset(false)}>
              {S.cancel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
export function Install() {
  const { offline, registration } = useApp();
  const [verified, setVerified] = useState<boolean | null>(null);
  return (
    <section className="panel narrow prose">
      <span className="eyebrow">PWA · ohne App Store</span>
      <h1>{S.installTitle}</h1>
      <ol>
        {S.installSteps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {["localhost", "127.0.0.1"].includes(location.hostname) && (
        <p className="notice">{S.installLocal}</p>
      )}
      <p className="notice">
        {(verified ?? offline) ? S.offline : S.offlinePending}
      </p>
      <button
        className="secondary"
        onClick={async () =>
          setVerified(registration ? await verifyOffline(registration) : false)
        }
      >
        {S.online}
      </button>
      <p>{S.installData}</p>
      <a
        href="https://support.apple.com/de-de/guide/iphone/iphea86e5236/ios"
        rel="noreferrer"
        target="_blank"
      >
        Apple-Anleitung
      </a>
    </section>
  );
}
