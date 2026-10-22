import type { Program, State } from "../model/mips";
import { TEXT_BASE, format, registerNames } from "../model/mips";
export function ExecutionFlow({
  program,
  state,
  playing,
}: {
  program: Program;
  state: State;
  playing: boolean;
}) {
  const ins = program.instructions.find((i) => i.line === state.executedLine);
  const op = ins?.op || "",
    branch = state.branch;
  const reads = (r: string) =>
    r.startsWith("$") ? (state.regs[registerNames.indexOf(r)] ?? r) : r;
  const isMath = [
    "add",
    "addi",
    "addu",
    "addiu",
    "sub",
    "subu",
    "mul",
    "mult",
    "div",
    "slt",
    "slti",
    "and",
    "or",
    "xor",
    "andi",
    "ori",
    "sll",
    "srl",
  ].includes(op);
  const nodes = [
    ["PC", format(TEXT_BASE + state.pc * 4, "HEX"), !!ins],
    ["Команда", op || "Дайын", !!ins],
    [
      "Регистрлер",
      `$t0=${state.regs[8]} · $t1=${state.regs[9]}`,
      !!ins && op !== "j",
    ],
    [
      "ALU / шарт",
      branch
        ? branch.taken
          ? "Ақиқат ↗"
          : "Жалған ↓"
        : isMath
          ? "Есептеу"
          : op === "lw" || op === "sw"
            ? "Адрес"
            : "—",
      !!branch || isMath || op === "lw" || op === "sw",
    ],
    [
      "Күйді жаңарту",
      op === "sw"
        ? "Жадқа жазу"
        : op === "syscall"
          ? "Енгізу / шығару"
          : branch
            ? "Келесі PC"
            : state.changed.map((i) => registerNames[i]).join(", ") || "—",
      !!ins,
    ],
  ];
  return (
    <div
      className={`execution-flow ${playing ? "running" : ""}`}
      aria-label="Зертхананың жұмыс істеп жатқан процессоры"
    >
      <div className="flow-heading">
        <span className="eyebrow">
          <i className="status-dot" />
          ОҚУ ПРОЦЕССОРЫ
        </span>
        <span>
          {state.halted
            ? "Аяқталды"
            : playing
              ? "Автоматты орындалуда"
              : state.steps
                ? "Кідіртілді"
                : "Дайын"}
        </span>
      </div>
      <div className="flow-nodes">
        {nodes.map(([name, value, lit], i) => (
          <div className={lit ? "lit" : ""} key={name as string}>
            <small>{name}</small>
            <strong key={state.steps}>{value}</strong>
            {i < 4 && <b aria-hidden="true">→</b>}
          </div>
        ))}
      </div>
      <p aria-live="off">
        {branch
          ? `${ins!.args.slice(0, -1).map(reads).join(" · ")} → ${branch.condition} → ${branch.taken ? "белгіге өту: " + branch.target : "келесі команда"}`
          : ins
            ? ins.source
            : "Бір рет «Есепті орындау» басыңыз. Әр қадам өзі жалғасады."}
      </p>
      <small>
        Бастапқы код деңгейіндегі күй. Бұл көріністегі қадам аппараттық такт
        емес.
      </small>
    </div>
  );
}
