export function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function uid() {
  return crypto.randomUUID();
}

export function fmtDate(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

export function daysDiffFromNow(ts?: number | null) {
  if (!ts) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
