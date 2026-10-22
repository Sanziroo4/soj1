import "./processor-experience.css";
import { usePlayback } from "./usePlayback";
import { useState, useEffect } from "react";
import { ArrowUpRight, RotateCcw, Plus, Minus } from "lucide-react";
import { parts } from "../content/lessons";
const links = {
  "data-link": {
    name: "Деректер байланысы",
    plain:
      "Есептелетін сандарды немесе команданың биттерін тасымалдайтын жол. Адрес пен басқару сигналынан рөлі бөлек.",
    input: "Регистр мәндері, ALU нәтижесі, жадтан оқылған сөз.",
    output: "Қабылдаушы бөлікке берілетін 32 биттік мән.",
    example:
      "add: регистрлерден 7 және 5 → ALU; ALU-дан 12 → $t2. lw: жадтағы 42 → $t2.",
    links:
      "Регистрлер ↔ ALU; регистрлер ↔ деректер жады; командалар жады → талдау.",
  },
  "address-link": {
    name: "Адрес байланысы",
    plain:
      "Деректің өзін емес, қай жерде тұрғанын хабарлайды. Үйдің адресі мен үйдегі зат сияқты екі бөлек ұғым.",
    input: "PC немесе ALU есептеген адрес.",
    output: "Командалар не деректер жадында таңдалатын орын.",
    example: "lw: адрес 0x10010000, осы адрестегі мән 42. 0x10010000 ≠ 42.",
    links: "PC → командалар жады; ALU → деректер жады; тармақ таңдауы → PC.",
  },
  "control-link": {
    name: "Басқару байланысы",
    plain:
      "Қай операцияны қашан орындау керегін белгілейтін сигналдар. Бұл жолмен қосылатын сандар берілмейді.",
    input: "Басқару блогы талдаған команданың түрі.",
    output: "RegWrite, MemRead, MemWrite, Branch, ALU амалы.",
    example:
      "sw: MemWrite = 1, RegWrite = 0. add: RegWrite = 1, MemRead = 0, MemWrite = 0.",
    links:
      "Басқару блогы → ALU, регистрлер файлы, деректер жады және PC таңдау.",
  },
} as const;
const connections = [
  { from: "pc", to: "imem", kind: "address-link", d: "M165 280 H210" },
  { from: "imem", to: "regs", kind: "data-link", d: "M420 280 H455" },
  { from: "imem", to: "cu", kind: "data-link", d: "M315 235 V175" },
  { from: "regs", to: "alu", kind: "data-link", d: "M560 325 V400" },
  { from: "alu", to: "dmem", kind: "address-link", d: "M465 450 H425" },
  { from: "regs", to: "dmem", kind: "data-link", d: "M500 325 V345 H385 V410" },
  { from: "dmem", to: "regs", kind: "data-link", d: "M330 410 V360 H555 V325" },
  {
    from: "alu",
    to: "regs",
    kind: "data-link",
    d: "M650 450 H690 V365 H620 V325",
  },
  {
    from: "cu",
    to: "regs",
    kind: "control-link",
    d: "M225 175 V200 H560 V235",
  },
  {
    from: "cu",
    to: "dmem",
    kind: "control-link",
    d: "M280 175 V205 H680 V390 H405 V410",
  },
  { from: "cu", to: "alu", kind: "control-link", d: "M300 175 V215 H640 V400" },
  { from: "alu", to: "pc", kind: "address-link", d: "M560 500 V535 H95 V325" },
  { from: "clock", to: "pc", kind: "clock-link", d: "M105 410 V365 H55 V325" },
  {
    from: "clock",
    to: "regs",
    kind: "clock-link",
    d: "M105 410 V365 H485 V325",
  },
];
export function Chip({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="chip-scene cinematic-chip"
      onClick={onClick}
      aria-label="Процессордың ішін ашу"
    >
      <svg
        viewBox="0 0 640 620"
        role="img"
        aria-label="Анимацияланған MIPS процессоры"
      >
        <defs>
          <linearGradient id="spatial-chip-top" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#3c5531" />
            <stop offset=".5" stopColor="#1c2c20" />
            <stop offset="1" stopColor="#0e1612" />
          </linearGradient>
          <linearGradient id="spatial-chip-edge">
            <stop stopColor="#9cbf65" />
            <stop offset="1" stopColor="#1d3b2c" />
          </linearGradient>
          <radialGradient id="spatial-chip-aura">
            <stop stopColor="#d2ff5a" stopOpacity=".22" />
            <stop offset="1" stopColor="#81f4c1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          className="chip-aura"
          cx="320"
          cy="320"
          r="285"
          fill="url(#spatial-chip-aura)"
        />
        <g className="chip-orbits" fill="none">
          <ellipse
            cx="320"
            cy="340"
            rx="288"
            ry="138"
            transform="rotate(-24 320 340)"
          />
          <ellipse
            cx="320"
            cy="340"
            rx="280"
            ry="135"
            transform="rotate(24 320 340)"
          />
          <circle cx="320" cy="320" r="265" />
        </g>
        <g className="chip-base-layer">
          <path
            d="M320 240 548 371 320 502 92 371Z"
            fill="#10241b"
            stroke="#3c6a46"
          />
          <path
            d="M320 260 514 372 320 484 126 372Z"
            fill="none"
            stroke="#7fa86a"
            strokeDasharray="5 10"
          />
        </g>
        <g className="chip-middle-layer">
          <path
            d="M320 170 530 291 530 322 320 443 110 322 110 291Z"
            fill="#112218"
            stroke="#547341"
          />
          <path
            d="M320 170 530 291 320 412 110 291Z"
            fill="#1e3425"
            stroke="#91b861"
          />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} className="chip-pin">
              <path
                d={`M${140 + i * 19} ${284 - i * 11} l-34 -20 M${500 - i * 19} ${284 - i * 11} l34 -20 M${140 + i * 19} ${305 + i * 11} l-34 20 M${500 - i * 19} ${305 + i * 11} l34 20`}
              />
            </g>
          ))}
        </g>
        <g className="chip-core">
          <path
            d="M320 118 490 216 490 255 320 354 150 255 150 216Z"
            fill="#163220"
            stroke="#89b952"
          />
          <path
            d="M320 118 490 216 320 314 150 216Z"
            fill="url(#spatial-chip-top)"
            stroke="#d2ff5a"
            strokeWidth="2"
          />
          <path
            d="M320 151 433 216 320 281 207 216Z"
            fill="#1b3020"
            stroke="#729b4b"
          />
          <path
            d="M320 172 397 216 320 260 243 216Z"
            fill="#233d26"
            stroke="#d2ff5a"
          />
          <text
            x="320"
            y="227"
            textAnchor="middle"
            fill="#e5ffae"
            fontWeight="750"
            fontSize="31"
          >
            MIPS
          </text>
          <circle className="chip-dot" cx="320" cy="118" r="6" fill="#d2ff5a" />
        </g>
        <g className="chip-orbit-dots">
          <circle cx="91" cy="387" r="7" fill="#81f4c1" />
          <circle cx="535" cy="220" r="5" fill="#d2ff5a" />
          <circle cx="430" cy="536" r="4" fill="#ffb879" />
        </g>
      </svg>
      <span className="chip-invitation">
        Ішін ашып көр <ArrowUpRight size={22} aria-hidden="true" />
      </span>
    </button>
  );
}
export function Processor({ reveal }: { reveal: number }) {
  const { viewportRef, inView } = usePlayback(0);
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState("alu"),
    [zoom, setZoom] = useState(1);
  useEffect(() => {
    if (reveal > 0) setOpen(true);
  }, [reveal]);
  const p =
    parts.find((part) => part.id === selected) ||
    links[selected as keyof typeof links];
  return (
    <div
      className="structure-grid processor-experience"
      ref={viewportRef}
      data-in-view={inView}
    >
      <div className="panel diagram-panel">
        <div className="panel-top">
          <span className="eyebrow">Ішкі құрылым</span>
          <button onClick={() => setOpen(!open)}>
            <RotateCcw size={14} />
            {open ? "Қайта жинау" : "Ішін ашу"}
          </button>
        </div>
        <div className="diagram-scroll">
          <svg
            className={`processor-map ${open ? "expanded" : "assembled"} ${inView ? "" : "inactive"}`}
            style={{ width: `${zoom * 100}%` }}
            viewBox="0 0 720 565"
            role="group"
            aria-label="Процессор құрылымы"
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#b7e66a" />
              </marker>
            </defs>
            <g className="wires" opacity={open ? 1 : 0}>
              {connections.map((c, i) => (
                <path
                  key={i}
                  className={`${c.kind.replace("-link", "-wire")} ${c.from === selected || c.to === selected || c.kind === selected ? "energized" : "quiet"}`}
                  d={c.d}
                />
              ))}
            </g>
            {parts.map((part, i) => (
              <g
                key={part.id}
                role="button"
                tabIndex={open ? 0 : -1}
                aria-label={part.name}
                aria-pressed={selected === part.id}
                onClick={() => {
                  if (!open) setOpen(true);
                  setSelected(part.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(true);
                    setSelected(part.id);
                  }
                }}
                className={`cpu-part ${selected === part.id ? "selected" : ""} ${({ alu: ["regs", "dmem", "pc", "cu"], cu: ["imem", "alu", "regs", "dmem"], regs: ["alu", "dmem", "cu"], pc: ["imem", "alu"], imem: ["pc", "cu", "regs"], dmem: ["alu", "regs", "cu"], clock: ["pc", "regs"] } as Record<string, string[]>)[selected]?.includes(part.id) ? "connected" : ""}`}
                style={{
                  transform: open
                    ? "translate(0px,0px)"
                    : `translate(${280 - part.x + (i % 2) * 8}px, ${220 - part.y + i * 3}px)`,
                  opacity: open ? 1 : 0.7,
                }}
              >
                <rect
                  x={part.x}
                  y={part.y}
                  width={part.w}
                  height={part.h}
                  rx="16"
                />
                <text
                  x={part.x + part.w / 2}
                  y={part.y + part.h / 2 + 7}
                  textAnchor="middle"
                  className="part-name"
                >
                  {part.name}
                </text>
                <circle cx={part.x + part.w - 16} cy={part.y + 16} r="3" />
              </g>
            ))}
            {!open && (
              <g
                onClick={() => setOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="Процессорды ашу"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setOpen(true);
                }}
              >
                <rect
                  x="250"
                  y="220"
                  width="220"
                  height="120"
                  rx="10"
                  fill="#1c3021"
                  stroke="#c6f567"
                />
                <text
                  x="360"
                  y="276"
                  fill="#c6f567"
                  textAnchor="middle"
                  fontSize="25"
                >
                  MIPS
                </text>
                <text
                  x="360"
                  y="307"
                  fill="#e4e8df"
                  textAnchor="middle"
                  fontSize="20"
                >
                  Ішін ашу ↗
                </text>
              </g>
            )}
          </svg>
        </div>
        <div className="diagram-legend">
          {(
            [
              ["data-link", "Деректер", ""],
              ["address-link", "Адрес", "cyan"],
              ["control-link", "Басқару", "orange"],
            ] as const
          ).map(([id, label, color]) => (
            <button
              className={selected === id ? "active" : ""}
              key={id}
              onClick={() => setSelected(id)}
            >
              <i className={color} />
              {label}
            </button>
          ))}
          <div className="zoom">
            <button
              aria-label="Сызбаны кішірейту"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => z - 0.25)}
            >
              <Minus size={14} />
            </button>
            <button
              aria-label="Сызбаны үлкейту"
              disabled={zoom >= 2}
              onClick={() => setZoom((z) => z + 0.25)}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
      <aside className="panel part-info" key={selected}>
        <div className="square-icon">
          {selected === "alu" ? "Σ" : selected === "clock" ? "↯" : "⌘"}
        </div>
        <h3>{p.name}</h3>
        <p>{p.plain}</p>
        <div className="callout">
          <p>{p.example}</p>
          {selected === "alu" && (
            <div className="sum-animation">
              <span>7</span>
              <b>+</b>
              <span>5</span>
              <b>→</b>
              <strong>12</strong>
            </div>
          )}
        </div>
        <details className="component-details">
          <summary>Кіріс пен шығыс</summary>{" "}
          <dl>
            <dt>Кіріс</dt>
            <dd>{p.input}</dd>
            <dt>Шығыс</dt>
            <dd>{p.output}</dd>
            <dt>Байланыс</dt>
            <dd>{p.links}</dd>
          </dl>
        </details>
      </aside>
    </div>
  );
}
