export type Status = "Applied" | "Interview" | "Offer" | "Rejected";
export const STATUSES: Status[] = ["Applied", "Interview", "Offer", "Rejected"];

export type Filters = {
  q: string;
  status: Status | "All";
};

export type Job = {
  id: string;
  company: string;
  role: string;
  location?: string;
  link?: string;
  notes?: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
  followUpAt?: number | null;
};

export type AppData = {
  jobs: Job[];
};
