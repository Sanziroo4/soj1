import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Repeat2,
} from "lucide-react";
import "./controls.css";
export function Controls({
  playing,
  setPlaying,
  index,
  setIndex,
  max,
  speed,
  setSpeed,
  loop,
  setLoop,
  startLabel = "Бастау",
  pauseLabel = "Кідірту",
}: {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  index: number;
  setIndex: (v: number) => void;
  max: number;
  speed: number;
  setSpeed: (v: number) => void;
  loop?: boolean;
  setLoop?: (v: boolean) => void;
  startLabel?: string;
  pauseLabel?: string;
}) {
  const position = Math.min(max, Math.max(0, index));
  return (
    <div className="controls">
      <button
        className="primary playback-primary"
        disabled={max === 0}
        onClick={() => {
          if (index >= max) setIndex(0);
          setPlaying(!playing);
        }}
      >
        {playing ? <Pause size={20} /> : <Play size={20} />}{" "}
        {playing ? pauseLabel : startLabel}
      </button>
      <div
        className="playback-steps"
        role="group"
        aria-label="Қадамдарды басқару"
      >
        <button
          title="Алдыңғы қадам"
          aria-label="Алдыңғы қадам"
          disabled={index === 0}
          onClick={() => {
            setPlaying(false);
            setIndex(index - 1);
          }}
        >
          <SkipBack size={20} />
        </button>
        <button
          title="Келесі қадам"
          aria-label="Келесі қадам"
          disabled={index >= max}
          onClick={() => {
            setPlaying(false);
            setIndex(index + 1);
          }}
        >
          <SkipForward size={20} />
        </button>
        <button
          title="Қайта бастау"
          aria-label="Қайта бастау"
          onClick={() => {
            setPlaying(false);
            setIndex(0);
          }}
        >
          <RotateCcw size={20} />
        </button>
      </div>
      <label className="speed">
        <span>Жылдамдық</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={1400}>0.5×</option>
          <option value={700}>1×</option>
          <option value={350}>2×</option>
          <option value={175}>4×</option>
          <option value={87.5}>8×</option>
        </select>
      </label>
      {setLoop && (
        <label className={`loop-control ${loop ? "enabled" : ""}`}>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          <Repeat2 size={18} />
          <span>Қайталау</span>
        </label>
      )}
      <span className="mono dim" aria-label="Орындалу қадамы">
        {position} / {max}
      </span>
      <div
        className="playback-progress"
        role="progressbar"
        aria-label="Орындалу барысы"
        aria-valuemin={0}
        aria-valuemax={max || 1}
        aria-valuenow={position}
      >
        <span style={{ transform: `scaleX(${max ? position / max : 0})` }} />
      </div>
    </div>
  );
}
