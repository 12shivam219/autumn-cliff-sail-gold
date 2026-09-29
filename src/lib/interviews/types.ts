export const INTERVIEW_STATUSES = [
  "Scheduled",
  "Canceled",
  "Rejected",
  "Offer",
  "Completed",
] as const;

export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_SOURCES = ["gmail", "manual", "sample"] as const;
export type InterviewSource = (typeof INTERVIEW_SOURCES)[number];

export type Interview = {
  id: string;
  gmailThreadId: string;
  gmailMessageId: string | null;
  companyName: string;
  role: string;
  status: InterviewStatus;
  interviewDate: string | null;
  interviewerNames: string[];
  meetingLink: string | null;
  subject: string | null;
  snippet: string | null;
  source: InterviewSource;
  notes: string | null;
  lastEmailAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewDraft = {
  companyName: string;
  role: string;
  status: InterviewStatus;
  interviewDate: string | null;
  interviewerNames: string[];
  meetingLink: string | null;
  notes: string | null;
};

export type ScanResult = {
  ok: boolean;
  pending?: boolean;
  loginRequired?: boolean;
  loginUrl?: string;
  errorKind?:
    | "pending"
    | "login"
    | "not_connected"
    | "scope_denied"
    | "access_denied"
    | "error";
  errorMessage?: string;
  scanned: number;
  parsed: number;
  upserted: number;
  skipped: number;
  interviews: Interview[];
};

export type ConnectorNotice = {
  kind:
    | "pending"
    | "login"
    | "not_connected"
    | "scope_denied"
    | "access_denied"
    | "error";
  message: string;
  loginUrl?: string;
};

export type ListInterviewsResult = {
  interviews: Interview[];
  signedIn: boolean;
};

export const LOOKBACK_OPTIONS = [7, 14, 30, 90] as const;
export type LookbackDays = (typeof LOOKBACK_OPTIONS)[number];
