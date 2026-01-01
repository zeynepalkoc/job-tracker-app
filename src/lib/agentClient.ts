export type AgentIntentResponse = { intent: string; debug?: any };

const BASE =
  import.meta.env.VITE_AGENT_SERVER_URL?.trim() || "http://localhost:5174";

export async function getAgentIntent(input: string, debug = false) {
  const resp = await fetch(
    `${BASE}/api/agent-intent${debug ? "?debug=1" : ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    }
  );

  const data = (await resp.json()) as AgentIntentResponse;

  if (!resp.ok) {
    const msg =
      data?.debug?.openai_error?.message || `Agent error (${resp.status})`;
    throw new Error(msg);
  }

  return data;
}
