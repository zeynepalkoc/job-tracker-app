import { useEffect, useMemo, useState } from "react";
import { cx } from "../lib/utils";

type AgentResult = {
  intent: string;
  ui?: {
    title?: string;
    lines?: string[];
    tips?: string[];
  };
  debug?: any;
  [key: string]: any;
};

export default function AgentModal({
  open,
  onClose,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  onRun: (command: string) => Promise<AgentResult>;
}) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [hintInfo, setHintInfo] = useState(true);
  const helperText = useMemo(() => {
    if (error) return error;
    if (!result) return "Examples: today · weekly plan · move an application to Interview";
    if (result.intent === "UNKNOWN") return "I didn't understand. Try a shorter, clearer command.";
    // Intent is useful for debugging, but we keep the default UI human.
    return "";
  }, [result, error]);

useEffect(() => {
    if (!open) return;
    setHintInfo(true);
    const t = setTimeout(() => setHintInfo(false), 4000);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const uiTitle = result?.ui?.title;
  const uiLines = result?.ui?.lines ?? [];
  const uiTips = result?.ui?.tips ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />

      <div
        className={cx(
          "relative w-full max-w-2xl rounded-[28px] p-5",
          "border border-white/50 bg-white/80 shadow-[0_26px_80px_-40px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          "dark:border-zinc-800/60 dark:bg-zinc-950/70"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Job App Agent</h2>

              {/* Info button */}
             <button
  type="button"
  onClick={() => {
    setShowInfo((s) => !s);
    setHintInfo(false); // tıklayınca ipucu dursun
  }}
  className={cx(
    "relative flex h-7 w-7 items-center justify-center rounded-full",
    "border border-zinc-200/80 bg-white/60 text-xs font-semibold text-zinc-600",
    "hover:bg-white/90 active:scale-[0.98] transition",
    "dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:bg-zinc-900/60"
  )}
  aria-label="How the agent works"
>
  {/* Hint animation (only when closed) */}
  {hintInfo && !showInfo ? (
    <>
      <span
        className={cx(
          "pointer-events-none absolute -inset-1 rounded-full",
          "ring-2 ring-indigo-400/35 dark:ring-indigo-300/25",
          "animate-ping motion-reduce:animate-none"
        )}
      />
      <span
        className={cx(
          "pointer-events-none absolute -inset-1 rounded-full",
          "ring-2 ring-indigo-500/20 dark:ring-indigo-300/15",
          "animate-pulse motion-reduce:animate-none"
        )}
      />
    </>
  ) : null}

  i
</button>

            </div>

            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              Give a simple command to review, update, or plan your applications.
            </p>

          {/* Info popover */}
{showInfo ? (
  <div
    className={cx(
      "relative mt-3 rounded-2xl p-4",
      "border border-zinc-200/80 bg-white/70 backdrop-blur-xl shadow-[0_18px_55px_-35px_rgba(0,0,0,0.25)]",
      "dark:border-zinc-800/70 dark:bg-zinc-950/55"
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          How to use the Agent
        </div>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          The agent understands simple commands. For actions like moving or adding notes,
          include a company name and a clear detail.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowInfo(false)}
        className={cx(
          "rounded-xl px-2.5 py-1 text-[11px] font-semibold",
          "border border-zinc-200/70 bg-white/70 text-zinc-700 hover:bg-white",
          "dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
        )}
      >
        Close
      </button>
    </div>

    <div className="mt-3 space-y-3 text-sm text-zinc-800 dark:text-zinc-100">
      <div>
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Review & planning</div>
        <div className="mt-1 grid gap-1">
          <div>• <span className="font-semibold">today</span> — see today’s priorities</div>
          <div>• <span className="font-semibold">weekly plan</span> — plan your week</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Move (update status)</div>
        <div className="mt-1 grid gap-1">
          <div>• <span className="font-semibold">move {"{company}"} to Interview</span></div>
          <div>• <span className="font-semibold">move {"{company}"} to Offer</span></div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Notes</div>
        <div className="mt-1 grid gap-1">
          <div>• <span className="font-semibold">note {"{company}"}: {"{your note}"}</span></div>
          <div>• <span className="font-semibold">add a note to {"{company}"}: {"{your note}"}</span></div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Follow-ups</div>
        <div className="mt-1 grid gap-1">
          <div>• <span className="font-semibold">followup {"{company}"} 2025-01-10</span></div>
          <div>• <span className="font-semibold">schedule a follow-up for {"{company}"} 2025-02-01</span></div>
        </div>
      </div>

      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        If a command is missing details, the agent will ask for more information instead of guessing.
      </div>
    </div>
  </div>
) : null}

          </div>

          <button
            onClick={onClose}
            className={cx(
              "rounded-2xl px-3 py-2 text-sm font-medium transition active:scale-[0.98]",
              "border border-zinc-200/90 bg-white/70 hover:bg-white/90",
              "dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/70"
            )}
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Prompt</div>

          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Try: today, weekly plan, or move an application to Interview"
            className={cx(
              "mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none transition",
              "border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm",
              "dark:border-zinc-800/90 dark:bg-zinc-950/60"
            )}
          />

          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                setLoading(true);
                setError("");
                setResult(null);
                setShowDetails(false);

                try {
                  const r = await onRun(command);
                  setResult(r);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Agent request failed");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !command.trim()}
              className={cx(
                "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]",
                "bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500",
                "shadow-[0_16px_50px_-24px_rgba(99,102,241,0.95)]",
                (loading || !command.trim()) && "opacity-60 pointer-events-none"
              )}
            >
              {loading ? "Running…" : "Run"}
            </button>

            <button
              onClick={() => {
                setCommand("");
                setError("");
                setResult(null);
                setShowDetails(false);
              }}
              className={cx(
                "rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
                "border border-zinc-200/90 bg-white/70 hover:bg-white/90",
                "dark:border-zinc-800/90 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/70"
              )}
            >
              Clear
            </button>
          </div>

          <div
            className={cx(
              "mt-4 rounded-[22px] p-4 shadow-sm",
              "border border-white/50 bg-white/65",
              "dark:border-zinc-800/60 dark:bg-zinc-950/55"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Result</div>

              {result ? (
                <button
                  onClick={() => setShowDetails((s) => !s)}
                  className="rounded-xl border border-zinc-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-700
                             hover:bg-white dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                >
                  {showDetails ? "Hide details" : "Details"}
                </button>
              ) : null}
            </div>

            <div className="mt-2 text-sm text-zinc-800 dark:text-zinc-100">{helperText}</div>

            {result ? (
              <div className="mt-3 space-y-3">
                {uiTitle ? (
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{uiTitle}</div>
                ) : null}

                {uiLines.length ? (
                  <div className="space-y-1 text-sm text-zinc-800 dark:text-zinc-100">
                    {uiLines.map((x, i) => (
                      <div key={i}>{x}</div>
                    ))}
                  </div>
                ) : null}

                {uiTips.length ? (
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="font-semibold mb-1">You can also try:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {uiTips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {showDetails ? (
                  <pre
                    className="overflow-auto rounded-2xl border border-white/40 bg-white/50 p-3 text-xs text-zinc-700
                                  dark:border-zinc-800/50 dark:bg-zinc-950/40 dark:text-zinc-200"
                  >
{JSON.stringify(result, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
