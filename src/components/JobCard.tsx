import type { Job, Status } from "../types/app";
import { cx, daysDiffFromNow, fmtDate } from "../lib/utils";

/* =========================
   Status styles (Apple-like)
========================= */
const STATUS_STYLES: Record<
  Status,
  {
    badge: string;
    accent: string;
    glow: string;
  }
> = {
  Applied: {
    badge:
      "border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-200",
    accent: "bg-gradient-to-b from-sky-500/70 to-sky-400/30",
    glow: "shadow-[0_18px_55px_-38px_rgba(14,165,233,0.55)]",
  },
  Interview: {
    badge:
      "border-violet-200/70 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/35 dark:text-violet-200",
    accent: "bg-gradient-to-b from-violet-500/70 to-fuchsia-400/30",
    glow: "shadow-[0_18px_55px_-38px_rgba(139,92,246,0.55)]",
  },
  Offer: {
    badge:
      "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
    accent: "bg-gradient-to-b from-emerald-500/70 to-emerald-400/30",
    glow: "shadow-[0_18px_55px_-38px_rgba(16,185,129,0.55)]",
  },
  Rejected: {
    badge:
      "border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200",
    accent: "bg-gradient-to-b from-rose-500/70 to-rose-400/30",
    glow: "shadow-[0_18px_55px_-38px_rgba(244,63,94,0.45)]",
  },
};

/* =========================
   Component
========================= */
export default function JobCard({
  job,
  onEdit,
  onDelete,
  onMove,
  readOnly,
  isOverlay,
}: {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  readOnly?: boolean;
  isOverlay?: boolean;
}) {
  /* 🔒 SAFE STATUS (asla undefined olmaz) */
  const safeStatus: Status =
    Object.prototype.hasOwnProperty.call(STATUS_STYLES, job.status)
      ? (job.status as Status)
      : "Applied";

  const s = STATUS_STYLES[safeStatus];

  /* Follow-up badge */
  const d = daysDiffFromNow(job.followUpAt ?? null);
  const followBadge =
    d === null
      ? null
      : d < 0
      ? {
          text: "Overdue",
          cls:
            "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200",
        }
      : d === 0
      ? {
          text: "Follow-up today",
          cls:
            "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200",
        }
      : {
          text: `${d} day${d === 1 ? "" : "s"} left`,
          cls:
            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
        };

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur-xl p-3",
        "dark:border-zinc-800/70 dark:bg-zinc-950/55",
        s.glow,
        isOverlay && "rotate-[0.4deg] scale-[1.01]"
      )}
    >
      {/* Status accent bar */}
      <div className={cx("absolute left-0 top-0 h-full w-[6px]", s.accent)} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 pl-1">
          <div className="truncate text-sm font-semibold">{job.company}</div>
          <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
            {job.role}
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(job)} className={miniBtn} title="Edit">
              ✎
            </button>
            <button
              onClick={() => onDelete(job.id)}
              className={miniBtn}
              title="Delete"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
        <span className={cx(chip, s.badge)}>{safeStatus}</span>

        {job.location && <span className={chip}>{job.location}</span>}

        {followBadge && (
          <span className={cx(chip, followBadge.cls)}>
            {followBadge.text} • {fmtDate(job.followUpAt ?? null)}
          </span>
        )}

        {job.link && (
          <a
            href={job.link}
            target="_blank"
            rel="noreferrer"
            className={cx(chip, "hover:underline")}
            title={job.link}
          >
            Link ↗
          </a>
        )}
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-300 pl-1">
          {job.notes}
        </div>
      )}

      {/* Move buttons */}
      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-1">
          <button onClick={() => onMove(job.id, "Applied")} className={moveBtn}>
            Applied
          </button>
          <button
            onClick={() => onMove(job.id, "Interview")}
            className={moveBtn}
          >
            Interview
          </button>
          <button onClick={() => onMove(job.id, "Offer")} className={moveBtn}>
            Offer
          </button>
          <button
            onClick={() => onMove(job.id, "Rejected")}
            className={moveBtn}
          >
            Rejected
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================
   Shared styles
========================= */
const chip =
  "rounded-full border border-zinc-200/70 bg-white/70 px-2.5 py-1 text-[11px] text-zinc-700 " +
  "dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:text-zinc-200";

const miniBtn =
  "rounded-xl border border-zinc-200/70 bg-white/70 px-2 py-1 text-xs hover:bg-white " +
  "dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:hover:bg-zinc-900/60";

const moveBtn =
  "rounded-xl border border-zinc-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-white " +
  "dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:bg-zinc-900/60";
