const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const { headers: callerHeaders, ...rest } = options;
  const res = await fetch(`${BFF_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(callerHeaders as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}${body ? `: ${body}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  applied_date: string;
  location?: string;
  job_url?: string;
  salary_min?: number;
  salary_max?: number;
  follow_up_date?: string;
  notes?: string;
  resume_used?: string;
  cover_letter_used?: boolean;
}

export interface FunnelItem { status: string; count: number; }
export interface TimelineItem { date: string; count: number; }
export interface MatchResult { score: number; matched: string[]; missing: string[]; }

export const listApplications = () =>
  apiFetch<Application[]>("/api/applications?limit=100");

export const createApplication = (data: Omit<Application, "id">) =>
  apiFetch<Application>("/api/applications", { method: "POST", body: JSON.stringify(data) });

export const updateApplication = (id: string, data: Partial<Application>) =>
  apiFetch<Application>(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteApplication = (id: string) =>
  apiFetch<void>(`/api/applications/${id}`, { method: "DELETE" });

export const getFunnel = () =>
  apiFetch<FunnelItem[]>("/api/analytics/funnel");

export const getTimeline = () =>
  apiFetch<TimelineItem[]>("/api/analytics/timeline");

export const analyzeKeywords = (resume: string, job_description: string) =>
  apiFetch<MatchResult>("/api/matcher/analyze", {
    method: "POST",
    body: JSON.stringify({ resume, job_description }),
  });
