import type { Job } from "../types/app";

const KEY = "job-tracker:v1";

type Stored = { jobs: Job[] };

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Stored;
    const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs : [];
    return jobs.map((j) => ({ ...j, followUpAt: j.followUpAt ?? null }));
  } catch {
    return [];
  }
}

export function saveJobs(jobs: Job[]) {
  const payload: Stored = { jobs };
  localStorage.setItem(KEY, JSON.stringify(payload));
}
