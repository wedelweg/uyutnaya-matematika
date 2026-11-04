import { test, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { S } from "../../src/content/strings";
import type { State } from "../../src/domain/types";
async function onboard(page: Page, diagnostic = false) {
  await page.goto("./");
  await page.getByRole("button", { name: S.start, exact: true }).click();
  if (diagnostic)
    await page
      .getByRole("button", { name: S.diagnosticStart, exact: true })
      .click();
  else
    await page
      .getByRole("button", { name: S.skipDiagnostic, exact: true })
      .click();
}
async function readState(page: Page): Promise<State> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("cozy-math");
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const db = r.result;
          const q = db.transaction("app").objectStore("app").get("profile");
          q.onsuccess = () => {
            resolve(q.result.state);
            db.close();
          };
          q.onerror = () => reject(q.error);
        };
      }),
  );
}
async function answerTask(page: Page, wrong = false) {
  const card = page.getByTestId("task");
  await expect(card).toBeVisible();
  const current = (await readState(page)).active!;
  const taskId = current.tasks[current.cursor].id;
  const advanced = () =>
    expect
      .poll(async () => {
        const active = (await readState(page)).active;
        return active?.tasks[active.cursor]?.id;
      })
      .not.toBe(taskId);
  if (await card.locator(".feedback").count()) {
    await page.getByRole("button", { name: S.next, exact: true }).click();
    await advanced();
    return;
  }
  const fact = await card.getAttribute("data-fact"),
    format = await card.getAttribute("data-format");
  const [a, b] = fact!.split("x").map(Number);
  if (format === "strategy")
    for (let i = 0; i < 2; i++) {
      const line = await card.locator(".equation").innerText();
      const numbers = line.match(/\d+/g)!.map(Number);
      await page
        .getByLabel(S.answer, { exact: true })
        .fill(String(numbers[0] * numbers[1]));
      await page.getByRole("button", { name: S.check, exact: true }).click();
    }
  await page
    .getByLabel(S.answer, { exact: true })
    .fill(String(wrong ? 999 : format === "missing" ? a : a * b));
  await page.getByRole("button", { name: S.check, exact: true }).click();
  if (current.mode === "quick" && !wrong) {
    await advanced();
    return;
  }
  await expect(card.locator(".feedback")).toBeVisible();
  await page.getByRole("button", { name: S.next, exact: true }).click();
  await advanced();
}
async function finishLesson(page: Page) {
  for (let i = 0; i < 5; i++) {
    const button = page.getByRole("button", {
      name: i === 0 ? S.split : i === 4 ? S.hideSupport : S.next,
      exact: true,
    });
    await button.click();
  }
  await expect(page.locator(".lesson-card")).toHaveCount(0);
}
async function finishActivity(page: Page) {
  for (let i = 0; i < 30; i++) {
    if (await page.locator(".lesson-card").count()) {
      await finishLesson(page);
      continue;
    }
    if (await page.getByTestId("task").count()) {
      await answerTask(page);
      continue;
    }
    if (await page.getByRole("button", { name: S.done, exact: true }).count()) {
      await page.getByRole("button", { name: S.done, exact: true }).click();
      continue;
    }
    if (await page.locator(".summary-panel").count()) return;
    await page.waitForTimeout(50);
  }
  throw new Error("Activity did not terminate");
}
async function parents(page: Page) {
  await page
    .getByRole("navigation", { name: "Hauptmenü" })
    .filter({ visible: true })
    .getByRole("button", { name: S.parents, exact: true })
    .click();
  await page.getByLabel(S.gateAnswer).fill("21");
  await page.getByRole("button", { name: S.enter, exact: true }).click();
}

test("subdirectory manifest, icons, worker and cache stay within the application scope", async ({
  page,
}) => {
  await onboard(page);
  await expect(page.getByText(S.offline, { exact: true })).toBeVisible({
    timeout: 15000,
  });
  const base = new URL("./", page.url());
  const manifestURL = await page
    .locator('link[rel="manifest"]')
    .evaluate((e: HTMLLinkElement) => e.href);
  const manifest = await (await page.request.get(manifestURL)).json();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  expect(manifest.lang).toBe("de");
  expect(manifest.name).toBe("Gemütliche Mathe");
  for (const field of ["id", "start_url", "scope"])
    expect(new URL(manifest[field], manifestURL).href).toBe(base.href);
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, manifestURL);
    expect(url.href.startsWith(base.href)).toBe(true);
    expect((await page.request.get(url.href)).ok()).toBe(true);
  }
  const worker = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const urls = [];
    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys())
        urls.push(request.url);
    return { scope: reg?.scope, script: reg?.active?.scriptURL, urls };
  });
  expect(worker.scope).toBe(base.href);
  expect(worker.script).toBe(new URL("sw.js", base).href);
  expect(worker.urls.length).toBeGreaterThan(5);
  expect(worker.urls.every((url) => url.startsWith(base.href))).toBe(true);
});

test("vertical 7 × 8: explanation, delayed independent retrieval, persistence and summary", async ({
  page,
}) => {
  await onboard(page);
  await page
    .getByRole("navigation", { name: "Hauptmenü" })
    .filter({ visible: true })
    .getByRole("button", { name: S.lessons, exact: true })
    .click();
  for (const title of [
    "Von Gruppen zum Malnehmen",
    "Fünf ist die Hälfte von zehn",
  ]) {
    await page
      .locator(".lesson-tile")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .getByRole("button", { name: S.lessonSkip })
      .click();
  }
  await page
    .locator(".lesson-tile")
    .filter({
      has: page.getByRole("heading", {
        name: "Sieben: fünf plus zwei",
        exact: true,
      }),
    })
    .getByRole("button", { name: S.lessonStart })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sieben: fünf plus zwei" }),
  ).toBeVisible();
  await expect(
    page.getByText("Reihen: 7. In jeder Reihe: 8.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("40 + 16 = 56", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: "artifacts/lesson-7x8.png", fullPage: true });
  await finishLesson(page);
  await page.screenshot({ path: "artifacts/exercise.png", fullPage: true });
  const afterLesson = await readState(page);
  expect(afterLesson.facts["7x8"].successes).toBe(0);
  expect(afterLesson.lessons.seven).toBe("completed");
  await page.reload();
  await expect(page.getByTestId("task")).toBeVisible();
  await finishActivity(page);
  const after = await readState(page);
  expect(after.facts["7x8"].successDates.length).toBeLessThanOrEqual(1);
  expect(after.facts["7x8"].status).not.toBe("secure");
  expect(
    after.attempts.some(
      (a) => a.factId === "7x8" && a.independent && a.correct,
    ),
  ).toBe(true);
  expect(after.sessions).toHaveLength(1);
  await page.reload();
  expect((await readState(page)).attempts).toEqual(after.attempts);
});

test("new profile → diagnostic → mission → restart → export/import", async ({
  page,
}) => {
  await onboard(page, true);
  await finishActivity(page);
  await expect(
    page.getByRole("heading", { name: S.summaryDiagnostic }),
  ).toBeVisible();
  expect((await readState(page)).profile.diagnosticDone).toBe(true);
  await page.getByRole("button", { name: S.returnRoom, exact: true }).click();
  await page.getByRole("button", { name: S.startMission, exact: true }).click();
  await finishActivity(page);
  await page.reload();
  const before = await readState(page);
  expect(before.sessions).toHaveLength(2);
  await parents(page);
  await page.screenshot({ path: "artifacts/parents.png", fullPage: true });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: S.export, exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByRole("button", { name: S.reset, exact: true }).click();
  await page.getByRole("button", { name: S.resetConfirm, exact: true }).click();
  await expect(page.getByRole("heading", { name: S.welcome })).toBeVisible();
  await page.getByRole("button", { name: S.start, exact: true }).click();
  await page
    .getByRole("button", { name: S.skipDiagnostic, exact: true })
    .click();
  await parents(page);
  await page.getByLabel(S.import, { exact: true }).setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: S.importPreview }),
  ).toBeVisible();
  expect((await readState(page)).sessions).toHaveLength(0);
  await page.getByRole("button", { name: S.replace, exact: true }).click();
  expect((await readState(page)).attempts).toEqual(before.attempts);
  expect((await readState(page)).lessons).toEqual(before.lessons);
});

test("hint survives refresh; first-answer feedback blocks duplicate submission", async ({
  page,
}) => {
  await onboard(page, true);
  await answerTask(page);
  await page.getByRole("button", { name: S.hint, exact: true }).click();
  await expect(page.locator(".support-panel")).toBeVisible();
  await page.reload();
  await expect(page.locator(".support-panel")).toBeVisible();
  await page.getByLabel(S.answer, { exact: true }).fill("6");
  await page.getByRole("button", { name: S.check, exact: true }).dblclick();
  await expect(page.locator(".feedback")).toBeVisible();
  const s = await readState(page);
  expect(s.attempts.filter((a) => a.action !== "teaching")).toHaveLength(2);
  expect(s.attempts.at(-1)!.independent).toBe(false);
  expect(s.facts["1x8"].successes).toBe(0);
  await page.reload();
  await expect(page.locator(".feedback")).toBeVisible();
  expect(
    (await readState(page)).attempts.filter((a) => a.action !== "teaching"),
  ).toHaveLength(2);
});

test("complete precache enables offline reload and a whole lesson; missing entry revokes readiness", async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(origin + "/") && !r.url().startsWith("data:"))
      external.push(r.url());
  });
  await onboard(page);
  await expect(page.getByText(S.offline, { exact: true })).toBeVisible({
    timeout: 15000,
  });
  expect(external).toEqual([]);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: S.startMission, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Hauptmenü" })
    .filter({ visible: true })
    .getByRole("button", { name: S.lessons, exact: true })
    .click();
  await page
    .getByRole("button", { name: S.lessonStart, exact: true })
    .first()
    .click();
  await finishLesson(page);
  await finishActivity(page);
  expect((await readState(page)).lessons.groups).toBe("completed");
  await page.getByRole("button", { name: S.returnRoom, exact: true }).click();
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys())
        if (request.url.includes("icon-512.png")) await cache.delete(request);
    }
  });
  await page.getByRole("button", { name: /Aufs Handy/ }).click();
  await page.getByRole("button", { name: S.online, exact: true }).click();
  await expect(page.getByText(S.offlinePending, { exact: true })).toBeVisible();
});

test("responsive layouts, 200% text and no horizontal overflow", async ({
  page,
}) => {
  await onboard(page);
  for (const size of [
    { width: 393, height: 852 },
    { width: 320, height: 740 },
    { width: 852, height: 393 },
    { width: 1440, height: 960 },
  ]) {
    await page.setViewportSize(size);
    await page.screenshot({
      path: `artifacts/home-${size.width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  await page
    .getByRole("navigation", { name: "Hauptmenü" })
    .filter({ visible: true })
    .getByRole("button", { name: S.map, exact: true })
    .click();
  await expect(page.locator(".knowledge-cell")).toHaveCount(100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".knowledge-cell")
      .evaluateAll((elements) =>
        elements.every(
          (e) =>
            e.getBoundingClientRect().width >= 44 &&
            e.getBoundingClientRect().height >= 44,
        ),
      ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/map-320.png", fullPage: true });
  await page.addStyleTag({ content: "html{font-size:36px!important}" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/map-200percent.png",
    fullPage: true,
  });
});

test("assessment hides teaching until completion and never changes intervals", async ({
  page,
}) => {
  await onboard(page, true);
  await finishActivity(page);
  await page.getByRole("button", { name: S.returnRoom, exact: true }).click();
  await parents(page);
  await page
    .locator(".check-card")
    .first()
    .getByRole("button", { name: S.assessmentStart })
    .click();
  const before = (await readState(page)).facts;
  await expect(
    page.getByRole("button", { name: S.hint, exact: true }),
  ).toHaveCount(0);
  await page.getByLabel(S.answer, { exact: true }).fill("999");
  await page.getByRole("button", { name: S.check, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: S.assessmentRecorded }),
  ).toBeVisible();
  await expect(page.locator(".support-panel,.dot-array")).toHaveCount(0);
  await page.getByRole("button", { name: S.next, exact: true }).click();
  await finishActivity(page);
  expect((await readState(page)).facts).toEqual(before);
  await expect(page.locator(".assessment-review")).toHaveCount(1);
});

test("service-worker update waits until the session ends and preserves progress", async ({
  page,
}) => {
  await onboard(page, true);
  const original = readFileSync("dist/sw.js", "utf8");
  try {
    writeFileSync("dist/sw.js", original + `\n// e2e-update-${Date.now()}\n`);
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      await reg.update();
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: S.updateAction }),
    ).toHaveCount(0);
    await finishActivity(page);
    await expect(
      page.getByRole("button", { name: S.updateAction }),
    ).toBeVisible();
    const before = await readState(page);
    await page.getByRole("button", { name: S.updateAction }).click();
    await expect(
      page.getByRole("button", { name: S.startMission, exact: true }),
    ).toBeVisible();
    expect((await readState(page)).attempts).toEqual(before.attempts);
  } finally {
    writeFileSync("dist/sw.js", original);
  }
});

test("chosen Sanrio companion and local rounded font survive refresh and offline launch", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "My Melody", exact: true }).click();
  await page.screenshot({
    path: "artifacts/character-choice.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: S.start, exact: true }).click();
  await page
    .getByRole("button", { name: S.skipDiagnostic, exact: true })
    .click();
  await expect(page.getByText(S.offline, { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      document.fonts.check('18px "Nunito Variable"', "Spieler 7 × 8"),
    ),
  ).toBe(true);
  await expect(page.locator(".room-mascot img")).toHaveAttribute(
    "alt",
    "My Melody",
  );
  expect(
    await page
      .locator(".room-mascot img")
      .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".room-mascot img")).toHaveAttribute(
    "alt",
    "My Melody",
  );
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      document.fonts.check('18px "Nunito Variable"', "Spieler"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: S.settings, exact: true }).click();
  await page.getByRole("button", { name: "Pompompurin", exact: true }).click();
  await page.getByRole("button", { name: S.save, exact: true }).click();
  await page.reload();
  await expect(page.locator(".room-mascot img")).toHaveAttribute(
    "alt",
    "Pompompurin",
  );
  expect(
    await page
      .locator(".room-mascot img")
      .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
  ).toBe(true);
});

test("quick round: recall first, optional help persists offline, gift appears in room", async ({
  page,
  context,
}) => {
  await onboard(page);
  await expect(page.getByText(S.offline, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: S.startMission, exact: true }).click();
  await expect(page.getByTestId("task")).toBeVisible();
  await expect(
    page.locator(".lesson-card,.support-panel,.cookie-board,.cafe-order"),
  ).toHaveCount(0);
  expect((await readState(page)).active!.tasks).toHaveLength(6);
  await page.screenshot({ path: "artifacts/quick-recall.png", fullPage: true });
  const first = (await readState(page)).active!.tasks[0];
  const [a, b] = first.factId.split("x").map(Number);
  await page.getByLabel(S.answer, { exact: true }).fill(String(a * b));
  await page.getByRole("button", { name: S.check, exact: true }).click();
  await expect.poll(async () => (await readState(page)).active!.cursor).toBe(1);
  expect(
    (await readState(page)).attempts.find((t) => t.id === first.id)
      ?.independent,
  ).toBe(true);
  await page.getByRole("button", { name: S.hint, exact: true }).click();
  await expect(page.locator(".support-panel")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".support-panel")).toBeVisible();
  const hinted = (await readState(page)).active!.tasks[1].id;
  await answerTask(page);
  expect(
    (await readState(page)).attempts.find((t) => t.id === hinted)?.independent,
  ).toBe(false);
  await answerTask(page, true);
  await finishActivity(page);
  await expect(page.getByRole("heading", { name: "Fertig! ✿" })).toBeVisible();
  expect((await readState(page)).milestones).toContain("cafe-1");
  const gift = page.getByRole("region", { name: S.chooseGift });
  await gift.getByRole("button", { name: "Herzkissen", exact: true }).click();
  await expect(
    gift.locator('.room-item[aria-label="Herzkissen"]'),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/quick-gift.png", fullPage: true });
  await page
    .getByRole("button", { name: "In mein Zimmer", exact: true })
    .click();
  await page.reload();
  await expect(
    page.locator('.room-item[aria-label="Herzkissen"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: /Dekoration/ }).click();
  const editor = page.getByRole("region", { name: "Zimmer gestalten" });
  await editor.getByRole("button", { name: "Herzkissen", exact: true }).click();
  await editor.getByRole("button", { name: /Am Fenster/ }).click();
  await page.reload();
  expect((await readState(page)).room!.slots[1]).toBe(0);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("illustrated story counts exact groups and stays supported after offline reload", async ({
  page,
  context,
}) => {
  await onboard(page, true);
  await expect(page.locator(".flower-pot-group")).toHaveCount(2);
  await expect(page.locator(".counted-flower")).toHaveCount(6);
  await expect(
    page.getByText(
      "Auf der Fensterbank stehen 2 gleiche Blumentöpfe. In jedem wachsen 3 Blumen. Wie viele Blumen sind es zusammen?",
      { exact: true },
    ),
  ).toBeVisible();
  await expect
    .poll(async () => (await readState(page)).active!.tasks[0].supported)
    .toBe(true);
  await page.screenshot({ path: "artifacts/flower-story.png", fullPage: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".counted-flower")).toHaveCount(6);
  await answerTask(page);
  const s = await readState(page);
  expect(
    s.attempts.find((a) => a.id === s.active!.tasks[0].id)?.independent,
  ).toBe(false);
  expect(s.facts["2x3"].successes).toBe(0);
});

test("optional study, distinct character themes and both motion preferences", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "My Melody", exact: true }).click();
  await page.getByRole("button", { name: S.start, exact: true }).click();
  await page
    .getByRole("button", { name: "Ich möchte lernen", exact: true })
    .click();
  await page
    .getByRole("button", { name: S.lessonStart, exact: true })
    .first()
    .click();
  await expect(page.locator(".lesson-card")).toBeVisible();
  expect((await readState(page)).active!.kind).toBe("mission");
  await expect(page.getByTestId("task")).toHaveCount(0);
  await page.getByRole("button", { name: S.exit, exact: true }).click();
  await expect(page.locator(".app")).toHaveClass(/pet-cat/);
  const pink = await page
    .locator(".app")
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.screenshot({ path: "artifacts/melody-theme.png", fullPage: true });
  expect(
    await page
      .locator(".room-mascot")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("friend-wave");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".room-mascot")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: S.settings, exact: true }).click();
  await page.getByRole("button", { name: "Pompompurin", exact: true }).click();
  await page.getByLabel(S.motion, { exact: true }).uncheck();
  await page.getByRole("button", { name: S.save, exact: true }).click();
  await page
    .getByRole("navigation", { name: "Hauptmenü" })
    .filter({ visible: true })
    .getByRole("button", { name: S.home, exact: true })
    .click();
  await expect(page.locator(".app")).toHaveClass(/pet-bunny/);
  expect(
    await page
      .locator(".app")
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).not.toBe(pink);
  expect(
    await page
      .locator(".room-mascot")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.screenshot({ path: "artifacts/purin-theme.png", fullPage: true });
});

test("theme selection previews both modes before saving and keeps the profile", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByLabel("Wie heißt du?", { exact: true })).toBeVisible();
  await page.locator("main h1").focus();
  await expect(page.locator("main h1")).toBeFocused();
  await expect(page.locator("main h1")).toHaveCSS("outline-style", "none");
  await page.getByLabel("Wie heißt du?", { exact: true }).fill("Spieler");
  await expect(page.locator(".welcome-art .room-art")).toBeVisible();
  await page.getByRole("button", { name: S.calm, exact: true }).click();
  await expect(page.locator(".welcome-art .calm-preview")).toBeVisible();
  await expect(page.locator(".welcome-art .room-art")).toHaveCount(0);
  await expect(page.locator(".theme-description")).toContainText(
    "ohne Zimmer und Café-Geschichte",
  );
  await page.screenshot({ path: "artifacts/calm-choice.png", fullPage: true });
  await page.getByRole("button", { name: S.cozy, exact: true }).click();
  await expect(page.locator(".welcome-art .room-art")).toBeVisible();
  await page.screenshot({ path: "artifacts/cozy-choice.png", fullPage: true });
  await page.getByRole("button", { name: S.start, exact: true }).click();
  await page
    .getByRole("button", { name: S.skipDiagnostic, exact: true })
    .click();
  const before = await readState(page);
  await page.getByRole("button", { name: S.settings, exact: true }).click();
  await page.getByRole("button", { name: S.calm, exact: true }).click();
  await expect(page.locator(".settings-preview .calm-preview")).toBeVisible();
  expect(await readState(page)).toEqual(before);
  await page.getByRole("button", { name: S.save, exact: true }).click();
  await expect(page.getByText(S.profileSaved, { exact: true })).toBeVisible();
  expect(await readState(page)).toEqual({
    ...before,
    profile: { ...before.profile, theme: "calm" },
  });
  await page.reload();
  await expect(page.locator(".calm-room")).toBeVisible();
  await expect(
    page.locator('meta[name="apple-mobile-web-app-title"]'),
  ).toHaveAttribute("content", "Gemütliche Mathe");
  const icon = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");
  expect(icon).toMatch(/^data:image\/png;base64,/);
  expect(Buffer.from(icon!.split(",")[1], "base64")).toEqual(
    readFileSync("public/icons/pompompurin-apple-v3.png"),
  );
  const dimensions = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src!;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, icon);
  expect(dimensions).toEqual([180, 180]);
});

test("companion celebrates success and droops on error; reduced motion disables reactions", async ({
  page,
}) => {
  await onboard(page, true);
  await page.getByLabel(S.answer, { exact: true }).fill("6");
  await page.getByRole("button", { name: S.check, exact: true }).click();
  await expect(page.locator(".answer-happy")).toBeVisible();
  await expect(page.locator(".answer-happy .mascot")).toHaveCSS(
    "animation-name",
    "answer-hop",
  );
  await page.screenshot({ path: "artifacts/happy-answer.png", fullPage: true });
  await page.getByRole("button", { name: S.next, exact: true }).click();
  await page.getByLabel(S.answer, { exact: true }).fill("99");
  await page.getByRole("button", { name: S.check, exact: true }).click();
  await expect(page.locator(".answer-sad")).toBeVisible();
  await expect(page.locator(".answer-sad .mascot")).toHaveCSS(
    "animation-name",
    "answer-droop",
  );
  await page.screenshot({ path: "artifacts/sad-answer.png", fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".answer-sad .mascot")).toHaveCSS(
    "animation-name",
    "none",
  );
});
