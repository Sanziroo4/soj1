import { test, expect, type Locator } from "@playwright/test";

async function openInspector(lab: Locator) {
  const inspector = lab.locator(".lab-inspector");
  if (!(await inspector.evaluate((el) => (el as HTMLDetailsElement).open)))
    await inspector.locator(":scope > summary").click();
}

test("Бес есеп бір басумен аяқталады, жылжыту мен нәтижені көрсету ойнатуды бұзбайды", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 680 });
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  for (const [tab, result] of [
    ["Салыстыру", "Max: 12"],
    ["Баға", "B"],
    ["Функция", "f(x) = 8"],
    ["Мезгіл", "Autumn"],
    ["Калькулятор", "Remainder: 3"],
  ]) {
    await lab.getByRole("tab", { name: new RegExp(tab) }).click();
    await lab.locator(".controls select").selectOption("87.5");
    await lab
      .getByRole("button", { name: "Есепті орындау", exact: true })
      .click();
    await openInspector(lab);
    await lab.locator(".machine-state").scrollIntoViewIfNeeded();
    await expect(lab.locator(".execution-flow")).toHaveClass(/running/);
    await expect(lab.locator(".flow-heading")).toContainText("Аяқталды", {
      timeout: 10000,
    });
    await expect(lab.locator(".console pre")).toContainText(result);
    const count = await lab.locator(".controls>.mono").innerText();
    const [n, max] = count.split("/").map(Number);
    expect(n).toBe(max);
    await expect(
      lab.getByRole("button", { name: "Есепті орындау", exact: true }),
    ).toBeVisible();
  }
});

test("Дайын мәндер автоматты іске қосылады; нәтиже мен график кодтан шығады", async ({
  page,
}) => {
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await lab.getByRole("tab", { name: /Баға/ }).click();
  await lab.locator(".controls select").selectOption("87.5");
  await lab.getByRole("button", { name: "59", exact: true }).click();
  await expect(lab.locator(".grade-display strong")).toHaveText("F", {
    timeout: 5000,
  });
  await openInspector(lab);
  await expect(lab.locator(".console pre")).toHaveText("F");
  await lab.getByRole("button", { name: "101", exact: true }).click();
  await expect(lab.locator(".grade-display strong")).toHaveText("!");
  await expect(lab.locator(".console pre")).toContainText("Error");
  await lab.getByRole("tab", { name: /Функция/ }).click();
  await lab.locator(".controls select").selectOption("87.5");
  await lab.getByRole("button", { name: "x = 5", exact: true }).click();
  await expect(lab.locator(".lab-visual>p")).toContainText("f(5) = 24");
  await expect(lab.locator(".function-chart .point-ring")).toHaveCount(1);
  await openInspector(lab);
  await expect(lab.locator(".console pre")).toHaveText("f(x) = 24");
  await lab.getByRole("button", { name: "Алдыңғы қадам", exact: true }).click();
  await lab.getByRole("button", { name: "Қайта бастау", exact: true }).click();
  await expect(lab.locator(".function-chart .point-ring")).toHaveCount(0);
  await expect(lab.locator(".console pre")).toContainText("Нәтиже күтілуде");
});

test("Үш пайплайн сценарийі өздігінен аяқталады; қайталау, кідірту және фоннан оралу", async ({
  page,
}) => {
  await page.goto("/#pipeline");
  const pipe = page.locator("#pipeline");
  for (const name of [
    "Тәуелсіз командалар",
    "Тәуелділік + stall",
    "Тәуелділік + forwarding",
  ]) {
    await pipe.getByRole("button", { name, exact: true }).click();
    await pipe.locator(".controls select").selectOption("87.5");
    await expect(pipe.locator(".controls>.mono")).toHaveText(
      name.includes("stall") ? "11 / 11" : "7 / 7",
    );
    await expect(
      pipe.getByRole("button", { name: "Бастау", exact: true }),
    ).toBeVisible();
  }
  await pipe.getByRole("checkbox", { name: "Қайталау" }).check();
  await pipe.getByRole("button", { name: "Бастау", exact: true }).click();
  await page.waitForTimeout(1800);
  await expect(
    pipe.getByRole("button", { name: "Кідірту", exact: true }),
  ).toBeVisible();
  await pipe.getByRole("button", { name: "Кідірту", exact: true }).click();
  const count = await pipe.locator(".controls>.mono").innerText();
  await page.waitForTimeout(300);
  await expect(pipe.locator(".controls>.mono")).toHaveText(count);
  await pipe.getByRole("checkbox", { name: "Қайталау" }).uncheck();
  await pipe.getByRole("button", { name: "Қайта бастау", exact: true }).click();
  await pipe.locator(".controls select").selectOption("350");
  await pipe.getByRole("button", { name: "Бастау", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await pipe.locator(".controls>.mono").innerText();
  await page.waitForTimeout(500);
  await expect(pipe.locator(".controls>.mono")).toHaveText(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(pipe.locator(".controls>.mono")).toHaveText("7 / 7");
});

test("RAM → кэш → регистр → ALU тасымалы өздігінен жүреді", async ({
  page,
}) => {
  await page.goto("/#structure");
  const memory = page.locator(".memory-section");
  await memory.scrollIntoViewIfNeeded();
  await memory.getByRole("button", { name: "RAM", exact: true }).click();
  await expect(memory).toHaveAttribute("data-memory-step", "4");
  await expect(memory.locator(".memory-status")).toHaveText(
    "✓ 42 мәні ALU-ға жетті",
  );
  await expect(memory.locator(".memory-alu code")).toHaveText("42");
  await memory.getByRole("button", { name: "Регистр", exact: true }).click();
  await expect(memory).toHaveAttribute("data-memory-step", "2");
  await expect(memory.locator(".memory-alu code")).toHaveText("42");
});

test("Қорғау өзі командадан пайплайнға, одан бес есепке өтеді", async ({
  page,
}) => {
  test.setTimeout(110000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Қорғау режимі", exact: true })
    .click();
  await page.getByRole("button", { name: "Маршруттың келесі бөлімі" }).click();
  await page.getByRole("button", { name: "Маршруттың келесі бөлімі" }).click();
  await page.getByRole("button", { name: "Авто көрсету", exact: true }).click();
  await expect(page.locator(".presentation-label h3")).toHaveText("Пайплайн", {
    timeout: 10000,
  });
  await expect(page.locator(".presentation-label h3")).toHaveText(
    "MIPS негіздері",
    { timeout: 10000 },
  );
  await expect(page.locator(".presentation-label h3")).toHaveText(
    "Зертхана · 1/5",
    { timeout: 12000 },
  );
  await expect(page.locator(".presentation-label h3")).toHaveText(
    "Зертхана · 2/5",
    { timeout: 25000 },
  );
  await expect(page.locator(".presentation-label h3")).toHaveText(
    "Зертхана · 3/5",
    { timeout: 15000 },
  );
  await expect(page.locator(".presentation-label h3")).toHaveText(
    "Зертхана · 4/5",
    { timeout: 15000 },
  );
  await expect(page.locator(".presentation-label h3")).toHaveText(
    "Зертхана · 5/5",
    { timeout: 15000 },
  );
  await expect(page.locator(".presentation-label h3")).toHaveText("Қорытынды", {
    timeout: 25000,
  });
  await expect(
    page.getByRole("button", { name: "Авто көрсету", exact: true }),
  ).toBeVisible();
});
