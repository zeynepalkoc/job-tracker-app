import { useEffect, useMemo, useState } from "react";
import type { Job, Status } from "../types/app";
import { STATUSES } from "../types/app";
import { uid } from "../lib/utils";
import { generateFollowUp } from "../lib/aiFollowup";
import { useToast } from "./ToastProvider";

function toInputDate(ts?: number | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fromInputDate(val: string) {
  if (!val) return null;
  const [y, m, d] = val.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 9, 0, 0);
  return dt.getTime();
}

type Tone = "Friendly" | "Professional" | "Short";

export default function JobModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Job | null;
  onClose: () => void;
  onSave: (job: Job) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initial;

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("Applied");
  const [followUp, setFollowUp] = useState("");

  const [tone, setTone] = useState<Tone>("Professional");
  const [aiSubject, setAiSubject] = useState("");
  const [aiBody, setAiBody] = useState("");

  useEffect(() => {
    if (!open) return;

    setCompany(initial?.company ?? "");
    setRole(initial?.role ?? "");
    setLocation(initial?.location ?? "");
    setLink(initial?.link ?? "");
    setNotes(initial?.notes ?? "");
    setStatus(initial?.status ?? "Applied");
    setFollowUp(toInputDate(initial?.followUpAt ?? null));

    setTone("Professional");
    setAiSubject("");
    setAiBody("");
  }, [open, initial]);

  const canSave = useMemo(() => company.trim() && role.trim(), [company, role]);

  if (!open) return null;

  const tempJobForAI: Job = {
    id: initial?.id ?? "temp",
    company: company.trim(),
    role: role.trim(),
    location: location.trim() || undefined,
    link: link.trim() || undefined,
    notes: notes,
    status,
    createdAt: initial?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    followUpAt: fromInputDate(followUp),
  };

  const handleGenerate = () => {
    if (!tempJobForAI.company || !tempJobForAI.role) {
      toast({ title: "Add company & role first", description: "AI needs at least these two fields." });
      return;
    }
    const out = generateFollowUp(tempJobForAI, tone);
    setAiSubject(out.subject);
    setAiBody(out.body);

    const merged =
      `--- AI Follow-up Draft ---\nSubject: ${out.subject}\n\n${out.body}\n\n---\n` +
      (notes ? `\n${notes}` : "");
    setNotes(merged);

    toast({ title: "Follow-up draft generated ✨", ttl: 2400 });
  };

  const handleCopy = async () => {
    if (!aiBody) {
      toast({ title: "Generate first", description: "Create a draft, then copy it." });
      return;
    }
    await navigator.clipboard.writeText(`Subject: ${aiSubject}\n\n${aiBody}`);
    toast({ title: "Copied ✅", description: "Paste it into email/LinkedIn message.", ttl: 2400 });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-[28px] border border-zinc-200/80 bg-white/85 backdrop-blur-xl p-5 shadow-[0_30px_110px_-60px_rgba(0,0,0,0.75)]
                      dark:border-zinc-800/70 dark:bg-zinc-950/75">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">{isEdit ? "Edit Job Application" : "Add Job Application"}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Save key details and track your application progress in one place.</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200/80 bg-white/70 px-2.5 py-1 text-sm dark:border-zinc-800/70 dark:bg-zinc-950/60"
          >
            
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <Row label="Company">
              <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
            </Row>

            <Row label="Role">
              <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}  placeholder="Job title(e.g. Frontend Developer)"/>
            </Row>

            <Row label="Location">
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}placeholder="City or Remote" />
            </Row>

            <Row label="Job Link">
              <input className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://company.com/careers/…" />
            </Row>

            <div className="grid gap-3 sm:grid-cols-2">
              <Row label="Status">
                <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Row>

              <Row label="Follow-up Date">
                <input className={inputCls} type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </Row>
            </div>

            <Row label="Notes">
              <textarea
                className={inputCls}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={9}
                placeholder="Interview notes, recruiter name, feedback, next steps…"
              />
            </Row>
          </div>

          <div className="rounded-[26px] border border-zinc-200/80 bg-white/65 backdrop-blur-xl p-4 shadow-[0_18px_55px_-35px_rgba(0,0,0,0.25)]
                          dark:border-zinc-800/70 dark:bg-zinc-950/45">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Follow-up Message Generator</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
               Create a clear, professional follow-up message using your application details.
                </div>
              </div>
              <span className="rounded-full border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/35 dark:text-indigo-200">
                Demo 
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <Row label="Tone">
                <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Short">Short</option>
                </select>
              </Row>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white
                             bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500
                             shadow-[0_16px_50px_-24px_rgba(99,102,241,0.95)] active:scale-[0.98] transition"
                >
                  ✨ Generate follow-up
                </button>

                <button
                  onClick={handleCopy}
                  className="rounded-2xl px-4 py-2.5 text-sm font-semibold border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm
                             hover:bg-white/90 dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/70"
                >
                  Copy
                </button>
              </div>

              <div className="mt-1 rounded-2xl border border-zinc-200/70 bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/50 p-3">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Subject</div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 break-words">{aiSubject || "—"}</div>

                <div className="mt-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">Message</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {aiBody || "Your follow-up message will appear here."}
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
               Tip: Personalize with the recruiter’s name before sending.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2 text-sm border border-zinc-200/80 bg-white/70 dark:border-zinc-800/70 dark:bg-zinc-950/60"
          >
            Cancel
          </button>

          <button
            disabled={!canSave}
            onClick={() => {
              const now = Date.now();
              onSave({
                id: initial?.id ?? uid(),
                company: company.trim(),
                role: role.trim(),
                location: location.trim() || undefined,
                link: link.trim() || undefined,
                notes: notes.trim() || undefined,
                status,
                createdAt: initial?.createdAt ?? now,
                updatedAt: now,
                followUpAt: fromInputDate(followUp),
              });
            }}
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-white
                       bg-gradient-to-r from-indigo-600 to-fuchsia-600
                       disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur px-3 py-2 text-sm outline-none " +
  "dark:border-zinc-800/70 dark:bg-zinc-950/55";
