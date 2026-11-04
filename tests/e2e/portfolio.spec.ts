import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
async function capture(page: Page, path: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await page.screenshot({ path, fullPage: false, animations: "disabled" });
}
test("portfolio screenshots and full offline round", async ({
  page,
  context,
}) => {
  const out = process.env.TEST_URL ? "artifacts/live" : "docs/screenshots";
  mkdirSync(out, { recursive: true });
  await page.goto("./");
  await page.getByRole("button", { name: "Los geht's", exact: true }).click();
  await page
    .getByRole("button", { name: "Kennenlernen überspringen", exact: true })
    .click();
  await expect(
    page.getByText("Bereit zum Üben ohne Internet", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await capture(page, `${out}/room.png`);
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await capture(page, `${out}/practice.png`);
  await page
    .getByRole("button", { name: "Ich weiß es nicht mehr", exact: true })
    .click();
  await expect(page.getByText("Mit Tipp", { exact: true })).toBeVisible();
  await capture(page, `${out}/help.png`);
  await context.setOffline(true);
  await page.reload();
  for (let i = 0; i < 6; i++) {
    const task = page.getByTestId("task");
    await expect(task).toBeVisible();
    const id = await task.getAttribute("data-fact");
    const [a, b] = id!.split("x").map(Number);
    await page.getByLabel("Deine Antwort", { exact: true }).fill(String(a * b));
    await page.getByRole("button", { name: "Prüfen", exact: true }).click();
    if (i < 5) await expect(task).not.toHaveAttribute("data-fact", id!);
  }
  await expect(page.getByRole("heading", { name: "Fertig! ✿" })).toBeVisible();
  await page
    .getByRole("region", { name: "Wähle eine Dekoration" })
    .getByRole("button")
    .first()
    .click();
  await page.locator("h1").focus();
  await capture(page, `${out}/reward.png`);
  await context.setOffline(false);
});
