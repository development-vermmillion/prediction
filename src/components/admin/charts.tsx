"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "@/lib/utils";
import type { DailyStat } from "@/types";

const tooltipStyle = {
  background: "rgba(20,13,38,0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 14,
  color: "#fff",
  fontSize: 13,
};
const axis = { fill: "rgba(255,255,255,0.45)", fontSize: 12 };

export function RevenueChart({ data }: { data: DailyStat[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="g-wager" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5c9a" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ff5c9a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-paid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCompact(Number(v))} />
          <Area type="monotone" dataKey="wagered" name="Wagered" stroke="#ff5c9a" strokeWidth={2.5} fill="url(#g-wager)" />
          <Area type="monotone" dataKey="paidOut" name="Paid out" stroke="#22d3ee" strokeWidth={2.5} fill="url(#g-paid)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UsersChart({ data }: { data: DailyStat[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="newUsers" name="New players" fill="#a78bfa" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GameSplitChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCompact(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid w-full grid-cols-2 gap-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-white/70">
            <span className="size-3 rounded-full" style={{ background: d.color }} /> {d.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
