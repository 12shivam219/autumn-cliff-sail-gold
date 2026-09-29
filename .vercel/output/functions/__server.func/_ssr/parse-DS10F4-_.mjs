import { Dt as boolean, Et as array, Ft as string, Mt as object, wt as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { t as INTERVIEW_STATUSES } from "./status-CerAbSlB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/parse-DS10F4-_.js
var extractedSchema = object({
	relevant: boolean().default(true),
	company_name: string().default(""),
	role: string().default(""),
	status: _enum(INTERVIEW_STATUSES).default("Scheduled"),
	interview_date: string().nullable().optional(),
	interviewer_names: array(string()).default([]),
	meeting_link: string().nullable().optional(),
	notes: string().nullable().optional()
});
var LINK_RE = /https?:\/\/(?:[\w-]+\.)*(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com|calendly\.com)[^\s<>"']*/i;
function companyFromFrom(from) {
	const angle = from.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+@[^>]+)>?$/);
	const name = angle?.[1]?.trim();
	if (name && !name.includes("@") && name.length > 1) return tidyCompany(name);
	const host = ((angle?.[2] ?? from).split("@")[1] ?? "").split(".")[0] ?? "";
	if (!host || [
		"gmail",
		"googlemail",
		"outlook",
		"hotmail",
		"yahoo"
	].includes(host.toLowerCase())) return "Unknown company";
	return tidyCompany(host);
}
function tidyCompany(value) {
	return value.replace(/[-_.]+/g, " ").replace(/\b(recruiting|talent|careers|jobs|team|via greenhouse|via lever)\b/gi, "").replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}
function detectStatus(text) {
	const t = text.toLowerCase();
	if (/\b(pleased to offer|offer letter|job offer|we are offering)\b/.test(t)) return "Offer";
	if (/\b(not moving forward|unfortunately|we regret|other candidates|will not be proceeding)\b/.test(t)) return "Rejected";
	if (/\b(cancel+ed|cancellation|need to reschedule|has been called off)\b/.test(t)) return "Canceled";
	if (/\b(thanks for interviewing|thank you for taking the time|completed the interview)\b/.test(t)) return "Completed";
	return "Scheduled";
}
function detectLink(text) {
	return text.match(LINK_RE)?.[0] ?? null;
}
function detectDate(text) {
	for (const pattern of [
		/\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+[A-Z][a-z]+\s+\d{1,2}(?:,\s*\d{4})?(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)?/,
		/\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2})?/,
		/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm))?/i
	]) {
		const match = text.match(pattern);
		if (!match) continue;
		const parsed = Date.parse(match[0].replace(/\bat\b/i, ""));
		if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
	}
	return null;
}
function looksRelevant(text) {
	return /\b(interview|phone screen|onsite|offer letter|application|zoom\.us|meet\.google|hiring manager)\b/i.test(text);
}
function heuristicExtract(message) {
	const blob = `${message.subject}\n${message.from}\n${message.snippet}\n${message.body}`;
	const relevant = looksRelevant(blob);
	const roleMatch = blob.match(/\b(?:role|position|for the)\s*[:–-]?\s*([A-Z][A-Za-z0-9/+\- ]{2,60})/);
	return {
		relevant,
		companyName: companyFromFrom(message.from),
		role: roleMatch?.[1]?.trim() || guessRole(message.subject) || "Role not specified",
		status: detectStatus(blob),
		interviewDate: detectDate(blob) ?? parseMaybeDate(message.date),
		interviewerNames: [],
		meetingLink: detectLink(blob),
		notes: message.snippet.slice(0, 240) || null
	};
}
function guessRole(subject) {
	const dash = subject.replace(/^(\s*(re|fw|fwd)\s*:\s*)+/i, "").trim().split(/[-–|]/)[0]?.trim();
	if (dash && /engineer|manager|designer|scientist|director|intern|lead/i.test(dash)) return dash.slice(0, 80);
	return null;
}
function parseMaybeDate(value) {
	if (!value) return null;
	if (/^\d+$/.test(value)) {
		const n = Number(value);
		const ms = n < 0xe8d4a51000 ? n * 1e3 : n;
		const d = new Date(ms);
		return Number.isNaN(d.getTime()) ? null : d.toISOString();
	}
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}
function normalizeExtracted(raw) {
	const meeting = raw.meeting_link?.trim() || null;
	const date = raw.interview_date?.trim() || null;
	let interviewDate = null;
	if (date) {
		const parsed = Date.parse(date);
		interviewDate = Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
	}
	return {
		relevant: raw.relevant,
		companyName: raw.company_name.trim() || "Unknown company",
		role: raw.role.trim() || "Role not specified",
		status: raw.status,
		interviewDate,
		interviewerNames: raw.interviewer_names.map((n) => n.trim()).filter(Boolean),
		meetingLink: meeting && /^https?:\/\//i.test(meeting) ? meeting : meeting,
		notes: raw.notes?.trim() || null
	};
}
function parseJsonPayload(text) {
	const trimmed = text.trim();
	const body = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? trimmed;
	try {
		return JSON.parse(body);
	} catch {
		const start = body.indexOf("{");
		const end = body.lastIndexOf("}");
		if (start >= 0 && end > start) return JSON.parse(body.slice(start, end + 1));
		throw new Error("Model did not return JSON");
	}
}
async function extractWithGrok(messages) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return null;
	const compact = messages.map((m, i) => ({
		index: i,
		subject: m.subject,
		from: m.from,
		date: m.date,
		body: (m.body || m.snippet).slice(0, 3500)
	}));
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: 0,
			max_tokens: 1800,
			response_format: { type: "json_object" },
			messages: [{
				role: "system",
				content: "You extract job-interview facts from recruiting emails. Return JSON only."
			}, {
				role: "user",
				content: `Extract interview details from each email. Ignore newsletters and unrelated mail (relevant=false).

Status must be one of: Scheduled, Canceled, Rejected, Offer, Completed.
- Scheduled: invite, confirmation, calendar hold, zoom link for an upcoming interview
- Canceled: interview called off or postponed without a new time
- Rejected: not moving forward / regret to inform
- Offer: verbal or written job offer
- Completed: thank-you after an interview, no next step stated

interview_date: ISO-8601 datetime if a specific time is present, else null.
meeting_link: Zoom / Meet / Teams / Calendly URL or null.
company_name: hiring company, not the ATS (Greenhouse, Lever, Ashby).
role: job title being interviewed for.

Emails JSON:
${JSON.stringify(compact)}

Respond as:
{"items":[{"index":0,"relevant":true,"company_name":"","role":"","status":"Scheduled","interview_date":null,"interviewer_names":[],"meeting_link":null,"notes":""}]}`
			}]
		})
	});
	if (!res.ok) return null;
	const content = (await res.json()).choices?.[0]?.message?.content;
	if (!content) return null;
	const parsed = parseJsonPayload(content);
	const rec = parsed && typeof parsed === "object" ? parsed : {};
	const items = Array.isArray(rec.items) ? rec.items : Array.isArray(rec.interviews) ? rec.interviews : Array.isArray(parsed) ? parsed : [];
	return messages.map((message, index) => {
		const row = items.find((item) => {
			return (item && typeof item === "object" ? item : null)?.index === index;
		});
		if (!row) return heuristicExtract(message);
		const safe = extractedSchema.safeParse(row);
		return safe.success ? normalizeExtracted(safe.data) : heuristicExtract(message);
	});
}
async function extractInterviews(messages) {
	if (messages.length === 0) return [];
	try {
		const fromModel = await extractWithGrok(messages);
		if (fromModel) return fromModel;
	} catch {}
	return messages.map(heuristicExtract);
}
//#endregion
export { extractInterviews };
