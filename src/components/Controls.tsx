import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
export function Controls({
  playing,
  setPlaying,
  index,
  setIndex,
  max,
  speed,
  setSpeed,
}: {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  index: number;
  setIndex: (v: number) => void;
  max: number;
  speed: number;
  setSpeed: (v: number) => void;
}) {
  return (
    <div className="controls">
      <button
        className="primary"
        onClick={() => {
          if (index >= max) setIndex(0);
          setPlaying(!playing);
        }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
        {playing ? "Кідірту" : "Бастау"}
      </button>
      <button
        title="Алдыңғы қадам"
        aria-label="Алдыңғы қадам"
        disabled={index === 0}
        onClick={() => {
          setPlaying(false);
          setIndex(index - 1);
        }}
      >
        <SkipBack size={17} />
      </button>
      <button
        title="Келесі қадам"
        aria-label="Келесі қадам"
        disabled={index === max}
        onClick={() => {
          setPlaying(false);
          setIndex(index + 1);
        }}
      >
        <SkipForward size={17} />
      </button>
      <button
        title="Қайта бастау"
        aria-label="Қайта бастау"
        onClick={() => {
          setPlaying(false);
          setIndex(0);
        }}
      >
        <RotateCcw size={17} />
      </button>
      <label className="speed">
        Жылдамдық
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={1400}>0.5×</option>
          <option value={700}>1×</option>
          <option value={350}>2×</option>
        </select>
      </label>
      <span className="mono dim">
        {index} / {max}
      </span>
    </div>
  );
}
