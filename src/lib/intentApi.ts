export async function getIntent(message: string): Promise<
  "TODAY" | "RISK" | "DECISION" | "HEALTH" | "WEEKLY" | "MOVE" | "UNKNOWN"
> {
  try {
    const r = await fetch("http://localhost:5174/api/agent-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await r.json();
    return (data.intent ?? "UNKNOWN") as any;
  } catch {
    return "UNKNOWN";
  }
}
