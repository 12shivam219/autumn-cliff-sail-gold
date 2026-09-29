import { isInterviewStatus } from "./status";
import type { Interview, InterviewSource, InterviewStatus } from "./types";

export type InterviewRow = {
  id: string;
  gmail_thread_id: string;
  gmail_message_id: string | null;
  company_name: string;
  role: string;
  status: string;
  interview_date: unknown;
  interviewer_names: unknown;
  meeting_link: string | null;
  subject: string | null;
  snippet: string | null;
  source: string;
  notes: string | null;
  last_email_at: unknown;
  created_at: unknown;
  updated_at: unknown;
};

function toIso(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
    return value;
  }
  return String(value);
}

function toIsoRequired(value: unknown): string {
  return toIso(value) ?? new Date().toISOString();
}

function namesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function sourceOf(value: string): InterviewSource {
  if (value === "manual" || value === "sample" || value === "gmail") return value;
  return "gmail";
}

export function mapInterviewRow(row: InterviewRow): Interview {
  const status: InterviewStatus = isInterviewStatus(row.status) ? row.status : "Scheduled";
  return {
    id: row.id,
    gmailThreadId: row.gmail_thread_id,
    gmailMessageId: row.gmail_message_id,
    companyName: row.company_name,
    role: row.role,
    status,
    interviewDate: toIso(row.interview_date),
    interviewerNames: namesOf(row.interviewer_names),
    meetingLink: row.meeting_link,
    subject: row.subject,
    snippet: row.snippet,
    source: sourceOf(row.source),
    notes: row.notes,
    lastEmailAt: toIso(row.last_email_at),
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  };
}
