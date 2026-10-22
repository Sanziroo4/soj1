import { tasks } from "../src/content/programs.ts";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const cp = process.env.MARS_CLASSPATH;
if (!cp) {
  console.error(
    "Set MARS_CLASSPATH to the official MARS classes directory or JAR. See README.",
  );
  process.exit(1);
}
const cases = [
  [
    1,
    [7, 12, 5],
    "Max: 12\nMin: 5\nEqual mask (ab=1, ac=2, bc=4): 0\nStrict ascending: 0",
  ],
  [1, [5, 5, 5], "Equal mask (ab=1, ac=2, bc=4): 7"],
  [2, [59], "F"],
  [2, [60], "D"],
  [2, [90], "A"],
  [2, [101], "Error: grade must be 0..100"],
  [3, [0], "f(x) = -1"],
  [3, [5], "f(x) = 24"],
  [4, [12], "Winter"],
  [4, [0], "Error: month must be 1..12"],
  [5, [24, 7, 4], "Result / quotient: 3\nRemainder: 3"],
  [5, [-24, 7, 4], "Result / quotient: -3\nRemainder: -3"],
  [5, [2147483647, 2, 3], "Result / quotient: -2"],
  [5, [1, 0, 4], "Error: division by zero"],
];
const dir = mkdtempSync(join(tmpdir(), "mips-lab-mars-"));
let passed = 0;
try {
  for (const [id, input, expected] of cases) {
    const file = join(dir, `task-${id}.asm`);
    writeFileSync(file, tasks[id - 1].code);
    const r = spawnSync(
      "java",
      [
        "-Djava.awt.headless=true",
        `-Djava.util.prefs.userRoot=${dir}`,
        "-cp",
        cp,
        "Mars",
        "nc",
        "me",
        "ae2",
        "se3",
        "10000",
        file,
      ],
      { input: input.join("\n") + "\n", encoding: "utf8", timeout: 15000 },
    );
    if (r.status !== 0 || !r.stdout.includes(expected)) {
      console.error("FAIL", id, input, r.status, r.stdout, r.stderr);
      process.exitCode = 1;
    } else {
      passed++;
      console.log(
        `PASS MARS task ${id} inputs ${input.join(", ")} → ${expected.replaceAll("\n", " | ")}`,
      );
    }
  }
  console.log(`${passed}/${cases.length} MARS scenarios passed`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
