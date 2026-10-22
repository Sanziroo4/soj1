import { strToU8, zipSync } from "fflate";
import { tasks } from "../content/programs";
export function download(data: BlobPart, name: string, type = "text/plain") {
  const u = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function downloadAll() {
  const files: Record<string, Uint8Array> = {};
  for (const t of tasks) files[`mips-lab-${t.id}.asm`] = strToU8(t.code);
  files["README.txt"] = strToU8(
    "MIPS LAB — MARS\nSettings > Delayed branching: OFF.\nRun > Assemble, then Run > Go.\nInput integers one per syscall 5. Task 5: a, b, op (1 +, 2 -, 3 *, 4 /).\nThe web interpreter executes source-level pseudo instructions, not hardware cycles.\nSigned add/sub overflow traps; mul keeps low 32 bits. INT_MIN/-1 division is not portable; see site notes.",
  );
  const zipped = zipSync(files);
  download(
    zipped.buffer as ArrayBuffer,
    "mips-lab-5-programs.zip",
    "application/zip",
  );
}
