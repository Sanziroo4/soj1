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
      className="chip-scene"
      onClick={onClick}
      aria-label="Процессордың ішін ашу"
    >
      <svg
        viewBox="0 0 600 490"
        role="img"
        aria-label="Анимацияланған MIPS процессоры"
      >
        <defs>
          <linearGradient id="chipFill" x2="1" y2="1">
            <stop stopColor="#263b2d" />
            <stop offset="1" stopColor="#101c17" />
          </linearGradient>
          <radialGradient id="glow">
            <stop stopColor="#c6f567" stopOpacity=".16" />
            <stop offset="1" stopColor="#c6f567" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="240" r="235" fill="url(#glow)" />
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i} className="chip-trace">
            <path
              d={`M ${170 + i * 24} 170 V ${80 - (i % 3) * 16} L ${135 + i * 30} ${45 + (i % 2) * 10}`}
            />
            <path
              d={`M ${170 + i * 24} 320 V ${390 + (i % 3) * 16} L ${135 + i * 30} ${435 - (i % 2) * 10}`}
            />
            <path
              d={`M 210 ${160 + i * 15} H ${80 - (i % 3) * 18} L ${55} ${125 + i * 23}`}
            />
            <path
              d={`M 390 ${160 + i * 15} H ${505 + (i % 3) * 18} L 550 ${125 + i * 23}`}
            />
          </g>
        ))}
        <g className="chip-core">
          <path
            d="M300 110 440 190 440 310 300 390 160 310 160 190Z"
            fill="#0a100c"
            stroke="#72904d"
          />
          <path
            d="M300 96 440 176 440 294 300 374 160 294 160 176Z"
            fill="url(#chipFill)"
            stroke="#c6f567"
            strokeWidth="1.5"
          />
          <path
            d="M300 130 409 193 409 276 300 339 191 276 191 193Z"
            fill="#17251b"
            stroke="#556e39"
          />
          <path
            d="M300 160 378 205 378 258 300 303 222 258 222 205Z"
            fill="#192b1e"
            stroke="#8ba956"
          />
          <text
            x="300"
            y="229"
            textAnchor="middle"
            fill="#d6f4a6"
            fontFamily="monospace"
            fontSize="27"
            fontWeight="700"
          >
            MIPS
          </text>
          <text
            x="300"
            y="254"
            textAnchor="middle"
            fill="#91a27b"
            fontFamily="monospace"
            fontSize="10"
            letterSpacing="4"
          >
            32-BIT CORE
          </text>
          <circle className="chip-dot" cx="300" cy="112" r="4" fill="#c6f567" />
        </g>
        <text
          x="300"
          y="478"
          textAnchor="middle"
          fill="#9ba994"
          fontSize="11"
          letterSpacing="3"
        >
          БАСЫП, ІШІН ЗЕРТТЕҢІЗ ↗
        </text>
      </svg>
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
    <div className="structure-grid" ref={viewportRef}>
      <div className="panel diagram-panel">
        <div className="panel-top">
          <span className="eyebrow">
            <i className="status-dot" /> ИНТЕРАКТИВТІ ҚҰРЫЛЫМ
          </span>
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
              <text x="277" y="354">
                деректер · 32 бит
              </text>
              <text x="340" y="195" className="control-label">
                басқару
              </text>
              <text x="285" y="553" className="address-label">
                келесі адрес → PC
              </text>
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
                  rx="7"
                />
                <text x={part.x + 16} y={part.y + 34} className="part-name">
                  {part.name}
                </text>
                <text x={part.x + 16} y={part.y + 58} className="part-en">
                  {part.en}
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
                  fontSize="13"
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
        <span className="eyebrow">
          БӨЛІКТІ ЗЕРТТЕУ <ArrowUpRight size={15} />
        </span>
        <h3>{p.name}</h3>
        <p>{p.plain}</p>
        <dl>
          <dt>Кіріс</dt>
          <dd>{p.input}</dd>
          <dt>Шығыс</dt>
          <dd>{p.output}</dd>
          <dt>Байланыс</dt>
          <dd>{p.links}</dd>
        </dl>
        <div className="callout">
          <span className="eyebrow">НАҚТЫ МЫСАЛ</span>
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
        <small>Басқа бөлікті таңдау үшін сызбаны басыңыз.</small>
      </aside>
    </div>
  );
}
