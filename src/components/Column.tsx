import type { Job, Status } from "../types/app";
import { useDroppable } from "@dnd-kit/core";
import SortableJob from "./SortableJob";
import { cx } from "../lib/utils";

export default function Column({
  status,
  jobs,
  onEdit,
  onDelete,
  onMove,
  readOnly,
}: {
  status: Status;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  readOnly: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "rounded-[26px] border border-zinc-200/80 bg-white/65 backdrop-blur-xl p-3 shadow-[0_18px_55px_-35px_rgba(0,0,0,0.25)]",
        "dark:border-zinc-800/70 dark:bg-zinc-950/45",
        isOver && "ring-4 ring-indigo-300/20 dark:ring-indigo-500/15"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold">{status}</div>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{jobs.length}</span>
      </div>

      <div className="mt-3 grid gap-3">
        {jobs.map((j) => (
          <SortableJob key={j.id} job={j} onEdit={onEdit} onDelete={onDelete} onMove={onMove} readOnly={readOnly} />
        ))}

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200/70 bg-white/60 p-3 text-xs text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-400">
            Drop here
          </div>
        ) : null}
      </div>
    </div>
  );
}
