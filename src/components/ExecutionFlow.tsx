import {
  ArrowRight,
  Check,
  Cpu,
  GitBranch,
  Database,
  Braces,
} from "lucide-react";
import type { Program, State } from "../model/mips";
import { registerNames } from "../model/mips";

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
  const get = (r: string) => {
    const n = registerNames.indexOf(r);
    return n >= 0
      ? state.regs[n]
      : /^\$\d+$/.test(r)
        ? state.regs[Number(r.slice(1))]
        : r;
  };
  const arithmetic = [
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
  const compared =
    branch && ins ? ins.args.slice(0, -1).map(get).join(" · ") : null;
  const action = state.error
    ? "Орындау тоқтады"
    : state.halted
      ? "Нәтиже дайын"
      : branch
        ? branch.taken
          ? "Тармақ алынды"
          : "Келесі команда"
        : op === "sw"
          ? "Жадқа жазу"
          : op === "lw"
            ? "Жадтан оқу"
            : op === "syscall"
              ? state.changed.includes(2)
                ? "Сан енгізілді"
                : state.output
                  ? "Нәтиже шығарылды"
                  : "Бағдарлама аяқталды"
              : arithmetic
                ? "Есептеу орындалды"
                : op === "j"
                  ? "Белгіге өту"
                  : state.changed.length
                    ? "Мән сақталды"
                    : "Команданы күту";
  const changed = state.changed
    .map((i) => `${registerNames[i]} = ${state.regs[i]}`)
    .join(" · ");
  const value =
    compared ||
    changed ||
    (state.steps
      ? `$t0 = ${state.regs[8]} · $t1 = ${state.regs[9]}`
      : "Мәндерді енгізіңіз");
  const actionIcon = branch ? (
    <GitBranch size={21} />
  ) : op === "lw" || op === "sw" ? (
    <Database size={21} />
  ) : state.halted ? (
    <Check size={21} />
  ) : (
    <Cpu size={21} />
  );
  return (
    <div
      className={`execution-flow ${playing ? "running" : ""} ${state.halted ? "complete" : ""}`}
      aria-label="Зертхананың жұмыс істеп жатқан процессоры"
    >
      <div className="flow-heading">
        <span>
          <i className="status-dot" />
          Процессор
        </span>
        <strong>
          {state.error
            ? "Қате"
            : state.halted
              ? "Аяқталды"
              : playing
                ? "Орындалуда"
                : state.steps
                  ? "Кідіртілді"
                  : "Дайын"}
        </strong>
      </div>
      <div className="flow-nodes">
        <div className={ins ? "lit" : ""}>
          <span>
            <Braces size={19} />
            Команда
          </span>
          <strong key={`op-${state.steps}`}>{op || "—"}</strong>
        </div>
        <ArrowRight className="flow-connector" aria-hidden="true" size={23} />
        <div className={state.steps ? "lit" : ""}>
          <span>Мәндер</span>
          <strong key={`value-${state.steps}`}>{value}</strong>
        </div>
        <ArrowRight className="flow-connector" aria-hidden="true" size={23} />
        <div className={state.steps ? "lit flow-action" : "flow-action"}>
          <span>
            {actionIcon}
            {branch ? "Шарт" : "Әрекет"}
          </span>
          <strong key={`action-${state.steps}`}>{action}</strong>
        </div>
      </div>
      {branch && (
        <p className={`flow-branch ${branch.taken ? "taken" : ""}`}>
          <GitBranch size={18} />
          <code>{branch.condition}</code>
          <span>{branch.taken ? `→ ${branch.target}` : "↓ келесі жол"}</span>
        </p>
      )}
    </div>
  );
}
