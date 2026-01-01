import { cx } from "../lib/utils";

export default function EmptyState({
  onAdd,
  onAddSample,
  readOnly,
}: {
  onAdd: () => void;
  onAddSample: () => void;
  readOnly: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-white/40 bg-white/55 backdrop-blur-xl",
        "shadow-[0_18px_60px_-30px_rgba(0,0,0,0.35)]",
        "dark:border-zinc-800/60 dark:bg-zinc-950/55",
        "p-8 sm:p-10 text-center"
      )}
    >
      <div className="mx-auto max-w-xl">
        <div className="text-2xl font-semibold tracking-tight">Your board is empty</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your first application and keep everything in one place.
Or load sample jobs to see how the board works.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
          <button
            onClick={onAddSample}
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm
                       hover:bg-white/90 dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/70"
          >
            Add sample jobs
          </button>

          <button
            onClick={onAdd}
            className={cx(
              "rounded-2xl px-4 py-2.5 text-sm font-semibold text-white",
              "bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500",
              "shadow-[0_16px_50px_-24px_rgba(99,102,241,0.95)] active:scale-[0.98] transition",
              readOnly && "opacity-50 pointer-events-none"
            )}
          >
            + Add your first job
          </button>
        </div>

        {readOnly && (
          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            You opened a shared link — this view is read-only.
          </div>
        )}
      </div>
    </div>
  );
}
