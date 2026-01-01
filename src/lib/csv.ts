import type { Job } from "../types/app";

// küçük CSV parser (quote destekli)
function splitCsvLine(line: string, delimiter: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // "" -> "
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out.map((s) => s.trim());
}

function detectDelimiter(headerLine: string, firstDataLine: string) {
  const comma = (headerLine.match(/,/g) || []).length;
  const semi = (headerLine.match(/;/g) || []).length;

  if (semi > comma) return ";";
  if (comma > semi) return ",";

  // header eşitse data satırına bak
  const comma2 = (firstDataLine.match(/,/g) || []).length;
  const semi2 = (firstDataLine.match(/;/g) || []).length;
  return semi2 > comma2 ? ";" : ",";
}

export function exportToCSV(jobs: Job[]) {
  const headers = [
    "company",
    "role",
    "status",
    "location",
    "url",
    "salary",
    "notes",
    "followUpAt",
    "createdAt",
    "updatedAt",
  ];

  const rows = jobs.map((j) =>
    headers
      .map((h) => {
        const v = (j as any)[h];
        return `"${String(v ?? "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "job-applications.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromCSV(file: File, onDone: (jobs: Job[]) => void) {
  const reader = new FileReader();

  reader.onload = () => {
    const textRaw = String(reader.result || "");

    // satır sonlarını normalize et
    const text = textRaw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const linesAll = text.split("\n").filter((l) => l.trim().length > 0);
    if (linesAll.length < 2) return onDone([]);

    const headerLine = linesAll[0];
    const firstDataLine = linesAll[1] ?? "";
    const delimiter = detectDelimiter(headerLine, firstDataLine);

    const headers = splitCsvLine(headerLine, delimiter).map((h) =>
      h.replace(/^"|"$/g, "").trim()
    );

    const now = Date.now();

    const jobs: Job[] = linesAll
      .slice(1)
      .map((line) => {
        const values = splitCsvLine(line, delimiter).map((v) =>
          v.replace(/^"|"$/g, "").trim()
        );

        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = values[i] ?? ""));

        return {
          id: crypto.randomUUID(),
          company: obj.company || "",
          role: obj.role || "",
          status: (obj.status || "Applied") as any,
          location: obj.location || "",
          url: obj.url || obj.link || "",
          salary: obj.salary || "",
          notes: obj.notes || "",
          followUpAt: obj.followUpAt ? Number(obj.followUpAt) : null,
          createdAt: obj.createdAt ? Number(obj.createdAt) : now,
          updatedAt: obj.updatedAt ? Number(obj.updatedAt) : now,
        } as Job;
      })
      .filter((j) => j.company || j.role);

    onDone(jobs);
  };

  reader.readAsText(file);
}
