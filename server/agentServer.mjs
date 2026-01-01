import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5174;

function norm(s = "") {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[İI]/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/\s+/g, " ");
}

// tiny levenshtein for 1-2 typo tolerance
function levenshtein(a, b) {
  a = a || "";
  b = b || "";
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function isCloseWord(input, target) {
  const a = norm(input);
  const b = norm(target);
  if (a === b) return true;
  // allow small typos for short keywords
  const d = levenshtein(a, b);
  return d <= 2;
}

function parseStatus(s) {
  const x = norm(s);
  if (x.includes("applied") || x.includes("basvur")) return "Applied";
  if (x.includes("interview") || x.includes("mulakat")) return "Interview";
  if (x.includes("offer") || x.includes("teklif")) return "Offer";
  if (x.includes("rejected") || x.includes("red")) return "Rejected";
  return null;
}

function parseIntent(messageRaw) {
  const message = norm(messageRaw);

  // TODAY (TR/EN)
  const todayWords = ["today", "bugun", "bugün", "gunluk", "günlük"];
  if (todayWords.some((w) => message === norm(w) || isCloseWord(message, w))) {
    return { intent: "TODAY", actions: [] };
  }

  // WEEKLY PLAN (TR/EN)
  const weeklyWords = ["weekly", "weekly plan", "week plan", "haftalik plan", "haftalık plan"];
  if (weeklyWords.some((w) => message.includes(norm(w)) || isCloseWord(message, w))) {
    return { intent: "WEEKLY_PLAN", actions: [] };
  }

  // MOVE examples:
  // "move Google to Interview"
  // "google interview'a tasi"
  // "Google -> Offer"
  const moveRe =
    /^move\s+(.+?)\s+(?:to|into)\s+(applied|interview|offer|rejected)\s*$/i;
  const moveRe2 =
    /^(.+?)\s*(?:->|→)\s*(applied|interview|offer|rejected)\s*$/i;
  const moveTr =
    /^(.+?)\s+(?:mulakat|mülakat|interview|teklif|offer|red|rejected|basvur|başvur)(?:a|e)?\s*(?:tasi|tas?i|gecir|al)\s*$/i;

  let m = moveRe.exec(messageRaw);
  if (m) {
    const company = m[1]?.trim();
    const to = parseStatus(m[2]);
    return { intent: "MOVE", company, to, actions: [{ type: "MOVE", company, to }] };
  }

  m = moveRe2.exec(messageRaw);
  if (m) {
    const company = m[1]?.trim();
    const to = parseStatus(m[2]);
    return { intent: "MOVE", company, to, actions: [{ type: "MOVE", company, to }] };
  }

  // followup examples:
  // "followup Google 2025-01-10"
  // "follow up Google 2025-01-10"
  const fuRe = /^follow\s*up|^followup/i;
  if (fuRe.test(messageRaw)) {
    const parts = messageRaw.trim().split(/\s+/);
    // followup <Company...> <YYYY-MM-DD>
    const date = parts.find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p));
    const company = date
      ? messageRaw.replace(new RegExp(date), "").replace(/follow\s*up|followup/i, "").trim()
      : messageRaw.replace(/follow\s*up|followup/i, "").trim();

    return {
      intent: "FOLLOWUP",
      company: company || undefined,
      date: date || undefined,
      actions: [{ type: "FOLLOWUP", company, date }],
    };
  }

  // note examples:
  // "note Google: recruiter asked for portfolio"
  // "not Google: ..."
  const noteRe = /^(note|not)\s+/i;
  if (noteRe.test(messageRaw)) {
    const after = messageRaw.replace(/^(note|not)\s+/i, "").trim();
    const idx = after.indexOf(":");
    const company = idx >= 0 ? after.slice(0, idx).trim() : after.split(/\s+/)[0];
    const text = idx >= 0 ? after.slice(idx + 1).trim() : after.replace(company, "").trim();

    return {
      intent: "NOTE",
      company: company || undefined,
      text: text || undefined,
      actions: [{ type: "NOTE", company, text }],
    };
  }

  // fallback heuristics (contains keywords)
  if (message.includes("today") || message.includes("bugun") || message.includes("bugün")) {
    return { intent: "TODAY", actions: [] };
  }
  if (message.includes("week") || message.includes("weekly") || message.includes("hafta")) {
    return { intent: "WEEKLY_PLAN", actions: [] };
  }
  if (message.includes("move") || message.includes("tasi") || message.includes("tas")) {
    return { intent: "MOVE", actions: [] };
  }

  return { intent: "UNKNOWN", actions: [] };
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/agent-intent", (req, res) => {
  const input = req.body?.input ?? req.body?.message ?? "";
  const out = parseIntent(input);
  res.json(out);
});

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`);
});
