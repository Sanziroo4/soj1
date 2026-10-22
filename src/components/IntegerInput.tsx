import { useEffect, useState } from "react";
/** Keep intermediate '-' and empty edits so negative integers can be typed normally. */
export function IntegerInput({
  value,
  onChange,
  onDirty,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  onDirty?: () => void;
  label: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const valid =
    /^-?\d+$/.test(draft) &&
    Number(draft) >= -2147483648 &&
    Number(draft) <= 2147483647;
  return (
    <span className="integer-field">
      <input
        aria-label={label}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        aria-invalid={!valid}
        onChange={(e) => {
          const text = e.target.value;
          if (!/^-?\d*$/.test(text)) return;
          setDraft(text);
          onDirty?.();
          const n = Number(text);
          if (/^-?\d+$/.test(text) && n >= -2147483648 && n <= 2147483647)
            onChange(n);
        }}
        onBlur={() => {
          if (!valid) setDraft(String(value));
        }}
      />
      {!valid && (
        <small className="input-hint">
          32 биттік бүтін санды толық енгізіңіз.
        </small>
      )}
    </span>
  );
}
