import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { sampleInterviews } from "./sample";
import { mapInterviewRow, type InterviewRow } from "./map-row";
import { shouldReplaceStatus } from "./status";
import type {
  Interview,
  InterviewDraft,
  ListInterviewsResult,
  ScanResult,
} from "./types";
import { INTERVIEW_STATUSES } from "./types";

function newId(): string {
  return crypto.randomUUID();
}

function namesJson(names: string[]): string {
  return JSON.stringify(names);
}

function lastEmailIso(date: string | null): string {
  if (!date) return new Date().toISOString();
  if (/^\d+$/.test(date)) {
    const n = Number(date);
    return new Date(n < 1e12 ? n * 1000 : n).toISOString();
  }
  const parsed = Date.parse(date);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

async function listForUser(userId: string): Promise<Interview[]> {
  const sql = await getSql();
  const rows = await sql<InterviewRow>`
    select
      id, gmail_thread_id, gmail_message_id, company_name, role, status,
      interview_date, interviewer_names, meeting_link, subject, snippet,
      source, notes, last_email_at, created_at, updated_at
    from interviews
    where user_id = ${userId}
    order by
      case when interview_date is null then 1 else 0 end,
      interview_date desc,
      updated_at desc
  `;
  return rows.map(mapInterviewRow);
}

async function upsertRow(
  userId: string,
  incoming: Interview,
): Promise<"inserted" | "updated" | "kept"> {
  const sql = await getSql();
  const existing = await sql<InterviewRow>`
    select
      id, gmail_thread_id, gmail_message_id, company_name, role, status,
      interview_date, interviewer_names, meeting_link, subject, snippet,
      source, notes, last_email_at, created_at, updated_at
    from interviews
    where user_id = ${userId} and gmail_thread_id = ${incoming.gmailThreadId}
    limit 1
  `;
  const current = existing[0] ? mapInterviewRow(existing[0]) : null;
  if (!current) {
    await sql`
      insert into interviews (
        id, user_id, gmail_thread_id, gmail_message_id, company_name, role,
        status, interview_date, interviewer_names, meeting_link, subject,
        snippet, source, notes, last_email_at
      ) values (
        ${incoming.id},
        ${userId},
        ${incoming.gmailThreadId},
        ${incoming.gmailMessageId},
        ${incoming.companyName},
        ${incoming.role},
        ${incoming.status},
        ${incoming.interviewDate},
        ${namesJson(incoming.interviewerNames)}::jsonb,
        ${incoming.meetingLink},
        ${incoming.subject},
        ${incoming.snippet},
        ${incoming.source},
        ${incoming.notes},
        ${incoming.lastEmailAt}
      )
    `;
    return "inserted";
  }

  const replace = shouldReplaceStatus(
    current.status,
    incoming.status,
    current.lastEmailAt,
    incoming.lastEmailAt,
  );
  const status = replace ? incoming.status : current.status;
  const interviewDate = incoming.interviewDate ?? current.interviewDate;
  const meetingLink = incoming.meetingLink ?? current.meetingLink;
  const interviewers =
    incoming.interviewerNames.length > 0
      ? incoming.interviewerNames
      : current.interviewerNames;
  const companyName =
    incoming.companyName !== "Unknown company" ? incoming.companyName : current.companyName;
  const role =
    incoming.role !== "Role not specified" ? incoming.role : current.role;

  await sql`
    update interviews set
      gmail_message_id = coalesce(${incoming.gmailMessageId}, gmail_message_id),
      company_name = ${companyName},
      role = ${role},
      status = ${status},
      interview_date = ${interviewDate},
      interviewer_names = ${namesJson(interviewers)}::jsonb,
      meeting_link = ${meetingLink},
      subject = coalesce(${incoming.subject}, subject),
      snippet = coalesce(${incoming.snippet}, snippet),
      notes = coalesce(${incoming.notes}, notes),
      last_email_at = coalesce(${incoming.lastEmailAt}, last_email_at),
      updated_at = now()
    where user_id = ${userId} and id = ${current.id}
  `;
  return replace ? "updated" : "kept";
}

export const listInterviews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ListInterviewsResult> => {
    const interviews = await listForUser(context.userId);
    return { interviews, signedIn: true };
  });

export const scanInbox = createServerFn({ method: "POST" })
  .validator((input: { days?: number }) => ({
    days: Math.min(Math.max(Number(input?.days) || 30, 1), 180),
  }))
  .handler(async ({ data }): Promise<ScanResult> => {
    const { fetchInterviewEmails } = await import("./gmail");
    const { extractInterviews } = await import("./parse");
    const fetched = await fetchInterviewEmails(data.days);
    if (!fetched.ok) {
      return {
        ok: false,
        pending: fetched.pending,
        loginRequired: fetched.loginRequired,
        loginUrl: fetched.loginUrl,
        errorKind: fetched.errorKind,
        errorMessage: fetched.errorMessage,
        scanned: 0,
        parsed: 0,
        upserted: 0,
        skipped: 0,
        interviews: [],
      };
    }

    const extracted = await extractInterviews(fetched.messages);
    const now = new Date().toISOString();
    const built: Interview[] = [];
    let skipped = 0;
    fetched.messages.forEach((message, index) => {
      const item = extracted[index];
      if (!item || !item.relevant) {
        skipped += 1;
        return;
      }
      built.push({
        id: newId(),
        gmailThreadId: message.threadId,
        gmailMessageId: message.id,
        companyName: item.companyName,
        role: item.role,
        status: item.status,
        interviewDate: item.interviewDate,
        interviewerNames: item.interviewerNames,
        meetingLink: item.meetingLink,
        subject: message.subject,
        snippet: message.snippet || item.notes,
        source: "gmail",
        notes: item.notes,
        lastEmailAt: lastEmailIso(message.date),
        createdAt: now,
        updatedAt: now,
      });
    });

    let persisted: Interview[] = built;
    let upserted = 0;
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      if (user) {
        for (const row of built) {
          const action = await upsertRow(user.id, row);
          if (action !== "kept") upserted += 1;
        }
        persisted = await listForUser(user.id);
      } else {
        upserted = built.length;
      }
    } catch {
      upserted = built.length;
    }

    return {
      ok: true,
      scanned: fetched.messages.length,
      parsed: built.length,
      upserted,
      skipped,
      interviews: persisted,
    };
  });

export const createInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: InterviewDraft) => input)
  .handler(async ({ context, data }): Promise<Interview> => {
    const now = new Date().toISOString();
    const status = INTERVIEW_STATUSES.includes(data.status) ? data.status : "Scheduled";
    const row: Interview = {
      id: newId(),
      gmailThreadId: `manual-${newId()}`,
      gmailMessageId: null,
      companyName: data.companyName.trim() || "Untitled company",
      role: data.role.trim() || "Role not specified",
      status,
      interviewDate: data.interviewDate,
      interviewerNames: data.interviewerNames,
      meetingLink: data.meetingLink,
      subject: null,
      snippet: null,
      source: "manual",
      notes: data.notes,
      lastEmailAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await upsertRow(context.userId, row);
    return row;
  });

export const updateInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string } & Partial<InterviewDraft>) => input)
  .handler(async ({ context, data }): Promise<Interview | null> => {
    const sql = await getSql();
    const existing = await sql<InterviewRow>`
      select
        id, gmail_thread_id, gmail_message_id, company_name, role, status,
        interview_date, interviewer_names, meeting_link, subject, snippet,
        source, notes, last_email_at, created_at, updated_at
      from interviews
      where user_id = ${context.userId} and id = ${data.id}
      limit 1
    `;
    const current = existing[0] ? mapInterviewRow(existing[0]) : null;
    if (!current) return null;
    const next: Interview = {
      ...current,
      companyName: data.companyName?.trim() || current.companyName,
      role: data.role?.trim() || current.role,
      status: data.status ?? current.status,
      interviewDate:
        data.interviewDate === undefined ? current.interviewDate : data.interviewDate,
      interviewerNames: data.interviewerNames ?? current.interviewerNames,
      meetingLink: data.meetingLink === undefined ? current.meetingLink : data.meetingLink,
      notes: data.notes === undefined ? current.notes : data.notes,
      updatedAt: new Date().toISOString(),
    };
    await sql`
      update interviews set
        company_name = ${next.companyName},
        role = ${next.role},
        status = ${next.status},
        interview_date = ${next.interviewDate},
        interviewer_names = ${namesJson(next.interviewerNames)}::jsonb,
        meeting_link = ${next.meetingLink},
        notes = ${next.notes},
        updated_at = now()
      where user_id = ${context.userId} and id = ${next.id}
    `;
    return next;
  });

export const deleteInterview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql`delete from interviews where user_id = ${context.userId} and id = ${id}`;
    return { ok: true };
  });

export const loadSamplePipeline = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Interview[]> => {
    for (const row of sampleInterviews()) {
      await upsertRow(context.userId, { ...row, id: newId() });
    }
    return listForUser(context.userId);
  });
