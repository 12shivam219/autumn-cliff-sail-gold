import type { InterviewStatus } from "./types";

export const STATUS_LABEL: Record<InterviewStatus, string> = {
  Scheduled: "Scheduled",
  Canceled: "Canceled",
  Rejected: "Rejected",
  Offer: "Offer",
  Completed: "Completed",
};

export const STATUS_TONE: Record<InterviewStatus, string> = {
  Scheduled: "bg-scheduled/15 text-scheduled ring-scheduled/25",
  Canceled: "bg-canceled/15 text-canceled ring-canceled/25",
  Rejected: "bg-rejected/15 text-rejected ring-rejected/25",
  Offer: "bg-offer/15 text-offer ring-offer/25",
  Completed: "bg-completed/15 text-completed ring-completed/25",
};

const STATUS_RANK: Record<InterviewStatus, number> = {
  Scheduled: 1,
  Completed: 2,
  Canceled: 3,
  Rejected: 4,
  Offer: 5,
};

export function isInterviewStatus(value: string): value is InterviewStatus {
  return value in STATUS_LABEL;
}

/** Prefer a later email; if timestamps tie, keep the more terminal status. */
export function shouldReplaceStatus(
  current: InterviewStatus,
  next: InterviewStatus,
  currentEmailAt: string | null,
  nextEmailAt: string | null,
): boolean {
  if (nextEmailAt && currentEmailAt) {
    const nextMs = Date.parse(nextEmailAt);
    const currentMs = Date.parse(currentEmailAt);
    if (!Number.isNaN(nextMs) && !Number.isNaN(currentMs) && nextMs !== currentMs) {
      return nextMs > currentMs;
    }
  }
  if (nextEmailAt && !currentEmailAt) return true;
  return STATUS_RANK[next] >= STATUS_RANK[current];
}

export function isUpcoming(interviewDate: string | null, status: InterviewStatus): boolean {
  if (status !== "Scheduled" || !interviewDate) return false;
  const ms = Date.parse(interviewDate);
  if (Number.isNaN(ms)) return false;
  return ms >= Date.now() - 60 * 60 * 1000;
}
