const read = (r: string) => `li $v0, 5\nsyscall\nmove ${r}, $v0`;
const print = (label: string, r: string) =>
  `li $v0, 4\nla $a0, ${label}\nsyscall\nli $v0, 1\nmove $a0, ${r}\nsyscall`;
const end = "li $v0, 10\nsyscall";
const header =
  "# MIPS LAB | MARS: Settings > Delayed branching OFF\n# Inputs: one integer per syscall 5. Source-level teaching model.\n";
export type Task = {
  id: number;
  title: string;
  short: string;
  description: string;
  inputs: { name: string; value: number }[];
  code: string;
  registers: string[];
};
export const tasks: Task[] = [
  {
    id: 1,
    title: "Үш санды салыстыру",
    short: "Салыстыру",
    description:
      "Ең үлкені мен ең кішісін тап. Барлық тең жұптарды және қатаң өсу ретін тексер: a < b < c.",
    inputs: [
      { name: "a", value: 7 },
      { name: "b", value: 12 },
      { name: "c", value: 5 },
    ],
    registers: ["$s0", "$s1", "$s2", "$s3"],
    code:
      header +
      `.data
maxMsg: .asciiz "Max: "
minMsg: .asciiz "\\nMin: "
eqMsg: .asciiz "\\nEqual mask (ab=1, ac=2, bc=4): "
ascMsg: .asciiz "\\nStrict ascending: "
.text
.globl main
main:
${read("$t0")}
${read("$t1")}
${read("$t2")}
move $s0, $t0
move $s1, $t0
bge $s0, $t1, max_c
move $s0, $t1
max_c:
bge $s0, $t2, min_b
move $s0, $t2
min_b:
ble $s1, $t1, min_c
move $s1, $t1
min_c:
ble $s1, $t2, equal_ab
move $s1, $t2
equal_ab:
li $s2, 0
bne $t0, $t1, equal_ac
addi $s2, $s2, 1
equal_ac:
bne $t0, $t2, equal_bc
addi $s2, $s2, 2
equal_bc:
bne $t1, $t2, ascending
addi $s2, $s2, 4
ascending:
li $s3, 0
bge $t0, $t1, output
bge $t1, $t2, output
li $s3, 1
output:
${print("maxMsg", "$s0")}
${print("minMsg", "$s1")}
${print("eqMsg", "$s2")}
${print("ascMsg", "$s3")}
${end}`,
  },
  {
    id: 2,
    title: "Саннан әріпке",
    short: "Баға",
    description:
      "Шектерді зертте: 90–100 → A, 80–89 → B, 70–79 → C, 60–69 → D, 0–59 → F. Басқа мән — қате.",
    inputs: [{ name: "Баға", value: 85 }],
    registers: ["$s0"],
    code:
      header +
      `.data
errorMsg: .asciiz "Error: grade must be 0..100"
.text
.globl main
main:
${read("$t0")}
blt $t0, 0, invalid
bgt $t0, 100, invalid
li $s0, 65
bge $t0, 90, output
li $s0, 66
bge $t0, 80, output
li $s0, 67
bge $t0, 70, output
li $s0, 68
bge $t0, 60, output
li $s0, 70
output:
li $v0, 11
move $a0, $s0
syscall
j done
invalid:
li $s0, -1
li $v0, 4
la $a0, errorMsg
syscall
done:
${end}`,
  },
  {
    id: 3,
    title: "Бөліктік функция",
    short: "Функция",
    description:
      "x < 0: 2x + 5 · 0 ≤ x ≤ 5: x² − 1 · x > 5: 10 − x. Үш тармақтың шекарасын зертте.",
    inputs: [{ name: "x", value: 3 }],
    registers: ["$s0", "$s1"],
    code:
      header +
      `.data
resultMsg: .asciiz "f(x) = "
.text
.globl main
main:
${read("$t0")}
blt $t0, 0, negative
bgt $t0, 5, greater
li $s1, 2
mul $s0, $t0, $t0
addi $s0, $s0, -1
j output
negative:
li $s1, 1
add $s0, $t0, $t0
addi $s0, $s0, 5
j output
greater:
li $s1, 3
li $t1, 10
sub $s0, $t1, $t0
output:
${print("resultMsg", "$s0")}
${end}`,
  },
  {
    id: 4,
    title: "Жыл мезгілі",
    short: "Мезгіл",
    description:
      "Айды таңда. MIPS тармақтары қыс, көктем, жаз немесе күз бағытын анықтайды.",
    inputs: [{ name: "Ай", value: 10 }],
    registers: ["$s0"],
    code:
      header +
      `.data
winterMsg: .asciiz "Winter"
springMsg: .asciiz "Spring"
summerMsg: .asciiz "Summer"
autumnMsg: .asciiz "Autumn"
errorMsg: .asciiz "Error: month must be 1..12"
.text
.globl main
main:
${read("$t0")}
blt $t0, 1, invalid
bgt $t0, 12, invalid
beq $t0, 12, winter
ble $t0, 2, winter
ble $t0, 5, spring
ble $t0, 8, summer
li $s0, 4
la $a0, autumnMsg
j output
winter:
li $s0, 1
la $a0, winterMsg
j output
spring:
li $s0, 2
la $a0, springMsg
j output
summer:
li $s0, 3
la $a0, summerMsg
j output
invalid:
li $s0, -1
la $a0, errorMsg
output:
li $v0, 4
syscall
${end}`,
  },
  {
    id: 5,
    title: "Бүтін сан калькуляторы",
    short: "Калькулятор",
    description:
      "Амал коды: 1 = +, 2 = −, 3 = ×, 4 = ÷. Бөлінді нөлге қарай дөңгелектенеді; қалдықтың таңбасы бөлінгішпен бірдей.",
    inputs: [
      { name: "a", value: 24 },
      { name: "b", value: 7 },
      { name: "Амал", value: 4 },
    ],
    registers: ["$s0", "$s1"],
    code:
      header +
      `.data
resultMsg: .asciiz "Result / quotient: "
remMsg: .asciiz "\\nRemainder: "
zeroMsg: .asciiz "Error: division by zero"
opMsg: .asciiz "Error: operation must be 1..4"
.text
.globl main
main:
${read("$t0")}
${read("$t1")}
${read("$t2")}
li $s1, 0
beq $t2, 1, plus
beq $t2, 2, minus
beq $t2, 3, multiply
beq $t2, 4, divide
la $a0, opMsg
j error
plus:
add $s0, $t0, $t1
j output
minus:
sub $s0, $t0, $t1
j output
multiply:
mul $s0, $t0, $t1
j output
divide:
beq $t1, $zero, zero_error
div $t0, $t1
mflo $s0
mfhi $s1
j output
zero_error:
la $a0, zeroMsg
error:
li $v0, 4
syscall
j done
output:
${print("resultMsg", "$s0")}
${print("remMsg", "$s1")}
done:
${end}`,
  },
];
export const seasons = ["", "Қыс", "Көктем", "Жаз", "Күз"];
export const supported =
  "li, la, move, add, addi, addu, addiu, sub, subu, mul, mult, div, mflo, mfhi, slt, slti, and, andi, or, ori, xor, sll, srl, lw, sw, beq, bne, bge, bgt, ble, blt, bgez, bltz, j, nop, syscall";
