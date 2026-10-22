import { useEffect, useRef } from "react";
import type { usePlayback } from "./usePlayback";
/** Advance only after this demo actually ran to completion; pausing preserves its state. */
export function useGuidedDemo(
  play: ReturnType<typeof usePlayback>,
  max: number,
  enabled = false,
  onComplete?: () => void,
) {
  const done = useRef(false),
    ran = useRef(false),
    callback = useRef(onComplete);
  callback.current = onComplete;
  const { setIndex, setPlaying, setSpeed, setLoop } = play;
  useEffect(() => {
    if (!enabled) return;
    done.current = false;
    ran.current = false;
    setIndex((i) => (i >= max ? 0 : i));
    setSpeed(350);
    setLoop(false);
    setPlaying(true);
    return () => setPlaying(false);
  }, [enabled, max, setIndex, setPlaying, setSpeed, setLoop]);
  useEffect(() => {
    if (enabled && play.playing) ran.current = true;
    if (
      enabled &&
      ran.current &&
      play.index >= max &&
      max > 0 &&
      !play.playing &&
      !done.current
    ) {
      done.current = true;
      callback.current?.();
    }
  }, [enabled, play.index, play.playing, max]);
}
