import { r as createServerFn } from "./ssr.mjs";
import { a as isInterviewStatus, c as shouldReplaceStatus, i as authMiddleware, s as sampleInterviews, t as INTERVIEW_STATUSES } from "./status-CerAbSlB.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { r as getSql } from "./db-9l-nHePF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-D4-vpo-g.js
function toIso(value) {
	if (value == null || value === "") return null;
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string") {
		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
		return value;
	}
	return String(value);
}
function toIsoRequired(value) {
	return toIso(value) ?? (/* @__PURE__ */ new Date()).toISOString();
}
function namesOf(value) {
	if (Array.isArray(value)) return value.map(String).filter(Boolean);
	if (typeof value === "string") try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
	} catch {
		return value.split(",").map((n) => n.trim()).filter(Boolean);
	}
	return [];
}
function sourceOf(value) {
	if (value === "manual" || value === "sample" || value === "gmail") return value;
	return "gmail";
}
function mapInterviewRow(row) {
	const status = isInterviewStatus(row.status) ? row.status : "Scheduled";
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
		updatedAt: toIsoRequired(row.updated_at)
	};
}
function newId() {
	return crypto.randomUUID();
}
function namesJson(names) {
	return JSON.stringify(names);
}
function lastEmailIso(date) {
	if (!date) return (/* @__PURE__ */ new Date()).toISOString();
	if (/^\d+$/.test(date)) {
		const n = Number(date);
		return new Date(n < 0xe8d4a51000 ? n * 1e3 : n).toISOString();
	}
	const parsed = Date.parse(date);
	return Number.isNaN(parsed) ? (/* @__PURE__ */ new Date()).toISOString() : new Date(parsed).toISOString();
}
async function listForUser(userId) {
	return (await (await getSql())`
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
  `).map(mapInterviewRow);
}
async function upsertRow(userId, incoming) {
	const sql = await getSql();
	const existing = await sql`
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
	const replace = shouldReplaceStatus(current.status, incoming.status, current.lastEmailAt, incoming.lastEmailAt);
	const status = replace ? incoming.status : current.status;
	const interviewDate = incoming.interviewDate ?? current.interviewDate;
	const meetingLink = incoming.meetingLink ?? current.meetingLink;
	const interviewers = incoming.interviewerNames.length > 0 ? incoming.interviewerNames : current.interviewerNames;
	const companyName = incoming.companyName !== "Unknown company" ? incoming.companyName : current.companyName;
	const role = incoming.role !== "Role not specified" ? incoming.role : current.role;
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
var listInterviews_createServerFn_handler = createServerRpc({
	id: "3ee2b465dc58f1b90e3fea2d1bfc899200492bcd92212f237ef0ca8473ccdbb4",
	name: "listInterviews",
	filename: "src/lib/interviews/server.ts"
}, (opts) => listInterviews.__executeServer(opts));
var listInterviews = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listInterviews_createServerFn_handler, async ({ context }) => {
	return {
		interviews: await listForUser(context.userId),
		signedIn: true
	};
});
var scanInbox_createServerFn_handler = createServerRpc({
	id: "e816091e39185ba254dbb641825bd13bd838bdcaa33b62ee93350273399faee2",
	name: "scanInbox",
	filename: "src/lib/interviews/server.ts"
}, (opts) => scanInbox.__executeServer(opts));
var scanInbox = createServerFn({ method: "POST" }).validator((input) => ({ days: Math.min(Math.max(Number(input?.days) || 30, 1), 180) })).handler(scanInbox_createServerFn_handler, async ({ data }) => {
	const { fetchInterviewEmails } = await import("./gmail-D1A-B8De.mjs");
	const { extractInterviews } = await import("./parse-DS10F4-_.mjs");
	const fetched = await fetchInterviewEmails(data.days);
	if (!fetched.ok) return {
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
		interviews: []
	};
	const extracted = await extractInterviews(fetched.messages);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const built = [];
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
			updatedAt: now
		});
	});
	let persisted = built;
	let upserted = 0;
	try {
		const { getSessionUser } = await import("./verify.server-CYm3ShQy.mjs");
		const user = await getSessionUser();
		if (user) {
			for (const row of built) if (await upsertRow(user.id, row) !== "kept") upserted += 1;
			persisted = await listForUser(user.id);
		} else upserted = built.length;
	} catch {
		upserted = built.length;
	}
	return {
		ok: true,
		scanned: fetched.messages.length,
		parsed: built.length,
		upserted,
		skipped,
		interviews: persisted
	};
});
var createInterview_createServerFn_handler = createServerRpc({
	id: "2f1bd97e7b4c20990939c056aa508d5cd0fbbd14a0eec61827e4f76833b82565",
	name: "createInterview",
	filename: "src/lib/interviews/server.ts"
}, (opts) => createInterview.__executeServer(opts));
var createInterview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createInterview_createServerFn_handler, async ({ context, data }) => {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const status = INTERVIEW_STATUSES.includes(data.status) ? data.status : "Scheduled";
	const row = {
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
		updatedAt: now
	};
	await upsertRow(context.userId, row);
	return row;
});
var updateInterview_createServerFn_handler = createServerRpc({
	id: "e11904eff9c4a1c60636f23d8e0c47b0376682760469621db464bc8170d58f63",
	name: "updateInterview",
	filename: "src/lib/interviews/server.ts"
}, (opts) => updateInterview.__executeServer(opts));
var updateInterview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(updateInterview_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const existing = await sql`
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
	const next = {
		...current,
		companyName: data.companyName?.trim() || current.companyName,
		role: data.role?.trim() || current.role,
		status: data.status ?? current.status,
		interviewDate: data.interviewDate === void 0 ? current.interviewDate : data.interviewDate,
		interviewerNames: data.interviewerNames ?? current.interviewerNames,
		meetingLink: data.meetingLink === void 0 ? current.meetingLink : data.meetingLink,
		notes: data.notes === void 0 ? current.notes : data.notes,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
var deleteInterview_createServerFn_handler = createServerRpc({
	id: "6097c7cf4038f4dc54829461326acd979b06f5381ff9c764f074a245815ab817",
	name: "deleteInterview",
	filename: "src/lib/interviews/server.ts"
}, (opts) => deleteInterview.__executeServer(opts));
var deleteInterview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(deleteInterview_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`delete from interviews where user_id = ${context.userId} and id = ${id}`;
	return { ok: true };
});
var loadSamplePipeline_createServerFn_handler = createServerRpc({
	id: "f6213a6b0bd03be1ada4cb9420a43ec4653d4a097ddc9ca7bc9d436b2ca76d5d",
	name: "loadSamplePipeline",
	filename: "src/lib/interviews/server.ts"
}, (opts) => loadSamplePipeline.__executeServer(opts));
var loadSamplePipeline = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(loadSamplePipeline_createServerFn_handler, async ({ context }) => {
	for (const row of sampleInterviews()) await upsertRow(context.userId, {
		...row,
		id: newId()
	});
	return listForUser(context.userId);
});
//#endregion
export { createInterview_createServerFn_handler, deleteInterview_createServerFn_handler, listInterviews_createServerFn_handler, loadSamplePipeline_createServerFn_handler, scanInbox_createServerFn_handler, updateInterview_createServerFn_handler };
