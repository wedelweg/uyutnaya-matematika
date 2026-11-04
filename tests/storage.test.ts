import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createState } from "../src/domain/engine";
import {
  exportBackup,
  migrate,
  openStore,
  parseBackup,
  readState,
  validateState,
  writeState,
} from "../src/storage/store";
beforeEach(async () => {
  const db = await openStore();
  await db.clear("app");
  db.close();
});
describe("transactional persistence and backups", () => {
  it("round trips all profile, fact and room data across connections", async () => {
    const s = createState();
    s.profile.name = "Игрок";
    s.rewards = [1, 5];
    await writeState(s, 0);
    const row = await readState();
    expect(row.state).toEqual(s);
    expect(row.revision).toBe(1);
    expect(parseBackup(exportBackup(row.state))).toEqual(s);
  });
  it("rejects a stale writer rather than losing another tab's changes", async () => {
    const s = createState();
    await writeState(s, 0);
    const newer = { ...s, profile: { ...s.profile, name: "Новое имя" } };
    await expect(writeState(newer, 0)).rejects.toThrow("CONFLICT");
    expect((await readState()).state.profile.name).toBe("");
  });
  it("propagates write failure and leaves previous state intact", async () => {
    const s = createState();
    await writeState(s, 0);
    const mock = vi
      .spyOn(IDBObjectStore.prototype, "put")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });
    await expect(writeState({ ...s, rewards: [1] }, 1)).rejects.toThrow(
      "quota",
    );
    mock.mockRestore();
    expect((await readState()).state.rewards).toEqual([]);
  });
  it.each(["{}", "not json", '{"format":"cozy-math","version":99}'])(
    "rejects corrupt format %s",
    (text) => expect(() => parseBackup(text)).toThrow(),
  );
  it("rejects an oversized input before parsing", () =>
    expect(() => parseBackup(" ".repeat(8 * 1024 * 1024 + 1))).toThrow("8 МБ"));
  it("validates ranges, enums, dates, unique IDs, and timezone", () => {
    const mutate = [
      (s: any) => (s.facts["7x8"].a = 99),
      (s: any) => (s.facts["7x8"].step = 5),
      (s: any) => (s.facts["7x8"].dueDate = "2026-02-30"),
      (s: any) => (s.profile.timezone = "No/Zone"),
      (s: any) => (s.rewards = [16]),
      (s: any) => (s.facts["7x8"].successDates = ["2026-10-22", "2026-10-21"]),
      (s: any) => (s.profile.name = "a".repeat(41)),
    ];
    for (const fn of mutate) {
      const s = createState();
      fn(s);
      expect(() => validateState(s)).toThrow();
    }
  });
  it("migrates legacy dueAt to the profile calendar, retaining progress", () => {
    const legacy: any = createState();
    legacy.schemaVersion = 1;
    legacy.profile.timezone = "Europe/Berlin";
    legacy.facts["7x8"].dueAt = "2026-10-24T22:30:00Z";
    delete legacy.facts["7x8"].dueDate;
    const migrated = validateState(migrate(legacy));
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.facts["7x8"].dueDate).toBe("2026-10-25");
    expect(legacy.schemaVersion).toBe(1);
  });
  it("upgrades an actual version-one database without losing the stored profile", async () => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.deleteDatabase("cozy-math");
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
    const legacy: any = createState();
    legacy.schemaVersion = 1;
    legacy.profile.name = "Старая копия";
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open("cozy-math", 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore("app").put(
          { state: legacy, revision: 3 },
          "profile",
        );
      };
      r.onsuccess = () => {
        r.result.close();
        resolve();
      };
      r.onerror = () => reject(r.error);
    });
    expect((await readState()).state.profile.name).toBe("Старая копия");
    expect((await readState()).revision).toBe(3);
  });
});
