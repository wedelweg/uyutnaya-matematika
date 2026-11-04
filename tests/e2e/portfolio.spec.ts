import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
test("portfolio screenshots and full offline round", async ({
  page,
  context,
}) => {
  const out = process.env.TEST_URL ? "artifacts/live" : "docs/screenshots";
  mkdirSync(out, { recursive: true });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Давай познакомимся", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Пропустить знакомство", exact: true })
    .click();
  await expect(
    page.getByText("Готово к занятиям без интернета", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: `${out}/room.png`, fullPage: false });
  await page.getByRole("button", { name: "Играть", exact: true }).click();
  await page.screenshot({ path: `${out}/practice.png`, fullPage: false });
  await page.getByRole("button", { name: "Не помню", exact: true }).click();
  await page.screenshot({ path: `${out}/help.png`, fullPage: false });
  await context.setOffline(true);
  await page.reload();
  for (let i = 0; i < 6; i++) {
    const task = page.getByTestId("task");
    await expect(task).toBeVisible();
    const id = await task.getAttribute("data-fact");
    const [a, b] = id!.split("x").map(Number);
    await page.getByLabel("Твой ответ", { exact: true }).fill(String(a * b));
    await page.getByRole("button", { name: "Проверить", exact: true }).click();
    if (i < 5) await expect(task).not.toHaveAttribute("data-fact", id!);
  }
  await expect(page.getByRole("heading", { name: "Готово! ✿" })).toBeVisible();
  await page
    .getByRole("region", { name: "Выбери украшение" })
    .getByRole("button")
    .first()
    .click();
  await page.locator("h1").focus();
  await page.screenshot({ path: `${out}/reward.png`, fullPage: false });
  await context.setOffline(false);
});
