/**
 * Load test: N players all betting in the same Aviator, Color and Wheel rounds.
 * 1) seed:  DATABASE_PATH=/tmp/load.db npx tsx scripts/seed-load.ts 3000 /tmp/load-cookies.json
 * 2) start the server with the same DATABASE_PATH
 * 3) BASE=http://localhost:3100 node scripts/loadtest.mjs /tmp/load-cookies.json
 */
import fs from "node:fs";
import { io } from "socket.io-client";

const B = process.env.BASE ?? "http://localhost:3000";
const cookies = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)] ?? 0;

const t0 = Date.now();
const socks = [];
for (let i = 0; i < cookies.length; i += 100) {
  await Promise.all(
    cookies.slice(i, i + 100).map(
      (c) =>
        new Promise((res) => {
          const s = io(B, { extraHeaders: { cookie: c }, transports: ["websocket"], reconnection: false });
          s.on("connect", () => { socks.push(s); res(); });
          s.on("connect_error", () => res());
        }),
    ),
  );
}
console.log(`connected ${socks.length}/${cookies.length} sockets in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const g of ["aviator", "color-prediction", "number-wheel"]) socks.forEach((s) => s.emit("join", { game: g }));

const state = { av: null, color: null, wheel: null };
socks[0].on("aviator:state", (x) => (state.av = x));
socks[0].on("aviator:phase", (x) => (state.av = x));
socks[0].on("color:state", (x) => (state.color = x));
socks[0].on("color:phase", (x) => (state.color = x));
socks[0].on("wheel:state", (x) => (state.wheel = x));
socks[0].on("wheel:phase", (x) => (state.wheel = x));
await sleep(2000);

const lat = [];
const timed = (s, ev, p) => new Promise((res) => { const t = performance.now(); s.emit(ev, p, (a) => { lat.push(performance.now() - t); res(a); }); });
const stakes = [10, 20, 50, 100];
const colors = ["red", "green", "violet"];

// wait for fresh betting windows
const wait = async (fn, ms = 90000) => { const t = Date.now(); while (Date.now() - t < ms && !fn()) await sleep(100); };
await wait(() => state.color?.phase === "betting" && state.color.lockAt - Date.now() > 15000);
await wait(() => state.wheel?.phase === "betting" && state.wheel.bettingEndsAt - Date.now() > 12000);
const balances = new Map();
socks.forEach((s, i) => s.on("balance", (x) => balances.set(i, x.balance)));

console.log("everyone bets on Color and Wheel…");
let ok = 0, refused = 0;
const t1 = Date.now();
await Promise.all(socks.map(async (s, i) => {
  await sleep(Math.random() * 6000);
  const a = await timed(s, "color:bet", { bet: i % 3 === 0 ? { kind: "number", value: i % 10, amount: stakes[i % 4] } : { kind: "color", value: colors[i % 3], amount: stakes[i % 4] } });
  a.ok ? ok++ : refused++;
  const b = await timed(s, "wheel:bet", { bet: { kind: "outside", value: ["even", "odd", "low", "high"][i % 4], amount: stakes[(i + 1) % 4] } });
  b.ok ? ok++ : refused++;
}));
console.log(`color+wheel bets: ${ok} accepted, ${refused} refused, placed in ${((Date.now() - t1) / 1000).toFixed(1)}s`);
console.log(`ack latency ms  p50 ${pct(lat, 0.5).toFixed(0)}  p95 ${pct(lat, 0.95).toFixed(0)}  max ${Math.max(...lat).toFixed(0)}`);

await wait(() => state.av?.phase === "betting" && state.av.bettingEndsAt - Date.now() > 20000, 90000);
console.log("everyone bets on Aviator…");
const al = [];
await Promise.all(socks.map(async (s, i) => {
  await sleep(Math.random() * 8000);
  const t = performance.now();
  const a = await new Promise((res) => s.emit("aviator:bet", { amount: stakes[i % 4], autoCash: [1.2, 1.5, 2, 3, 5][i % 5] }, res));
  al.push(performance.now() - t);
  a.ok ? ok++ : refused++;
}));
console.log(`aviator ack latency ms p50 ${pct(al, 0.5).toFixed(0)} p95 ${pct(al, 0.95).toFixed(0)} max ${Math.max(...al).toFixed(0)}`);
console.log(`players in aviator round: ${state.av?.totalPlayers}, stake ${state.av?.totalStake}`);

// event-loop health while rounds settle
const gaps = []; let prev = performance.now();
const probe = setInterval(() => { const n = performance.now(); gaps.push(n - prev - 100); prev = n; }, 100);
await wait(() => state.av?.phase === "crashed", 120000);
await sleep(8000);
clearInterval(probe);
console.log(`client event-loop lag during settlement: max ${Math.max(...gaps).toFixed(0)}ms`);
const got = [...balances.values()].length;
console.log(`balance updates received by ${got} players. crash point ${state.av?.crashPoint}x`);
socks.forEach((s) => s.close());
process.exit(0);
