//#region node_modules/.nitro/vite/services/ssr/assets/errors-DBtLudPj.js
function isLoginRequired(result) {
	return result.ok === false && result.loginRequired === true;
}
function isConnectorPending(result) {
	return result.ok === false && result.pending === true;
}
function isFramed() {
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
}
function redirectToLoginIfRequired(result) {
	if (!isLoginRequired(result)) return false;
	const url = result.loginUrl;
	if (!url) return false;
	if (typeof window === "undefined") return false;
	if (isFramed()) {
		const opened = window.open(url, "_blank");
		if (opened) {
			opened.opener = null;
			return true;
		}
	}
	window.location.assign(url);
	return true;
}
var MESSAGE_RULES = [
	{
		needles: ["not_connected", "failed_precondition"],
		kind: "not_connected",
		message: "Connect this connector in Grok to load your data."
	},
	{
		needles: ["scope_denied"],
		kind: "scope_denied",
		message: "This view isn't available — the app requested a tool outside its grant."
	},
	{
		needles: ["access_denied"],
		kind: "access_denied",
		message: "You don't have access to this data."
	}
];
function matchMessageRule(raw) {
	return MESSAGE_RULES.find((rule) => rule.needles.some((needle) => raw.includes(needle)));
}
function classifyCallToolError(result) {
	if (result.ok) return null;
	const detail = result.errorMessage || void 0;
	const raw = (result.errorMessage ?? "").toLowerCase();
	if (isConnectorPending(result)) return {
		kind: "pending",
		message: "Connecting to your data…",
		detail
	};
	if (raw.includes("missing_connector_token")) return {
		kind: "error",
		message: "Open this app from Grok to load your data.",
		detail
	};
	if (isLoginRequired(result)) return {
		kind: "login",
		message: "Continue with Grok to load your data.",
		detail
	};
	const rule = matchMessageRule(raw);
	if (rule) return {
		kind: rule.kind,
		message: rule.message,
		detail
	};
	return {
		kind: "error",
		message: detail ?? "Something went wrong. Try again.",
		detail
	};
}
//#endregion
export { isFramed as n, redirectToLoginIfRequired as r, classifyCallToolError as t };
