import type { State } from "../model/mips";
import { seasons } from "../content/programs";
export function LabVisual({
  id,
  values,
  state,
  finished,
  ready,
  started,
  onValue,
}: {
  id: number;
  values: number[];
  state: State;
  finished: boolean;
  ready: boolean;
  started: boolean;
  onValue: (i: number, v: number) => void;
}) {
  const r = state.regs,
    valid = (ready || finished) && !state.error;
  if (id === 1) {
    const max = Math.max(1, ...values.map(Math.abs));
    return (
      <div className="lab-visual">
        <div className="number-bars">
          {values.map((n, i) => (
            <div className="bar-column" key={i}>
              <b>{n}</b>
              <div className="bar-scale">
                <span
                  className={`number-bar ${n < 0 ? "negative" : ""}`}
                  style={{
                    height: `${(Math.abs(n) / max) * 45}%`,
                    bottom: n >= 0 ? "50%" : undefined,
                    top: n < 0 ? "50%" : undefined,
                  }}
                />
              </div>
              <code>{["a", "b", "c"][i]}</code>
            </div>
          ))}
        </div>
        <small>Орта сызық = 0; төменгі бағыт = теріс мән.</small>
        {valid ? (
          <div className="result-grid">
            <span>
              Ең үлкені<strong>{r[16]}</strong>
            </span>
            <span>
              Ең кішісі<strong>{r[17]}</strong>
            </span>
            <span>
              a &lt; b &lt; c<strong>{r[19] ? "Иә" : "Жоқ"}</strong>
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
                  .join(", ") || "Жоқ"}
              </strong>
            </span>
          </div>
        ) : (
          <p className="dim">
            Қадамдар арқылы шарттардың қалай тексерілетінін бақылаңыз.
          </p>
        )}
      </div>
    );
  }
  if (id === 2)
    return (
      <div className="lab-visual">
        <div className="grade-display">
          <strong>
            {valid
              ? r[16] === -1
                ? "!"
                : String.fromCharCode(r[16])
              : started && [65, 66, 67, 68, 70].includes(r[16])
                ? String.fromCharCode(r[16])
                : "?"}
          </strong>
          <span>
            {valid
              ? r[16] === -1
                ? "Диапазоннан тыс"
                : "MIPS таңдаған баға"
              : started
                ? "Ағымдағы кандидат · шарттар тексерілуде"
                : "Нәтижені орындап көріңіз"}
          </span>
        </div>
        <div className="grade-meter">
          <i style={{ width: `${Math.max(0, Math.min(100, values[0]))}%` }} />
        </div>
        <div className="meter-labels">
          <span>0 · F</span>
          <span>60 · D</span>
          <span>70 · C</span>
          <span>80 · B</span>
          <span>90 · A</span>
        </div>
        <div className="quick-values">
          {[59, 60, 69, 70, 79, 80, 89, 90, 100, 101].map((n) => (
            <button key={n} onClick={() => onValue(0, n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  if (id === 3) {
    const X = (x: number) => 185 + x * 14,
      Y = (y: number) => 220 - y * 5;
    const x = values[0],
      y = valid ? r[16] : 0;
    return (
      <div className="lab-visual">
        <svg
          className="function-chart"
          viewBox="0 0 410 300"
          role="img"
          aria-label="Бөліктік функция графигі: x=0 жабық нүкте -1; x=5 жабық нүкте 24"
        >
          <g className="chart-grid">
            {[-10, -5, 0, 5, 10, 15, 20, 25, 30].map((v) => (
              <g key={v}>
                <line x1="35" y1={Y(v)} x2="390" y2={Y(v)} />
                <text x="9" y={Y(v) + 4}>
                  {v}
                </text>
              </g>
            ))}
            {[-10, -5, 0, 5, 10, 15].map((v) => (
              <g key={v}>
                <line x1={X(v)} y1="20" x2={X(v)} y2="270" />
                <text x={X(v) - 4} y="289">
                  {v}
                </text>
              </g>
            ))}
          </g>
          <line className="axis" x1="35" y1={Y(0)} x2="395" y2={Y(0)} />
          <line className="axis" x1={X(0)} y1="20" x2={X(0)} y2="275" />
          <path
            className={`curve ${started && r[17] === 1 ? "selected" : ""}`}
            d={`M${X(-10)},${Y(-15)} L${X(0)},${Y(5)}`}
          />
          <path
            className={`curve ${started && r[17] === 2 ? "selected" : ""}`}
            d={
              "M" +
              Array.from(
                { length: 51 },
                (_, i) => `${X(i / 10)},${Y((i / 10) ** 2 - 1)}`,
              ).join(" L")
            }
          />
          <path
            className={`curve ${started && r[17] === 3 ? "selected" : ""}`}
            d={`M${X(5)},${Y(5)} L${X(15)},${Y(-5)}`}
          />
          {[
            [0, 5, false],
            [0, -1, true],
            [5, 24, true],
            [5, 5, false],
          ].map(([a, b, c], i) => (
            <circle
              key={i}
              cx={X(a as number)}
              cy={Y(b as number)}
              r="4"
              fill={c ? "#c6f567" : "#111816"}
              stroke="#c6f567"
              strokeWidth="2"
            />
          ))}
          {valid && x >= -10 && x <= 15 && y >= -15 && y <= 40 && (
            <g>
              <circle className="point-ring" cx={X(x)} cy={Y(y)} r="9" />
              <circle cx={X(x)} cy={Y(y)} r="4" fill="#f8b774" />
            </g>
          )}
        </svg>
        <p>
          {valid ? (
            <>
              <strong className="lime">
                f({x}) = {y}
              </strong>{" "}
              · {["", "2x + 5", "x² − 1", "10 − x"][r[17]]}
            </>
          ) : started ? (
            "Белсенді тармақ таңдалуда, есептеу жалғасады…"
          ) : (
            "Нүктені көру үшін бағдарламаны орындаңыз."
          )}
        </p>
        <small>
          ● — шекара кіреді · ○ — кірмейді. График терезесі: −10 ≤ x ≤ 15.
          Есептеу: таңбалы 32 бит.
        </small>
        <div className="quick-values">
          {[-1, 0, 5, 6].map((n) => (
            <button onClick={() => onValue(0, n)} key={n}>
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
      <div className={`lab-visual season-${season}`}>
        <div className="month-wheel">
          {Array.from({ length: 12 }, (_, i) => (
            <button
              aria-label={`${i + 1}-ай`}
              className={values[0] === i + 1 ? "active" : ""}
              style={{
                left: `${50 + 40 * Math.sin((i * Math.PI) / 6)}%`,
                top: `${50 - 40 * Math.cos((i * Math.PI) / 6)}%`,
              }}
              onClick={() => onValue(0, i + 1)}
              key={i}
            >
              {i + 1}
            </button>
          ))}
          <div className="season-center">
            <span className="season-icon">
              {["◷", "❄", "✿", "☀", "❧"][season] || "!"}
            </span>
            <strong>
              {season === -1 ? "Қате ай" : seasons[season] || "Айды таңда"}
            </strong>
          </div>
        </div>
        <p>
          {valid
            ? "Мезгіл $s0 регистрінің орындалған нәтижесінен алынды."
            : "Айды таңдап, MIPS бағдарламасын орындаңыз."}
        </p>
      </div>
    );
  }
  return (
    <div className="lab-visual">
      <div className="calculator-equation">
        <span>{values[0]}</span>
        <b>{["", "+", "−", "×", "÷"][values[2]] || "?"}</b>
        <span>{values[1]}</span>
        <b>=</b>
        <strong>
          {valid && !state.output.includes("Error") ? r[16] : "—"}
        </strong>
      </div>
      {valid && values[2] === 4 && !state.output.includes("Error") && (
        <div className="result-grid">
          <span>
            Бүтін бөлінді<strong>{r[16]}</strong>
          </span>
          <span>
            Қалдық<strong>{r[17]}</strong>
          </span>
        </div>
      )}
      <div className="callout">
        <p>
          ADD / SUB: таңбалы overflow кезінде тоқтайды. MUL: төменгі 32 бит
          сақталады. DIV: бөлінді LO, қалдық HI регистріне түседі.
        </p>
        <small>
          −2³¹ / −1 нәтижесі таңбалы 32 битке сыймайды; бұл модель LO = −2³¹, HI
          = 0 деп көрсетіп, ескерту береді. MARS пен нақты ISA мінез-құлқы бөлек
          тексеріледі.
        </small>
      </div>
    </div>
  );
}
