import { Controls } from "./Controls";
import { usePlayback } from "./usePlayback";
import { IntegerInput } from "./IntegerInput";
import { useState } from "react";
import { format } from "../model/mips";
import {
  Cpu,
  Database,
  Layers,
  ArrowRight,
  Code2,
  MapPin,
  GitBranch,
  Braces,
} from "lucide-react";
export function MemoryLesson() {
  const [level, setLevel] = useState(0),
    [retrieved, setRetrieved] = useState(false);
  const play = usePlayback(level + 2),
    current = level - play.index + 1;
  const names = ["Регистр", "Кэш", "RAM"];
  function send(i = level) {
    setLevel(i);
    setRetrieved(true);
    play.setIndex(0);
    play.setPlaying(true);
  }
  return (
    <div
      className="memory-section panel"
      ref={play.viewportRef}
      data-memory-step={play.index}
      data-in-view={play.inView}
    >
      <div className="memory-copy">
        <span className="eyebrow">Деректер қозғалысы</span>
        <h3>
          42 санының
          <br />
          <span>саяхаты.</span>
        </h3>
        <p>
          Деректің қайдан келетінін таңда. Оның ALU-ға дейінгі жолын бақыла.
        </p>
        <div className="memory-tabs">
          {names.map((n, i) => (
            <button
              key={n}
              className={level === i ? "active" : ""}
              onClick={() => send(i)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="memory-definition">
          {
            [
              "Регистр — процессор дәл қазір қолданатын мәндерді сақтайды.",
              "Кэш — жиі қажет болатын деректердің жақын көшірмесі.",
              "RAM — бағдарлама мен деректер сақталатын жедел жад.",
            ][level]
          }
        </p>
        <button className="plain" onClick={() => send()}>
          42 мәнін ALU-ға жеткізу <ArrowRight size={20} />
        </button>
      </div>
      <div className="memory-stage">
        <div
          className="memory-stack memory-animated"
          data-current={retrieved ? current : "none"}
        >
          {[
            { n: "RAM", desc: "Негізгі жад", l: 2, icon: Database },
            { n: "Кэш", desc: "Жақын көшірме", l: 1, icon: Layers },
            { n: "Регистрлер", desc: "Жұмыс мәні", l: 0, icon: Cpu },
            { n: "ALU", desc: "Есептеуге дайын", l: -1, icon: Cpu },
          ].map(({ n, desc, l, icon: Icon }) => (
            <div
              className={`memory-node ${l === -1 ? "memory-alu" : ""} ${retrieved && current === l ? "active" : ""} ${l > level ? "outside-route" : ""} ${retrieved && play.index > 0 && l >= current && l <= level ? "visited" : ""}`}
              key={n}
            >
              <span className="memory-node-icon">
                <Icon size={25} />
              </span>
              <span>
                <strong>{n}</strong>
                <span>{desc}</span>
              </span>
              <code key={retrieved && current === l ? play.index : "static"}>
                {retrieved && play.index > 0 && l >= current && l <= level
                  ? "42"
                  : "—"}
              </code>
            </div>
          ))}
        </div>
        <p className="memory-status" aria-live="polite">
          {!retrieved
            ? "Жолды таңдап, деректі жібер."
            : play.index === 0
              ? "Деректі іздеу…"
              : current === -1
                ? "✓ 42 мәні ALU-ға жетті"
                : `${names[current]} → 42 мәні тасымалдануда`}
        </p>
        {retrieved && <Controls {...play} max={level + 2} />}
      </div>
    </div>
  );
}
const concepts = [
  {
    icon: Code2,
    title: "MIPS — командалар тілі",
    text: "ISA процессор қандай командаларды түсінетінін анықтайды. Ассемблер — сол командалардың жазылуы, MARS — оларды жинап, орындап көруге арналған құрал.",
    example: "add $t2, $t0, $t1",
  },
  {
    icon: Braces,
    title: "Регистр — шағын жұмыс орны",
    text: "32 биттік мән регистрде сақталады. Команда мәндерді оқып, есептеп, нәтижені басқа регистрге жаза алады.",
    example: "$t0 = 7   $t1 = 5   →   $t2 = 12",
  },
  {
    icon: MapPin,
    title: "Адрес — деректің орны",
    text: ".data деректерді, .text командаларды сипаттайды. Жад адресі мен сол жерде сақталған мән — екі бөлек нәрсе.",
    example: "[0x10010000] = 42",
  },
  {
    icon: GitBranch,
    title: "Шарт — бағытты таңдау",
    text: "Label — кодтағы орынның аты. Шарт ақиқат болса, beq сол белгіге өтеді. syscall енгізу мен шығаруды іске қосады.",
    example: "beq $t0, $t1, equal",
  },
];
const roles = [
  { name: "$zero", text: "Әрқашан нөл. Оған жазу мәнін өзгертпейді." },
  { name: "$t0–$t9", text: "Уақытша мәндерге арналған регистрлер." },
  {
    name: "$s0–$s7",
    text: "Шақырулар арасында сақталатын мәндер. Оларды сақтау — бағдарламалау келісімі.",
  },
  {
    name: "$v0 / $a0",
    text: "Syscall қызметінің коды және оның аргументі. Мысалы, $v0 = 1 бүтін санды шығарады.",
  },
];
export function Basics() {
  const [base, setBase] = useState<"DEC" | "HEX" | "BIN">("DEC"),
    [value, setValue] = useState(42),
    [role, setRole] = useState(0);
  return (
    <>
      <div className="basics-grid">
        {concepts.map(({ icon: Icon, title, text, example }) => (
          <article className="lesson-card panel" key={title}>
            <span className="lesson-icon">
              <Icon size={28} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
            <code>{example}</code>
          </article>
        ))}
      </div>
      <div className="register-lesson panel">
        <div className="register-roles">
          <h3>Регистрді таны.</h3>
          <div className="role-tabs">
            {roles.map((r, i) => (
              <button
                className={i === role ? "active" : ""}
                key={r.name}
                onClick={() => setRole(i)}
              >
                {r.name}
              </button>
            ))}
          </div>
          <p key={role}>{roles[role].text}</p>
          <details className="concept-details">
            <summary>Ядро, жиілік және архитектура</summary>
            <p>
              Ядро командаларды орындайды. Жиілік секундтағы такт санын
              көрсетеді, бірақ жалғыз өзі өнімділікті анықтамайды. ISA —
              командалардың келісімі, микроархитектура — сол келісімді іске
              асыру тәсілі. Бұл сайт қарапайым оқу моделін көрсетеді.
            </p>
          </details>
        </div>
        <div className="number-system">
          <h3>Бір сан. Үш жазылу.</h3>
          <label>
            Бүтін сан
            <IntegerInput
              label="Сан жүйесі мысалы"
              value={value}
              onChange={setValue}
            />
          </label>
          <div className="base-switch">
            {(["DEC", "HEX", "BIN"] as const).map((b) => (
              <button
                className={base === b ? "active" : ""}
                key={b}
                onClick={() => setBase(b)}
              >
                {b}
              </button>
            ))}
          </div>
          <output className="number-output mono" key={`${base}-${value}`}>
            {format(value, base)}
          </output>
          <p>Жазылуы өзгереді. Сан өзгермейді.</p>
        </div>
      </div>
    </>
  );
}
