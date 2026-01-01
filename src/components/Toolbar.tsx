// src/components/Toolbar.tsx
import type { Filters, Status } from "../types/app";
import { STATUSES } from "../types/app";
import { cx } from "../lib/utils";

export default function Toolbar({
  filters,
  onChange,
  onAdd,
  theme,
  onToggleTheme,
  view,
  onChangeView,
  onShare,
  onAgent,
  onOpenAgent,
  readOnly,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onAdd: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  view: "board" | "stats";
  onChangeView: (v: "board" | "stats") => void;
  onShare: () => void;

  // projende biri kullanılıyor olabilir → ikisini de destekliyoruz
  onAgent?: () => void;
  onOpenAgent?: () => void;

  readOnly: boolean;
}) {
  const handleAgent = () => {
    if (onOpenAgent) return onOpenAgent();
    if (onAgent) return onAgent();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* LEFT: Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Job Application Tracker
        </h1>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            Stay on top of your applications — from first click to final offer.
          </span>

          {readOnly && (
            <span className="rounded-full border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/35 dark:text-indigo-200">
              Read-only (shared)
            </span>
          )}
        </div>
      </div>

      {/* CONTROLS (tablet 2 row, xl tek row) */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* ROW 1: Tabs + Search + Status */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 xl:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => onChangeView("board")}
              className={cx(btn, view === "board" && btnActive)}
            >
              Board
            </button>

            <button
              onClick={() => onChangeView("stats")}
              className={cx(btn, view === "stats" && btnActive)}
            >
              Stats
            </button>
          </div>

          <input
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            placeholder="Search company, role, location, or notes…"
            className={cx(
              // ✅ hepsi aynı yükseklik için sabit padding + text size
              "h-[44px] w-full rounded-2xl px-3.5 text-sm outline-none transition",
              // ✅ tablet/desktop width kontrolü
              "md:w-[360px] xl:w-72",
              "border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm",
              "dark:border-zinc-800/90 dark:bg-zinc-950/60"
            )}
            disabled={view !== "board"}
          />

          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as Status | "All" })
            }
            className={cx(
              "h-[44px] w-full rounded-2xl px-3.5 text-sm outline-none transition",
              "md:w-[190px]",
              "border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm",
              "dark:border-zinc-800/90 dark:bg-zinc-950/60"
            )}
            disabled={view !== "board"}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* ROW 2: Actions */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end xl:justify-end xl:items-center">
          <button onClick={onToggleTheme} className={btn}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          <button onClick={handleAgent} className={btn}>
            Agent
          </button>

          <button onClick={onShare} className={btn}>
            Share
          </button>

          <button
            onClick={onAdd}
            className={cx(
              primary,
              // mobilde full, tablet/desktop auto
              "w-full md:w-auto md:ml-3",
              readOnly && "opacity-50 pointer-events-none"
            )}
          >
            + Add Job
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ Buton yüksekliklerini sabitledik:
 * - h-[44px]
 * - px/py yerine height ile aynı çizgi
 */
const btn =
  "h-[44px] rounded-2xl px-3.5 text-sm font-medium transition active:scale-[0.98] " +
  "border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm hover:bg-white/90 " +
  "dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/70";

const btnActive =
  "ring-4 ring-indigo-300/25 dark:ring-indigo-500/15 border-indigo-200/70 dark:border-indigo-900/50";

const primary =
  "h-[44px] rounded-2xl px-4 text-sm font-semibold text-white " +
  "bg-gradient-to-r from-indigo-600 to-fuchsia-600 " +
  "hover:from-indigo-500 hover:to-fuchsia-500 " +
  "shadow-[0_16px_50px_-24px_rgba(99,102,241,0.95)] active:scale-[0.98] transition";
