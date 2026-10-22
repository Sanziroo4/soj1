import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  GitBranch,
  Layers,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  BookOpen,
  Play,
  Pause,
} from "lucide-react";
import { Chip, Processor } from "./components/Processor";
import { Instruction } from "./components/Instruction";
import { Pipeline } from "./components/Pipeline";
import { MemoryLesson, Basics } from "./components/Lessons";
import { Lab } from "./components/Lab";
import { nav, speaking } from "./content/lessons";
import { downloadAll } from "./model/download";
const routes = [
  ...nav.slice(0, 5).map((n, i) => ({
    id: n.id,
    title: n.label,
    speech: speaking[i],
    task: 0,
  })),
  ...[1, 2, 3, 4, 5].map((task) => ({
    id: "lab",
    title: `Зертхана · ${task}/5`,
    speech: [
      "Үш санның максимумын, минимумын, барлық тең жұптарын және қатаң өсу ретін тексереміз. Теріс және тең сандарды да көрсетеміз.",
      "Бағаның шекарасын 59, 60, 89, 90 және 101 мәндерімен тексереміз. Әр шарт нәтиженің қай әріп болатынын анықтайды.",
      "Бөліктік функцияда x = 0 және x = 5 ортаңғы тармаққа кіреді. Графиктегі ашық және жабық нүктелер осыны көрсетеді.",
      "Мезгіл енгізілген айға сәйкес тармақ арқылы таңдалады. Нәтиже JavaScript күнтізбесінен емес, MIPS кодындағы $s0 регистрінен алынады.",
      "Калькуляторда 24 / 7 бөліндісі 3, қалдығы 3. Нөлге бөлу мен 32 биттік шектен шығуды жеке тексереміз.",
    ][task - 1],
    task,
  })),
  { id: "defense", title: "Қорытынды", speech: speaking[6], task: 0 },
];
function SectionHead({
  n,
  kicker,
  title,
  description,
}: {
  n: string;
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">
          <span className="section-num">{n}</span>
          {kicker}
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="section-cross">+</span>
    </div>
  );
}
export default function App() {
  const [processorReveal, setProcessorReveal] = useState(0),
    [active, setActive] = useState("intro"),
    [defense, setDefense] = useState(false),
    [autoPresent, setAutoPresent] = useState(false),
    [route, setRoute] = useState(0),
    [labId, setLabId] = useState(1),
    [fullscreen, setFullscreen] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("main > section"),
      );
      let current = sections[0]?.id || "intro";
      for (const section of sections) {
        if (
          section.getBoundingClientRect().top <=
          Math.max(110, innerHeight * 0.25)
        )
          current = section.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("fullscreenchange", handler);
    };
  }, []);
  useEffect(() => {
    document
      .querySelectorAll("main > section")
      .forEach((s) => s.setAttribute("data-active", String(s.id === active)));
  }, [active]);
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    setActive(id);
  }
  function reveal() {
    go("structure");
    setProcessorReveal((i) => i + 1);
  }
  function move(i: number, automatic = false) {
    if (!automatic) setAutoPresent(false);
    if (routes[i].id === "structure") setProcessorReveal((n) => n + 1);
    setRoute(i);
    if (routes[i].task) setLabId(routes[i].task);
    go(routes[i].id);
  }
  function advance() {
    if (route < routes.length - 1) move(route + 1, true);
    else setAutoPresent(false);
  }
  useEffect(() => {
    if (!defense || !autoPresent) return;
    const id = routes[route].id;
    if (["instruction", "pipeline", "lab"].includes(id)) return;
    if (route === routes.length - 1) {
      setAutoPresent(false);
      return;
    }
    const t = setTimeout(() => advance(), id === "structure" ? 8500 : 6500);
    return () => clearTimeout(t);
  }, [defense, autoPresent, route]);
  async function full() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice(
        "Браузер толық экранға рұқсат бермеді. Қорғау маршруты терезеде жұмыс істейді.",
      );
    }
  }
  return (
    <div className={defense ? "app presenting" : "app"}>
      <a href="#main" className="skip-link">
        Мазмұнға өту
      </a>
      <header className="site-header">
        <a className="brand" href="#intro" onClick={() => setActive("intro")}>
          <span className="brand-icon">
            <Cpu size={20} />
          </span>
          MIPS<span className="brand-light">LAB</span>
          <span className="brand-version">/ 01</span>
        </a>
        <nav aria-label="Бөлімдер">
          {nav.map((n) => (
            <a
              key={n.id}
              className={active === n.id ? "active" : ""}
              href={`#${n.id}`}
              onClick={() => setActive(n.id)}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <button
          className="header-defense"
          onClick={() => {
            setDefense(true);
            move(0);
          }}
        >
          <Maximize size={14} />
          <span>Қорғау режимі</span>
        </button>
      </header>
      <main id="main">
        <section id="intro" className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow">
                <i className="status-dot" /> ҚАЗАҚША ИНТЕРАКТИВТІ ОҚУ ОРТАСЫ
              </span>
              <h1>
                Үлкен идеялар.
                <br />
                Кішкентай{" "}
                <span>
                  чиптің
                  <br className="desktop-break" /> ішінде.
                </span>
              </h1>
              <p>
                Процессор қалай ойлайды? Сандар қайда жүреді?
                <br className="desktop-break" /> MIPS әлемін ішінен зерттеп, әр
                команданың
                <br className="desktop-break" /> шешімге қалай айналатынын өзің
                көр.
              </p>
              <div className="hero-actions">
                <button className="primary large" onClick={reveal}>
                  Процессордың ішіне саяхат <ArrowUpRight size={18} />
                </button>
                <button className="plain" onClick={() => go("lab")}>
                  Зертханаға өту <ArrowRight size={16} />
                </button>
              </div>
              <div className="hero-meta">
                <span>
                  <i />
                  32 биттік оқу моделі
                </span>
                <span>5 практикалық тапсырма</span>
                <span>Өз қарқыныңмен</span>
              </div>
            </div>
            <div className="hero-visual">
              <span className="visual-coordinate">MIPS RISC ARCHITECTURE</span>
              <Chip onClick={reveal} />
              <div className="visual-bottom">
                <span>
                  STATUS <b>READY TO EXPLORE</b>
                </span>
                <span>0x00400000</span>
              </div>
            </div>
          </div>
          <div className="hero-bottom">
            <span>ТЕОРИЯДАН → ТӘЖІРИБЕГЕ</span>
            <a href="#structure">
              Төмен айналдырып зертте <span>↓</span>
            </a>
            <span className="mono">01 — 07</span>
          </div>
        </section>
        <div className="learning-strip">
          <span className="eyebrow">СЕНІҢ ОҚУ ЖОЛЫҢ</span>
          <div>
            {nav.map((n, i) => (
              <a href={`#${n.id}`} key={n.id}>
                <small>{n.n}</small>
                {n.label}
                {i < 6 && <ChevronRight size={13} />}
              </a>
            ))}
          </div>
        </div>
        <section className="content-section" id="structure">
          <SectionHead
            n="02"
            kicker="ПРОЦЕССОРДЫ ТАНЫ"
            title="Сыртынан чип. Ішінде — тұтас жүйе."
            description="Процессор — нұсқауларды орындайтын есептеу құрылғысы. Бөлікті таңдап, оның басқалармен қалай жұмыс істейтінін көр."
          />
          <Processor reveal={processorReveal} />
          <MemoryLesson />
          <a className="next-link" href="#instruction">
            Енді бір команданың жолын бақылайық <ArrowRight size={17} />
          </a>
        </section>
        <section className="content-section" id="instruction">
          <SectionHead
            n="03"
            kicker="БІР КОМАНДАНЫҢ ЖОЛЫ"
            title="7 + 5. Бірақ процессор үшін қалай?"
            description="Команданы алу сәтінен нәтижені жазуға дейін. Әр кезеңді тоқтатып, нақты мәндерді зертте."
          />
          <Instruction
            demo={defense && autoPresent && routes[route].id === "instruction"}
            onComplete={advance}
          />
          <a className="next-link" href="#pipeline">
            Ал бірнеше команда қатар орындалса ше? <ArrowRight size={17} />
          </a>
        </section>
        <section className="content-section" id="pipeline">
          <SectionHead
            n="04"
            kicker="КЕЗЕҢДЕРДІ ҚАБАТТАСТЫРУ"
            title="Бір ырғақ. Бірнеше команда."
            description="Пайплайн әртүрлі командалардың кезеңдерін қабаттастырады. Бұл әр команданың өз нәтижесіне жететін жолын қысқартпайды."
          />
          <Pipeline
            demo={defense && autoPresent && routes[route].id === "pipeline"}
            onComplete={advance}
          />
          <a className="next-link" href="#basics">
            MIPS тілін түсінуге көшейік <ArrowRight size={17} />
          </a>
        </section>
        <section className="content-section" id="basics">
          <SectionHead
            n="05"
            kicker="ЗЕРТХАНАҒА ДАЙЫНДЫҚ"
            title="Процессормен ортақ тіл тап."
            description="Бірнеше негізгі ұғымды білсең, төмендегі ассемблер коды оқылатын нұсқаулыққа айналады."
          />
          <Basics />
          <a className="next-link" href="#lab">
            Түсінгеніңді бес тапсырмада сына <ArrowRight size={17} />
          </a>
        </section>
        <section className="content-section lab-section" id="lab">
          <SectionHead
            n="06"
            kicker="ИНТЕРАКТИВТІ ЗЕРТХАНА"
            title="Шарттан шешімге."
            description="Санды өзгерт. Кодты орында. Тармақтың неге таңдалғанын бақыла. Әр нәтиженің артында — орындалған MIPS командасы."
          />
          <Lab
            selectedId={labId}
            onSelect={(id) => {
              setAutoPresent(false);
              setLabId(id);
            }}
            demo={defense && autoPresent && routes[route].id === "lab"}
            onComplete={advance}
          />
        </section>
        <section className="content-section" id="defense">
          <SectionHead
            n="07"
            kicker="СӨЖ ҚОРҒАУ"
            title="Түсін. Көрсет. Түсіндір."
            description="Дайын маршрут процессор құрылымынан бес практикалық тапсырмаға дейін жүргізеді. Әр аялдамада сөйлеушіге қысқа тірек мәтін бар."
          />
          <div className="panel defense-card">
            <div>
              <span className="eyebrow">СЕЙТҚАЗЫ С.Қ. · ӨЗІНДІК ЖҰМЫС</span>
              <h3>
                «MIPS ассемблерінде шартты операторларды пайдаланып, көп
                деңгейлі тармақталуды жүзеге асыру»
              </h3>
              <div className="defense-features">
                <span>
                  <Cpu size={17} />
                  Процессор құрылымы
                </span>
                <span>
                  <Layers size={17} />
                  Команданың жолы
                </span>
                <span>
                  <GitBranch size={17} />5 тапсырма
                </span>
              </div>
              <div className="hero-actions">
                <button
                  className="primary large"
                  onClick={() => {
                    setDefense(true);
                    setAutoPresent(true);
                    move(0, true);
                  }}
                >
                  Қорғау маршрутын бастау <ArrowRight size={17} />
                </button>
                <button onClick={full}>
                  <Maximize size={16} />
                  Толық экран
                </button>
              </div>
            </div>
            <div className="defense-art">
              <span>IF</span>
              <span>ID</span>
              <span>EX</span>
              <span>MEM</span>
              <span>WB</span>
              <GitBranch size={62} />
            </div>
          </div>
          <div className="resources">
            <div>
              <BookOpen size={20} />
              <h3>Дереккөздер</h3>
            </div>
            <a
              href="https://dpetersanderson.github.io/"
              target="_blank"
              rel="noreferrer"
            >
              MARS жобасы <ArrowUpRight size={14} />
            </a>
            <a
              href="https://dpetersanderson.github.io/Help/SyscallHelp.html"
              target="_blank"
              rel="noreferrer"
            >
              Syscall анықтамасы <ArrowUpRight size={14} />
            </a>
            <a
              href="https://dpetersanderson.github.io/Help/MarsHelpSettings.html"
              target="_blank"
              rel="noreferrer"
            >
              MARS баптаулары <ArrowUpRight size={14} />
            </a>
            <a
              href="https://ucsb-cs154.github.io/w20/lectures/lect13.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Классикалық пайплайн <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#intro">
          <Cpu size={20} /> MIPS LAB
        </a>
        <span>Түсінікті болу үшін жасалған. · Сейтқазы С.Қ.</span>
        <button className="plain" onClick={downloadAll}>
          <Download size={15} />
          Код архиві
        </button>
      </footer>
      {defense && (
        <aside className="presentation-bar" aria-label="Қорғау маршруты">
          <div className="presentation-label">
            <span className="eyebrow">
              ҚОРҒАУ МАРШРУТЫ · {route + 1} / {routes.length}
            </span>
            <h3>{routes[route].title}</h3>
          </div>
          <p>{routes[route].speech}</p>
          <div className="presentation-controls">
            <button
              className="auto-present"
              aria-label={
                autoPresent ? "Авто көрсетуді кідірту" : "Авто көрсету"
              }
              onClick={() => {
                if (route === routes.length - 1) move(0, true);
                setAutoPresent((v) => !v);
              }}
            >
              {autoPresent ? <Pause size={16} /> : <Play size={16} />}
              <span>{autoPresent ? "Кідірту" : "Авто көрсету"}</span>
            </button>
            <button
              aria-label="Маршруттың алдыңғы бөлімі"
              disabled={route === 0}
              onClick={() => move(route - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="primary"
              aria-label="Маршруттың келесі бөлімі"
              disabled={route === routes.length - 1}
              onClick={() => move(route + 1)}
            >
              <ChevronRight size={20} />
            </button>
            <button
              aria-label={fullscreen ? "Толық экраннан шығу" : "Толық экран"}
              onClick={full}
            >
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button
              aria-label="Қорғау режимін жабу"
              onClick={() => {
                setDefense(false);
                setAutoPresent(false);
                if (document.fullscreenElement) void document.exitFullscreen();
              }}
            >
              <X size={18} />
            </button>
          </div>
        </aside>
      )}
      {notice && (
        <div role="status" className="notice">
          {notice}
          <button aria-label="Хабарламаны жабу" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
