import { useState, useEffect } from "react";
export function usePlayback(max: number, active = true) {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!playing || !active || !visible) return;
    if (index >= max) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(
      () => setIndex((i) => Math.min(i + 1, max)),
      speed,
    );
    return () => clearTimeout(timer);
  }, [playing, index, max, speed, active, visible]);
  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);
  return { index, setIndex, playing, setPlaying, speed, setSpeed };
}
