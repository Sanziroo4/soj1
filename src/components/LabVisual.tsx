import { useId, type CSSProperties } from "react";
import type { State } from "../model/mips";
import { registerNames } from "../model/mips";
import { seasons } from "../content/programs";
import "./lab-visuals.css";

type VisualProps = {
  id: number;
  values: number[];
  state: State;
  finished: boolean;
  ready: boolean;
  started: boolean;
  onValue: (i: number, v: number) => void;
};

function ResultBurst() {
  return (
    <div className="result-burst" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--burst-angle": `${i * 30}deg`,
              "--burst-distance": `${86 + (i % 3) * 24}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function BranchPulse({ state }: { state: State }) {
  const branch = state.branch;
  if (!branch)
    return (
      <div className="comparison-pulse idle">
        <span className="pulse-dot" />
        Мәндер регистрлерде өңделуде
      </div>
    );
  const [op, ...rest] = branch.condition.trim().split(/\s+/);
  const args = rest.join(" ").split(/[,\s]+/);
  const read = (value: string) =>
    value?.startsWith("$")
      ? (state.regs[registerNames.indexOf(value)] ?? value)
      : value;
  const symbols: Record<string, string> = {
    beq: "=",
    bne: "≠",
    bge: "≥",
    bgt: ">",
    ble: "≤",
    blt: "<",
  };
  return (
    <div
      className={`comparison-pulse ${branch.taken ? "yes" : "no"}`}
      key={`${branch.line}-${state.steps}`}
    >
      <span className="pulse-dot" />
      <span>
        {read(args[0])} {symbols[op] || op} {read(args[1])}
      </span>
      <b>{branch.taken ? "Ақиқат" : "Жалған"}</b>
    </div>
  );
}

export function LabVisual({
  id,
  values,
  state,
  finished,
  ready,
  started,
  onValue,
}: VisualProps) {
  const uniqueId = useId().replace(/:/g, "");
  const r = state.regs,
    valid = (ready || finished) && !state.error;
  const sceneClass = `lab-visual viz-scene ${valid ? "is-ready" : ""} ${started ? "has-started" : ""}`;
  if (id === 1) {
    const extent = Math.max(1, ...values.map(Math.abs));
    const compared: string[] = state.branch?.condition.match(/\$t[012]/g) || [];
    return (
      <div className={`${sceneClass} comparison-scene`}>
        <div className="pillar-stage" aria-label="Үш санның таңбалы салыстыруы">
          <div className="pillar-grid" aria-hidden="true" />
          <div className="pillar-zero">
            <span>0</span>
          </div>
          <div className="number-bars">
            {values.map((value, i) => (
              <div
                className={`bar-column ${compared.includes(`$t${i}`) ? "comparing" : ""} ${valid && value === r[16] ? "is-maximum" : ""}`}
                key={i}
              >
                <div className="pillar-value">
                  <b
                    style={
                      String(value).length > 7 ? { fontSize: 20 } : undefined
                    }
                  >
                    {value}
                  </b>
                  <span>{["a", "b", "c"][i]}</span>
                </div>
                <div className="bar-scale">
                  <span
                    className={`number-bar ${value < 0 ? "negative" : "positive"}`}
                    style={{
                      height: `${Math.max(value === 0 ? 0 : 1, (Math.abs(value) / extent) * 44)}%`,
                      bottom: value >= 0 ? "50%" : undefined,
                      top: value < 0 ? "50%" : undefined,
                    }}
                  >
                    <i />
                    <i />
                    <i />
                  </span>
                  {valid && value === r[16] && (
                    <span className="pillar-crown">Үлкені</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {valid ? (
          <div
            className="result-grid comparison-results"
            key={`${values.join(",")}-result`}
          >
            <span>
              Ең үлкені<strong>{r[16]}</strong>
            </span>
            <span>
              Ең кішісі<strong>{r[17]}</strong>
            </span>
            <span>
              a &lt; b &lt; c
              <strong className="word-result">
                {r[19] ? "Иә, өсу реті" : "Жоқ"}
              </strong>
            </span>
            <span>
              Тең жұптар
              <strong className="smaller">
                {[
                  r[18] & 1 ? "a = b" : "",
                  r[18] & 2 ? "a = c" : "",
                  r[18] & 4 ? "b = c" : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Жоқ"}
              </strong>
            </span>
          </div>
        ) : started ? (
          <BranchPulse state={state} />
        ) : (
          <p className="scene-prompt">Үш сан. Әрқайсысының өз орны бар.</p>
        )}
      </div>
    );
  }
  if (id === 2) {
    const known = [65, 66, 67, 68, 70].includes(r[16]);
    const letter = valid
      ? r[16] === -1
        ? "!"
        : known
          ? String.fromCharCode(r[16])
          : "—"
      : started && known
        ? String.fromCharCode(r[16])
        : "?";
    const grade = known ? String.fromCharCode(r[16]) : "";
    const score = Math.max(0, Math.min(100, values[0]));
    return (
      <div
        className={`${sceneClass} grade-scene ${valid && r[16] === -1 ? "is-error" : ""}`}
      >
        <div className="grade-arena">
          <svg className="grade-orbit" viewBox="0 0 340 340" aria-hidden="true">
            <defs>
              <linearGradient
                id={`grade-${uniqueId}`}
                x1="0"
                x2="1"
                y1="0"
                y2="1"
              >
                <stop stopColor="#81f4c1" />
                <stop offset="1" stopColor="#d2ff5a" />
              </linearGradient>
            </defs>
            <circle className="orbit-guide" cx="170" cy="170" r="143" />
            <circle className="orbit-guide inner" cx="170" cy="170" r="126" />
            <circle
              className="orbit-progress"
              cx="170"
              cy="170"
              r="143"
              pathLength="100"
              stroke={`url(#grade-${uniqueId})`}
              strokeDasharray={`${score} 100`}
              transform="rotate(-90 170 170)"
            />
            <g className="orbit-ticks">
              {Array.from({ length: 40 }, (_, i) => (
                <line
                  key={i}
                  x1="170"
                  y1="10"
                  x2="170"
                  y2={i % 4 === 0 ? 21 : 16}
                  transform={`rotate(${i * 9} 170 170)`}
                />
              ))}
            </g>
          </svg>
          <div className="grade-display" key={`${letter}-${valid}`}>
            <strong>{letter}</strong>
            <span>
              {valid
                ? r[16] === -1
                  ? "Баға 0–100 аралығында болуы керек"
                  : "Баға анықталды"
                : started
                  ? "Шарт тексерілуде"
                  : "Өз бағаңды тексер"}
            </span>
          </div>
          {valid && r[16] !== -1 && <ResultBurst />}
          <div className="score-orbit-label">
            {values[0]}
            <span>/ 100</span>
          </div>
        </div>
        <div className="grade-scale">
          <div className="grade-meter">
            <i style={{ width: `${score}%` }} />
            <span className="grade-marker" style={{ left: `${score}%` }} />
          </div>
          <div className="meter-labels">
            {[
              ["F", "0–59"],
              ["D", "60–69"],
              ["C", "70–79"],
              ["B", "80–89"],
              ["A", "90–100"],
            ].map(([name, range]) => (
              <span
                key={name}
                className={valid && grade === name ? "selected" : ""}
              >
                <b>{name}</b>
                {range}
              </span>
            ))}
          </div>
        </div>
        <div className="quick-values" aria-label="Баға шектерін тексеру">
          {[59, 60, 69, 70, 79, 80, 89, 90, 100, 101].map((n) => (
            <button
              className={values[0] === n ? "selected" : ""}
              aria-pressed={values[0] === n}
              key={n}
              onClick={() => onValue(0, n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (id === 3) {
    const X = (x: number) => 64 + (x + 10) * 20,
      Y = (y: number) => 340 - (y + 15) * 6;
    const x = values[0],
      y = valid ? r[16] : 0,
      branch = started ? r[17] : 0;
    const inWindow = valid && x >= -10 && x <= 15 && y >= -15 && y <= 35;
    return (
      <div className={`${sceneClass} function-scene`}>
        <div className="formula-switch" aria-label="Функция тармақтары">
          {[
            ["x < 0", "2x + 5"],
            ["0 ≤ x ≤ 5", "x² − 1"],
            ["x > 5", "10 − x"],
          ].map(([condition, formula], i) => (
            <div key={condition} className={branch === i + 1 ? "selected" : ""}>
              <span>{condition}</span>
              <strong>{formula}</strong>
            </div>
          ))}
        </div>
        <div className="function-plot">
          <svg
            className="function-chart"
            viewBox="0 0 600 390"
            role="img"
            aria-label="Бөліктік функция: x=0 кезінде −1, x=5 кезінде 24. Ашық шекаралар тармаққа кірмейді."
          >
            <defs>
              <linearGradient id={`curve-${uniqueId}`} x1="0" x2="1">
                <stop stopColor="#81f4c1" />
                <stop offset="1" stopColor="#d2ff5a" />
              </linearGradient>
              <clipPath id={`plot-${uniqueId}`}>
                <rect x="54" y="30" width="520" height="320" />
              </clipPath>
            </defs>
            <g className="chart-grid">
              {[-10, 0, 10, 20, 30].map((v) => (
                <g key={v}>
                  <line x1="64" y1={Y(v)} x2="565" y2={Y(v)} />
                  <text x="39" y={Y(v) + 5} textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}
              {[-10, -5, 0, 5, 10, 15].map((v) => (
                <g key={v}>
                  <line x1={X(v)} y1="36" x2={X(v)} y2="340" />
                  <text x={X(v)} y="374" textAnchor="middle">
                    {v}
                  </text>
                </g>
              ))}
            </g>
            <line className="axis" x1="60" y1={Y(0)} x2="575" y2={Y(0)} />
            <line className="axis" x1={X(0)} y1="26" x2={X(0)} y2="349" />
            <g clipPath={`url(#plot-${uniqueId})`}>
              <path
                className={`curve ${branch === 1 ? "selected" : ""}`}
                d={`M${X(-10)},${Y(-15)} L${X(0)},${Y(5)}`}
                stroke={`url(#curve-${uniqueId})`}
              />
              <path
                className={`curve ${branch === 2 ? "selected" : ""}`}
                d={
                  "M" +
                  Array.from(
                    { length: 51 },
                    (_, i) => `${X(i / 10)},${Y((i / 10) ** 2 - 1)}`,
                  ).join(" L")
                }
                stroke={`url(#curve-${uniqueId})`}
              />
              <path
                className={`curve ${branch === 3 ? "selected" : ""}`}
                d={`M${X(5)},${Y(5)} L${X(15)},${Y(-5)}`}
                stroke={`url(#curve-${uniqueId})`}
              />
              {(
                [
                  [0, 5, false],
                  [0, -1, true],
                  [5, 24, true],
                  [5, 5, false],
                ] as const
              ).map(([a, b, closed], i) => (
                <circle
                  className={`boundary-point ${closed ? "closed" : "open"}`}
                  key={i}
                  cx={X(a)}
                  cy={Y(b)}
                  r="5"
                />
              ))}
              {inWindow && (
                <g className="selected-point" key={`${x}-${y}`}>
                  <line
                    className="point-projection"
                    x1={X(x)}
                    y1={Y(0)}
                    x2={X(x)}
                    y2={Y(y)}
                  />
                  <circle className="point-ring" cx={X(x)} cy={Y(y)} r="14" />
                  <circle className="point-core" cx={X(x)} cy={Y(y)} r="6" />
                </g>
              )}
            </g>
          </svg>
        </div>
        <p className="function-verdict" aria-live="polite">
          {valid ? (
            <>
              <strong>
                f({x}) = {y}
              </strong>
              <span>
                {["", "2x + 5", "x² − 1", "10 − x"][r[17]] || "Нәтиже"}
              </span>
            </>
          ) : (
            <span>
              {started
                ? "Қай тармақ таңдалады?"
                : "x мәнін таңда. Тармағын бақыла."}
            </span>
          )}
        </p>
        {valid && !inWindow && (
          <div className="scene-notice">Нүкте график терезесінен тыс.</div>
        )}
        <div className="quick-values" aria-label="Функция шекараларын тексеру">
          {[-1, 0, 5, 6].map((n) => (
            <button
              className={x === n ? "selected" : ""}
              aria-pressed={x === n}
              onClick={() => onValue(0, n)}
              key={n}
            >
              x = {n}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (id === 4) {
    const season = valid ? r[16] : 0;
    return (
      <div className={`${sceneClass} seasons-scene season-${season}`}>
        <div className="season-composition">
          <div
            className="season-landscape"
            key={season}
            role="img"
            aria-label={
              season === -1
                ? "Қате ай"
                : seasons[season] || "Жыл мезгілін таңдау"
            }
          >
            <div className="season-aura" />
            <div className="season-sun" />
            <div className="season-cloud cloud-one" />
            <div className="season-cloud cloud-two" />
            <div className="season-caption">
              <span>{values[0]}-ай</span>
              <strong>
                {season === -1
                  ? "Қате ай"
                  : seasons[season] || "Мезгілді таңда"}
              </strong>
            </div>
            <svg
              className="landscape-art"
              viewBox="0 0 600 300"
              aria-hidden="true"
            >
              <path
                className="far-hill"
                d="M0 223Q110 128 220 208Q350 105 600 203V300H0Z"
              />
              <path
                className="near-hill"
                d="M0 258Q180 192 310 253Q440 195 600 246V300H0Z"
              />
              <g className="season-tree">
                <path
                  className="tree-trunk"
                  d="M437 261V119M437 181L403 150M437 201L468 165M437 153L456 131"
                />
                <g className="tree-canopy">
                  <circle cx="405" cy="137" r="34" />
                  <circle cx="463" cy="148" r="40" />
                  <circle cx="434" cy="106" r="43" />
                </g>
                <path
                  className="tree-snow"
                  d="M395 120Q402 103 415 108Q437 66 461 103Q485 106 491 129Q471 122 464 130Q446 110 431 128Q408 118 395 120"
                />
              </g>
              <path className="ground-path" d="M282 300Q337 262 360 245" />
              {[70, 110, 172, 260, 333, 510, 556].map((p, i) => (
                <g
                  className="ground-flower"
                  transform={`translate(${p},${262 + (i % 3) * 9})`}
                  key={p}
                >
                  <path d="M0 9V-8" />
                  <circle cx="0" cy="-10" r="4" />
                  <circle cx="-4" cy="-7" r="3" />
                  <circle cx="4" cy="-7" r="3" />
                </g>
              ))}
            </svg>
            {valid && season > 0 && (
              <div className="season-particles" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <i
                    key={i}
                    style={
                      {
                        "--particle-x": `${5 + i * 7}%`,
                        "--particle-delay": `${-i * 0.73}s`,
                        "--particle-time": `${4 + (i % 4)}s`,
                        "--particle-size": `${5 + (i % 4) * 2}px`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div className="month-wheel" aria-label="Айды таңдау">
            {Array.from({ length: 12 }, (_, i) => (
              <button
                aria-label={`${i + 1}-ай`}
                aria-pressed={values[0] === i + 1}
                className={values[0] === i + 1 ? "active" : ""}
                style={{
                  left: `${50 + 41 * Math.sin((i * Math.PI) / 6)}%`,
                  top: `${50 - 41 * Math.cos((i * Math.PI) / 6)}%`,
                }}
                onClick={() => onValue(0, i + 1)}
                key={i}
              >
                {i + 1}
              </button>
            ))}
            <div className="season-center">
              <span className="season-icon" aria-hidden="true">
                {["◌", "❄", "✿", "☀", "❧"][season] || "!"}
              </span>
              <strong>
                {season === -1 ? "1–12 ай" : seasons[season] || "Айды таңда"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const outputError = state.output.includes("Error"),
    failed = !!state.error || (valid && outputError);
  const errorLabel = state.error.includes("overflow")
    ? "32 биттік шектен шығу"
    : state.output.includes("division by zero")
      ? "Нөлге бөлуге болмайды"
      : state.error
        ? "Есептеу тоқтады"
        : "Амал дұрыс таңдалмады";
  const result = valid && !outputError ? r[16] : null;
  return (
    <div
      className={`${sceneClass} calculator-scene ${failed ? "is-error" : ""}`}
    >
      <div className="calculator-orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="calculator-equation">
        <span>{values[0]}</span>
        <b>{["", "+", "−", "×", "÷"][values[2]] || "?"}</b>
        <span>{values[1]}</span>
        <b>=</b>
      </div>
      <div className="calculator-answer" key={`${result}-${failed}`}>
        <span>
          {failed
            ? "Есептеу қатесі"
            : result !== null
              ? values[2] === 4
                ? "Бүтін бөлінді"
                : "Нәтиже"
              : started
                ? "Есептелуде"
                : "Нәтижені аш"}
        </span>
        <strong>
          {failed ? "!" : result !== null ? result : started ? "···" : "?"}
        </strong>
        {result !== null && !failed && <ResultBurst />}
      </div>
      {failed ? (
        <p className="calculator-error" role="status">
          {errorLabel}
        </p>
      ) : valid && values[2] === 4 ? (
        <div className="result-grid division-result">
          <span>
            Бүтін бөлінді<strong>{r[16]}</strong>
          </span>
          <span>
            Қалдық<strong>{r[17]}</strong>
          </span>
        </div>
      ) : started && !valid ? (
        <div className="calculation-progress">
          <i />
          <i />
          <i />
          <span>Командалар орындалуда</span>
        </div>
      ) : null}
    </div>
  );
}
