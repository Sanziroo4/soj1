import "./processor-experience.css";
import { useGuidedDemo } from "./useGuidedDemo";
import { useState } from "react";
import { pipeline, stages } from "../model/pipeline";
import type { PipelineMode } from "../model/pipeline";
import { Controls } from "./Controls";
import { usePlayback } from "./usePlayback";
export function Pipeline({
  demo = false,
  onComplete,
}: {
  demo?: boolean;
  onComplete?: () => void;
}) {
  const [mode, setMode] = useState<PipelineMode>("independent");
  const p = pipeline(mode),
    play = usePlayback(p.cycles);
  useGuidedDemo(play, p.cycles, demo, onComplete);
  return (
    <div
      className="panel pipeline pipeline-experience"
      ref={play.viewportRef}
      data-in-view={play.inView}
    >
      <div className="scenario-tabs">
        {(["independent", "stall", "forward"] as PipelineMode[]).map((m, i) => (
          <button
            key={m}
            className={mode === m ? "active" : ""}
            onClick={() => {
              setMode(m);
              play.setIndex(0);
              play.setPlaying(true);
            }}
          >
            {
              [
                "Тәуелсіз командалар",
                "Тәуелділік + stall",
                "Тәуелділік + forwarding",
              ][i]
            }
          </button>
        ))}
      </div>
      <div
        className="pipeline-live spatial-pipeline"
        aria-label="Пайплайндағы ағымдағы командалар"
      >
        <div className="pipeline-clock">
          <span>
            Такт <strong>{play.index}</strong>
          </span>
          <span>
            {mode === "stall"
              ? "4 кідіріс"
              : mode === "forward"
                ? "Нәтиже тікелей беріледі"
                : "Командалар қатар қозғалады"}
          </span>
        </div>
        <div className="pipeline-stage-labels">
          <span />
          {stages.map((stage, i) => (
            <div key={stage}>
              <strong>{stage}</strong>
              <span>{["Алу", "Талдау", "Есептеу", "Жад", "Жазу"][i]}</span>
            </div>
          ))}
        </div>
        {p.rows.map((row, i) => {
          const current = row.cells[play.index - 1],
            isStall = current === "STALL",
            complete =
              play.index >= row.cells.lastIndexOf("WB") + 1 && play.index > 0;
          const lane = isStall
            ? 1
            : current
              ? stages.indexOf(current as (typeof stages)[number])
              : complete
                ? 4
                : 0;
          return (
            <div className="pipeline-conveyor-row" key={i}>
              <span className="pipeline-row-label">
                <span>I{i + 1}</span>
                <code>{row.code}</code>
              </span>
              <div className="pipeline-lane">
                {stages.map((stage) => (
                  <i key={stage} />
                ))}
                <div
                  className={`pipeline-token ${isStall ? "hazard-active" : ""} ${!current ? "token-idle" : ""} ${complete ? "token-complete" : ""}`}
                  style={
                    {
                      "--lane": Math.max(0, lane),
                    } as import("react").CSSProperties
                  }
                >
                  <span>I{i + 1}</span>
                  <strong>{current || (complete ? "✓" : "Күту")}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Controls {...play} max={p.cycles} />
      <div className="callout pipeline-insight" aria-live="polite">
        <strong>
          {play.index === p.cycles
            ? "Үш команда аяқталды"
            : play.index
              ? `Қазір: ${p.rows.map((r, i) => `I${i + 1} ${r.cells[play.index - 1] || "—"}`).join(" · ")}`
              : "Бір рет бас. Қабаттасуды бақыла."}
        </strong>
        <p>
          {mode === "independent"
            ? "Тәуелсіз үш команда 7 тактте аяқталады."
            : mode === "stall"
              ? "Келесі команда дайын мәнді күтеді. Әр тәуелділікке екі кідіріс қосылады."
              : "ALU нәтижесі келесі команданың EX кезеңіне тікелей өтеді. Бұл мысалда кідіріс жоқ."}
        </p>
      </div>
      <details className="pipeline-timeline">
        <summary>
          Такт кестесін ашу <span>{p.cycles} такт</span>
        </summary>
        <div className="table-scroll">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Команда / такт</th>
                {Array.from({ length: p.cycles }, (_, i) => (
                  <th key={i} className={play.index === i + 1 ? "current" : ""}>
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.rows.map((r, i) => (
                <tr key={i}>
                  <th>
                    <code>{r.code}</code>
                  </th>
                  {r.cells.map((c, j) => (
                    <td
                      key={j}
                      className={`${c === "STALL" ? "stall" : c ? "stage-" + stages.indexOf(c as (typeof stages)[number]) : ""} ${play.index === j + 1 ? "current" : ""} ${j + 1 > play.index ? "future" : ""}`}
                    >
                      {c || "·"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
