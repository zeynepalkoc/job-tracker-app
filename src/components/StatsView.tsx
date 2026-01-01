// src/components/StatsView.tsx
import type { Job } from "../types/app";
import { STATUSES } from "../types/app";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const daysBetween = (a: number, b: number) =>
  Math.max(0, (b - a) / (1000 * 60 * 60 * 24));

function useIsDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function statusAccent(status: string, isDark: boolean) {
  // Apple-like soft accents (still vibrant)
  const m: Record<string, { from: string; to: string; solid: string }> = {
    Applied: {
      from: isDark ? "rgba(124,131,255,0.95)" : "rgba(79,70,229,0.92)",
      to: isDark ? "rgba(210,107,255,0.85)" : "rgba(168,85,247,0.82)",
      solid: isDark ? "#7C83FF" : "#4F46E5",
    },
    Interview: {
      from: isDark ? "rgba(52,211,153,0.95)" : "rgba(16,185,129,0.92)",
      to: isDark ? "rgba(34,197,94,0.85)" : "rgba(34,197,94,0.80)",
      solid: isDark ? "#34D399" : "#10B981",
    },
    Offer: {
      from: isDark ? "rgba(210,107,255,0.95)" : "rgba(168,85,247,0.92)",
      to: isDark ? "rgba(124,131,255,0.85)" : "rgba(79,70,229,0.80)",
      solid: isDark ? "#D26BFF" : "#A855F7",
    },
    Rejected: {
      from: isDark ? "rgba(251,113,133,0.95)" : "rgba(244,63,94,0.90)",
      to: isDark ? "rgba(239,68,68,0.82)" : "rgba(239,68,68,0.78)",
      solid: isDark ? "#FB7185" : "#F43F5E",
    },
  };
  return m[status] ?? m.Applied;
}

export default function StatsView({ jobs }: { jobs: Job[] }) {
  const now = Date.now();
  const isDark = useIsDark();

  // ---------- Metrics ----------
  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, jobs.filter((j) => j.status === s).length])
  ) as Record<string, number>;

  const applied = byStatus.Applied ?? 0;
  const interview = byStatus.Interview ?? 0;
  const offer = byStatus.Offer ?? 0;
  const rejected = byStatus.Rejected ?? 0;

  const appliedToInterviewRate = applied ? Math.round((interview / applied) * 100) : 0;
  const interviewToOfferRate = interview ? Math.round((offer / interview) * 100) : 0;

  const avgDaysInStage =
    jobs.length
      ? Math.round(
          jobs.reduce((sum, j) => {
            const t = (j.updatedAt ?? j.createdAt ?? now) as number;
            return sum + daysBetween(t, now);
          }, 0) / jobs.length
        )
      : 0;

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const overdueCount = jobs.filter(
    (j) => (j.followUpAt ?? 0) > 0 && (j.followUpAt ?? 0) < startToday.getTime()
  ).length;

  const dueTodayCount = (() => {
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    return jobs.filter(
      (j) =>
        (j.followUpAt ?? 0) >= startToday.getTime() &&
        (j.followUpAt ?? 0) <= endToday.getTime()
    ).length;
  })();

  // ---------- Chart data ----------
  const statusChartData = STATUSES.map((s) => ({
    status: s,
    count: byStatus[s] ?? 0,
  }));

  const conversionPieData = [
    { name: "Interview", value: interview },
    { name: "Offer", value: offer },
    { name: "Rejected", value: rejected },
  ].filter((x) => x.value > 0);

  // ---------- Palette ----------
  const palette = isDark
    ? {
        text: "rgba(244,244,245,0.92)",
        mut: "rgba(161,161,170,0.90)",
        grid: "rgba(255,255,255,0.16)", // 👈 daha belirgin
        axis: "rgba(255,255,255,0.28)", // 👈 daha belirgin
        tooltipBg: "rgba(9,9,11,0.72)",
        tooltipBorder: "rgba(255,255,255,0.14)",
        barStart: "rgba(124,131,255,0.95)",
        barEnd: "rgba(210,107,255,0.85)",
      }
    : {
        text: "rgba(24,24,27,0.92)",
        mut: "rgba(82,82,91,0.84)",
        grid: "rgba(24,24,27,0.18)", // 👈 daha belirgin
        axis: "rgba(24,24,27,0.28)", // 👈 daha belirgin
        tooltipBg: "rgba(255,255,255,0.86)",
        tooltipBorder: "rgba(24,24,27,0.10)",
        barStart: "rgba(79,70,229,0.90)",
        barEnd: "rgba(168,85,247,0.82)",
      };

  const pieColors = [
    statusAccent("Interview", isDark).solid,
    statusAccent("Offer", isDark).solid,
    statusAccent("Rejected", isDark).solid,
  ];

  const barMax = Math.max(...statusChartData.map((d) => d.count), 1);
  const yMax = clamp(barMax + 1, 2, 999);

  return (
    <div className="p-3 sm:p-4">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Applied → Interview"
          value={`${appliedToInterviewRate}%`}
          sub={`Applied: ${applied}, Interview: ${interview}`}
        />
        <Card
          title="Interview → Offer"
          value={`${interviewToOfferRate}%`}
          sub={`Interview: ${interview}, Offer: ${offer}`}
        />
        <Card title="Avg days in stage" value={`${avgDaysInStage}`} sub="Based on last status update" />
        <Card title="Follow-up health" value={`${overdueCount} overdue`} sub={`${dueTodayCount} due today`} />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Status Bar Chart */}
        <div className="rounded-[24px] border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
          <div className="text-sm font-semibold">Applications by status</div>

          <div className="mt-3 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 18, left: 0, bottom: 6 }}>
                <defs>
                  <linearGradient id="barGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={palette.barStart} />
                    <stop offset="100%" stopColor={palette.barEnd} />
                  </linearGradient>
                </defs>

                {/* daha net çizgiler */}
                <CartesianGrid stroke={palette.grid} strokeDasharray="3 6" vertical={false} />

                <XAxis
                  dataKey="status"
                  tickMargin={10}
                  axisLine={{ stroke: palette.axis }}
                  tickLine={false}
                  tick={{ fill: palette.text, fontSize: 12, fontWeight: 500 }}
                />

                <YAxis
                  allowDecimals={false}
                  domain={[0, yMax]}
                  axisLine={{ stroke: palette.axis }}
                  tickLine={false}
                  tick={{ fill: palette.text, fontSize: 12, fontWeight: 500 }}
                  width={32}
                />

                <Tooltip
                  content={<GlassTooltip />}
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(24,24,27,0.035)" }}
                />

                <Bar
                  dataKey="count"
                  fill="url(#barGlow)"
                  radius={[12, 12, 10, 10]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
           Tip: Consistent follow-ups often improve the Applied → Interview rate.
          </div>
        </div>

        {/* Conversion Pie Chart */}
        <div className="rounded-[24px] border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
          <div className="text-sm font-semibold">Conversion mix</div>

          <div className="mt-3 h-[250px]">
            {conversionPieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<GlassTooltip />} />

                  <Pie
                    data={conversionPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={92}
                    innerRadius={56}
                    paddingAngle={3}
                    stroke={isDark ? "rgba(255,255,255,0.22)" : "rgba(24,24,27,0.12)"}
                    strokeWidth={2}
                    labelLine={false}
                    label={(p) => {
                      const v = Number(p.value || 0);
                      return v ? `${v}` : "";
                    }}
                  >
                    {conversionPieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={palette.text}
                    style={{ fontSize: 12, fontWeight: 800 }}
                  >
                    {jobs.length ? `${jobs.length} total` : "no data"}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
                No data yet — add a few jobs to see the chart.
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <LegendPill label="Interview" color={pieColors[0]} />
            <LegendPill label="Offer" color={pieColors[1]} />
            <LegendPill label="Rejected" color={pieColors[2]} />
          </div>
        </div>
      </div>

      {/* Details + Suggestions (Apple-like) */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Status breakdown (premium rows) */}
        <div className="rounded-[24px] border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
          <div className="text-sm font-semibold">Status breakdown</div>

          <div className="mt-3 space-y-3">
            {STATUSES.map((s) => {
              const count = byStatus[s] ?? 0;
              const total = jobs.length || 1;
              const pct = Math.round((count / total) * 100);
              const accent = statusAccent(String(s), isDark);

              return (
                <div
                  key={s}
                  className="rounded-2xl border border-white/35 bg-white/45 p-3 backdrop-blur-xl
                             dark:border-zinc-800/50 dark:bg-zinc-950/35"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: accent.solid }}
                      />
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {s}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{pct}%</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {count}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggestions (card list) */}
        <div className="rounded-[24px] border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Suggestions</div>
            <span className="rounded-full border border-white/40 bg-white/50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700
                             dark:border-zinc-800/50 dark:bg-zinc-950/40 dark:text-zinc-200">
              Quick wins
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {[
              {
                title: "Add follow-ups",
                desc: "If conversion is low, schedule follow-ups 3–5 days after applying.",
              },
              {
                title: "Keep interview notes fresh",
                desc: "Keep interview questions, takeaways, and next steps up to date.",
              },
              {
                title: "Clear overdue first",
                desc: "Overdue follow-ups usually have the highest ROI.",
              },
            ].map((x, i) => (
              <div
                key={i}
                className="group flex gap-3 rounded-2xl border border-white/35 bg-white/45 p-3 backdrop-blur-xl
                           dark:border-zinc-800/50 dark:bg-zinc-950/35"
              >
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-white text-xs font-bold
                             shadow-[0_14px_40px_-24px_rgba(99,102,241,0.9)]"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(79,70,229,0.95), rgba(168,85,247,0.9))",
                  }}
                >
                  {i + 1}
                </div>

                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {x.title}
                  </div>
                  <div className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {x.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-[24px] border border-white/40 bg-white/60 p-4 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
      <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{sub}</div>
    </div>
  );
}

function LegendPill({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/55 px-2.5 py-1 backdrop-blur-xl
                 dark:border-zinc-800/50 dark:bg-zinc-950/45"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
  );
}

function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(9,9,11,0.72)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 16,
        padding: "10px 12px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 18px 50px -30px rgba(0,0,0,0.55)",
        color: "rgba(244,244,245,0.92)",
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
        {label ?? payload?.[0]?.name}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(161,161,170,0.90)" }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 800 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}
