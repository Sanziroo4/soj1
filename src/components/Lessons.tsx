import { IntegerInput } from "./IntegerInput";
import { useState } from "react";
import { format } from "../model/mips";
import { Cpu, Database, Layers, ArrowRight } from "lucide-react";
export function MemoryLesson() {
  const [level, setLevel] = useState(0),
    [retrieved, setRetrieved] = useState(false);
  const names = ["Регистр", "Кэш", "RAM"];
  return (
    <div className="memory-section">
      <div>
        <span className="eyebrow">ДЕРЕКТЕР ҚАЙДА ТҰРАДЫ?</span>
        <h3>Бір дерек. Үш түрлі қашықтық.</h3>
        <p>
          Регистр — жұмыс үстеліңдегі қағаз. Кэш — қасыңдағы сөре. RAM — үлкен
          кітапхана. Бұл салыстыру рөлін түсіндіреді; нақты жылдамдық құрылғыға
          байланысты.
        </p>
        <div className="memory-tabs">
          {names.map((n, i) => (
            <button
              className={level === i ? "active" : ""}
              onClick={() => {
                setLevel(i);
                setRetrieved(false);
              }}
              key={n}
            >
              {n}
            </button>
          ))}
        </div>
        <p>
          {
            [
              "Регистрлер команда операндтарын тікелей береді. MIPS-та 32 жалпы мақсатты регистр бар, әрқайсысы 32 бит.",
              "Кэш — жақында қолданылған деректердің аппараттық көшірмесі. Кәдімгі MIPS командасы кэш регистрін жеке атамайды.",
              "RAM — бағдарламалар мен деректерге арналған жедел жад. lw/sw архитектуралық адрес арқылы қатынайды.",
            ][level]
          }
        </p>
        <button onClick={() => setRetrieved(true)}>
          42 мәнін ALU-ға жеткізу <ArrowRight size={15} />
        </button>
        <p className="lime" aria-live="polite">
          {retrieved
            ? [
                "Регистр → ALU: операнд 42 дайын.",
                "Кэште бар деп аламыз → регистр → ALU: 42.",
                "Кэште жоқ деп аламыз → RAM → кэш → регистр → ALU: 42.",
              ][level]
            : "Деректің жолын көру үшін батырманы басыңыз."}
        </p>
      </div>
      <div className={`memory-stack retrieved-${retrieved ? level : "none"}`}>
        <div>
          <Cpu />
          <span>
            Регистрлер<strong>Аз көлем · тікелей операндтар</strong>
          </span>
          <code>42</code>
        </div>
        <div>
          <Layers />
          <span>
            Кэш<strong>Деректердің жақын көшірмесі</strong>
          </span>
          <code>42</code>
        </div>
        <div>
          <Database />
          <span>
            RAM<strong>Негізгі деректер кеңістігі</strong>
          </span>
          <code>42</code>
        </div>
        <small>
          Бұл жеке ұғымдық көрініс. Оқу интерпретаторында кэш пен RAM таймингі
          модельденбейді.
        </small>
      </div>
    </div>
  );
}
export function Basics() {
  const [base, setBase] = useState<"DEC" | "HEX" | "BIN">("DEC"),
    [value, setValue] = useState(42);
  return (
    <>
      <div className="basics-grid">
        {[
          [
            "ISA → тіл → құрал",
            "MIPS — процессор түсінетін командалар жиынының архитектурасы (ISA). Ассемблер тілі — командалардың мәтіндік жазылуы. Ассемблер құралы мәтінді машиналық кодқа айналдырады. MARS — жинау және симуляция ортасы.",
          ],
          [
            "32 бит және регистр",
            "32 бит — 32 екілік разряд. Таңбалы диапазон: −2 147 483 648…2 147 483 647. Регистрлер шағын мәндерді сақтайды; жад адресі деректің орналасуын көрсетеді, деректің өзі емес.",
          ],
          [
            "Команда және label",
            "Команда: add $t2, $t0, $t1. Label — кодтағы орынның аты, мысалы equal:. beq теңдік орындалғанда осы белгіге өтеді. Label — орындалатын жеке команда емес.",
          ],
          [
            ".data · .text · syscall",
            ".data — жолдар мен деректер, .text — орындалатын код. syscall қызметі $v0 арқылы таңдалады: 5 енгізеді, 1 сан шығарады, 4 жол шығарады, 10 аяқтайды. $a0 — шығару аргументі.",
          ],
        ].map(([title, text], i) => (
          <article className="panel lesson-card" key={title}>
            <span className="eyebrow">0{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="panel register-lesson">
        <div>
          <span className="eyebrow">РЕГИСТРЛЕР КАРТАСЫ</span>
          <h3>Әр атаудың өз рөлі бар.</h3>
          <dl>
            <dt>$zero</dt>
            <dd>Әрқашан 0; жазу нәтиже бермейді.</dd>
            <dt>$t0–$t9</dt>
            <dd>Уақытша мәндер; шақырушы қажет мәндерін өзі сақтайды.</dd>
            <dt>$s0–$s7</dt>
            <dd>
              Сақталатын мәндер. Бұл — шақыру келісімі; процессор автоматты
              түрде сақтамайды.
            </dd>
            <dt>$v0 / $a0</dt>
            <dd>Нәтиже / аргумент; MARS syscall қызметтері де қолданады.</dd>
          </dl>
        </div>
        <div className="number-system">
          <span className="eyebrow">САН ӨЗГЕРМЕЙДІ. ЖАЗЫЛУЫ ӨЗГЕРЕДІ.</span>
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
                key={b}
                className={base === b ? "active" : ""}
                onClick={() => setBase(b)}
              >
                {b}
              </button>
            ))}
          </div>
          <output className="number-output mono">{format(value, base)}</output>
          <small>
            HEX және BIN таңбалы санның екілік толықтауыштағы 32 битін
            көрсетеді.
          </small>
        </div>
      </div>
      <div className="callout">
        <strong>Біздің модель және нақты процессор</strong>
        <p>
          Ядро — командалар ағынын орындайтын есептеу бөлігі. Тактілік жиілік —
          секундтағы такт саны; ол өздігінен өнімділікті анықтамайды. ISA —
          бағдарламашы көретін келісім, микроархитектура — оны іске асыру
          тәсілі. Бір ISA әртүрлі микроархитектураларда орындала алады.
        </p>
      </div>
    </>
  );
}
