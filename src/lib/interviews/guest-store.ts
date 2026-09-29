import type { Interview } from "./types";

const KEY = "shortlist.interviews.v1";

export function readGuestInterviews(): Interview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Interview[]) : [];
  } catch {
    return [];
  }
}

export function writeGuestInterviews(rows: Interview[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* quota / private mode */
  }
}

export function upsertGuest(rows: Interview[], incoming: Interview[]): Interview[] {
  const map = new Map(rows.map((row) => [row.gmailThreadId, row]));
  for (const row of incoming) {
    const existing = map.get(row.gmailThreadId);
    map.set(row.gmailThreadId, existing ? { ...existing, ...row, id: existing.id } : row);
  }
  const next = [...map.values()];
  writeGuestInterviews(next);
  return next;
}
