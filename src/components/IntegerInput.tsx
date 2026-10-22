import { useEffect, useRef, useState } from "react";
import "./integer-input.css";

const normalize = (text: string) =>
  text
    .trim()
    .replace(/[−‐‑‒–—―﹣－]/g, "-")
    .replace(/^\+/, "");
const complete = (text: string) =>
  /^-?\d+$/.test(text) &&
  Number(text) >= -2147483648 &&
  Number(text) <= 2147483647;

/** Preserve partial edits, and let a minus key or ± change an existing value's sign. */
export function IntegerInput({
  value,
  onChange,
  onDirty,
  label,
  showSignToggle = true,
}: {
  value: number;
  onChange: (value: number) => void;
  onDirty?: () => void;
  label: string;
  showSignToggle?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(String(value)), [value]);
  const valid = complete(draft);

  function update(text: string) {
    setDraft(text);
    onDirty?.();
    if (complete(text)) onChange(Number(text));
  }
  function toggleSign() {
    const next = draft.startsWith("-")
      ? draft.slice(1)
      : draft === "" || Number(draft) === 0
        ? "-"
        : `-${draft}`;
    update(next);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(next.length, next.length);
    });
  }
  return (
    <span className="integer-field">
      <span className="integer-control" data-sign-toggle={showSignToggle}>
        <input
          ref={input}
          className="integer-value"
          aria-label={label}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          aria-invalid={!valid}
          onChange={(e) => {
            const text = normalize(e.target.value);
            if (/^-?\d*$/.test(text)) update(text);
          }}
          onKeyDown={(e) => {
            if (
              !e.ctrlKey &&
              !e.metaKey &&
              !e.altKey &&
              ["-", "−", "Subtract"].includes(e.key)
            ) {
              e.preventDefault();
              const allSelected =
                e.currentTarget.selectionStart === 0 &&
                e.currentTarget.selectionEnd === draft.length;
              if (allSelected) update("-");
              else toggleSign();
            }
          }}
          onBlur={() => {
            if (!valid) setDraft(String(value));
          }}
        />
        {showSignToggle && (
          <button
            type="button"
            className="integer-sign"
            aria-label={`${label}: таңбаны өзгерту`}
            title="Оң / теріс сан"
            disabled={complete(draft) && Number(draft) === -2147483648}
            onPointerDown={(e) => e.preventDefault()}
            onClick={toggleSign}
          >
            ±
          </button>
        )}
      </span>
      {!valid && (
        <small className="input-hint">
          {draft === "" || draft === "-"
            ? "Санның цифрларын енгізіңіз."
            : "−2 147 483 648…2 147 483 647 аралығындағы бүтін сан қажет."}
        </small>
      )}
    </span>
  );
}
