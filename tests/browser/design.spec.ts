import { test, expect } from "@playwright/test";

for (const width of [360, 390, 768, 1440]) {
  test(`Жаңа дизайн ${width}px: оқу жолы, бес сахна және ашылатын код`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const assertFits = async () =>
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await assertFits();
    for (const id of [
      "structure",
      "instruction",
      "pipeline",
      "basics",
      "lab",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await assertFits();
    }
    const lab = page.locator("#lab");
    await expect(lab.locator(".lab-inspector")).not.toHaveAttribute("open");
    for (const tab of [
      "Салыстыру",
      "Баға",
      "Функция",
      "Мезгіл",
      "Калькулятор",
    ]) {
      await lab.getByRole("tab", { name: new RegExp(tab) }).click();
      await expect(lab.locator(".lab-stage")).toBeVisible();
      await assertFits();
      await expect(lab.locator(".lab-inspector")).not.toHaveAttribute("open");
    }
    await lab.locator(".lab-inspector > summary").click();
    await expect(lab.locator(".source-code")).toBeVisible();
    await assertFits();
    expect(errors).toEqual([]);
  });
}

test("Мәтін оқылады, қосымша код жабық, reduced motion кезінде есептеу сақталады", async ({
  page,
}) => {
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await expect(lab.locator(".lab-inspector")).not.toHaveAttribute("open");
  await expect(lab.locator(".code-panel")).not.toBeVisible();
  const smallText = await page.evaluate(() => {
    const result: { text: string; size: number }[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (
        !parent ||
        !node.textContent?.trim() ||
        parent.closest("script,style,[aria-hidden=true]")
      )
        continue;
      const style = getComputedStyle(parent);
      if (
        !parent.getClientRects().length ||
        style.visibility === "hidden" ||
        style.display === "none"
      )
        continue;
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 14)
        result.push({
          text: node.textContent.trim().slice(0, 60),
          size: fontSize,
        });
    }
    return result;
  });
  expect(smallText).toEqual([]);
  await lab.getByRole("tab", { name: /Баға/ }).click();
  await lab.locator(".controls select").selectOption("87.5");
  await lab.getByRole("button", { name: "90", exact: true }).click();
  await expect(lab.locator(".grade-display strong")).toHaveText("A");
  await expect(lab.locator(".flow-heading")).toContainText("Аяқталды");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
    )
    .toBe(0);
  await expect(lab.locator(".lab-inspector")).not.toHaveAttribute("open");
  await lab.locator(".lab-inspector > summary").press("Enter");
  await expect(lab.locator(".code-panel")).toBeVisible();
  await expect(lab.locator(".console pre")).toHaveText("A");
});

test("Тікелей бөлім сілтемесі React жүктелгеннен кейін дұрыс жерге апарады", async ({
  page,
}) => {
  for (const [id, label] of [
    ["lab", "Зертхана"],
    ["instruction", "Бір команда"],
  ] as const) {
    await page.goto(`/#${id}`);
    const section = page.locator(`#${id}`);
    await expect
      .poll(() =>
        section.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const header = document
            .querySelector("header")!
            .getBoundingClientRect();
          return rect.top < innerHeight && rect.bottom > header.bottom;
        }),
      )
      .toBe(true);
    await expect(
      page.locator("nav").getByRole("link", { name: label, exact: true }),
    ).toHaveClass(/active/);
  }
});
