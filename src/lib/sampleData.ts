import type { Job } from "../types/app";

export function getSampleJobs(): Job[] {
  const now = Date.now();

  const mk = (p: Partial<Job>): Job => ({
    id: crypto.randomUUID(),
    company: "Company",
    role: "Role",
    status: "Applied",
    createdAt: now,
    updatedAt: now,
    followUpAt: null,
    ...p,
  });

  return [
    
    mk({
      company: "Company A",
      role: "Front-end Engineer",
      location: "London UK.",
      link: "https://example.com/job",
      notes: "",
      status: "Applied",
      followUpAt: now + 2 * 24 * 60 * 60 * 1000, // 2 days later
    }),

   
    mk({
      company: "Startup X",
      role: "Frontend Engineer",
      location: "California, USA",
      link: "https://example.com/job",
      notes: "Portfolio reviewed. Prepare discussion on recent projects.",
      status: "Interview",
      followUpAt: now + 1 * 24 * 60 * 60 * 1000, // 1 day later
    }),

    mk({
      company: "Product-focused Startup",
      role: "Junior Front-End Developer",
      location: "Istanbul",
      link: "https://example.com/job",
      notes: "Take-home assignment focused on responsive UI and clean architecture.",
      status: "Offer",
      followUpAt: null,
    }),

    
    mk({
      company: "Company B",
      role: "React Developer",
      location: "Hybrid",
      link: "https://example.com/job",
      notes: "No response after two weeks. Process closed.",
      status: "Rejected",
      followUpAt: null,
    }),
  ];
}
