import { useMemo, useState } from "react";


type AgentResult = {
  intent: string;
  [key: string]: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function getAgentBaseUrl() {
  // Vite env (typed) — tip hatası çıkarmasın diye güvenli okuyoruz
  const envUrl =
    (import.meta as any)?.env?.VITE_AGENT_SERVER_URL ??
    (import.meta as any)?.env?.VITE_AGENT_URL;

  const base = typeof envUrl === "string" ? envUrl.trim() : "";
  return base || "http://localhost:5174";
}

async function callAgentIntent(input: string, debug = true): Promise<AgentResult> {
  const base = getAgentBaseUrl();
  const url = `${base}/api/agent-intent${debug ? "?debug=1" : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      data?.debug?.openai_error?.message ||
      data?.error ||
      `Agent server error (${res.status})`;
    throw new Error(msg);
  }

  const intent = String(data?.intent ?? "UNKNOWN").toUpperCase().trim();
  return { ...(data ?? {}), intent };
}

export default function Agent({ open, onClose }: Props) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  const baseUrl = useMemo(() => getAgentBaseUrl(), []);

  const chips = useMemo(
    () => [
      "today",
      "weekly plan",
      "risk report",
      "decision",
      "health score",
      "move Google to Interview",
    ],
    []
  );

  const helperText = useMemo(() => {
    if (error) return error;
    if (!result)
      return 'Örn: "today" | "weekly plan" | "move Google to Interview"';
    if (result.intent === "UNKNOWN")
      return "Bunu anlayamadım. Daha kısa/temiz bir komut dene.";
    return `Intent: ${result.intent}`;
  }, [result, error]);

  const run = async () => {
    const input = command.trim();
    if (!input) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const r = await callAgentIntent(input, true);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent request failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

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
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Job App Agent</h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              Server: {baseUrl}
            </p>
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

        {/* Input */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Command
          </div>

          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder='Örn: "today"'
            className={cx(
              "mt-1 w-full rounded-2xl px-4 py-3 text-sm outline-none transition",
              "border border-zinc-200/90 bg-white/70 backdrop-blur-xl shadow-sm",
              "dark:border-zinc-800/90 dark:bg-zinc-950/60"
            )}
          />

          {/* Chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => setCommand(c)}
                className={cx(
                  "rounded-full px-3 py-1 text-xs font-semibold transition active:scale-[0.98]",
                  "border border-white/60 bg-white/50 hover:bg-white/80",
                  "dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/60"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={run}
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

          {/* Output */}
          <div
            className={cx(
              "mt-4 rounded-[22px] p-4 shadow-sm",
              "border border-white/50 bg-white/65",
              "dark:border-zinc-800/60 dark:bg-zinc-950/55"
            )}
          >
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Agent
            </div>

            <div className="mt-2 text-sm text-zinc-800 dark:text-zinc-100">
              {helperText}
            </div>

            {result ? (
              <pre className="mt-3 overflow-auto rounded-2xl border border-white/40 bg-white/50 p-3 text-xs text-zinc-700 dark:border-zinc-800/50 dark:bg-zinc-950/40 dark:text-zinc-200">
{JSON.stringify(result, null, 2)}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
