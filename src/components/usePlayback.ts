import { useState, useEffect, useRef, useCallback } from "react";
/** Playback belongs to the simulator, never to the navigation highlight. */
export function usePlayback(max: number) {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(350),
    [loop, setLoop] = useState(false),
    [visible, setVisible] = useState(!document.hidden),
    [inView, setInView] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0 },
    );
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => {
      document.removeEventListener("visibilitychange", update);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!playing || !visible || !inView || max === 0) return;
    if (index >= max && !loop) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(
      () => setIndex((i) => (i >= max ? 0 : i + 1)),
      speed,
    );
    return () => clearTimeout(timer);
  }, [playing, visible, inView, max, index, speed, loop]);
  const start = useCallback(() => {
    if (max === 0) return;
    setIndex((i) => (i >= max ? 0 : i));
    setPlaying(true);
  }, [max]);
  return {
    index,
    setIndex,
    playing,
    setPlaying,
    speed,
    setSpeed,
    loop,
    setLoop,
    viewportRef,
    inView,
    start,
  };
}
