import { test, expect, type Locator } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
async function openInspector(lab: Locator) {
  const inspector = lab.locator(".lab-inspector");
  if (!(await inspector.evaluate((el) => (el as HTMLDetailsElement).open)))
    await inspector.locator(":scope > summary").click();
}
test("Оқу жолы, процессор, командалар, пайплайн және сан жүйелері", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/MIPS LAB/);
  await page.getByRole("button", { name: "Процессордың ішіне саяхат" }).click();
  const structure = page.locator("#structure");
  await structure
    .getByRole("button", { name: "Регистрлер файлы", exact: true })
    .click();
  await expect(structure.locator(".part-info h3")).toHaveText(
    "Регистрлер файлы",
  );
  await structure.getByRole("button", { name: "Қайта жинау" }).click();
  await structure
    .getByRole("button", { name: "Процессорды ашу", exact: true })
    .press("Enter");
  await expect(structure.locator(".processor-map")).toHaveClass(/expanded/);
  await structure.getByRole("button", { name: "ALU", exact: true }).click();
  await expect(structure.locator(".sum-animation")).toContainText("12");
  await structure.getByRole("button", { name: "RAM", exact: true }).click();
  await structure
    .getByRole("button", { name: "42 мәнін ALU-ға жеткізу" })
    .click();
  await expect(structure.locator(".memory-status")).toHaveText(
    "✓ 42 мәні ALU-ға жетті",
  );
  await expect(structure.locator(".memory-node.visited")).toHaveCount(4);
  await expect(structure.locator(".memory-alu code")).toHaveText("42");
  await page
    .locator("nav")
    .getByRole("link", { name: "Бір команда", exact: true })
    .click();
  const cpu = page.locator("#instruction");
  for (let i = 0; i < 5; i++)
    await cpu
      .getByRole("button", { name: "Келесі қадам", exact: true })
      .click();
  await expect(cpu.locator(".now")).toContainText("$t2 ← 12");
  await cpu.getByRole("button", { name: "Алдыңғы қадам", exact: true }).click();
  await expect(cpu.locator(".now dl")).toContainText("0");
  await cpu.getByLabel("Команда t0", { exact: true }).fill("9");
  await expect(cpu.locator(".now h3")).toHaveText("Бір команда. Бес кезең.");
  await cpu.getByRole("button", { name: "sw Жадқа жазу" }).click();
  await cpu.getByRole("button", { name: "MEM Жад" }).click();
  await expect(cpu.locator(".now")).toContainText("[0x10010000] ← 5");
  await cpu.getByRole("button", { name: "Алдыңғы қадам", exact: true }).click();
  await expect(cpu.locator(".now dl")).toContainText("42");
  await cpu.getByRole("button", { name: "beq Тармақталу" }).click();
  await cpu.getByLabel("Команда t1", { exact: true }).fill("9");
  await cpu.getByRole("button", { name: "EX Есептеу" }).click();
  await expect(cpu.locator(".now")).toContainText("Тармақ алынды");
  await cpu.getByLabel("Команда t1", { exact: true }).fill("5");
  await cpu.getByRole("button", { name: "EX Есептеу" }).click();
  await expect(cpu.locator(".now")).toContainText("жалған");
  await page
    .locator("nav")
    .getByRole("link", { name: "Пайплайн", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Тәуелділік + stall", exact: true })
    .click();
  await page.locator(".pipeline-timeline > summary").click();
  await expect(page.locator(".pipeline-table")).toBeVisible();
  await expect(
    page.locator(".pipeline-table td").filter({ hasText: "STALL" }),
  ).toHaveCount(4);
  await page
    .getByRole("button", { name: "Тәуелділік + forwarding", exact: true })
    .click();
  await expect(
    page.locator(".pipeline-table td").filter({ hasText: "STALL" }),
  ).toHaveCount(0);
  await page
    .locator("nav")
    .getByRole("link", { name: "MIPS негіздері", exact: true })
    .click();
  await page
    .locator("#basics")
    .getByRole("button", { name: "HEX", exact: true })
    .click();
  await expect(page.locator(".number-output")).toHaveText("0x0000002a");
  expect(errors).toEqual([]);
});
test("Бес есеп, кері қадам, өңдеу, көшіру және жүктеу", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await openInspector(lab);
  await expect(lab.locator(".console")).toContainText("Max: 12");
  const negative = lab.getByLabel("Зертхана a", { exact: true });
  await negative.fill("");
  await negative.pressSequentially("-7");
  await expect(negative).toHaveValue("-7");
  await expect(lab.locator(".console")).toContainText("Нәтиже күтілуде");
  await negative.fill("7");
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await expect(
    lab.locator(".result-grid > span").filter({ hasText: "Ең кішісі" }),
  ).toContainText("5");
  await lab.getByRole("button", { name: "Алдыңғы қадам", exact: true }).click();
  await expect(lab.locator(".lab-now")).not.toContainText(
    "Бағдарлама аяқталды",
  );
  await lab.getByRole("button", { name: "Қайта бастау", exact: true }).click();
  await expect(lab.locator(".console")).toContainText("Нәтиже күтілуде");
  await expect(lab.locator(".branch-log")).toContainText(
    "Шарт әлі орындалмады",
  );
  for (const [tab, input, expected] of [
    ["Баға", "60", "D"],
    ["Функция", "0", "f(x) = -1"],
    ["Мезгіл", "12", "Winter"],
  ] as const) {
    await lab.getByRole("tab", { name: new RegExp(tab) }).click();
    await lab.locator(".lab-inputs input").fill(input);
    await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
    await openInspector(lab);
    await expect(lab.locator(".console pre")).toContainText(expected);
  }
  await lab.getByRole("tab", { name: /Калькулятор/ }).click();
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await openInspector(lab);
  await expect(lab.locator(".console")).toContainText("Remainder: 3");
  await lab.getByRole("button", { name: "Кодты көшіру", exact: true }).click();
  await expect(lab.getByRole("status")).toContainText("Код көшірілді");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "div $t0, $t1",
  );
  const filePromise = page.waitForEvent("download");
  await lab.getByRole("button", { name: "ASM жүктеу", exact: true }).click();
  const f = await filePromise;
  expect(f.suggestedFilename()).toBe("mips-lab-5.asm");
  expect(await readFile((await f.path())!, "utf8")).toContain(
    "Delayed branching OFF",
  );
  const zipPromise = page.waitForEvent("download");
  await lab.getByRole("button", { name: "5 .asm архиві" }).click();
  const z = await zipPromise;
  const zip = unzipSync(await readFile((await z.path())!));
  expect(Object.keys(zip).filter((s) => s.endsWith(".asm"))).toHaveLength(5);
  expect(strFromU8(zip["mips-lab-4.asm"])).toContain("winter:");
  await lab.getByRole("button", { name: "Кодты өңдеу", exact: true }).click();
  await lab
    .getByRole("textbox", { name: "MIPS код редакторы" })
    .fill(".text\nli $t0, 42\nli $v0, 1\nmove $a0, $t0\nsyscall");
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await expect(lab.locator(".console pre")).toHaveText("42");
  await lab.getByRole("button", { name: "Алдыңғы қадам", exact: true }).click();
  await expect(lab.locator(".console pre")).toContainText("Нәтиже күтілуде");
  expect(errors).toEqual([]);
});
test("Мобильді көрініс, пернетақта және қорғау маршруты", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Мазмұнға өту" })).toBeFocused();
  await page
    .getByRole("button", { name: "Қорғау режимі", exact: true })
    .click();
  await expect(page.locator(".presentation-bar")).toBeVisible();
  for (let i = 0; i < 9; i++)
    await page
      .getByRole("button", { name: "Маршруттың келесі бөлімі" })
      .click();
  await expect(
    page.locator("#lab [role=tab][aria-selected=true]"),
  ).toContainText("Калькулятор");
  await page.getByRole("button", { name: "Маршруттың келесі бөлімі" }).click();
  await expect(page.locator(".presentation-bar")).toContainText("Қорытынды");
  await page.getByRole("button", { name: "Қорғау режимін жабу" }).click();
  await expect(page.locator(".presentation-bar")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Ойнату, кідірту, жылдамдық, ASM ашу және толық экран", async ({
  page,
}) => {
  await page.goto("/#instruction");
  const cpu = page.locator("#instruction");
  await cpu.locator(".controls select").selectOption("1400");
  await cpu.getByRole("button", { name: "Бастау", exact: true }).click();
  await expect(cpu.locator(".stage-track .current")).toContainText("IF");
  await cpu.getByRole("button", { name: "Кідірту", exact: true }).click();
  const old = await cpu.locator(".controls>.mono").textContent();
  await page.waitForTimeout(1500);
  expect(await cpu.locator(".controls>.mono").textContent()).toBe(old);
  await cpu.getByRole("combobox").selectOption("350");
  await cpu.getByRole("button", { name: "Бастау", exact: true }).click();
  await expect(cpu.locator(".now")).toContainText("$t2 ← 12");
  await cpu.getByRole("button", { name: "Қайта бастау", exact: true }).click();
  await cpu.getByRole("button", { name: "lw Жадтан оқу" }).click();
  await cpu.getByRole("button", { name: "WB Жазу" }).click();
  await expect(cpu.locator(".now")).toContainText("$t2 ← 42");
  await cpu.getByLabel("Команда жад мәні", { exact: true }).fill("-17");
  await cpu.getByRole("button", { name: "WB Жазу" }).click();
  await expect(cpu.locator(".now")).toContainText("$t2 ← -17");
  await page
    .locator("nav")
    .getByRole("link", { name: "Құрылым", exact: true })
    .click();
  await page
    .locator("#structure")
    .getByRole("button", { name: "Адрес", exact: true })
    .click();
  await expect(page.locator(".part-info h3")).toHaveText("Адрес байланысы");
  await expect(page.locator(".part-info")).toContainText("0x10010000 ≠ 42");
  await page
    .locator("nav")
    .getByRole("link", { name: "Зертхана", exact: true })
    .click();
  const lab = page.locator("#lab");
  await openInspector(lab);
  await lab.locator("input[type=file]").setInputFiles({
    name: "custom.asm",
    mimeType: "text/plain",
    buffer: Buffer.from(
      ".data\nx: .word 42\n.text\nla $s0, x\nlw $t0, 0($s0)\nli $t1, 9\nsw $t1, 0($s0)\nli $v0, 1\nmove $a0, $t0\nsyscall",
    ),
  });
  await lab.getByRole("button", { name: "Нәтижеге өту" }).click();
  await expect(lab.locator(".console pre")).toHaveText("42");
  await lab.getByRole("button", { name: "Қайта бастау", exact: true }).click();
  await expect(lab.locator(".console pre")).toContainText("Нәтиже күтілуде");
  await page
    .locator("nav")
    .getByRole("link", { name: "Қорғау", exact: true })
    .click();
  await page
    .locator("#defense")
    .getByRole("button", { name: "Толық экран", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  for (const width of [360, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
