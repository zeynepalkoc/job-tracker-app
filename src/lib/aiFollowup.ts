import type { Job } from "../types/app";

type Tone = "Friendly" | "Professional" | "Short";

function safe(v?: string) {
  return (v ?? "").trim();
}

function pickSubject(job: Job) {
  const company = safe(job.company);
  const role = safe(job.role);

  if (role && company) return `Following up on my ${role} application at ${company}`;
  if (role) return `Following up on my ${role} application`;
  return "Following up on my application";
}

function closing() {
  return `Best regards,\n[Your Name]`;
}

function greeting(tone: Tone) {
  return tone === "Short" ? "Hi [Name],\n" : "Hi [Name],\n\n";
}

function statusLine(job: Job) {
  switch (job.status) {
    case "Applied":
      return "I wanted to follow up on my application.";
    case "Interview":
      return "I wanted to follow up regarding the interview process.";
    case "Offer":
      return "Thank you again for the offer. I’m excited about the opportunity and wanted to ask about the next steps.";
    case "Rejected":
      return "Thank you again for your time. I wanted to stay in touch regarding future opportunities.";
    default:
      return "I wanted to follow up and check in.";
  }
}

function interestLine(tone: Tone) {
  if (tone === "Short") return "I remain very interested in the role.";
  if (tone === "Professional")
    return "I remain very interested in the role and would appreciate any updates you can share.";
  return "I’m still very interested and would love to hear if there are any updates.";
}

function notesHint(notes?: string) {
  const n = safe(notes);
  if (!n) return "";
  const first = n
    .split(/[\n.]/)
    .map((s) => s.trim())
    .filter(Boolean)[0];

  if (!first) return "";
  return `\n\nAs mentioned earlier, ${first}.`;
}

export function generateFollowUp(job: Job, tone: Tone = "Professional") {
  const company = safe(job.company);
  const role = safe(job.role);
  const loc = safe(job.location);

  const subject = pickSubject(job);
  const intro = greeting(tone);

  const line1 =
    company && role
      ? `I hope you're doing well. ${statusLine(job)} for the ${role} position at ${company}.`
      : `I hope you're doing well. ${statusLine(job)}`;

  const line2 = interestLine(tone);

  const line3 =
    tone === "Short"
      ? "Would you be able to share any updates?"
      : "Would you be able to share any updates on the timeline and next steps?";

  const locationNote =
    loc && tone !== "Short"
      ? `\n\nRegarding location, ${loc} works well for me, and I’m also open to other options.`
      : "";

  const notesContext = notesHint(job.notes);

  const body =
    `${intro}${line1}\n${line2}\n${line3}${notesContext}${locationNote}\n\n${closing()}`;

  return { subject, body };
}
