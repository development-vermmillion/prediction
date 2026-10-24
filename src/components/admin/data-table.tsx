"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Text used by the search box. */
  searchText?: (row: T) => string;
  toolbar?: React.ReactNode;
  pageSize?: number;
}

export function DataTable<T>({ rows, columns, rowKey, searchText, toolbar, pageSize = 10 }: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchText) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <GlassCard className="overflow-hidden">
      {(searchText || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          {searchText && (
            <label className="glass flex min-w-52 flex-1 items-center gap-2 rounded-xl px-3 py-2 md:max-w-xs">
              <Search size={16} className="text-white/50" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
              />
            </label>
          )}
          {toolbar}
        </div>
      )}
      <div className="admin-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs tracking-wider text-white/45 uppercase">
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-semibold", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {slice.map((row) => (
              <tr key={rowKey(row)} className="transition hover:bg-white/5">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-white/45">
                  Nothing matches your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/55">
        <span>
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="cursor-pointer rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="tabular-nums">
            {safePage + 1} / {pages}
          </span>
          <button
            aria-label="Next page"
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
            className="cursor-pointer rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
