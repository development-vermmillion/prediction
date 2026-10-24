/**
 * End-to-end test against a running server.
 *   BASE=http://localhost:3100 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/e2e.mjs
 * Takes about 3 minutes (it waits for real Aviator/Color/Wheel rounds).
 */
import { createHash, createHmac } from "node:crypto";
import { io } from "socket.io-client";

const B = process.env.BASE ?? "http://localhost:3000";
const OWNER = { email: process.env.ADMIN_EMAIL ?? "admin@predicators.com", password: process.env.ADMIN_PASSWORD ?? "admin123" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};

async function call(method, path, body, cookie) {
  const r = await fetch(B + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const cookies = (r.headers.getSetCookie?.() ?? []).map((x) => x.split(";")[0]).join("; ");
  return { status: r.status, body: await r.json().catch(() => ({})), cookie: cookies };
}
const connect = (cookie) =>
  new Promise((res) => {
    const s = io(B, { extraHeaders: { cookie }, transports: ["websocket"], reconnection: false });
    s.on("connect", () => res(s));
    s.on("connect_error", () => res(null));
  });
const ack = (s, ev, p) => new Promise((res) => s.emit(ev, p, res));
const sha = (t) => createHash("sha256").update(t).digest("hex");
const floatOf = (seed, game, n) => parseInt(createHmac("sha256", seed).update(`${game}:${n}`).digest("hex").slice(0, 13), 16) / 2 ** 52;
const stamp = Date.now().toString(36);

// ---------- setup
const owner = await call("POST", "/api/auth/login", OWNER);
check("owner can sign in", owner.status === 200 && owner.body.user?.role === "admin");
const players = [];
for (const n of ["p1", "p2", "p3", "p4"]) {
  const r = await call("POST", "/api/auth/register", { name: `${n}${stamp}`, email: `${n}${stamp}@t.com`, password: "password123" });
  players.push({ ...r.body.user, cookie: r.cookie });
}
check("4 players registered", players.every((p) => p.id));
const bad = await call("POST", "/api/auth/login", { email: players[0].email, password: "wrong-password" });
check("wrong password rejected", bad.status === 401);
check("player cannot open admin API", (await call("GET", "/api/admin/users", null, players[0].cookie)).status === 403);
check("anonymous cannot open admin API", (await call("GET", "/api/admin/users")).status === 401);
check("socket without login is rejected", (await connect("")) === null);

// ---------- credits
const grant = (p, amount) => call("POST", `/api/admin/users/${p.id}/credits`, { amount, note: "e2e" }, owner.cookie);
for (const p of players) await grant(p, 5000);
check("owner granted 5,000 each", (await call("GET", "/api/auth/me", null, players[0].cookie)).body.user.balance === 5000);
check("cannot deduct below zero", (await grant(players[0], -999999)).status === 400);
check("fractional amount rejected", (await grant(players[0], 10.5)).status === 400);
check("player cannot grant credits to self", (await call("POST", `/api/admin/users/${players[0].id}/credits`, { amount: 100 }, players[0].cookie)).status === 403);

const socks = await Promise.all(players.map((p) => connect(p.cookie)));
check("4 sockets connected", socks.every(Boolean));
const bal = players.map(() => 0);
socks.forEach((s, i) => s.on("balance", (x) => (bal[i] = x.balance)));
for (const g of ["aviator", "color-prediction", "number-wheel", "ludo"]) socks.forEach((s) => s.emit("join", { game: g }));
await sleep(800);

// ---------- stake rules on every game
const invalid = [0, 5, 15, 30, 150, 1050, -10, 1e9, "100", null];
let stakeOk = true;
for (const a of invalid) {
  const r1 = await ack(socks[3], "color:bet", { bet: { kind: "color", value: "red", amount: a } });
  const r2 = await ack(socks[3], "wheel:bet", { bet: { kind: "outside", value: "even", amount: a } });
  if (r1.ok || r2.ok) stakeOk = false;
  await sleep(60);
}
check("invalid stakes refused (color + wheel)", stakeOk);

// ---------- exposure limit
await call("PUT", "/api/admin/games", { game: "color-prediction", maxExposure: 1000 }, owner.cookie);
const capped = await ack(socks[3], "color:bet", { bet: { kind: "number", value: 3, amount: 500 } });
check("round exposure limit refuses a bet that could cost the house too much", !capped.ok && /limit/i.test(capped.error ?? ""), capped.error);
await call("PUT", "/api/admin/games", { game: "color-prediction", maxExposure: 500000 }, owner.cookie);

// ---------- shared rounds: color + wheel + aviator in parallel
const seen = { color: {}, wheel: {}, av: {} };
const colorRes = {}; // per round: { result, seed } as seen by each player
const wheelRes = {};
socks.forEach((s, i) => {
  s.on("color:state", (x) => (seen.color[i] = { ...seen.color[i], commit: x.commit, roundNo: x.roundNo }));
  s.on("color:phase", (x) => (seen.color[i] = { ...seen.color[i], commit: x.commit, roundNo: x.roundNo }));
  s.on("color:result", (x) => ((colorRes[x.roundNo] ??= {})[i] = { result: x.result, seed: x.seed }));
  s.on("wheel:state", (x) => (seen.wheel[i] = { ...seen.wheel[i], commit: x.commit, roundNo: x.roundNo }));
  s.on("wheel:phase", (x) => {
    seen.wheel[i] = { ...seen.wheel[i], commit: x.commit, roundNo: x.roundNo };
    if (x.seed && x.result != null) ((wheelRes[x.roundNo] ??= {})[i] = { result: x.result, seed: x.seed, commit: x.commit });
  });
  s.on("aviator:state", (x) => (seen.av[i] = { ...seen.av[i], ...x }));
  s.on("aviator:phase", (x) => (seen.av[i] = { ...seen.av[i], ...x }));
  s.on("aviator:cashed", (x) => (seen.av[i] = { ...seen.av[i], cashed: x }));
});
socks.forEach((s) => { s.emit("join", { game: "color-prediction" }); s.emit("join", { game: "number-wheel" }); s.emit("join", { game: "aviator" }); });
await sleep(1000);

// wait for the next betting window of each game
const until = async (fn, ms = 90000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await sleep(100); } return false; };
await until(() => seen.color[0]?.commit);
const colorCommit = seen.color[0].commit, colorRound = seen.color[0].roundNo;
check("all players see the same Color round and fingerprint", [0, 1, 2, 3].every((i) => seen.color[i]?.commit === colorCommit && seen.color[i]?.roundNo === colorRound));
const wheelRoundAtBet = seen.wheel[0]?.roundNo;
const placed = await Promise.all([
  ack(socks[0], "color:bet", { bet: { kind: "color", value: "red", amount: 50 } }),
  ack(socks[1], "color:bet", { bet: { kind: "color", value: "green", amount: 100 } }),
  ack(socks[2], "color:bet", { bet: { kind: "number", value: 4, amount: 10 } }),
  ack(socks[0], "wheel:bet", { bet: { kind: "outside", value: "high", amount: 20 } }),
  ack(socks[1], "wheel:bet", { bet: { kind: "number", value: 5, amount: 10 } }),
]);
check("Color and Wheel bets accepted from several players", placed.every((r) => r.ok), JSON.stringify(placed.map((r) => r.ok)));

// Aviator: join during betting, bets from all four, one manual cash-out, one auto cash-out, one no cash-out
await until(() => seen.av[0]?.phase === "betting" && seen.av[0]?.bettingEndsAt - Date.now() > 5000, 80000);
const avCommit = seen.av[0].commit, avRound = seen.av[0].roundId;
check("all players see the same Aviator round and fingerprint", [0, 1, 2, 3].every((i) => seen.av[i]?.commit === avCommit && seen.av[i]?.roundId === avRound));
const ab = await Promise.all([
  ack(socks[0], "aviator:bet", { amount: 100 }),
  ack(socks[1], "aviator:bet", { amount: 20, autoCash: 1.1 }),
  ack(socks[2], "aviator:bet", { amount: 50, autoCash: 1000 }),
  ack(socks[3], "aviator:bet", { amount: 10 }),
]);
check("4 players bet on the same Aviator round", ab.every((r) => r.ok));
check("a second Aviator bet in the same round is refused", !(await ack(socks[0], "aviator:bet", { amount: 10 })).ok);
check("cash-out is refused when the plane is not flying", !(await ack(socks[3], "aviator:cashout", {})).ok);

// Wait for flight, then try manual cash-out for player 0 at ~1.3x
await until(() => seen.av[0]?.phase === "flying", 90000);
let manual = null;
const t0 = Date.now();
while (Date.now() - t0 < 20000 && seen.av[0]?.phase === "flying" && !manual) {
  const m = Math.exp(0.00016 * (Date.now() - seen.av[0].startedAt));
  if (m >= 1.3) manual = await ack(socks[0], "aviator:cashout", {});
  await sleep(40);
}
check("manual cash-out works (or the plane had already crashed)", manual === null ? true : manual.ok === true || /already|crash|late/i.test(manual.error ?? ""), manual ? JSON.stringify(manual).slice(0, 80) : "plane crashed first");
const lateBet = await ack(socks[3], "aviator:bet", { amount: 10 });
check("bets refused once the plane has taken off", !lateBet.ok || seen.av[0].phase !== "flying");

await until(() => seen.av[0]?.phase === "crashed" && seen.av[0]?.seed, 90000);
const av = seen.av[0];
check("Aviator seed matches the fingerprint shown before betting", sha(av.seed) === avCommit);
const rtpUsed = 0.97;
const f = floatOf(av.seed, "aviator", avRound);
const expectedCrash = Math.min(1000, Math.floor((rtpUsed / (1 - f)) * 100) / 100);
const expected = expectedCrash < 1 ? 1 : expectedCrash;
check("Aviator crash point is reproducible from the revealed seed", Math.abs(expected - av.crashPoint) < 0.011, `${av.crashPoint}x`);
check("every player saw the same crash point", [0, 1, 2, 3].every((i) => seen.av[i]?.crashPoint === av.crashPoint));

// Color / wheel results
await until(() => Object.keys(colorRes[colorRound] ?? {}).length === 4, 60000);
const cr = colorRes[colorRound] ?? {};
const c = cr[0];
check("Color: same result for everyone", !!c && [0, 1, 2, 3].every((i) => cr[i]?.result === c.result));
check("Color: seed matches fingerprint and reproduces the result", !!c && sha(c.seed) === colorCommit && Math.floor(floatOf(c.seed, "color-prediction", colorRound) * 10) === c.result, `result ${c?.result}`);
const wheelRound = wheelRoundAtBet;
await until(() => Object.keys(wheelRes[wheelRound] ?? {}).length === 4, 60000);
const wr = wheelRes[wheelRound] ?? {};
const w = wr[0];
check("Wheel: same result for everyone", !!w && [0, 1, 2, 3].every((i) => wr[i]?.result === w.result));
check("Wheel: seed matches fingerprint and reproduces the result", !!w && sha(w.seed) === w.commit && Math.floor(floatOf(w.seed, "number-wheel", wheelRound) * 12) === w.result, `result ${w?.result}`);

// public fairness API
await sleep(800);
const fair = await call("GET", "/api/fairness?game=color-prediction");
const row = fair.body.rounds?.find((r) => r.roundNo === colorRound);
check("public Fairness page data lists the round with its seed", !!row && sha(row.seed) === row.commit);

// ---------- ludo, four players
const tables = [null, null, null, null];
socks.forEach((s, i) => s.on("ludo:table", (t) => (tables[i] = t)));
await Promise.all(socks.map((s) => ack(s, "ludo:leave", {})));
await sleep(300);
const balBefore = [...bal];
const created = await ack(socks[0], "ludo:create", { size: 4, stake: 20 });
check("Ludo: 4-player table created", created.ok);
await sleep(300);
const tid = tables[0]?.id;
for (let i = 1; i < 4; i++) check(`Ludo: player ${i + 1} joined`, (await ack(socks[i], "ludo:join", { tableId: tid })).ok);
await sleep(500);
check("Ludo: game starts when 4 seats are full", tables[0]?.status === "playing" && tables[0]?.seats.length === 4);
let guard = 0, last = "";
const ids = players.map((p) => p.id);
while (tables[0]?.status !== "finished" && guard++ < 6000) {
  const t = tables[0];
  const g = t?.game;
  if (!g) { await sleep(50); continue; }
  const seat = t.seats.find((s) => s.color === g.turn);
  const idx = ids.indexOf(seat.userId);
  const key = JSON.stringify([g.turn, g.phase, g.roll, g.tokens[g.turn]]);
  if (key === last) { await sleep(25); continue; }
  last = key;
  if (g.phase === "roll") await ack(socks[idx], "ludo:roll", {});
  else await ack(socks[idx], "ludo:move", { token: g.legal[Math.floor(Math.random() * g.legal.length)] });
  await sleep(30);
}
await sleep(600);
const T = tables[0];
check("Ludo: 4-player game finished with a winner", T?.status === "finished" && !!T.winner, `winner ${T?.winner}`);
const winnerIdx = ids.indexOf(T.seats.find((s) => s.color === T.winner)?.userId);
const deltas = bal.map((b, i) => b - balBefore[i]);
check("Ludo: winner is up 52 net (pot 80 minus 10% fee = 72, minus own 20 stake)", deltas[winnerIdx] === 52, `winner change ${deltas[winnerIdx]}`);
check("Ludo: the three others each lost their 20", deltas.every((d, i) => i === winnerIdx || d === -20), JSON.stringify(deltas));

// ---------- moderation
const ban = await call("PATCH", `/api/admin/users/${players[3].id}`, { status: "banned" }, owner.cookie);
check("owner can ban a player", ban.status === 200);
await sleep(500);
check("banned player is disconnected", socks[3].connected === false);
check("banned player cannot sign in", (await call("POST", "/api/auth/login", { email: players[3].email, password: "password123" })).status !== 200);
await call("PUT", "/api/admin/games", { game: "number-wheel", enabled: false }, owner.cookie);
const closed = await ack(socks[0], "wheel:bet", { bet: { kind: "outside", value: "odd", amount: 10 } });
check("a closed game refuses bets", !closed.ok && /closed|betting/i.test(closed.error ?? ""), closed.error);
await call("PUT", "/api/admin/games", { game: "number-wheel", enabled: true }, owner.cookie);

// ---------- money conservation: each player's balance equals the sum of their ledger rows
let conserved = true;
for (let i = 0; i < 3; i++) {
  const h = await call("GET", "/api/wallet/history", null, players[i].cookie);
  const me = await call("GET", "/api/auth/me", null, players[i].cookie);
  const sum = h.body.transactions.reduce((a, t) => a + t.amount, 0);
  if (sum !== me.body.user.balance) conserved = false;
}
check("every balance equals the sum of its ledger (no credits created or lost)", conserved);

socks.forEach((s) => s.close());
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
