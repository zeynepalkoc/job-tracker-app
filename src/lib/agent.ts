export type AgentIntent =
  | "TODAY"
  | "WEEKLY"
  | "RISK"
  | "DECISION"
  | "HEALTH"
  | "MOVE"
  | "UNKNOWN";

export type AgentIntentResponse = {
  intent: AgentIntent;
  // server debug açarsa gelebilir
  debug?: any;
  // MOVE gibi detaylar dönerse saklayalım
  company?: string;
  to?: string;
  [key: string]: any;
};

function getBaseUrl() {
  const envUrl =
    (import.meta as any)?.env?.VITE_AGENT_SERVER_URL ??
    (import.meta as any)?.env?.VITE_AGENT_URL;

  const base = typeof envUrl === "string" ? envUrl.trim() : "";
  return base || "http://localhost:5174";
}

function normalizeIntent(x: any): AgentIntent {
  const s = String(x ?? "UNKNOWN").toUpperCase().trim();

  // bazı modeller "WEEKLY_PLAN" döndürebilir -> WEEKLY'e indir
  if (s === "WEEKLY_PLAN") return "WEEKLY";
  if (s === "MOVE_JOB") return "MOVE";

  const allowed: AgentIntent[] = [
    "TODAY",
    "WEEKLY",
    "RISK",
    "DECISION",
    "HEALTH",
    "MOVE",
    "UNKNOWN",
  ];

  return (allowed.includes(s as AgentIntent) ? (s as AgentIntent) : "UNKNOWN");
}

/**
 * Agent server'a intent çıkarımı için gider.
 * input: user command (e.g. "today", "move Google to Interview")
 * debug: true ise server ?debug=1 eklenir
 */
export async function getIntent(input: string, debug = false): Promise<AgentIntentResponse> {
  const base = getBaseUrl();
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
      data?.message ||
      data?.error ||
      `Agent server error (${res.status})`;
    throw new Error(msg);
  }

  // server bazen string döndürür, bazen object. ikisini de yakala.
  const rawIntent =
    typeof data === "string" ? data : data?.intent ?? data?.data?.intent;

  const intent = normalizeIntent(rawIntent);

  // MOVE gibi ekstra alanlar varsa koru
  if (data && typeof data === "object") {
    return { ...data, intent };
  }

  return { intent };
}

/**
 * UI tarafında kolay kullanım:
 * intent string döndürür (TODAY / WEEKLY / ...)
 */
export async function getIntentOnly(input: string): Promise<AgentIntent> {
  const r = await getIntent(input, false);
  return r.intent;
}
