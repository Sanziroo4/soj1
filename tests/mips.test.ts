import { describe, it, expect } from "vitest";
import {
  execute,
  parse,
  initial,
  step,
  registerNames,
  DATA_BASE,
  format,
} from "../src/model/mips";
import { tasks } from "../src/content/programs";
import { pipeline } from "../src/model/pipeline";
const run = (id: number, input: number[]) =>
  execute(tasks[id - 1].code, input).trace.at(-1)!;
const r = (code: string) => execute(".text\n" + code).trace.at(-1)!;
describe("Бес зертханалық бағдарлама — нақты MIPS орындалуы", () => {
  it.each([
    [1, 2, 3],
    [-7, -2, -9],
    [5, 5, 5],
    [1, 2, 1],
    [2, 2, 1],
    [1, 2, 2],
    [2147483647, 0, -2147483648],
  ])("Салыстыру: %j %j %j", (a, b, c) => {
    const s = run(1, [a, b, c]);
    expect(s.error).toBe("");
    expect(s.regs[16]).toBe(Math.max(a, b, c));
    expect(s.regs[17]).toBe(Math.min(a, b, c));
    expect(s.regs[18]).toBe(
      (a === b ? 1 : 0) + (a === c ? 2 : 0) + (b === c ? 4 : 0),
    );
    expect(s.regs[19]).toBe(a < b && b < c ? 1 : 0);
    expect(s.output).toContain(`Max: ${Math.max(a, b, c)}`);
  });
  it.each([
    [-1, -1],
    [0, 70],
    [59, 70],
    [60, 68],
    [69, 68],
    [70, 67],
    [79, 67],
    [80, 66],
    [89, 66],
    [90, 65],
    [100, 65],
    [101, -1],
  ])("Баға %i → %i", (n, char) => {
    const s = run(2, [n]);
    expect(s.error).toBe("");
    expect(s.regs[16]).toBe(char);
    expect(s.output).toBe(
      char === -1 ? "Error: grade must be 0..100" : String.fromCharCode(char),
    );
  });
  it.each([
    [-3, -1, 1],
    [-1, 3, 1],
    [0, -1, 2],
    [1, 0, 2],
    [5, 24, 2],
    [6, 4, 3],
    [20, -10, 3],
  ])("Функция %i → %i", (x, y, branch) => {
    const s = run(3, [x]);
    expect(s.error).toBe("");
    expect(s.regs[16]).toBe(y);
    expect(s.regs[17]).toBe(branch);
    expect(s.output).toBe(`f(x) = ${y}`);
  });
  it.each(
    Array.from({ length: 14 }, (_, month) => [
      month,
      month < 1 || month > 12
        ? -1
        : month === 12 || month <= 2
          ? 1
          : month <= 5
            ? 2
            : month <= 8
              ? 3
              : 4,
    ]),
  )("Ай %i → %i", (month, season) => {
    const s = run(4, [month]);
    expect(s.error).toBe("");
    expect(s.regs[16]).toBe(season);
    expect(s.output).toBe(
      ["", "Winter", "Spring", "Summer", "Autumn"][season] ||
        "Error: month must be 1..12",
    );
  });
  it.each([
    [7, 5, 1, 12, 0],
    [7, 5, 2, 2, 0],
    [-7, 5, 3, -35, 0],
    [24, 7, 4, 3, 3],
    [-24, 7, 4, -3, -3],
    [24, -7, 4, -3, 3],
    [-24, -7, 4, 3, -3],
    [0, 7, 4, 0, 0],
  ])("Калькулятор %i %i op%i", (a, b, op, q, rem) => {
    const s = run(5, [a, b, op]);
    expect(s.error).toBe("");
    expect(s.regs[16]).toBe(q);
    expect(s.regs[17]).toBe(rem);
  });
  it("Нөлге бөлу код тармағымен өңделеді", () => {
    const s = run(5, [1, 0, 4]);
    expect(s.error).toBe("");
    expect(s.output).toContain("division by zero");
  });
  it.each([
    [2147483647, 1, 1],
    [-2147483648, 1, 2],
  ])("ADD/SUB overflow: %i %i op%i", (a, b, op) => {
    const s = run(5, [a, b, op]);
    expect(s.error).toContain("overflow");
    expect(s.regs[16]).toBe(0);
  });
  it("MUL төменгі 32 бит және ескерту", () => {
    const t = execute(tasks[4].code, [2147483647, 2, 3]).trace;
    expect(t.at(-1)!.regs[16]).toBe(-2);
    expect(t.some((s) => s.warning.includes("төменгі 32 бит"))).toBe(true);
  });
  it("INT_MIN / -1 модель ерекшелігі", () => {
    const t = execute(tasks[4].code, [-2147483648, -1, 4]).trace;
    expect(t.at(-1)!.regs[16]).toBe(-2147483648);
    expect(t.at(-1)!.regs[17]).toBe(0);
    expect(t.some((s) => s.warning.includes("INT_MIN"))).toBe(true);
  });
});
describe("Интерпретатор күйі", () => {
  it("$zero өзгермейді және барлық 32 регистр бар", () => {
    const s = r("li $zero, 42\nadd $t0, $zero, $zero");
    expect(s.regs).toHaveLength(32);
    expect(s.regs[0]).toBe(0);
    expect(s.regs[8]).toBe(0);
    expect(registerNames).toHaveLength(32);
  });
  it("lw/sw адрес пен деректі ажыратады", () => {
    const x = execute(
      ".data\nx: .word 42\n.text\nla $s0, x\nlw $t0, 0($s0)\nli $t1, -7\nsw $t1, 0($s0)\nlw $t2, 0($s0)",
    );
    const s = x.trace.at(-1)!;
    expect(s.error).toBe("");
    expect(s.regs[16]).toBe(DATA_BASE);
    expect(s.regs[8]).toBe(42);
    expect(s.regs[10]).toBe(-7);
    expect(s.memory[DATA_BASE]).toBe(-7);
    expect(x.trace[3].memory[DATA_BASE]).toBe(42);
    expect(x.trace[4].regs).toEqual(x.trace[3].regs);
  });
  it("add деректер жадын қолданбайды", () => {
    const x = execute(
      ".data\nx: .word 42\n.text\nli $t0, 7\nli $t1, 5\nadd $t2, $t0, $t1",
    );
    expect(x.trace.at(-1)!.regs[10]).toBe(12);
    expect(x.trace.at(-1)!.memory).toEqual(x.trace[0].memory);
  });
  it("beq: алынған және алынбаған бағыт", () => {
    for (const [b, taken] of [
      [7, true],
      [5, false],
    ] as const) {
      const x = execute(
        ".text\nbeq $t0, $t1, target\nli $t2, 99\ntarget:\nnop",
        [],
        { $t0: 7, $t1: b },
      );
      expect(x.trace[1].branch?.taken).toBe(taken);
      expect(x.trace.at(-1)!.regs[10]).toBe(taken ? 0 : 99);
    }
  });
  it("Кері қадам регистр, жад, консоль, inputIndex және тармақты толық қайтарады", () => {
    const { program, trace } = execute(
      ".data\nx: .word 42\n.text\nli $v0, 5\nsyscall\nmove $t0, $v0\nli $v0, 1\nmove $a0, $t0\nsyscall\nla $s0, x\nsw $t0, 0($s0)\nbeq $t0, $t0, end\nli $t0, 0\nend:\nnop",
      [9],
    );
    for (let i = 0; i < trace.length - 1; i++) {
      const before = JSON.stringify(trace[i]);
      const replay = step(program, trace[i], [9]);
      expect(replay).toEqual(trace[i + 1]);
      expect(JSON.stringify(trace[i])).toBe(before);
    }
    expect(trace[0].inputIndex).toBe(0);
    expect(trace[0].output).toBe("");
    expect(trace[0].memory[DATA_BASE]).toBe(42);
    expect(trace.at(-1)!.memory[DATA_BASE]).toBe(9);
    expect(trace.at(-1)!.output).toBe("9");
  });
  it("Өзгерген кірістер жаңа тарих жасайды", () => {
    const a = execute(tasks[4].code, [7, 5, 1]),
      b = execute(tasks[4].code, [1, 2, 1]);
    expect(a.trace[0]).toEqual(b.trace[0]);
    expect(a.trace.at(-1)!.regs[16]).toBe(12);
    expect(b.trace.at(-1)!.regs[16]).toBe(3);
  });
  it("Қате команда және белгі диагнозы", () => {
    expect(r("unknown $t0").error).toContain("Қолдау жоқ");
    expect(r("j missing").error).toContain("Белгі табылмады");
    expect(r("li $bad, 1").error).toContain("Белгісіз регистр");
    expect(() => parse("same:\nnop\nsame:\nnop")).toThrow("Қайталанған");
  });
  it("Тураланбаған және шектен тыс жад адресі", () => {
    expect(r("li $s0, 0x10010001\nlw $t0, 0($s0)").error).toContain(
      "туралануы",
    );
    expect(r("li $s0, 0\nsw $zero, 0($s0)").error).toContain("шегінен тыс");
  });
  it("Енгізу жоқ және цикл шегі", () => {
    expect(r("li $v0, 5\nsyscall").error).toContain("Енгізу");
    expect(execute("loop:\nj loop", [], {}, 8).trace.at(-1)!.error).toContain(
      "Қадам шегі",
    );
  });
  it("HI/LO signed multiplication", () => {
    const s = r("li $t0, -2147483648\nli $t1, 2\nmult $t0, $t1");
    expect(s.lo).toBe(0);
    expect(s.hi).toBe(-1);
  });
  it("MUL destination aliasing still detects truncation", () => {
    const s = r("li $t0, 2147483647\nli $t1, 2\nmul $t0, $t0, $t1");
    expect(s.regs[8]).toBe(-2);
    expect(s.warning).toContain("төменгі");
  });
  it("DEC/HEX/BIN бір биттерді көрсетеді", () => {
    expect(format(-1, "HEX")).toBe("0xffffffff");
    expect(format(-1, "BIN")).toBe("1".repeat(32));
    expect(format(42, "DEC")).toBe("42");
  });
  it("Immediate өрістерінің ені және signed/unsigned мағынасы", () => {
    expect(r("li $t0, 1\naddi $t1, $t0, 65535").error).toContain("Immediate");
    expect(r("li $t0, -1\nandi $t1, $t0, 65535").regs[9]).toBe(65535);
    expect(r("li $t0, 1\nsll $t1, $t0, 32").error).toContain("Immediate");
    expect(r("li $t0, 1\naddi $t1, $t0, -1").regs[9]).toBe(0);
  });
  it("Бос бағдарлама қауіпсіз аяқталады", () => {
    const p = parse("");
    expect(step(p, initial(p)).halted).toBe(true);
  });
});
describe("Бес кезеңді pipeline келісімі", () => {
  it.each(["independent", "forward"] as const)(
    "%s: 3 команда 7 такт",
    (mode) => {
      const p = pipeline(mode);
      expect(p.cycles).toBe(7);
      expect(p.rows[2].cells[6]).toBe("WB");
      for (const row of p.rows)
        expect(row.cells.filter(Boolean)).toEqual([
          "IF",
          "ID",
          "EX",
          "MEM",
          "WB",
        ]);
    },
  );
  it("forwarding жоқ: WB және ID бір тактте; 4 stall", () => {
    const p = pipeline("stall");
    expect(p.cycles).toBe(11);
    expect(
      p.rows.flatMap((r) => r.cells).filter((c) => c === "STALL"),
    ).toHaveLength(4);
    expect(p.rows[0].cells[4]).toBe("WB");
    expect(p.rows[1].cells[5]).toBe("EX");
    expect(p.rows[1].cells[7]).toBe("WB");
    expect(p.rows[2].cells[8]).toBe("EX");
    expect(p.rows[2].cells[10]).toBe("WB");
  });
});
