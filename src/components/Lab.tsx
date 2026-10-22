import { useGuidedDemo } from "./useGuidedDemo";
import { ExecutionFlow } from "./ExecutionFlow";
import { IntegerInput } from "./IntegerInput";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  Upload,
  ArrowRight,
  Check,
  Code2,
  ChevronDown,
  Terminal,
  Braces,
} from "lucide-react";
import { tasks } from "../content/programs";
import { execute, format, registerNames, TEXT_BASE } from "../model/mips";
import { download, downloadAll } from "../model/download";
import { Controls } from "./Controls";
import { usePlayback } from "./usePlayback";
import { LabVisual } from "./LabVisual";
import "./lab-workspace.css";

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
      <div className="lab-navigation">
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
              <span>{String(t.id).padStart(2, "0")}</span>
              {t.short}
            </button>
          ))}
        </div>
        <button className="archive" onClick={downloadAll}>
          <Download size={19} />5 .asm архиві
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
  const introduction = [
    "Үш санды енгіз. Ең үлкенін, ең кішісін және тең жұптарын анықта.",
    "Бағаны енгіз. Процессор сәйкес әріпті таңдасын.",
    "x мәнін өзгерт. Таңдалған формула мен нәтижені графиктен көр.",
    "Айды таңда. Шарттардың оны қай мезгілге жеткізетінін бақыла.",
    "Екі сан мен амалды таңда. Нәтиженің қалай алынатынын бақыла.",
  ][id - 1];
  const [values, setValues] = useState(task.inputs.map((i) => i.value)),
    [code, setCode] = useState(task.code),
    [edit, setEdit] = useState(false),
    [base, setBase] = useState<"DEC" | "HEX" | "BIN">("DEC"),
    [message, setMessage] = useState(""),
    [inspectorOpen, setInspectorOpen] = useState(false);
  const sourceView = useRef<HTMLDivElement>(null),
    file = useRef<HTMLInputElement>(null);
  const execution = useMemo(() => {
    try {
      return { ...execute(code, values, {}, 2000), error: "" };
    } catch (e) {
      return { trace: [], program: null, error: (e as Error).message };
    }
  }, [code, values]);
  const max = Math.max(0, execution.trace.length - 1),
    play = usePlayback(max),
    state = execution.trace[Math.min(play.index, execution.trace.length - 1)],
    finished = !!state?.halted;
  useGuidedDemo(play, max, demo, onComplete);
  useEffect(() => {
    const el = sourceView.current,
      line = el?.querySelector(".executing");
    if (el && line && inspectorOpen) {
      const a = el.getBoundingClientRect(),
        b = line.getBoundingClientRect();
      if (b.top < a.top || b.bottom > a.bottom)
        el.scrollTop += b.top - a.top - el.clientHeight / 2;
    }
  }, [play.index, edit, inspectorOpen]);
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
  const history = execution.trace.slice(0, play.index + 1),
    branches = history.flatMap((s) => (s.branch ? [s.branch] : [])),
    warnings = [...new Set(history.map((s) => s.warning).filter(Boolean))];
  const ready =
    finished ||
    history.some(
      (s) => s.steps > 0 && s.pc === execution.program?.labels.output,
    );
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Код көшірілді");
    } catch {
      setEdit(true);
      setMessage("Кодты редактордан көшіріңіз: Ctrl+A, Ctrl+C");
    }
  }
  const currentText =
    execution.error ||
    state?.error ||
    (state?.steps === 0
      ? "Мәндерді өзгертіп, есепті орындаңыз."
      : state?.halted
        ? "Бағдарлама аяқталды."
        : state?.branch
          ? `${state.branch.condition} → ${state.branch.taken ? "тармақ алынды" : "келесі жол"}`
          : `${code.split("\n")[state?.executedLine ?? 0]?.trim()}`);
  return (
    <div
      className="lab-workspace"
      ref={play.viewportRef}
      data-in-view={play.inView}
    >
      <div className="lab-left panel task-panel">
        <div className="task-heading">
          <div>
            <span className="task-step">Тәжірибе {id}</span>
            <h3>{task.title}</h3>
          </div>
          <span className={`task-state ${finished ? "done" : ""}`}>
            {state?.error
              ? "Қате"
              : finished
                ? "Дайын"
                : play.playing
                  ? "Орындалуда"
                  : "Зерттеп көр"}
          </span>
        </div>
        <p className="task-description">{introduction}</p>
        <div className="task-input-strip">
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
          <button
            className="finish-shortcut"
            disabled={!state}
            onClick={() => {
              play.setPlaying(false);
              play.setIndex(max);
            }}
          >
            Нәтижеге өту
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="lab-run-actions">
          <Controls
            {...play}
            max={max}
            startLabel="Есепті орындау"
            pauseLabel="Орындауды кідірту"
          />
        </div>
        <div
          className={`lab-stage ${play.playing ? "playing" : ""} ${finished && !state?.error ? "finished" : ""}`}
        >
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
                ready={ready}
                started={play.index > 0}
                onValue={(i, v) => value(i, v, true)}
              />
            )
          )}
        </div>
        {state && execution.program && (
          <ExecutionFlow
            program={execution.program}
            state={state}
            playing={play.playing}
          />
        )}
        {(state?.error || warnings.length > 0) && (
          <div className="lab-alerts">
            {state?.error && (
              <p className="error" role="alert">
                {state.error}
              </p>
            )}
            {warnings.map((w) => (
              <p className="warning" key={w}>
                {w}
              </p>
            ))}
          </div>
        )}
      </div>
      <details
        className="lab-inspector panel"
        open={inspectorOpen}
        onToggle={(e) => setInspectorOpen(e.currentTarget.open)}
      >
        <summary>
          <span>
            <Code2 size={22} />
            Код пен регистрлер
          </span>
          <ChevronDown size={22} />
        </summary>
        <div className="inspector-content lab-right">
          <div className="code-panel panel">
            <div className="panel-top">
              <span className="file-title">
                <Braces size={19} />
                task_0{id}.asm
              </span>
              <div className="icon-actions">
                <button
                  title="Кодты өңдеу"
                  aria-label="Кодты өңдеу"
                  onClick={() => setEdit(!edit)}
                >
                  <Code2 size={20} />
                </button>
                <button
                  title="Кодты көшіру"
                  aria-label="Кодты көшіру"
                  onClick={copy}
                >
                  {message === "Код көшірілді" ? (
                    <Check size={20} />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
                <button
                  title="ASM жүктеу"
                  aria-label="ASM жүктеу"
                  onClick={() => download(code, `mips-lab-${id}.asm`)}
                >
                  <Download size={20} />
                </button>
                <button
                  title="ASM файлын ашу"
                  aria-label="ASM файлын ашу"
                  onClick={() => file.current?.click()}
                >
                  <Upload size={20} />
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
                    setInspectorOpen(true);
                    setMessage("Файл ашылды");
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
          </div>
          <div className="machine-state panel">
            <div className="panel-top">
              <h4>Регистрлер</h4>
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
              <summary>
                Барлық регистрлер мен жад
                <ChevronDown size={18} />
              </summary>
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
              <p className="mono machine-special">
                HI {format(state?.hi ?? 0, base)} · LO{" "}
                {format(state?.lo ?? 0, base)}
                <br />
                PC {format(TEXT_BASE + (state?.pc ?? 0) * 4, "HEX")}
              </p>
              {Object.entries(state?.memory ?? {}).map(([a, v]) => (
                <p className="mono machine-special" key={a}>
                  [{format(Number(a), "HEX")}] = {format(v, base)}
                </p>
              ))}
            </details>
          </div>
          <div className="console-branches">
            <div className="console panel">
              <h4>
                <Terminal size={20} />
                Консоль
              </h4>
              <pre aria-live="polite">
                {state?.output || "› Нәтиже күтілуде…"}
              </pre>
            </div>
            <div className="branch-log panel">
              <h4>
                <Code2 size={20} />
                Шарттар
              </h4>
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
          <div className="now lab-now">
            <h4>Қазір не болып жатыр?</h4>
            <p aria-live="polite">{currentText}</p>
          </div>
        </div>
      </details>
    </div>
  );
}
