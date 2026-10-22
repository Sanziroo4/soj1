import { useEffect, useState, type CSSProperties } from "react";
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
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="section-index" aria-hidden="true">
        {n}
      </span>
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
    const id = window.location.hash.slice(1);
    if (!nav.some((n) => n.id === id)) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "instant", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
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
        <a className="brand" href="#intro" aria-label="MIPS LAB басты бет">
          <span className="brand-icon">
            <Cpu size={25} />
          </span>
          MIPS<span>LAB</span>
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
          <Play size={17} />
          <span>Қорғау режимі</span>
        </button>
      </header>
      <main id="main">
        <section id="intro" className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span />
                Оқып қана қойма. Іске қос.
              </span>
              <h1>
                Кодты жаз.
                <br />
                <span>Процесті көр.</span>
              </h1>
              <p>
                Процессордың ішіне кір. Команданы жүргіз. Әр шешімнің қалай
                пайда болатынын өзің зертте.
              </p>
              <div className="hero-actions">
                <button
                  className="primary large"
                  onClick={reveal}
                  aria-label="Процессордың ішіне саяхат"
                >
                  Процессорды ашу <ArrowUpRight size={21} />
                </button>
                <button
                  className="plain large"
                  onClick={() => go("lab")}
                  aria-label="Зертханаға өту"
                >
                  Зертхана <ArrowRight size={21} />
                </button>
              </div>
              <div className="hero-trail">
                <span>
                  <Cpu size={19} />
                  Құрылымды аш
                </span>
                <i />
                <span>
                  <GitBranch size={19} />
                  Кодты іске қос
                </span>
                <i />
                <span>
                  <Layers size={19} />
                  Нәтижені көр
                </span>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-aura" />
              <Chip onClick={reveal} />
            </div>
          </div>
          <a className="scroll-cue" href="#structure">
            <ArrowRight size={19} />
            <span>Тәжірибені баста</span>
          </a>
        </section>
        <section className="content-section" id="structure">
          <SectionHead
            n="01"
            kicker="Зертте"
            title="Бір чип. Тұтас әлем."
            description="Процессорды ашып, кез келген бөлігін таңда."
          />
          <Processor reveal={processorReveal} />
          <MemoryLesson />
        </section>
        <section className="content-section" id="instruction">
          <SectionHead
            n="02"
            kicker="Қозғалысты бақыла"
            title="Бір команда. Толық саяхат."
            description="Мәндерді өзгерт. Бастау батырмасын бас. Нәтижеге дейінгі әр сәтті көр."
          />
          <Instruction
            demo={defense && autoPresent && routes[route].id === "instruction"}
            onComplete={advance}
          />
        </section>
        <section className="content-section" id="pipeline">
          <SectionHead
            n="03"
            kicker="Бірге орында"
            title="Бір ырғақпен. Қатар қозғалыс."
            description="Командалар қалай қабаттасатынын және неге кейде күту керегін зертте."
          />
          <Pipeline
            demo={defense && autoPresent && routes[route].id === "pipeline"}
            onComplete={advance}
          />
        </section>
        <section className="content-section" id="basics">
          <SectionHead
            n="04"
            kicker="Тілді түсін"
            title="Процессормен ортақ тіл тап."
            description="Зертханаға керек негізгі ұғымдар — бір жерде."
          />
          <Basics />
        </section>
        <section className="content-section lab-section" id="lab">
          <SectionHead
            n="05"
            kicker="Өзің жасап көр"
            title="Шарттан шешімге."
            description="Бес тәжірибе. Сансыз мүмкіндік. Мәнді өзгерт те, кодтың шешімін бақыла."
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
        <section className="content-section defense-section" id="defense">
          <div className="defense-card panel">
            <div className="defense-copy">
              <span className="eyebrow">Көрсететін сәт келді</span>
              <h2>
                Өзің түсін.
                <br />
                <span>Өзгеге түсіндір.</span>
              </h2>
              <p>
                Процессордан бес зертханаға дейінгі толық көрсетілім. Маршрут
                өзі жүргізеді, түсіндіру — сенен.
              </p>
              <div className="hero-actions">
                <button
                  className="primary large"
                  onClick={() => {
                    setDefense(true);
                    setAutoPresent(true);
                    move(0, true);
                  }}
                >
                  Қорғау маршрутын бастау <ArrowRight size={22} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Толық экран"
                  onClick={full}
                >
                  <Maximize size={21} />
                </button>
              </div>
            </div>
            <div className="defense-art" aria-hidden="true">
              <div className="defense-orbit" />
              <div className="defense-symbol">
                <GitBranch size={86} />
              </div>
              {["IF", "ID", "EX", "MEM", "WB"].map((s, i) => (
                <span key={s} style={{ "--stage": i } as CSSProperties}>
                  {s}
                </span>
              ))}
            </div>
            <div className="defense-credit">
              <strong>Сейтқазы С.Қ.</strong>
              <p>
                MIPS ассемблерінде шартты операторларды пайдаланып, көп деңгейлі
                тармақталуды жүзеге асыру
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#intro">
          <Cpu size={23} />
          MIPS<span>LAB</span>
        </a>
        <span>Көр. Іске қос. Түсін.</span>
        <button className="plain" onClick={downloadAll}>
          <Download size={19} />
          Код архиві
        </button>
      </footer>
      {defense && (
        <aside className="presentation-bar" aria-label="Қорғау маршруты">
          <div className="presentation-label">
            <span>
              {route + 1} / {routes.length}
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
              {autoPresent ? <Pause size={19} /> : <Play size={19} />}
              <span>{autoPresent ? "Кідірту" : "Авто көрсету"}</span>
            </button>
            <button
              aria-label="Маршруттың алдыңғы бөлімі"
              disabled={route === 0}
              onClick={() => move(route - 1)}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="primary"
              aria-label="Маршруттың келесі бөлімі"
              disabled={route === routes.length - 1}
              onClick={() => move(route + 1)}
            >
              <ChevronRight size={22} />
            </button>
            <button
              aria-label={fullscreen ? "Толық экраннан шығу" : "Толық экран"}
              onClick={full}
            >
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button
              aria-label="Қорғау режимін жабу"
              onClick={() => {
                setDefense(false);
                setAutoPresent(false);
                if (document.fullscreenElement) void document.exitFullscreen();
              }}
            >
              <X size={21} />
            </button>
          </div>
        </aside>
      )}
      {notice && (
        <div role="status" className="notice">
          {notice}
          <button aria-label="Хабарламаны жабу" onClick={() => setNotice("")}>
            <X size={19} />
          </button>
        </div>
      )}
    </div>
  );
}
