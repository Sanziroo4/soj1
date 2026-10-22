import { useGuidedDemo } from "./useGuidedDemo";
import { ExecutionFlow } from "./ExecutionFlow";
import { IntegerInput } from "./IntegerInput";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Upload, ArrowRight, Check, Code2 } from "lucide-react";
import { tasks, supported } from "../content/programs";
import { execute, format, registerNames, TEXT_BASE } from "../model/mips";
import { download, downloadAll } from "../model/download";
import { Controls } from "./Controls";
import { usePlayback } from "./usePlayback";
import { LabVisual } from "./LabVisual";
export function Lab({
  selectedId: id,
  onSelect: setId,
  demo = false,
  onComplete,
}: {
  selectedId: number;
  onSelect: (id: number) => void;
  demo?: boolean;
  onComplete?: () => void;
}) {
  return (
    <>
      <div
        className="task-tabs"
        role="tablist"
        aria-label="Зертханалық тапсырмалар"
      >
        {tasks.map((t) => (
          <button
            role="tab"
            aria-selected={id === t.id}
            className={id === t.id ? "active" : ""}
            onClick={() => setId(t.id)}
            key={t.id}
          >
            <span>0{t.id}</span>
            {t.short}
          </button>
        ))}
        <button className="archive" onClick={downloadAll}>
          <Download size={16} />5 .asm архиві
        </button>
      </div>
      <LabTask key={id} id={id} demo={demo} onComplete={onComplete} />
    </>
  );
}
function LabTask({
  id,
  demo = false,
  onComplete,
}: {
  id: number;
  demo?: boolean;
  onComplete?: () => void;
}) {
  const task = tasks[id - 1];
  const [values, setValues] = useState(task.inputs.map((i) => i.value)),
    [code, setCode] = useState(task.code),
    [edit, setEdit] = useState(false),
    [base, setBase] = useState<"DEC" | "HEX" | "BIN">("DEC"),
    [message, setMessage] = useState("");
  const sourceView = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const execution = useMemo(() => {
    try {
      return { ...execute(code, values, {}, 2000), error: "" };
    } catch (e) {
      return { trace: [], program: null, error: (e as Error).message };
    }
  }, [code, values]);
  const play = usePlayback(Math.max(0, execution.trace.length - 1)),
    state = execution.trace[Math.min(play.index, execution.trace.length - 1)],
    finished = !!state?.halted;
  useGuidedDemo(
    play,
    Math.max(0, execution.trace.length - 1),
    demo,
    onComplete,
  );
  useEffect(() => {
    const el = sourceView.current,
      line = el?.querySelector(".executing");
    if (el && line) {
      const a = el.getBoundingClientRect(),
        b = line.getBoundingClientRect();
      if (b.top < a.top || b.bottom > a.bottom)
        el.scrollTop += b.top - a.top - el.clientHeight / 2;
    }
  }, [play.index, edit]);
  function reset() {
    play.setIndex(0);
    play.setPlaying(false);
    setMessage("");
  }
  function value(i: number, v: number, auto = false) {
    if (!Number.isInteger(v) || v < -2147483648 || v > 2147483647) return;
    setValues((a) => a.map((n, j) => (i === j ? v : n)));
    reset();
    if (auto) play.setPlaying(true);
  }
  const branches = execution.trace
    .slice(0, play.index + 1)
    .flatMap((s) => (s.branch ? [s.branch] : []));
  const warnings = [
    ...new Set(
      execution.trace
        .slice(0, play.index + 1)
        .map((s) => s.warning)
        .filter(Boolean),
    ),
  ];
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Код көшірілді");
    } catch {
      setEdit(true);
      setMessage("Кодты редактордан Ctrl+A, Ctrl+C арқылы көшіріңіз");
    }
  }
  return (
    <div
      className="lab-workspace"
      ref={play.viewportRef}
      data-in-view={play.inView}
    >
      <div className="lab-left">
        <div className="panel task-panel">
          <span className="eyebrow">ТАПСЫРМА 0{id} / 05</span>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <div className="lab-inputs">
            {task.inputs.map((x, i) => (
              <label key={x.name}>
                {x.name}
                {id === 5 && i === 2 ? (
                  <select
                    aria-label="Амал"
                    value={values[i]}
                    onChange={(e) => value(i, Number(e.target.value))}
                  >
                    {["+", "−", "×", "÷"].map((v, j) => (
                      <option key={v} value={j + 1}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <IntegerInput
                    label={`Зертхана ${x.name}`}
                    value={values[i]}
                    onDirty={reset}
                    onChange={(v) => value(i, v)}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="lab-run-actions">
            <button
              className="primary"
              disabled={!state}
              onClick={() =>
                play.playing ? play.setPlaying(false) : play.start()
              }
            >
              {play.playing ? "Орындауды кідірту" : "Есепті орындау"}
            </button>
            <span>
              {state?.halted
                ? "✓ Аяқталды"
                : play.playing
                  ? "● Автоматты орындалуда"
                  : "Мәнді енгізіп, орындаңыз"}
            </span>
          </div>
          {state && execution.program && (
            <ExecutionFlow
              program={execution.program}
              state={state}
              playing={play.playing}
            />
          )}
          {execution.error ? (
            <p role="alert" className="error">
              {execution.error}
            </p>
          ) : (
            state && (
              <LabVisual
                id={id}
                values={values}
                state={state}
                finished={finished}
                ready={
                  finished ||
                  execution.trace
                    .slice(0, play.index + 1)
                    .some(
                      (s) =>
                        s.steps > 0 &&
                        s.pc === execution.program?.labels.output,
                    )
                }
                started={play.index > 0}
                onValue={(i, v) => value(i, v, true)}
              />
            )
          )}
          <button
            className="text-button"
            onClick={() => {
              play.setPlaying(false);
              play.setIndex(execution.trace.length - 1);
            }}
            disabled={!state}
          >
            Нәтижеге өту <ArrowRight size={16} />
          </button>
        </div>
        <div className="panel now lab-now">
          <span className="eyebrow">ҚАЗІР НЕ БОЛЫП ЖАТЫР?</span>
          <p aria-live="polite">
            {execution.error ||
              state?.error ||
              (state?.steps === 0
                ? "Енгізілген сандар syscall 5 арқылы ретімен оқылады. «Есепті орындау» батырмасын бір рет басыңыз."
                : state?.halted
                  ? "Бағдарлама аяқталды. Нәтижені, регистрлерді және консольді салыстырыңыз."
                  : state?.branch
                    ? `${state.branch.condition} → ${state.branch.taken ? "тармақ алынды" : "келесі жол"}`
                    : `Орындалды: ${code.split("\n")[state?.executedLine ?? 0]?.trim()}`)}
          </p>
          {warnings.map((w) => (
            <p className="warning" key={w}>
              {w}
            </p>
          ))}
          <small>
            Бұл — бастапқы код деңгейіндегі қадамдар. Псевдокомандалар бір қадам
            ретінде орындалады; қадам саны аппараттық команда не такт саны емес.
          </small>
        </div>
      </div>
      <div className="lab-right">
        <div className="panel code-panel">
          <div className="panel-top">
            <span className="file-title">
              <i className="status-dot" />
              task_0{id}.asm <small>MIPS</small>
            </span>
            <div className="icon-actions">
              <button
                title="Кодты өңдеу"
                aria-label="Кодты өңдеу"
                onClick={() => setEdit(!edit)}
              >
                <Code2 size={16} />
              </button>
              <button
                title="Кодты көшіру"
                aria-label="Кодты көшіру"
                onClick={copy}
              >
                {message === "Код көшірілді" ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
              </button>
              <button
                title="ASM жүктеу"
                aria-label="ASM жүктеу"
                onClick={() => download(code, `mips-lab-${id}.asm`)}
              >
                <Download size={16} />
              </button>
              <button
                title="ASM файлын ашу"
                aria-label="ASM файлын ашу"
                onClick={() => file.current?.click()}
              >
                <Upload size={16} />
              </button>
            </div>
            <input
              ref={file}
              hidden
              type="file"
              accept=".asm,.s,.txt"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 100000) {
                    setMessage("Файл 100 КБ-тан кіші болуы тиіс");
                    return;
                  }
                  setCode(await f.text());
                  reset();
                  setMessage(
                    "Файл ашылды. Визуал тапсырма регистрлерінің келісіміне сүйенеді.",
                  );
                  e.target.value = "";
                }
              }}
            />
          </div>
          {message && (
            <div className="inline-message" role="status">
              {message}
            </div>
          )}
          {edit ? (
            <div className="editor-wrap">
              <label htmlFor={`editor-${id}`}>MIPS код редакторы</label>
              <textarea
                id={`editor-${id}`}
                className="code-editor"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  reset();
                }}
              />
              <button
                onClick={() => {
                  setCode(task.code);
                  reset();
                }}
              >
                Бастапқы кодты қайтару
              </button>
              <small>
                Өз кодыңыз үшін консоль, регистрлер және жад негізгі нәтиже
                болады. Тапсырма визуалы $s0–$s3 келісімін қолданады.
              </small>
            </div>
          ) : (
            <div
              ref={sourceView}
              className="source-code"
              tabIndex={0}
              aria-label="MIPS бастапқы коды"
            >
              {code.split("\n").map((line, i) => (
                <div
                  key={i}
                  className={`code-line ${state?.executedLine === i ? "executing" : ""}`}
                >
                  <span className="line-number">{i + 1}</span>
                  <code
                    className={
                      line.trim().startsWith("#")
                        ? "comment"
                        : line.trim().endsWith(":")
                          ? "label-code"
                          : ""
                    }
                  >
                    {line || " "}
                  </code>
                  {state?.executedLine === i && (
                    <span className="line-arrow">←</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Controls {...play} max={Math.max(0, execution.trace.length - 1)} />
        </div>
        <div className="panel machine-state">
          <div className="panel-top">
            <span className="eyebrow">РЕГИСТРЛЕР · 32 BIT</span>
            <div className="base-switch">
              {(["DEC", "HEX", "BIN"] as const).map((b) => (
                <button
                  key={b}
                  className={base === b ? "active" : ""}
                  onClick={() => setBase(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="register-grid">
            {[
              "$zero",
              "$v0",
              "$a0",
              "$t0",
              "$t1",
              "$t2",
              "$s0",
              "$s1",
              "$s2",
              "$s3",
            ].map((r) => (
              <div
                key={r}
                className={
                  state?.changed.includes(registerNames.indexOf(r))
                    ? "changed"
                    : ""
                }
              >
                <code>{r}</code>
                <strong className="mono">
                  {format(state?.regs[registerNames.indexOf(r)] ?? 0, base)}
                </strong>
              </div>
            ))}
          </div>
          <details>
            <summary>Барлық 32 регистр, HI / LO және жад</summary>
            <div className="register-grid">
              {registerNames.map((r, i) => (
                <div key={r}>
                  <code>{r}</code>
                  <span className="mono">
                    {format(state?.regs[i] ?? 0, base)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mono">
              HI {format(state?.hi ?? 0, base)} · LO{" "}
              {format(state?.lo ?? 0, base)} · келесі PC{" "}
              {format(TEXT_BASE + (state?.pc ?? 0) * 4, "HEX")}
            </p>
            {Object.entries(state?.memory ?? {}).map(([a, v]) => (
              <p className="mono" key={a}>
                [{format(Number(a), "HEX")}] = {format(v, base)}
              </p>
            ))}
          </details>
          <small>
            DEC / HEX / BIN — бір санның әртүрлі жазылуы. Регистрдің биттері
            өзгермейді.
          </small>
        </div>
        <div className="console-branches">
          <div className="panel console">
            <span className="eyebrow">КОНСОЛЬ</span>
            <pre aria-live="polite">
              {state?.output || "› Нәтиже күтілуде…"}
            </pre>
            {state?.error && (
              <p className="error" role="alert">
                {state.error}
              </p>
            )}
          </div>
          <div className="panel branch-log">
            <span className="eyebrow">ШАРТТАР ЖУРНАЛЫ</span>
            <div>
              {branches.length ? (
                branches.map((b, i) => (
                  <p key={i}>
                    <code>
                      L{b.line + 1} {b.condition}
                    </code>
                    <span className={b.taken ? "lime" : "dim"}>
                      {b.taken ? "↗ Тармақ" : "↓ Келесі"}
                    </span>
                  </p>
                ))
              ) : (
                <p className="dim">Шарт әлі орындалмады.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <details className="panel interpreter-help">
        <summary>Оқу интерпретаторының мүмкіндіктері мен шектеулері</summary>
        <p>
          Қолдау: <code>{supported}</code>. Syscall: 1 — бүтін сан шығару, 4 —
          жол шығару, 5 — бүтін сан енгізу, 10 — тоқтау, 11 — таңба шығару.
        </p>
        <p>
          .data, .text, .globl, .asciiz, .word, .space, .align. lw/sw: 4 байтқа
          тураланған, 64 КиБ деректер аймағындағы сөздер. Бастапқы PC =
          0x00400000, деректер = 0x10010000. Командалар бастапқы код индексімен
          модельденеді; псевдокомандалар ашылмайды.
        </p>
        <p>
          Delayed branching өшірулі. Ерекшеліктер, бинарлық кодтау, FPU, branch
          delay slot, ОС, кэш және толық MIPS ISA іске асырылмаған. Қауіпсіздік
          шегі: 2000 бастапқы код қадамы. $zero әрқашан 0. Жад пен барлық
          регистрлер кері қадамда қалпына келеді.
        </p>
        <p>
          Экспортталған код MARS үшін жазылған. Архивте бес бастапқы бағдарлама
          болады; жеке ASM батырмасы өңделген кодты жүктейді.
        </p>
      </details>
    </div>
  );
}
