export const stages = ["IF", "ID", "EX", "MEM", "WB"] as const;
export type PipelineMode = "independent" | "stall" | "forward";
// WB first half, ID second half; ALU forwarding into EX, no speculative fetch.
export function pipeline(mode: PipelineMode) {
  const stalled = [
    ["IF", "ID", "EX", "MEM", "WB", "", "", "", "", "", ""],
    ["", "IF", "ID", "STALL", "STALL", "EX", "MEM", "WB", "", "", ""],
    ["", "", "", "", "IF", "ID", "STALL", "STALL", "EX", "MEM", "WB"],
  ];
  return {
    rows: [0, 1, 2].map((i) => ({
      code:
        mode === "independent"
          ? ["add $t0, $s0, $s1", "add $t1, $s2, $s3", "add $t2, $s4, $s5"][i]
          : ["add $t0, $s0, $s1", "sub $t1, $t0, $s2", "add $t2, $t1, $s3"][i],
      cells:
        mode === "stall"
          ? stalled[i]
          : Array.from({ length: 7 }, (_, j) =>
              j >= i && j < i + 5 ? stages[j - i] : "",
            ),
    })),
    cycles: mode === "stall" ? 11 : 7,
  };
}
