"use client";

import { useEffect, useState } from "react";
import { Crown, Dices, Hourglass, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { GlassCard } from "@/components/ui/glass-card";
import { StakeInput } from "@/components/ui/stepper";
import { useGameConfig } from "@/hooks/use-game-config";
import { useGameSocket, useServerClock } from "@/hooks/use-game-socket";
import {
  BOARD_SIZE,
  cellFor,
  FINISH_STEP,
  HOME_COLUMN,
  PLAYER_META,
  PLAYER_ORDER,
  TRACK,
  TURN_MS,
  YARD_SLOTS,
  type LudoGameState,
  type LudoSize,
} from "@/lib/games/ludo";
import { emitAck } from "@/lib/socket";
import { cn, formatCoins } from "@/lib/utils";
import { useSession } from "@/store/session";
import { toast } from "@/store/toast";
import type { PlayerColor } from "@/types";

interface LobbyTable {
  id: string;
  size: LudoSize;
  stake: number;
  prize: number;
  seats: { color: PlayerColor; name: string }[];
}
interface TableState {
  id: string;
  size: LudoSize;
  stake: number;
  status: "waiting" | "playing" | "finished";
  prize: number;
  seats: { color: PlayerColor; userId: number; name: string; idle: number }[];
  game: LudoGameState | null;
  deadline: number;
  serverTime: number;
  winner: PlayerColor | null;
}

const S = 40;

export function LudoGame() {
  const clock = useServerClock();
  const [lobby, setLobby] = useState<LobbyTable[]>([]);
  const [table, setTable] = useState<TableState | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const connected = useGameSocket("ludo", {
    "ludo:lobby": (p: { tables: LobbyTable[] }) => setLobby(p.tables),
    "ludo:table": (t: TableState | null) => {
      if (t) clock.sync(t.serverTime);
      setTable(t);
    },
  });

  if (table && dismissed !== table.id) {
    return <TableView table={table} clock={clock} onClose={() => setDismissed(table.id)} />;
  }
  return <Lobby tables={lobby} connected={connected} />;
}

/* ------------------------------------------------------------------ */
/* Lobby                                                               */
/* ------------------------------------------------------------------ */

function Lobby({ tables, connected }: { tables: LobbyTable[]; connected: boolean }) {
  const me = useSession((s) => s.user)!;
  const cfg = useGameConfig("ludo");
  const [size, setSize] = useState<LudoSize>(2);
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const res = await emitAck("ludo:create", { size, stake });
    if (!res.ok) toast.error("Could not open table", res.error);
    setBusy(false);
  };
  const join = async (id: string) => {
    setBusy(true);
    const res = await emitAck("ludo:join", { tableId: id });
    if (!res.ok) toast.error("Could not join", res.error);
    setBusy(false);
  };

  const prize = stake * size - Math.floor((stake * size * cfg.rake) / 100);

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <GlassCard strong className="h-fit space-y-5 p-5" glow="rgb(255 200 61 / 0.3)">
        <h2 className="text-lg font-bold">Open a table</h2>
        <div className="grid grid-cols-2 gap-3">
          {([2, 4] as LudoSize[]).map((n) => (
            <button
              key={n}
              onClick={() => setSize(n)}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 text-center transition active:scale-95",
                size === n ? "border-white/70 bg-white/15" : "border-white/10 bg-white/5",
              )}
            >
              <span className="block font-display text-2xl font-black">{n}</span>
              <span className="text-sm text-white/55">players</span>
            </button>
          ))}
        </div>
        <StakeInput value={stake} onChange={setStake} color="#ffc83d" min={cfg.minBet} max={cfg.maxBet} />
        <div className="glass flex items-center justify-between rounded-2xl p-3 text-sm">
          <span className="text-white/60">Winner takes</span>
          <span className="flex items-center gap-1.5 font-display text-lg font-bold text-brand-gold">
            {formatCoins(prize)} <Coin size={16} />
          </span>
        </div>
        <p className="text-xs text-white/45">
          Your stake is held when you open or join a table. The winner takes the pot after a {cfg.rake}% house fee.
        </p>
        <Button full size="lg" variant="gold" disabled={busy || !connected || !cfg.enabled || me.balance < stake} onClick={create}>
          <Dices size={20} /> Open {size}-player table · {formatCoins(stake)}
        </Button>
        {me.balance < stake && <p className="text-center text-sm text-white/55">Not enough credits for this stake.</p>}
        {!cfg.enabled && <p className="text-center text-sm text-brand-gold">Ludo is temporarily closed by the owner.</p>}
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="mb-4 flex items-center justify-between text-lg font-bold">
          Open tables <span className="text-sm font-normal text-white/50">{tables.length} waiting</span>
        </h2>
        {tables.length === 0 ? (
          <p className="py-14 text-center text-white/50">No open tables yet — open one and wait for opponents.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {tables.map((t) => (
              <li key={t.id} className="glass rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Users size={16} /> {t.seats.length}/{t.size} players
                  </span>
                  <span className="flex items-center gap-1 font-display font-bold">
                    {formatCoins(t.stake)} <Coin size={14} />
                  </span>
                </div>
                <div className="mb-4 flex gap-2">
                  {Array.from({ length: t.size }, (_, i) => {
                    const seat = t.seats[i];
                    return seat ? (
                      <span key={i} title={seat.name} className="size-8 rounded-full ring-2 ring-white/40" style={{ background: PLAYER_META[seat.color].hex }} />
                    ) : (
                      <span key={i} className="size-8 rounded-full border border-dashed border-white/30" />
                    );
                  })}
                </div>
                <p className="mb-3 text-xs text-white/50">Prize {formatCoins(t.prize)} · {t.seats.map((s) => s.name).join(", ")}</p>
                <Button full size="sm" variant="success" disabled={busy || !connected || me.balance < t.stake} onClick={() => join(t.id)}>
                  Join · {formatCoins(t.stake)}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table (waiting room + live board)                                   */
/* ------------------------------------------------------------------ */

function TableView({ table, clock, onClose }: { table: TableState; clock: ReturnType<typeof useServerClock>; onClose: () => void }) {
  const me = useSession((s) => s.user)!;
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const g = table.game;
  const mySeat = table.seats.find((s) => s.userId === me.id);
  const myTurn = !!g && !g.winner && g.turn === mySeat?.color;
  const secondsLeft = Math.max(0, Math.ceil((table.deadline - clock.now()) / 1000));

  const roll = async () => {
    const res = await emitAck("ludo:roll");
    if (!res.ok) toast.error("Cannot roll", res.error);
  };
  const move = async (token: number) => {
    const res = await emitAck("ludo:move", { token });
    if (!res.ok) toast.error("Cannot move", res.error);
  };
  const leave = async () => {
    const res = await emitAck("ludo:leave");
    if (!res.ok) toast.error("Cannot leave", res.error);
  };

  /* ---- waiting room ---- */
  if (table.status === "waiting" || !g) {
    return (
      <GlassCard strong className="mx-auto max-w-lg p-8 text-center" glow="rgb(255 200 61 / 0.3)">
        <Hourglass className="mx-auto mb-3 text-brand-gold" size={36} />
        <h2 className="text-xl font-extrabold">Waiting for players</h2>
        <p className="mt-1 text-sm text-white/55">
          {table.seats.length}/{table.size} seated · stake {formatCoins(table.stake)} · prize {formatCoins(table.prize)}
        </p>
        <div className="my-6 flex justify-center gap-4">
          {Array.from({ length: table.size }, (_, i) => {
            const seat = table.seats[i];
            return (
              <div key={i} className="text-center">
                {seat ? (
                  <span className="mx-auto grid size-14 place-items-center rounded-full ring-2 ring-white/50" style={{ background: PLAYER_META[seat.color].hex }}>
                    <Avatar name={seat.name} size={36} />
                  </span>
                ) : (
                  <span className="mx-auto block size-14 rounded-full border border-dashed border-white/30" />
                )}
                <p className="mt-2 max-w-20 truncate text-xs text-white/60">{seat ? (seat.userId === me.id ? "You" : seat.name) : "Open"}</p>
              </div>
            );
          })}
        </div>
        <Button variant="glass" onClick={leave}>
          Leave table (refund stake)
        </Button>
      </GlassCard>
    );
  }

  /* ---- board ---- */
  const colors = g.colors;
  const cellKey = (c: PlayerColor, i: number) => {
    const [x, y] = cellFor(c, g.tokens[c][i], i);
    return `${x},${y}`;
  };
  const stacks = new Map<string, number>();
  const stackIndex: Record<string, number> = {};
  for (const c of colors)
    for (let i = 0; i < g.tokens[c].length; i++) {
      if (g.tokens[c][i] < 0) continue;
      const k = cellKey(c, i);
      stackIndex[`${c}${i}`] = stacks.get(k) ?? 0;
      stacks.set(k, (stacks.get(k) ?? 0) + 1);
    }

  const cellColor = (c: number, r: number): string | null => {
    for (const p of colors) {
      if (HOME_COLUMN[p].some(([hc, hr]) => hc === c && hr === r)) return PLAYER_META[p].hex;
      const [sc, sr] = TRACK[PLAYER_META[p].start];
      if (sc === c && sr === r) return PLAYER_META[p].hex;
    }
    return null;
  };
  const isTrack = (c: number, r: number) => TRACK.some(([tc, tr]) => tc === c && tr === r);

  const winnerSeat = table.seats.find((s) => s.color === g.winner);
  const iWon = !!winnerSeat && winnerSeat.userId === me.id;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <GlassCard strong className="p-4 md:p-6" glow="rgb(255 200 61 / 0.3)">
        <svg viewBox={`0 0 ${BOARD_SIZE * S} ${BOARD_SIZE * S}`} className="mx-auto block w-full max-w-xl">
          {PLAYER_ORDER.map((p) => {
            const [x, y] = YARD_SLOTS[p][0];
            const ox = x < 7 ? 0 : 9;
            const oy = y < 7 ? 0 : 9;
            const seated = colors.includes(p) && !g.eliminated.includes(p);
            return (
              <g key={p} opacity={seated ? 1 : 0.35}>
                <rect x={ox * S + 4} y={oy * S + 4} width={6 * S - 8} height={6 * S - 8} rx={22} fill={PLAYER_META[p].hex} fillOpacity={0.22} stroke={PLAYER_META[p].hex} strokeOpacity={0.6} strokeWidth={2} />
                {YARD_SLOTS[p].map(([sx, sy], i) => (
                  <circle key={i} cx={sx * S} cy={sy * S} r={S * 0.5} fill="#07050f" fillOpacity={0.5} />
                ))}
              </g>
            );
          })}
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
            const c = i % BOARD_SIZE;
            const r = Math.floor(i / BOARD_SIZE);
            const color = cellColor(c, r);
            if (!color && !isTrack(c, r)) return null;
            return <rect key={i} x={c * S + 2} y={r * S + 2} width={S - 4} height={S - 4} rx={8} fill={color ?? "#ffffff"} fillOpacity={color ? 0.75 : 0.1} stroke="#fff" strokeOpacity={0.12} />;
          })}
          <rect x={6 * S + 4} y={6 * S + 4} width={3 * S - 8} height={3 * S - 8} rx={14} fill="#ffc83d" fillOpacity={0.25} stroke="#ffc83d" />
          <text x={7.5 * S} y={7.5 * S} textAnchor="middle" dominantBaseline="central" fontSize={26}>🏁</text>

          {colors.flatMap((c) =>
            g.tokens[c].map((p, i) => {
              const [cx, cy] = cellFor(c, p, i);
              const n = stacks.get(cellKey(c, i)) ?? 1;
              const k = stackIndex[`${c}${i}`] ?? 0;
              const off = n > 1 ? (k - (n - 1) / 2) * 0.28 : 0;
              const clickable = myTurn && g.phase === "move" && g.legal.includes(i) && c === mySeat?.color;
              const done = p === FINISH_STEP;
              return (
                <g
                  key={`${c}${i}`}
                  onClick={clickable ? () => move(i) : undefined}
                  style={{
                    transform: `translate(${(cx + off) * S}px, ${(cy - off * 0.4) * S}px)`,
                    transition: "transform 450ms ease",
                    cursor: clickable ? "pointer" : "default",
                  }}
                >
                  {clickable && <circle r={S * 0.55} fill="none" stroke="#fff" strokeWidth={3} className="animate-pulse-glow" />}
                  <circle r={S * (n > 1 ? 0.28 : 0.34)} fill={PLAYER_META[c].hex} stroke="#fff" strokeWidth={3} opacity={done ? 0.55 : 1} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={n > 1 ? 11 : 14} fontWeight={800} fill="#07050f">
                    {i + 1}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
      </GlassCard>

      <div className="space-y-4">
        {g.winner && winnerSeat ? (
          <GlassCard strong className="p-5 text-center" glow={`${PLAYER_META[g.winner].hex}66`}>
            <Crown className="mx-auto mb-2 text-brand-gold" size={32} />
            <h3 className="text-xl font-extrabold">{iWon ? "You won!" : `${winnerSeat.name} wins`}</h3>
            <p className="mt-1 text-sm text-white/60">
              Prize {formatCoins(table.prize)} credits{iWon ? " added to your wallet" : ""}
            </p>
            <Button className="mt-4" full onClick={onClose}>
              Back to lobby
            </Button>
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-white/50 uppercase">{myTurn ? "Your turn" : "Waiting for"}</p>
                <p className="flex items-center gap-2 font-bold">
                  <span className="size-3 rounded-full" style={{ background: PLAYER_META[g.turn].hex }} />
                  {table.seats.find((s) => s.color === g.turn)?.name ?? PLAYER_META[g.turn].label}
                </p>
              </div>
              <div className="text-right">
                <span className="grid size-14 place-items-center rounded-2xl bg-white text-3xl font-black text-black">{g.roll ?? "–"}</span>
              </div>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (secondsLeft * 1000 / TURN_MS) * 100)}%`, background: PLAYER_META[g.turn].hex }} />
            </div>
            {myTurn && g.phase === "roll" ? (
              <Button full size="lg" variant="gold" onClick={roll}>
                <Dices size={20} /> Roll the dice · {secondsLeft}s
              </Button>
            ) : myTurn && g.phase === "move" && g.legal.length > 1 ? (
              <p className="rounded-2xl bg-white/10 p-3 text-center text-sm font-semibold">Tap a glowing token to move it · {secondsLeft}s</p>
            ) : (
              <p className="text-center text-sm text-white/55">{myTurn ? "Moving…" : `${secondsLeft}s left for their move`}</p>
            )}
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <h3 className="mb-3 flex items-center justify-between font-bold">
            Players <span className="text-xs font-normal text-white/50">pot {formatCoins(table.stake * table.seats.length)}</span>
          </h3>
          <ul className="space-y-2">
            {table.seats.map((s) => {
              const home = g.tokens[s.color].filter((p) => p === FINISH_STEP).length;
              const out = g.eliminated.includes(s.color);
              return (
                <li key={s.color} className={cn("flex items-center justify-between rounded-2xl p-2.5 text-sm", g.turn === s.color && !g.winner ? "bg-white/15" : "bg-white/5", out && "opacity-40")}>
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-3.5 rounded-full" style={{ background: PLAYER_META[s.color].hex }} />
                    {s.userId === me.id ? "You" : s.name}
                    {out && <span className="text-xs text-brand-red">forfeited</span>}
                  </span>
                  <span className="text-xs text-white/60">{home}/{g.tokens[s.color].length} home</span>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="mb-2 font-bold">Game log</h3>
          <ul className="space-y-1 text-sm text-white/65">
            {g.log.map((l, i) => (
              <li key={i} className={i === 0 ? "font-semibold text-white" : ""}>{l}</li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
