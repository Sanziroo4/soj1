/** Source-level MIPS teaching interpreter; no branch delay slot, caches or timing. */
export const registerNames = [
  "$zero",
  "$at",
  "$v0",
  "$v1",
  "$a0",
  "$a1",
  "$a2",
  "$a3",
  "$t0",
  "$t1",
  "$t2",
  "$t3",
  "$t4",
  "$t5",
  "$t6",
  "$t7",
  "$s0",
  "$s1",
  "$s2",
  "$s3",
  "$s4",
  "$s5",
  "$s6",
  "$s7",
  "$t8",
  "$t9",
  "$k0",
  "$k1",
  "$gp",
  "$sp",
  "$fp",
  "$ra",
];
export const DATA_BASE = 0x10010000,
  TEXT_BASE = 0x00400000;
export type Instruction = {
  op: string;
  args: string[];
  line: number;
  source: string;
};
export type Program = {
  instructions: Instruction[];
  labels: Record<string, number>;
  dataLabels: Record<string, number>;
  memory: Record<number, number>;
  strings: Record<number, string>;
  source: string;
};
export type Branch = {
  line: number;
  condition: string;
  taken: boolean;
  target: string;
};
export type State = {
  regs: number[];
  memory: Record<number, number>;
  pc: number;
  hi: number;
  lo: number;
  output: string;
  inputIndex: number;
  halted: boolean;
  error: string;
  warning: string;
  changed: number[];
  branch: Branch | null;
  executedLine: number | null;
  steps: number;
};
export function parse(source: string): Program {
  const p: Program = {
    instructions: [],
    labels: {},
    dataLabels: {},
    memory: {},
    strings: {},
    source,
  };
  let section = "text",
    address = DATA_BASE;
  source.split("\n").forEach((raw, line) => {
    let text = raw.replace(/#(?=(?:[^"]*"[^"]*")*[^"]*$).*$/, "").trim();
    if (!text) return;
    if (text === ".data") {
      section = "data";
      return;
    }
    if (text === ".text") {
      section = "text";
      return;
    }
    if (/^\.(globl|global)\b/.test(text)) return;
    const label = text.match(/^([A-Za-z_]\w*):/);
    if (label) {
      if (label[1] in p.labels || label[1] in p.dataLabels)
        throw Error(`Қайталанған белгі: ${label[1]}`);
      if (section === "text") p.labels[label[1]] = p.instructions.length;
      else p.dataLabels[label[1]] = address;
      text = text.slice(label[0].length).trim();
      if (!text) return;
    }
    if (section === "data") {
      if (text.startsWith(".asciiz")) {
        const s = JSON.parse(text.slice(7).trim()) as string;
        p.strings[address] = s;
        address += new TextEncoder().encode(s).length + 1;
      } else if (text.startsWith(".word")) {
        if (address % 4)
          throw Error(`${line + 1}-жол: .word алдында .align 2 қажет`);
        text
          .slice(5)
          .trim()
          .split(/[,\s]+/)
          .forEach((x) => {
            p.memory[address] = integer(x);
            address += 4;
          });
      } else if (text.startsWith(".align")) {
        const n = 2 ** Number(text.slice(6));
        address = Math.ceil(address / n) * n;
      } else if (text.startsWith(".space")) address += Number(text.slice(6));
      else throw Error(`${line + 1}-жол: қолдау жоқ директива`);
    } else {
      if (text.startsWith("."))
        throw Error(`${line + 1}-жол: қолдау жоқ директива`);
      const [op, ...tail] = text.split(/\s+/);
      p.instructions.push({
        op: op.toLowerCase(),
        args: tail
          .join(" ")
          .split(/[,\s]+/)
          .filter(Boolean),
        line,
        source: text,
      });
    }
  });
  return p;
}
export function integer(x: string | number): number {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isInteger(n) || n < -2147483648 || n > 4294967295)
    throw Error("32 биттік бүтін сан қажет");
  return n | 0;
}
export function initial(p: Program, regs: Record<string, number> = {}): State {
  const s: State = {
    regs: Array(32).fill(0),
    memory: { ...p.memory },
    pc: 0,
    hi: 0,
    lo: 0,
    output: "",
    inputIndex: 0,
    halted: false,
    error: "",
    warning: "",
    changed: [],
    branch: null,
    executedLine: null,
    steps: 0,
  };
  s.regs[29] = 0x7fffeffc;
  for (const [r, v] of Object.entries(regs)) s.regs[regIndex(r)] = integer(v);
  s.regs[0] = 0;
  return s;
}
function regIndex(r: string) {
  const n = registerNames.indexOf(r);
  if (n >= 0) return n;
  if (/^\$\d+$/.test(r) && Number(r.slice(1)) < 32) return Number(r.slice(1));
  throw Error(`Белгісіз регистр: ${r}`);
}
export function step(p: Program, prev: State, inputs: number[] = []): State {
  if (prev.halted) return prev;
  const s: State = {
    ...prev,
    regs: [...prev.regs],
    memory: { ...prev.memory },
    changed: [],
    branch: null,
    warning: "",
  };
  const ins = p.instructions[s.pc];
  if (!ins) {
    s.halted = true;
    return s;
  }
  s.executedLine = ins.line;
  s.pc++;
  s.steps++;
  const a = ins.args,
    get = (r: string) => s.regs[regIndex(r)],
    val = (x: string) => (x.startsWith("$") ? get(x) : integer(x));
  const put = (r: string, v: number) => {
    const i = regIndex(r);
    if (i !== 0) {
      s.regs[i] = v | 0;
      if (s.regs[i] !== prev.regs[i]) s.changed.push(i);
    }
  };
  const immediate = (x: string, min: number, max: number) => {
    const n = Number(x);
    if (!Number.isInteger(n) || n < min || n > max)
      throw Error(`Immediate ${min}…${max} аралығында болуы тиіс`);
    return n;
  };
  const checked = (v: number) => {
    if (v > 2147483647 || v < -2147483648)
      throw Error(
        "Таңбалы 32 биттік overflow: нәтиже диапазоннан шықты. Регистр өзгермеді.",
      );
    return v;
  };
  const jump = (label: string) => {
    if (!(label in p.labels)) throw Error(`Белгі табылмады: ${label}`);
    s.pc = p.labels[label];
  };
  const branch = (condition: boolean) => {
    s.branch = {
      line: ins.line,
      condition: ins.source,
      taken: condition,
      target: a[a.length - 1],
    };
    if (condition) jump(a[a.length - 1]);
  };
  const address = (arg: string) => {
    const m = arg.match(/^(-?(?:0x[0-9a-f]+|\d+))\((\$\w+)\)$/i);
    const addr = m
      ? (get(m[2]) + immediate(m[1], -32768, 32767)) >>> 0
      : p.dataLabels[arg];
    if (addr === undefined) throw Error(`Қате адрес: ${arg}`);
    if (addr % 4) throw Error("lw/sw: адрес 4 байтқа туралануы тиіс");
    if (addr < DATA_BASE || addr >= DATA_BASE + 65536)
      throw Error("Оқу моделінің деректер жады шегінен тыс адрес");
    return addr;
  };
  try {
    const counts: Record<string, number> = {
      li: 2,
      la: 2,
      move: 2,
      add: 3,
      addu: 3,
      addi: 3,
      addiu: 3,
      sub: 3,
      subu: 3,
      mul: 3,
      mult: 2,
      div: 2,
      mflo: 1,
      mfhi: 1,
      slt: 3,
      slti: 3,
      and: 3,
      or: 3,
      xor: 3,
      andi: 3,
      ori: 3,
      sll: 3,
      srl: 3,
      lw: 2,
      sw: 2,
      beq: 3,
      bne: 3,
      bge: 3,
      bgt: 3,
      ble: 3,
      blt: 3,
      bgez: 2,
      bltz: 2,
      j: 1,
      nop: 0,
      syscall: 0,
    };
    if (!(ins.op in counts)) throw Error(`Қолдау жоқ команда: ${ins.op}`);
    if (a.length !== counts[ins.op])
      throw Error(`${ins.op}: ${counts[ins.op]} аргумент қажет`);
    switch (ins.op) {
      case "li":
        put(a[0], integer(a[1]));
        break;
      case "la":
        if (!(a[1] in p.dataLabels)) throw Error(`Дерек белгісі жоқ: ${a[1]}`);
        put(a[0], p.dataLabels[a[1]]);
        break;
      case "move":
        put(a[0], get(a[1]));
        break;
      case "add":
        put(a[0], checked(get(a[1]) + get(a[2])));
        break;
      case "addi":
        put(a[0], checked(get(a[1]) + immediate(a[2], -32768, 32767)));
        break;
      case "addu":
        put(a[0], get(a[1]) + get(a[2]));
        break;
      case "addiu":
        put(a[0], get(a[1]) + immediate(a[2], -32768, 32767));
        break;
      case "sub":
        put(a[0], checked(get(a[1]) - get(a[2])));
        break;
      case "subu":
        put(a[0], get(a[1]) - get(a[2]));
        break;
      case "mul": {
        const product = BigInt(get(a[1])) * BigInt(get(a[2]));
        put(a[0], Number(BigInt.asIntN(32, product)));
        if (product !== BigInt(get(a[0])))
          s.warning = "MUL: көбейтіндінің тек төменгі 32 биті сақталды.";
        break;
      }
      case "mult": {
        const r = BigInt(get(a[0])) * BigInt(get(a[1]));
        s.lo = Number(BigInt.asIntN(32, r));
        s.hi = Number(BigInt.asIntN(32, r >> 32n));
        break;
      }
      case "div": {
        const x = get(a[0]),
          y = get(a[1]);
        if (y === 0) throw Error("Нөлге бөлуге болмайды");
        s.lo = Math.trunc(x / y) | 0;
        s.hi = (x % y) | 0;
        if (x === -2147483648 && y === -1)
          s.warning =
            "INT_MIN / −1: математикалық бөлінді сыймайды. Бұл оқу моделі LO = INT_MIN, HI = 0 деп белгілейді; нақты ISA нәтижесіне кепілдік жоқ.";
        break;
      }
      case "mflo":
        put(a[0], s.lo);
        break;
      case "mfhi":
        put(a[0], s.hi);
        break;
      case "slt":
        put(a[0], get(a[1]) < get(a[2]) ? 1 : 0);
        break;
      case "slti":
        put(a[0], get(a[1]) < immediate(a[2], -32768, 32767) ? 1 : 0);
        break;
      case "and":
        put(a[0], get(a[1]) & get(a[2]));
        break;
      case "andi":
        put(a[0], get(a[1]) & immediate(a[2], 0, 65535));
        break;
      case "or":
        put(a[0], get(a[1]) | get(a[2]));
        break;
      case "ori":
        put(a[0], get(a[1]) | immediate(a[2], 0, 65535));
        break;
      case "xor":
        put(a[0], get(a[1]) ^ get(a[2]));
        break;
      case "sll":
        put(a[0], get(a[1]) << immediate(a[2], 0, 31));
        break;
      case "srl":
        put(a[0], get(a[1]) >>> immediate(a[2], 0, 31));
        break;
      case "lw": {
        const addr = address(a[1]);
        if (!(addr in s.memory))
          throw Error("Бұл адрестегі сөз инициализацияланбаған");
        put(a[0], s.memory[addr]);
        break;
      }
      case "sw":
        s.memory[address(a[1])] = get(a[0]);
        break;
      case "beq":
        branch(get(a[0]) === val(a[1]));
        break;
      case "bne":
        branch(get(a[0]) !== val(a[1]));
        break;
      case "bge":
        branch(get(a[0]) >= val(a[1]));
        break;
      case "bgt":
        branch(get(a[0]) > val(a[1]));
        break;
      case "ble":
        branch(get(a[0]) <= val(a[1]));
        break;
      case "blt":
        branch(get(a[0]) < val(a[1]));
        break;
      case "bgez":
        branch(get(a[0]) >= 0);
        break;
      case "bltz":
        branch(get(a[0]) < 0);
        break;
      case "j":
        jump(a[0]);
        break;
      case "syscall":
        switch (get("$v0")) {
          case 1:
            s.output += String(get("$a0"));
            break;
          case 4: {
            const str = p.strings[get("$a0") >>> 0];
            if (str === undefined) throw Error("Жол адресі табылмады");
            s.output += str;
            break;
          }
          case 5:
            if (s.inputIndex >= inputs.length)
              throw Error("Енгізу кезегінде сан жоқ");
            put("$v0", integer(inputs[s.inputIndex++]));
            break;
          case 10:
            s.halted = true;
            break;
          case 11:
            s.output += String.fromCharCode(get("$a0") & 255);
            break;
          default:
            throw Error(`Қолдау жоқ syscall: ${get("$v0")}`);
        }
        break;
    }
  } catch (e) {
    s.error = `${ins.line + 1}-жол: ${(e as Error).message}`;
    s.halted = true;
  }
  s.regs[0] = 0;
  if (s.pc >= p.instructions.length) s.halted = true;
  return s;
}
export function execute(
  source: string,
  inputs: number[] = [],
  regs: Record<string, number> = {},
  limit = 10000,
) {
  const p = parse(source),
    trace = [initial(p, regs)];
  while (!trace.at(-1)!.halted && trace.length <= limit)
    trace.push(step(p, trace.at(-1)!, inputs));
  if (!trace.at(-1)!.halted)
    trace.push({
      ...trace.at(-1)!,
      error: "Қадам шегі: ықтимал шексіз цикл",
      halted: true,
    });
  return { program: p, trace };
}
export function format(n: number, base: "DEC" | "HEX" | "BIN" = "DEC") {
  return base === "DEC"
    ? String(n | 0)
    : base === "HEX"
      ? "0x" + (n >>> 0).toString(16).padStart(8, "0")
      : (n >>> 0).toString(2).padStart(32, "0");
}
