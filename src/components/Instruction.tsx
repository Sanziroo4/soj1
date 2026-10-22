import "./processor-experience.css";
import { useGuidedDemo } from "./useGuidedDemo";
import { IntegerInput } from "./IntegerInput";
import { useMemo, useState } from "react";
import { Controls } from "./Controls";
import { usePlayback } from "./usePlayback";
import {
  execute,
  format,
  registerNames,
  DATA_BASE,
  TEXT_BASE,
} from "../model/mips";
import { stages } from "../model/pipeline";
type Op = "add" | "lw" | "sw" | "beq";
export function Instruction({
  demo = false,
  onComplete,
}: {
  demo?: boolean;
  onComplete?: () => void;
}) {
  const [op, setOp] = useState<Op>("add"),
    [a, setA] = useState(7),
    [b, setB] = useState(5),
    [memory, setMemory] = useState(42);
  const play = usePlayback(5);
  useGuidedDemo(play, 5, demo, onComplete);
  const reset = () => {
    play.setIndex(0);
    play.setPlaying(false);
  };
  const result = useMemo(
    () =>
      execute(
        `.data\nvalue: .word ${memory}\n.text\n${op === "add" ? "add $t2, $t0, $t1" : op === "lw" ? "lw $t2, 0($s0)" : op === "sw" ? "sw $t1, 0($s0)" : "beq $t0, $t1, equal"}\nnop\nequal:\nnop`,
        [],
        { $t0: a, $t1: b, $s0: DATA_BASE },
      ),
    [op, a, b, memory],
  );
  const initial = result.trace[0],
    after = result.trace[1],
    stage = play.index;
  const state =
    stage >= (op === "sw" ? 4 : op === "beq" ? 3 : 5) ? after : initial;
  const value = op === "add" ? after.regs[10] : op === "lw" ? memory : b;
  const descriptions = {
    add: [
      "PC = 0x00400000 → командалар жадынан add $t2, $t0, $t1 алынады.",
      `$t0 = ${a} және $t1 = ${b} регистрлерден оқылады. ALU осы екі мәнді алады.`,
      `ALU: ${a} + ${b} = ${after.error ? "overflow" : value}.`,
      "Бұл add командасы деректер жадын қолданбайды. Есептелген нәтиже әрі қарай беріледі.",
      after.error
        ? after.error
        : `$t2 ← ${value}. PC келесі команда адресіне өтеді.`,
    ],
    lw: [
      "PC бойынша lw $t2, 0($s0) командасы алынады.",
      `Базалық адрес $s0 = ${format(DATA_BASE, "HEX")}, offset = 0.`,
      `ALU адрес есептейді: ${format(DATA_BASE, "HEX")} + 0. Бұл 42 мәні емес, адрес.`,
      `Деректер жады оқылады: [0x10010000] = ${memory}.`,
      `$t2 ← ${memory}. Жадтан оқылған мән регистрге жазылды.`,
    ],
    sw: [
      "PC бойынша sw $t1, 0($s0) командасы алынады.",
      `$s0 = ${format(DATA_BASE, "HEX")}, жазылатын дерек $t1 = ${b}.`,
      "ALU адрес есептейді: 0x10010000 + 0.",
      `[0x10010000] ← ${b}. Деректер жадына жазылды.`,
      "sw регистрді өзгертпейді. Нәтиже жадта сақталды.",
    ],
    beq: [
      "PC бойынша beq $t0, $t1, equal командасы алынады.",
      `Салыстыру операндтары: $t0 = ${a}, $t1 = ${b}.`,
      `${a} = ${b} — ${a === b ? "ақиқат. Тармақ алынды → 0x00400008." : "жалған. Келесі команда → 0x00400004."}`,
      "beq деректер жадын қолданбайды.",
      "beq регистрге жазбайды. Орындалу бағыты EX кезеңінде анықталды.",
    ],
  };
  const activeParts =
    stage === 1
      ? ["PC", "Командалар жады"]
      : stage === 2
        ? ["Басқару блогы", "Регистрлер"]
        : stage === 3
          ? ["ALU", op === "beq" ? "PC" : "Нәтиже"]
          : stage === 4
            ? [op === "lw" || op === "sw" ? "Деректер жады" : "Өткізу"]
            : stage === 5
              ? [op === "add" || op === "lw" ? "Регистрлер" : "Жазу жоқ"]
              : [];
  return (
    <div className="instruction-experience">
      <div className="scenario-tabs">
        {(["add", "lw", "sw", "beq"] as Op[]).map((x) => (
          <button
            className={op === x ? "active" : ""}
            onClick={() => {
              setOp(x);
              reset();
              play.setPlaying(true);
            }}
            key={x}
          >
            <code>{x}</code>
            <span>
              {
                {
                  add: "Қосу",
                  lw: "Жадтан оқу",
                  sw: "Жадқа жазу",
                  beq: "Тармақталу",
                }[x]
              }
            </span>
          </button>
        ))}
      </div>
      <div
        className="instruction-grid"
        ref={play.viewportRef}
        data-in-view={play.inView}
      >
        <div className="panel execution">
          <div className="panel-top">
            <code className="lime">
              {result.program.instructions[0].source}
            </code>
            <span className="command-stage-count">{stage}/5</span>
          </div>
          <div className="operand-inputs">
            {(op === "add" || op === "beq") && (
              <label>
                $t0
                <IntegerInput
                  label="Команда t0"
                  value={a}
                  onDirty={reset}
                  onChange={(n) => {
                    setA(n);
                    reset();
                  }}
                />
              </label>
            )}
            {op !== "lw" && (
              <label>
                $t1
                <IntegerInput
                  label="Команда t1"
                  value={b}
                  onDirty={reset}
                  onChange={(n) => {
                    setB(n);
                    reset();
                  }}
                />
              </label>
            )}
            {op === "lw" && (
              <label>
                Жадтағы мән
                <IntegerInput
                  label="Команда жад мәні"
                  value={memory}
                  onDirty={reset}
                  onChange={(n) => {
                    setMemory(n);
                    reset();
                  }}
                />
              </label>
            )}
            {(op === "lw" || op === "sw") && (
              <div className="command-memory-address">
                <span>Жад адресі</span>
                <code>0x10010000</code>
              </div>
            )}
          </div>
          <div className="stage-track">
            {stages.map((s, i) => (
              <button
                key={s}
                className={
                  stage === i + 1 ? "current" : stage > i + 1 ? "done" : ""
                }
                onClick={() => {
                  play.setPlaying(false);
                  play.setIndex(i + 1);
                }}
              >
                <span>0{i + 1}</span>
                <strong>{s}</strong>
                <small>{["Алу", "Талдау", "Есептеу", "Жад", "Жазу"][i]}</small>
              </button>
            ))}
          </div>
          <div
            className={`instruction-arena operation-${op} arena-stage-${stage} ${after.error ? "arena-error" : ""}`}
          >
            <div className="arena-orbit" aria-hidden="true" />
            <div className="arena-orbit second" aria-hidden="true" />
            <svg
              className="arena-wires"
              viewBox="0 0 840 300"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className={stage >= 2 ? "active" : ""}
                d="M150 150 C250 150 240 150 335 150"
              />
              <path
                className={stage >= 3 ? "active" : ""}
                d="M505 150 C600 150 600 150 690 150"
              />
            </svg>
            <div className="data-flow">
              <div
                className={`arena-node source-node ${stage === 2 ? "lit" : ""}`}
              >
                <small>{op === "lw" ? "БАЗАЛЫҚ АДРЕС" : "РЕГИСТРЛЕР"}</small>
                <code className={op === "lw" ? "address-value" : ""}>
                  {op === "lw" ? (
                    "0x10010000"
                  ) : op === "sw" ? (
                    b
                  ) : (
                    <>
                      {a}
                      <span> · </span>
                      {b}
                    </>
                  )}
                </code>
              </div>
              <b aria-hidden="true">→</b>
              <div
                className={`arena-node alu-node ${stage === 3 ? "lit" : ""}`}
              >
                <small>{op === "beq" ? "САЛЫСТЫРУ" : "ALU"}</small>
                <code
                  className={op === "lw" || op === "sw" ? "address-value" : ""}
                >
                  {stage >= 3
                    ? op === "add"
                      ? after.error
                        ? "!"
                        : value
                      : op === "beq"
                        ? a === b
                          ? "="
                          : "≠"
                        : "0x10010000"
                    : "—"}
                </code>
                <span className="alu-symbol" aria-hidden="true">
                  {op === "add" ? "+" : op === "beq" ? "?" : "↗"}
                </span>
              </div>
              <b aria-hidden="true">→</b>
              <div
                className={`arena-node destination-node ${stage === 5 || (stage === 4 && (op === "sw" || op === "lw")) ? "lit" : ""}`}
              >
                <small>
                  {op === "sw" ? "ЖАД" : op === "beq" ? "КЕЛЕСІ PC" : "$t2"}
                </small>
                <code className={op === "beq" ? "address-value" : ""}>
                  {op === "beq"
                    ? format(TEXT_BASE + state.pc * 4, "HEX")
                    : op === "sw"
                      ? state.memory[DATA_BASE]
                      : state.regs[10]}
                </code>
              </div>
            </div>
            {stage > 0 && (
              <div
                key={`${op}-${stage}-${a}-${b}-${memory}`}
                className={`transfer-packet packet-stage-${stage}`}
                aria-hidden="true"
              >
                {stage === 1
                  ? "Команда"
                  : stage === 2
                    ? op === "lw"
                      ? "адрес"
                      : op === "sw"
                        ? b
                        : `${a} · ${b}`
                    : stage === 3
                      ? op === "add"
                        ? after.error
                          ? "!"
                          : value
                        : op === "beq"
                          ? a === b
                            ? "тең"
                            : "тең емес"
                          : "адрес"
                      : op === "lw"
                        ? memory
                        : op === "sw"
                          ? b
                          : op === "beq"
                            ? "PC"
                            : value}
              </div>
            )}
            {((stage === 5 && (op === "add" || op === "lw") && !after.error) ||
              (stage >= 4 && op === "sw") ||
              (stage >= 3 && op === "beq")) && (
              <div className="command-payoff" key={`${op}-${stage}`}>
                <span>
                  {op === "beq"
                    ? a === b
                      ? "Тармақ алынды"
                      : "Келесі команда"
                    : op === "sw"
                      ? "Жадқа жазылды"
                      : "Нәтиже дайын"}
                </span>
                {Array.from({ length: 8 }, (_, i) => (
                  <i
                    key={i}
                    style={
                      {
                        "--spark-angle": `${i * 45}deg`,
                      } as import("react").CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <Controls {...play} max={5} />
        </div>
        <aside className="panel now">
          <span className="command-context-label">Қазір не болып жатыр?</span>
          <h3>
            {stage
              ? `${stages[stage - 1]} · ${["Команданы алу", "Талдау", "Орындау", "Жад кезеңі", "Нәтижені жазу"][stage - 1]}`
              : "Бір команда. Бес кезең."}
          </h3>
          <p aria-live="polite">
            {stage
              ? descriptions[op][stage - 1]
              : "Бастау батырмасын басыңыз немесе кезеңді таңдаңыз. Нақты мәндердің қозғалысын бақылаңыз."}
          </p>
          <div className="active-parts">
            {activeParts.map((x) => (
              <span key={x}>
                <i className="status-dot" />
                {x}
              </span>
            ))}
          </div>
          <dl>
            <dt>$t2</dt>
            <dd className="mono lime">
              {state.regs[registerNames.indexOf("$t2")]}
            </dd>
            <dt>Жад [0x10010000]</dt>
            <dd className="mono">{state.memory[DATA_BASE]}</dd>
            <dt>Таңдалған келесі PC</dt>
            <dd className="mono">{format(TEXT_BASE + state.pc * 4, "HEX")}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
