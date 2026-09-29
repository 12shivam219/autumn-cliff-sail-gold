import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-CerAbSlB.js
var INTERVIEW_STATUSES = [
	"Scheduled",
	"Canceled",
	"Rejected",
	"Offer",
	"Completed"
];
var LOOKBACK_OPTIONS = [
	7,
	14,
	30,
	90
];
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-BhcLuWvF.mjs").then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-_hq0tw-r.mjs");
	const { requireUserId } = await import("./verify.server-CYm3ShQy.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
function isoDaysFromNow(days, hour = 15, minute = 0) {
	const d = /* @__PURE__ */ new Date();
	d.setDate(d.getDate() + days);
	d.setHours(hour, minute, 0, 0);
	return d.toISOString();
}
function sampleInterviews() {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	return [
		{
			id: "sample-stripe",
			gmailThreadId: "sample-thread-stripe",
			gmailMessageId: "sample-msg-stripe",
			companyName: "Stripe",
			role: "Staff Product Engineer",
			status: "Scheduled",
			interviewDate: isoDaysFromNow(4, 14, 30),
			interviewerNames: ["Amina Chen", "Luis Ortega"],
			meetingLink: "https://zoom.us/j/847291003",
			subject: "Stripe — interview scheduled with Product Eng",
			snippet: "Looking forward to speaking with you Thursday. We'll cover system design, then a product walkthrough.",
			source: "sample",
			notes: "Loop is 75 minutes. Prepare a recent incident write-up.",
			lastEmailAt: isoDaysFromNow(-2, 9, 12),
			createdAt: now,
			updatedAt: now
		},
		{
			id: "sample-figma",
			gmailThreadId: "sample-thread-figma",
			gmailMessageId: "sample-msg-figma",
			companyName: "Figma",
			role: "Senior Frontend Engineer",
			status: "Scheduled",
			interviewDate: isoDaysFromNow(1, 11, 0),
			interviewerNames: ["Priya Shah"],
			meetingLink: "https://meet.google.com/kqm-fwts-abn",
			subject: "Figma interview: hiring manager screen",
			snippet: "Please join the Google Meet link below. Duration: 45 minutes.",
			source: "sample",
			notes: null,
			lastEmailAt: isoDaysFromNow(-1, 16, 40),
			createdAt: now,
			updatedAt: now
		},
		{
			id: "sample-notion",
			gmailThreadId: "sample-thread-notion",
			gmailMessageId: "sample-msg-notion",
			companyName: "Notion",
			role: "Engineering Manager",
			status: "Completed",
			interviewDate: isoDaysFromNow(-5, 13, 0),
			interviewerNames: ["Jonah Park", "Elena Voss"],
			meetingLink: null,
			subject: "Thanks for interviewing with Notion",
			snippet: "Appreciate you taking the time for the onsite yesterday. We'll be in touch.",
			source: "sample",
			notes: "Panel went long. Strong on team rituals, weaker on infra story.",
			lastEmailAt: isoDaysFromNow(-4, 10, 5),
			createdAt: now,
			updatedAt: now
		},
		{
			id: "sample-linear",
			gmailThreadId: "sample-thread-linear",
			gmailMessageId: "sample-msg-linear",
			companyName: "Linear",
			role: "Full-Stack Engineer",
			status: "Offer",
			interviewDate: isoDaysFromNow(-12, 15, 0),
			interviewerNames: ["Karri Saarinen"],
			meetingLink: null,
			subject: "Offer from Linear",
			snippet: "We're excited to offer you the Full-Stack Engineer role on the workflow team.",
			source: "sample",
			notes: "Verbal offer; written letter expected this week.",
			lastEmailAt: isoDaysFromNow(-1, 8, 20),
			createdAt: now,
			updatedAt: now
		},
		{
			id: "sample-vercel",
			gmailThreadId: "sample-thread-vercel",
			gmailMessageId: "sample-msg-vercel",
			companyName: "Vercel",
			role: "Platform Engineer",
			status: "Rejected",
			interviewDate: isoDaysFromNow(-18, 10, 0),
			interviewerNames: ["Recruiting team"],
			meetingLink: null,
			subject: "Update on your application to Vercel",
			snippet: "After careful review we will not be moving forward. Thank you for your time.",
			source: "sample",
			notes: null,
			lastEmailAt: isoDaysFromNow(-9, 12, 0),
			createdAt: now,
			updatedAt: now
		},
		{
			id: "sample-anthropic",
			gmailThreadId: "sample-thread-anthropic",
			gmailMessageId: "sample-msg-anthropic",
			companyName: "Anthropic",
			role: "Research Engineer",
			status: "Canceled",
			interviewDate: isoDaysFromNow(2, 16, 0),
			interviewerNames: ["Maya Ellison"],
			meetingLink: "https://zoom.us/j/120984433",
			subject: "Interview canceled — Anthropic",
			snippet: "We need to reschedule the research-scope conversation. Apologies for the late notice.",
			source: "sample",
			notes: "Waiting on a new slot.",
			lastEmailAt: isoDaysFromNow(-.2, 18, 10),
			createdAt: now,
			updatedAt: now
		}
	];
}
var STATUS_LABEL = {
	Scheduled: "Scheduled",
	Canceled: "Canceled",
	Rejected: "Rejected",
	Offer: "Offer",
	Completed: "Completed"
};
var STATUS_TONE = {
	Scheduled: "bg-scheduled/15 text-scheduled ring-scheduled/25",
	Canceled: "bg-canceled/15 text-canceled ring-canceled/25",
	Rejected: "bg-rejected/15 text-rejected ring-rejected/25",
	Offer: "bg-offer/15 text-offer ring-offer/25",
	Completed: "bg-completed/15 text-completed ring-completed/25"
};
var STATUS_RANK = {
	Scheduled: 1,
	Completed: 2,
	Canceled: 3,
	Rejected: 4,
	Offer: 5
};
function isInterviewStatus(value) {
	return value in STATUS_LABEL;
}
/** Prefer a later email; if timestamps tie, keep the more terminal status. */
function shouldReplaceStatus(current, next, currentEmailAt, nextEmailAt) {
	if (nextEmailAt && currentEmailAt) {
		const nextMs = Date.parse(nextEmailAt);
		const currentMs = Date.parse(currentEmailAt);
		if (!Number.isNaN(nextMs) && !Number.isNaN(currentMs) && nextMs !== currentMs) return nextMs > currentMs;
	}
	if (nextEmailAt && !currentEmailAt) return true;
	return STATUS_RANK[next] >= STATUS_RANK[current];
}
function isUpcoming(interviewDate, status) {
	if (status !== "Scheduled" || !interviewDate) return false;
	const ms = Date.parse(interviewDate);
	if (Number.isNaN(ms)) return false;
	return ms >= Date.now() - 36e5;
}
//#endregion
export { isInterviewStatus as a, shouldReplaceStatus as c, authMiddleware as i, LOOKBACK_OPTIONS as n, isUpcoming as o, STATUS_TONE as r, sampleInterviews as s, INTERVIEW_STATUSES as t };
