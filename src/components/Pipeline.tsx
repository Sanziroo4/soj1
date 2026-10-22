import { useState } from "react";
import { pipeline, stages } from "../model/pipeline";
import type { PipelineMode } from "../model/pipeline";
import { Controls } from "./Controls";
import { usePlayback } from "./usePlayback";
export function Pipeline({ active }: { active: boolean }) {
  const [mode, setMode] = useState<PipelineMode>("independent");
  const p = pipeline(mode),
    play = usePlayback(p.cycles, active);
  return (
    <div className="panel pipeline">
      <div className="scenario-tabs">
        {(["independent", "stall", "forward"] as PipelineMode[]).map((m, i) => (
          <button
            key={m}
            className={mode === m ? "active" : ""}
            onClick={() => {
              setMode(m);
              play.setIndex(0);
              play.setPlaying(false);
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
      <Controls {...play} max={p.cycles} />
      <div className="callout">
        <strong>Қазір не болып жатыр? · Такт {play.index}</strong>
        <p>
          {play.index === 0
            ? "Бастау батырмасын басып, командалардың қабаттасуын бақылаңыз."
            : p.rows
                .map(
                  (r, i) =>
                    `I${i + 1}: ${r.cells[play.index - 1] || "белсенді емес"}`,
                )
                .join(" · ")}
        </p>
        <p>
          {mode === "independent"
            ? "Тәуелсіз 3 команда 7 тактте аяқталады: 5 кезең + келесі екі команданың басталуы. Бұл бір команданың бес кезеңінен бөлек ұғым."
            : mode === "stall"
              ? "Forwarding жоқ: келесі команда операндты ID-де оқиды. WB такттің бірінші жартысында жазады, ID екінші жартысында оқиды. Әр тәуелділікке 2 stall, барлығы 4 кідіріс. Үшінші команданы алу ID босағанша кешіктіріледі."
              : "ALU нәтижесі EX/MEM → EX арқылы келесі командаға тікелей беріледі. Осы ALU → ALU мысалында stall жоқ. lw → тәуелді команда болса, осы модельде бір load-use stall керек болар еді."}
        </p>
      </div>
      <small>
        5 кезеңді, ретімен орындалатын оқу моделі. Нақты процессордың ені,
        кэштері, болжауы және кідірістері өзгеше болуы мүмкін.
      </small>
    </div>
  );
}
