import { r as ConnectorType } from "./types-4jafLSle.mjs";
import { t as classifyCallToolError } from "./errors-DBtLudPj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gmail-D1A-B8De.js
var INTERVIEW_QUERY = [
	"(\"interview scheduled\"",
	"OR \"interview confirmation\"",
	"OR \"interview invitation\"",
	"OR \"phone screen\"",
	"OR \"onsite interview\"",
	"OR \"virtual interview\"",
	"OR \"hiring manager\"",
	"OR \"update on your application\"",
	"OR \"we regret\"",
	"OR \"not moving forward\"",
	"OR \"offer letter\"",
	"OR \"pleased to offer\"",
	"OR cancelled OR canceled",
	"OR zoom.us OR meet.google.com)"
].join(" ");
function interviewSearchQuery(days) {
	return `newer_than:${Math.min(Math.max(Math.trunc(days) || 30, 1), 180)}d ${INTERVIEW_QUERY}`;
}
function asRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value;
}
function asString(value) {
	return typeof value === "string" ? value : "";
}
function pickString(record, keys) {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim()) return value;
	}
	return "";
}
function headerMap(payload) {
	const headers = asRecord(payload)?.headers;
	const map = {};
	if (!Array.isArray(headers)) return map;
	for (const item of headers) {
		const row = asRecord(item);
		if (!row) continue;
		const name = asString(row.name).toLowerCase();
		const value = asString(row.value);
		if (name && value) map[name] = value;
	}
	return map;
}
function decodeBody(data) {
	try {
		const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
		return Buffer.from(normalized, "base64").toString("utf8");
	} catch {
		return data;
	}
}
function walkBody(payload, acc) {
	const rec = asRecord(payload);
	if (!rec) return;
	const data = asString(asRecord(rec.body)?.data);
	const mime = asString(rec.mimeType).toLowerCase();
	if (data && (mime.includes("text/plain") || mime === "" || mime.includes("text/html"))) acc.push(decodeBody(data));
	const parts = rec.parts;
	if (Array.isArray(parts)) for (const part of parts) walkBody(part, acc);
}
function extractBody(record) {
	const direct = pickString(record, [
		"body",
		"bodyText",
		"text",
		"plainText",
		"content"
	]);
	if (direct) return stripHtml(direct);
	const acc = [];
	walkBody(record.payload ?? record, acc);
	return stripHtml(acc.find((chunk) => !chunk.includes("<")) ?? acc.join("\n")).slice(0, 8e3);
}
function stripHtml(value) {
	return value.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/\s+/g, " ").trim();
}
function normalizeMessage(raw) {
	const rec = asRecord(raw);
	if (!rec) return null;
	const nested = asRecord(rec.message) ?? asRecord(rec.email) ?? rec;
	const id = pickString(nested, [
		"id",
		"messageId",
		"message_id"
	]);
	const threadId = pickString(nested, [
		"threadId",
		"thread_id",
		"thread",
		"conversationId"
	]) || id;
	if (!id && !threadId) return null;
	const headers = headerMap(nested.payload ?? nested);
	const subject = pickString(nested, ["subject", "title"]) || headers.subject || "(no subject)";
	const from = pickString(nested, [
		"from",
		"sender",
		"fromEmail"
	]) || headers.from;
	const date = pickString(nested, [
		"date",
		"internalDate",
		"internal_date",
		"receivedAt",
		"timestamp"
	]) || headers.date || null;
	const snippet = pickString(nested, [
		"snippet",
		"preview",
		"summary"
	]);
	const body = extractBody(nested) || snippet;
	return {
		id: id || threadId,
		threadId,
		subject,
		from,
		date,
		snippet,
		body
	};
}
function collectList(data) {
	if (Array.isArray(data)) return data;
	const rec = asRecord(data);
	if (!rec) return [];
	const nested = rec.data ?? rec.result ?? rec;
	const nestedRec = asRecord(nested) ?? rec;
	for (const key of [
		"messages",
		"emails",
		"results",
		"items",
		"threads"
	]) {
		const value = nestedRec[key];
		if (Array.isArray(value)) return value;
	}
	if (Array.isArray(nested)) return nested;
	return [];
}
function failFromResult(result) {
	const classified = classifyCallToolError(result);
	return {
		ok: false,
		pending: result.pending,
		loginRequired: result.loginRequired,
		loginUrl: result.loginUrl,
		errorKind: classified?.kind ?? "error",
		errorMessage: classified?.message ?? result.errorMessage ?? "Gmail request failed."
	};
}
function isRetryableUnknownTool(result) {
	if (result.ok || result.pending || result.loginRequired) return false;
	const raw = (result.errorMessage ?? "").toLowerCase();
	if (classifyCallToolError(result)?.kind === "not_connected") return false;
	return raw.includes("unknown tool") || raw.includes("tool not found") || raw.includes("not found") || raw.includes("invalid tool") || raw.includes("does not exist");
}
async function callGmail(toolName, args) {
	const { callTool } = await import("./client.server-By1LRxeE.mjs");
	return callTool(toolName, args, { connectorType: ConnectorType.Gmail });
}
var SEARCH_ATTEMPTS = [
	{
		tool: "gmail_search",
		args: (query, max) => ({
			query,
			max_results: max
		})
	},
	{
		tool: "gmail_search",
		args: (query, max) => ({
			q: query,
			maxResults: max
		})
	},
	{
		tool: "gmail_list_messages",
		args: (query, max) => ({
			q: query,
			max_results: max
		})
	}
];
var READ_ATTEMPTS = [
	{
		tool: "gmail_get_message",
		args: (id) => ({ message_id: id })
	},
	{
		tool: "gmail_get_message",
		args: (id) => ({ id })
	},
	{
		tool: "gmail_read_message",
		args: (id) => ({ message_id: id })
	}
];
async function searchMessages(query, maxResults) {
	let lastFail = null;
	for (const attempt of SEARCH_ATTEMPTS) {
		const result = await callGmail(attempt.tool, attempt.args(query, maxResults));
		if (result.ok) return {
			ok: true,
			messages: collectList(result.data).map(normalizeMessage).filter((row) => row !== null)
		};
		const fail = failFromResult(result);
		if (result.pending || result.loginRequired || fail.errorKind === "not_connected") return fail;
		lastFail = fail;
		if (!isRetryableUnknownTool(result)) return fail;
	}
	return lastFail ?? {
		ok: false,
		errorKind: "error",
		errorMessage: "Could not search Gmail."
	};
}
async function readMessage(id) {
	for (const attempt of READ_ATTEMPTS) {
		const result = await callGmail(attempt.tool, attempt.args(id));
		if (result.ok) {
			const message = normalizeMessage(result.data);
			if (message) return message;
			const first = collectList(result.data).map(normalizeMessage).find((row) => row !== null);
			if (first) return first;
			return null;
		}
		if (result.pending || result.loginRequired) return null;
		if (!isRetryableUnknownTool(result)) return null;
	}
	return null;
}
function uniqueByThread(messages) {
	const seen = /* @__PURE__ */ new Map();
	for (const message of messages) {
		const existing = seen.get(message.threadId);
		if (!existing) {
			seen.set(message.threadId, message);
			continue;
		}
		const nextMs = message.date ? Date.parse(message.date) : 0;
		const currentMs = existing.date ? Date.parse(existing.date) : 0;
		if (!Number.isNaN(nextMs) && nextMs >= currentMs) seen.set(message.threadId, message);
	}
	return [...seen.values()];
}
var MAX_THREADS = 12;
var MAX_BODY_FETCH = 8;
async function fetchInterviewEmails(days) {
	const search = await searchMessages(interviewSearchQuery(days), 25);
	if (!search.ok) return search;
	const unique = uniqueByThread(search.messages).slice(0, MAX_THREADS);
	const hydrated = [];
	let fetches = 0;
	for (const message of unique) if (message.body.length < 80 && fetches < MAX_BODY_FETCH) {
		fetches += 1;
		const full = await readMessage(message.id);
		hydrated.push(full ?? message);
	} else hydrated.push(message);
	return {
		ok: true,
		messages: hydrated
	};
}
//#endregion
export { fetchInterviewEmails };
