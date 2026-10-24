/**
 * Monte-Carlo check of every game's return-to-player using the real outcome code.
 * Usage: npm run simulate [rounds]
 */
import { generateCrashPoint } from "../src/lib/games/aviator";
import { COLOR_META, MIXED_ODDS, NUMBER_ODDS, settleColorBet, type ColorBet, type ColorKey } from "../src/lib/games/color-prediction";
import { OUTSIDE_BETS, settleWheelBet, WHEEL_SEGMENTS, type WheelBet } from "../src/lib/games/number-wheel";
import { floatFromSeed, newSeed } from "../src/server/fair";

const N = Number(process.argv[2] ?? 300_000);
const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const seed = newSeed();
let counter = 0;
/** Same derivation the live server uses. */
const draw = () => floatFromSeed(seed, "sim", counter++);

console.log(`Simulating ${N.toLocaleString()} rounds per game using the production outcome functions\n`);

// ---- Aviator
console.log("AVIATOR (configured RTP 97%): cash-out at a fixed multiplier every round");
const crashes: number[] = [];
for (let i = 0; i < N; i++) crashes.push(generateCrashPoint(draw, 0.97));
for (const target of [1.2, 1.5, 2, 3, 5, 10, 50, 100]) {
  const wins = crashes.filter((c) => c >= target).length;
  console.log(`  cash out at ${String(target).padEnd(5)}x  win rate ${pct(wins / N).padStart(7)}  return to player ${pct((wins * target) / N)}`);
}
console.log(`  instant crashes at 1.00x: ${pct(crashes.filter((c) => c === 1).length / N)}`);

// ---- Color Prediction
console.log("\nCOLOR PREDICTION: staking 1 on each option every round");
const colorResults = Array.from({ length: N }, () => Math.floor(draw() * 10));
const colorBets: [string, ColorBet][] = [
  ...(["red", "green", "violet"] as ColorKey[]).map((c) => [c, { kind: "color", value: c, amount: 100 }] as [string, ColorBet]),
  ["number 7", { kind: "number", value: 7, amount: 100 }],
];
for (const [name, bet] of colorBets) {
  const paid = colorResults.reduce((a, r) => a + settleColorBet(bet, r), 0);
  console.log(`  ${name.padEnd(9)} return to player ${pct(paid / (N * 100))}`);
}
const dist = Array(10).fill(0);
for (const r of colorResults) dist[r]++;
console.log(`  result frequency (expect 10% each): ${dist.map((d) => (d / N * 100).toFixed(1)).join(" ")}`);
void COLOR_META; void MIXED_ODDS; void NUMBER_ODDS;

// ---- Number Wheel
console.log("\nNUMBER WHEEL: staking 1 on each option every round");
const wheelResults = Array.from({ length: N }, () => Math.floor(draw() * WHEEL_SEGMENTS));
const wheelBets: [string, WheelBet][] = [
  ...OUTSIDE_BETS.map((o) => [o.label, { kind: "outside", value: o.id, amount: 100 }] as [string, WheelBet]),
  ["number 7", { kind: "number", value: 7, amount: 100 }],
];
for (const [name, bet] of wheelBets) {
  const paid = wheelResults.reduce((a, r) => a + settleWheelBet(bet, r), 0);
  console.log(`  ${name.padEnd(9)} return to player ${pct(paid / (N * 100))}`);
}
const wd = Array(WHEEL_SEGMENTS).fill(0);
for (const r of wheelResults) wd[r]++;
console.log(`  result frequency (expect ${(100 / WHEEL_SEGMENTS).toFixed(1)}% each): ${wd.map((d) => (d / N * 100).toFixed(1)).join(" ")}`);

// ---- Independence: the outcome must not depend on bets (it is derived from the seed only)
console.log("\nOutcome is a pure function of (seed, game, round); no bet data is an input.");
