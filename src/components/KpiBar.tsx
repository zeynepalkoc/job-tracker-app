import type { Job } from "../types/app";

export default function KpiBar({ jobs }: { jobs: Job[] }) {
  const total = jobs.length;
  const interview = jobs.filter((j) => j.status === "Interview").length;
  const offer = jobs.filter((j) => j.status === "Offer").length;

  const interviewRate = total ? Math.round((interview / total) * 100) : 0;
  const offerRate = total ? Math.round((offer / total) * 100) : 0;

  return (
<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Total" value={String(total)} />
      <Card label="Interviews" value={`${interview} (${interviewRate}%)`} />
      <Card label="Offers" value={`${offer} (${offerRate}%)`} />
      <Card label="Focus" value="Drag & Drop" />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/65 backdrop-blur-xl px-3.5 py-3 shadow-[0_18px_55px_-35px_rgba(0,0,0,0.25)]
                    dark:border-zinc-800/70 dark:bg-zinc-950/45">
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}
