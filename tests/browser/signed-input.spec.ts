import { test, expect } from "@playwright/test";

test("Теріс x: цифрлардан кейін минус, толық қайта теру және нақты MIPS нәтижесі", async ({
  page,
}) => {
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await lab.getByRole("tab", { name: /Функция/ }).click();
  const x = lab.getByLabel("Зертхана x", { exact: true });
  await expect(x).toHaveValue("3");
  await x.press("End");
  await x.press("-");
  await expect(x).toHaveValue("-3");
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await expect(lab.locator(".lab-visual>p")).toContainText("f(-3) = -1");
  await x.fill("");
  await x.pressSequentially("-30");
  await expect(x).toHaveValue("-30");
  await expect(x).toHaveAttribute("aria-invalid", "false");
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await expect(lab.locator(".lab-visual>p")).toContainText("f(-30) = -55");
  await x.fill("0");
  await lab
    .getByRole("button", { name: "Зертхана x: таңбаны өзгерту", exact: true })
    .click();
  await expect(x).toHaveValue("-");
  await x.pressSequentially("3");
  await expect(x).toHaveValue("-3");
  await x.fill("3");
  await x.selectText();
  await x.press("-");
  await expect(x).toHaveValue("-");
  await x.pressSequentially("5");
  await expect(x).toHaveValue("-5");
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await expect(lab.locator(".lab-visual>p")).toContainText("f(-5) = -5");
});

test("Көшірілген Unicode минус пен бос орындар теріс санға айналады", async ({
  page,
}) => {
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await lab.getByRole("tab", { name: /Функция/ }).click();
  const x = lab.getByLabel("Зертхана x", { exact: true });
  for (const text of ["−3", "–3", "－3", "  -3  "]) {
    await x.fill("3");
    await x.fill(text);
    await expect(x).toHaveValue("-3");
    await expect(x).toHaveAttribute("aria-invalid", "false");
    await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
    await expect(lab.locator(".lab-visual>p")).toContainText("f(-3) = -1");
  }
});

test("Телефонда ± таңбасы және таңбалы бөлінді/қалдық, күйді тазарту", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await lab.getByRole("tab", { name: /Калькулятор/ }).click();
  await lab
    .getByRole("button", { name: "Зертхана a: таңбаны өзгерту", exact: true })
    .click();
  await expect(lab.getByLabel("Зертхана a", { exact: true })).toHaveValue(
    "-24",
  );
  expect(
    await lab.getByLabel("Зертхана a", { exact: true }).evaluate((el) => {
      const s = getComputedStyle(el);
      return (
        el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
      );
    }),
  ).toBeGreaterThanOrEqual(42);
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await lab.locator(".lab-inspector>summary").click();
  await expect(lab.locator(".console pre")).toContainText(
    "Result / quotient: -3\nRemainder: -3",
  );
  await lab
    .getByRole("button", { name: "Зертхана a: таңбаны өзгерту", exact: true })
    .click();
  await expect(lab.getByLabel("Зертхана a", { exact: true })).toHaveValue("24");
  await expect(lab.locator(".controls>.mono")).toHaveText(/^0\s*\//);
  await expect(lab.locator(".console pre")).toContainText("Нәтиже күтілуде");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Таңбалы 32 бит шекаралары және нөлден төмен CPU операнды", async ({
  page,
}) => {
  await page.goto("/#instruction");
  const cpu = page.locator("#instruction"),
    input = cpu.getByLabel("Команда t0", { exact: true });
  await input.fill("-2147483648");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(
    cpu.getByRole("button", {
      name: "Команда t0: таңбаны өзгерту",
      exact: true,
    }),
  ).toBeDisabled();
  await input.fill("2147483648");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("-7");
  await cpu.getByRole("button", { name: "WB Жазу" }).click();
  await expect(cpu.locator(".now")).toContainText("$t2 ← -2");
});
