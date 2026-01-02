import { useEffect, useMemo, useRef, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { arrayMove } from "@dnd-kit/sortable";

import type { Filters, Job, Status } from "./types/app";
import { STATUSES } from "./types/app";
import { loadJobs, saveJobs } from "./lib/storage";
import { useTheme } from "./hooks/useTheme";

import Toolbar from "./components/Toolbar";
import KpiBar from "./components/KpiBar";
import Board from "./components/Board";
import JobModal from "./components/JobModal";
import JobCard from "./components/JobCard";
import StatsView from "./components/StatsView";
import EmptyState from "./components/EmptyState";
import { createShareLink, loadSharedData } from "./lib/share";
import { getSampleJobs } from "./lib/sampleData";
import { useToast } from "./components/ToastProvider";
import AgentModal from "./components/AgentModal";

/**
 * ✅ Defensive hydration
 * Sometimes localStorage/share/import may contain invalid records (e.g. CSV strings).
 * We sanitize jobs before using them to avoid UI corruption and runtime crashes.
 */
function isValidJob(x: any): x is Job {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.company === "string" &&
    typeof x.role === "string" &&
    typeof x.status === "string" &&
    (STATUSES as readonly string[]).includes(x.status) &&
    typeof x.createdAt === "number" &&
    typeof x.updatedAt === "number"
  );
}

function sanitizeJobs(list: any): Job[] {
  if (!Array.isArray(list)) return [];
  return list.filter(isValidJob);
}

function groupByStatus(items: Job[]) {
  const map: Record<Status, Job[]> = {
    Applied: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  };

  // ✅ Defensive: if a job has an unexpected status, put it into Applied instead of crashing.
  for (const j of items) {
    const bucket = (map as any)[j.status] as Job[] | undefined;
    (bucket ?? map.Applied).push(j);
  }

  for (const s of STATUSES) map[s].sort((a, b) => b.updatedAt - a.updatedAt);
  return map;
}

const AGENT_URL =
  (import.meta as any).env?.VITE_AGENT_SERVER_URL?.trim?.() ||
  "http://localhost:5174";

type AgentResult = {
  intent: string;
  actions?: any[];
  company?: string;
  to?: string;
  date?: string;
  text?: string;
  debug?: any;
  ui?: {
    title?: string;
    lines?: string[];
    tips?: string[];
  };
};

function startOfTodayTs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function endOfTodayTs() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function normalizeStr(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[İI]/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o");
}

async function callAgent(inputRaw: string): Promise<AgentResult> {
  const res = await fetch(`${AGENT_URL}/api/agent-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: inputRaw }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.debug?.openai_error?.message ||
      data?.message ||
      data?.error ||
      `Agent error (${res.status})`;
    throw new Error(msg);
  }

  const intent = String(data?.intent ?? "UNKNOWN").toUpperCase().trim();
  return { ...(data || {}), intent };
}

export default function App() {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();

  // ✅ sanitize on first load
  const [jobs, setJobs] = useState<Job[]>(() => sanitizeJobs(loadJobs()));
  const [filters, setFilters] = useState<Filters>({ q: "", status: "All" });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "stats">("board");
  const [readOnly, setReadOnly] = useState(false);

  const undoRef = useRef<{ prev: Job[]; timer?: number } | null>(null);

  const [agentOpen, setAgentOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const persist = (next: Job[]) => {
    const clean = sanitizeJobs(next);
    setJobs(clean);
    saveJobs(clean);
  };

  const setUndo = (label: string, prev: Job[]) => {
    const ttl = 5000;
    if (undoRef.current?.timer) window.clearTimeout(undoRef.current.timer);

    const timer = window.setTimeout(() => {
      undoRef.current = null;
    }, ttl);

    undoRef.current = { prev, timer };

    toast({
      title: label,
      description: "You can undo this action for a few seconds.",
      actionLabel: "Undo",
      onAction: () => {
        const snap = undoRef.current?.prev;
        if (snap) persist(snap);
        undoRef.current = null;
        toast({ title: "Action undone ✅", ttl: 2200 });
      },
      ttl,
    });
  };

  useEffect(() => {
    const shared = loadSharedData();
    if (shared.readOnly) {
      setReadOnly(true);

      // ✅ sanitize shared payload too
      if (shared.data?.jobs) setJobs(sanitizeJobs(shared.data.jobs));

      toast({
        title: "Read-only view",
        description: "Opened from a shared link.",
        ttl: 2600,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJobs = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesQ =
        !q ||
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.location ?? "").toLowerCase().includes(q) ||
        (j.notes ?? "").toLowerCase().includes(q);

      const matchesStatus =
        filters.status === "All" ? true : j.status === filters.status;

      return matchesQ && matchesStatus;
    });
  }, [jobs, filters]);

  const jobsByStatus = useMemo(
    () => groupByStatus(filteredJobs),
    [filteredJobs]
  );

  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeId) ?? null,
    [jobs, activeId]
  );

  const onAdd = () => {
    if (readOnly) return;
    setEditing(null);
    setModalOpen(true);
  };

  const onAddSample = () => {
    if (readOnly) return;
    const prev = jobs;
    const sample = getSampleJobs();
    persist([...sample, ...jobs]);
    toast({ title: "Sample jobs added ✨", ttl: 2400 });
    setUndo("Sample data added", prev);
  };

  const onEdit = (job: Job) => {
    if (readOnly) return;
    setEditing(job);
    setModalOpen(true);
  };

  const onDelete = (id: string) => {
    if (readOnly) return;
    const prev = jobs;
    const target = jobs.find((j) => j.id === id);
    persist(jobs.filter((j) => j.id !== id));
    setUndo(`Deleted: ${target?.company ?? "job"}`, prev);
  };

  const onSave = (job: Job) => {
    if (readOnly) return;

    const exists = jobs.some((j) => j.id === job.id);
    const next = exists
      ? jobs.map((j) => (j.id === job.id ? job : j))
      : [job, ...jobs];

    persist(next);

    setModalOpen(false);
    setEditing(null);
    toast({ title: exists ? "Changes saved ✅" : "Job added ✅", ttl: 2200 });
  };

  const onMove = (id: string, status: Status) => {
    if (readOnly) return;

    const prev = jobs;
    const now = Date.now();
    const target = jobs.find((j) => j.id === id);

    persist(
      jobs.map((j) => (j.id === id ? { ...j, status, updatedAt: now } : j))
    );

    setUndo(`Moved to ${status}: ${target?.company ?? "job"}`, prev);
  };

  const onShare = async () => {
    const link = createShareLink({ jobs });
    await navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Anyone with the link can view this board in read-only mode.",
      ttl: 2600,
    });
  };

  function findStatusOfJob(id: string): Status | null {
    const j = jobs.find((x) => x.id === id);
    return j?.status ?? null;
  }

  function parseColumnId(id: string): Status | null {
    if (!id.startsWith("column:")) return null;
    const s = id.replace("column:", "") as Status;
    return STATUSES.includes(s) ? s : null;
  }

  function handleDragEnd(e: DragEndEvent) {
    if (readOnly) return;

    const { active, over } = e;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overId = String(over.id);
    if (activeIdStr === overId) return;

    const fromStatus = findStatusOfJob(activeIdStr);
    const toStatus = findStatusOfJob(overId) ?? parseColumnId(overId);
    if (!fromStatus || !toStatus) return;

    const overIsJobCard = !!findStatusOfJob(overId);

    if (fromStatus === toStatus && overIsJobCard) {
      const prev = jobs;

      const list = jobs.filter((j) => j.status === fromStatus);
      const other = jobs.filter((j) => j.status !== fromStatus);

      const oldIndex = list.findIndex((j) => j.id === activeIdStr);
      const newIndex = list.findIndex((j) => j.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const moved = arrayMove(list, oldIndex, newIndex);
      persist([...other, ...moved]);
      setUndo(`Reordered in ${fromStatus}`, prev);
      return;
    }

    const prev = jobs;
    const now = Date.now();
    let next = jobs.map((j) =>
      j.id === activeIdStr ? { ...j, status: toStatus, updatedAt: now } : j
    );

    if (overIsJobCard) {
      const target = next.filter((j) => j.status === toStatus);
      const rest = next.filter((j) => j.status !== toStatus);

      const movedIndex = target.findIndex((j) => j.id === activeIdStr);
      const overIndex = target.findIndex((j) => j.id === overId);

      if (movedIndex !== -1 && overIndex !== -1) {
        const reordered = arrayMove(target, movedIndex, overIndex);
        persist([...rest, ...reordered]);
        setUndo(`Moved to ${toStatus}`, prev);
        return;
      }
    }

    const movedJob = next.find((j) => j.id === activeIdStr);
    next = next.filter((j) => j.id !== activeIdStr);
    if (movedJob) persist([movedJob, ...next]);
    else persist(next);

    setUndo(`Moved to ${toStatus}`, prev);
  }

  const isEmpty = jobs.length === 0;

  // ✅ Agent UI helpers
  function buildTodayUi(): AgentResult["ui"] {
    const start = startOfTodayTs();
    const end = endOfTodayTs();

    const overdue = jobs.filter(
      (j) => (j.followUpAt ?? 0) > 0 && (j.followUpAt ?? 0) < start
    );
    const dueToday = jobs.filter(
      (j) => (j.followUpAt ?? 0) >= start && (j.followUpAt ?? 0) <= end
    );
    const inInterview = jobs.filter((j) => j.status === "Interview");

    const priorities = [...overdue, ...dueToday, ...inInterview]
      .slice(0, 5)
      .map((j) => `${j.company} (${j.role})`);

    return {
      title: "Today snapshot",
      lines: [
        `Overdue follow-ups: ${overdue.length}`,
        `Follow-ups today: ${dueToday.length}`,
        `In Interview: ${inInterview.length}`,
        priorities.length ? "" : "No urgent items 🎉",
        ...(priorities.length
          ? ["Top priorities:", ...priorities.map((p) => `- ${p}`)]
          : []),
      ].filter(Boolean),
      tips: [
        'Try: "weekly plan"',
        'Try: "move Company A to Interview"',
        'Try: "followup Company A 2025-01-10"',
        'Try: "note Company A: recruiter asked for portfolio"',
      ],
    };
  }

  function parseToStatus(s?: string): Status | null {
    if (!s) return null;
    const x = normalizeStr(s);
    if (x.includes("applied") || x.includes("basvur")) return "Applied";
    if (x.includes("interview") || x.includes("mulakat")) return "Interview";
    if (x.includes("offer") || x.includes("teklif")) return "Offer";
    if (x.includes("rejected") || x.includes("red")) return "Rejected";
    return null;
  }

  function findJobByCompany(company?: string) {
    if (!company) return null;
    const q = normalizeStr(company);
    const hit = jobs.find((j) => normalizeStr(j.company).includes(q));
    return hit ?? null;
  }

  async function runAgent(cmd: string): Promise<AgentResult> {
    const r = await callAgent(cmd);

    // UI enrich
    if (r.intent === "TODAY") r.ui = buildTodayUi();

    // Execute actions (only if not readOnly)
    if (!readOnly) {
      if (r.intent === "MOVE") {
        const job = findJobByCompany(r.company);
        const to = parseToStatus(r.to);
        if (job && to) {
          const prev = jobs;
          onMove(job.id, to);
          setUndo(`Moved via Agent: ${job.company} → ${to}`, prev);
          r.ui = {
            title: "Move executed ✅",
            lines: [`${job.company} moved to ${to}.`],
            tips: ['Try: "today"'],
          };
        } else {
          r.ui = {
            title: "Move not executed",
            lines: [
              "I recognized MOVE, but couldn't match the company/status.",
              "Tip: use exact company name or a unique part of it.",
            ],
          };
        }
      }

      if (r.intent === "FOLLOWUP") {
        const job = findJobByCompany(r.company);
        const dateStr = (r.date || "").trim();
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
        if (job && m) {
          const [_, y, mo, d] = m;
          const dt = new Date(
            Number(y),
            Number(mo) - 1,
            Number(d),
            9,
            0,
            0
          ).getTime();
          const prev = jobs;
          const now = Date.now();
          persist(
            jobs.map((j) =>
              j.id === job.id ? { ...j, followUpAt: dt, updatedAt: now } : j
            )
          );
          setUndo(`Follow-up set via Agent: ${job.company}`, prev);
          r.ui = {
            title: "Follow-up set ✅",
            lines: [`${job.company} follow-up → ${dateStr}`],
          };
        }
      }

      if (r.intent === "NOTE") {
        const job = findJobByCompany(r.company);
        const text = (r.text || "").trim();
        if (job && text) {
          const prev = jobs;
          const now = Date.now();
          const merged = job.notes ? `${job.notes}\n\n${text}` : text;
          persist(
            jobs.map((j) =>
              j.id === job.id ? { ...j, notes: merged, updatedAt: now } : j
            )
          );
          setUndo(`Note added via Agent: ${job.company}`, prev);
          r.ui = {
            title: "Note saved ✅",
            lines: [`${job.company}: note added.`],
          };
        }
      }
    } else {
      // read-only: still show help
      if (!r.ui && r.intent === "UNKNOWN") {
        r.ui = {
          title: "I didn't understand",
          lines: ["Try one of these:"],
          tips: [
            "today / bugun",
            "weekly plan",
            "move Company A to Interview",
            "followup Company A 2025-01-10",
            "note Company A: recruiter asked for portfolio",
          ],
        };
      }
    }

    return r;
  }

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-black" />
        <div className="absolute -top-24 left-[-120px] h-[380px] w-[380px] rounded-full bg-gradient-to-tr from-indigo-300/40 to-fuchsia-300/40 blur-3xl dark:from-indigo-500/20 dark:to-fuchsia-500/20" />
        <div className="absolute top-40 right-[-140px] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-amber-200/40 to-rose-300/40 blur-3xl dark:from-amber-500/15 dark:to-rose-500/15" />
        <div className="absolute bottom-[-160px] left-1/3 h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-emerald-200/35 to-cyan-200/35 blur-3xl dark:from-emerald-500/15 dark:to-cyan-500/15" />
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Toolbar
          filters={filters}
          onChange={setFilters}
          onAdd={onAdd}
          theme={theme}
          onToggleTheme={toggle}
          view={view}
          onChangeView={setView}
          onShare={onShare}
          readOnly={readOnly}
          onAgent={() => setAgentOpen(true)}
        />

        {view === "board" ? <KpiBar jobs={filteredJobs} /> : null}

        <div className="mt-6">
          {isEmpty && view === "board" ? (
            <EmptyState
              onAdd={onAdd}
              onAddSample={onAddSample}
              readOnly={readOnly}
            />
          ) : (
            <div className="rounded-[28px] border border-white/40 bg-white/55 p-3 sm:p-4 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
              {view === "stats" ? (
                <StatsView jobs={jobs} />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e) => setActiveId(String(e.active.id))}
                  onDragCancel={() => setActiveId(null)}
                  onDragEnd={(e) => {
                    handleDragEnd(e);
                    setActiveId(null);
                  }}
                >
                  <Board
                    jobsByStatus={jobsByStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMove={onMove}
                    readOnly={readOnly}
                  />

                  <DragOverlay
                    modifiers={[snapCenterToCursor]}
                    dropAnimation={{
                      duration: 180,
                      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                    }}
                  >
                    {activeJob ? (
                      <JobCard
                        job={activeJob}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onMove={() => {}}
                        isOverlay
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          )}
        </div>
      </div>

      <JobModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={onSave}
      />

      <AgentModal open={agentOpen} onClose={() => setAgentOpen(false)} onRun={runAgent} />

      <SpeedInsights />
    </div>
  );
}
