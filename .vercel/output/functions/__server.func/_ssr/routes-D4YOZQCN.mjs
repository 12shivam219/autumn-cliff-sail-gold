import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, r as QueryClientProvider, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as signOut, t as authClient } from "./client-BhcLuWvF.mjs";
import { n as CONNECTOR_TOKEN_READY_EVENT } from "./types-4jafLSle.mjs";
import { n as isFramed, r as redirectToLoginIfRequired, t as classifyCallToolError } from "./errors-DBtLudPj.mjs";
import { i as authMiddleware, n as LOOKBACK_OPTIONS, o as isUpcoming, r as STATUS_TONE, s as sampleInterviews, t as INTERVIEW_STATUSES } from "./status-CerAbSlB.mjs";
import { i as hasGateSessionMarker } from "./server-COKnfW8-.mjs";
import { a as Trash2, c as Plus, d as Inbox, f as CalendarClock, l as Mail, n as Video, o as Search, p as Building2, r as Users, s as RefreshCw, t as X, u as Link2 } from "../_libs/lucide-react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as format, r as isValid, t as parseISO } from "../_libs/date-fns.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D4YOZQCN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Badge({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ring-1 ring-inset", className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg shadow-[var(--shadow-border)] hover:opacity-90",
			secondary: "bg-surface text-fg shadow-[var(--shadow-border)] hover:bg-surface-2",
			ghost: "bg-transparent text-fg hover:bg-surface-2",
			danger: "bg-rejected/15 text-rejected shadow-[var(--shadow-border)] hover:bg-rejected/25"
		},
		size: {
			sm: "h-9 rounded-sm px-3 text-sm",
			md: "h-11 rounded-md px-4 text-sm",
			lg: "h-12 rounded-md px-5 text-base",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var fieldClass = "h-11 w-full rounded-sm bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70";
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn(fieldClass, className),
		...props
	});
}
function Select({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: cn(fieldClass, "pr-8", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn(fieldClass, "h-auto min-h-24 py-2", className),
		...props
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getConnectorReadiness = createServerFn({ method: "POST" }).handler(createSsrRpc("ac303419f3bd6f94ee837f95e91005a600278deed4876cb96a25aa0d69185951"));
var READINESS_PROBE_DELAYS_MS = [
	1e3,
	2e3,
	3e3,
	5e3
];
var READINESS_PROBE_MAX_TOTAL_MS = 18e4;
function readinessProbeDelayMs(attempt) {
	return READINESS_PROBE_DELAYS_MS[Math.min(Math.max(attempt, 0), READINESS_PROBE_DELAYS_MS.length - 1)];
}
function readinessProbeExhausted(startedAtMs, nowMs) {
	return nowMs - startedAtMs >= READINESS_PROBE_MAX_TOTAL_MS;
}
var READINESS_PROBE_TIMEOUT_MS = 1e4;
function withTimeout(promise, ms) {
	return new Promise((resolve) => {
		const timer = setTimeout(() => resolve(null), ms);
		const settle = (value) => {
			clearTimeout(timer);
			resolve(value);
		};
		promise.then(settle, () => settle(null));
	});
}
async function isConnectorReady() {
	return (await withTimeout(getConnectorReadiness(), READINESS_PROBE_TIMEOUT_MS))?.ready === true;
}
/**
* While `waiting` is true (a connector call returned `pending`), probes the
* server for the connector token and calls `refetch` once it is present. The
* probe is a header check on the app's own server — it never reaches the gate.
* A `connector-token-ready` bridge event from the Grok preview chrome triggers
* `refetch` immediately. A top-level page (download/export, local dev, the
* sandbox's own `npm run preview`) is not framed by any preview, so no token
* can ever arrive: the hook reports `not_embedded` without probing. Any framed
* page probes, even when the parent origin cannot be resolved (empty referrer,
* no `ancestorOrigins`): the token comes through the preview proxy, and the
* bridge event is only the faster signal.
*/
function useRefetchWhenConnectorReady(waiting, refetch) {
	const refetchRef = (0, import_react.useRef)(refetch);
	const [timedOut, setTimedOut] = (0, import_react.useState)(false);
	const [notEmbedded, setNotEmbedded] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		refetchRef.current = refetch;
	}, [refetch]);
	(0, import_react.useEffect)(() => {
		if (!waiting) return;
		if (!isFramed()) {
			setNotEmbedded(true);
			return () => setNotEmbedded(false);
		}
		let cancelled = false;
		let refetching = false;
		let attempt = 0;
		let timer;
		const startedAt = Date.now();
		const runRefetch = async () => {
			if (refetching) return;
			refetching = true;
			try {
				await refetchRef.current();
			} catch {} finally {
				refetching = false;
			}
		};
		const schedule = () => {
			timer = setTimeout(probe, readinessProbeDelayMs(attempt));
			attempt += 1;
		};
		const probe = async () => {
			if (cancelled || readinessProbeExhausted(startedAt, Date.now())) return;
			const ready = await isConnectorReady();
			if (cancelled) return;
			if (ready) await runRefetch();
			if (!cancelled) schedule();
		};
		const onTokenReady = () => {
			runRefetch();
		};
		const deadline = setTimeout(() => {
			if (!cancelled) setTimedOut(true);
		}, READINESS_PROBE_MAX_TOTAL_MS);
		window.addEventListener(CONNECTOR_TOKEN_READY_EVENT, onTokenReady);
		schedule();
		return () => {
			cancelled = true;
			clearTimeout(deadline);
			if (timer !== void 0) clearTimeout(timer);
			window.removeEventListener(CONNECTOR_TOKEN_READY_EVENT, onTokenReady);
			setTimedOut(false);
		};
	}, [waiting]);
	if (!waiting) return "idle";
	if (notEmbedded) return "not_embedded";
	return timedOut ? "timed_out" : "waiting";
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var listInterviews = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3ee2b465dc58f1b90e3fea2d1bfc899200492bcd92212f237ef0ca8473ccdbb4"));
var scanInbox = createServerFn({ method: "POST" }).validator((input) => ({ days: Math.min(Math.max(Number(input?.days) || 30, 1), 180) })).handler(createSsrRpc("e816091e39185ba254dbb641825bd13bd838bdcaa33b62ee93350273399faee2"));
var createInterview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("2f1bd97e7b4c20990939c056aa508d5cd0fbbd14a0eec61827e4f76833b82565"));
var updateInterview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("e11904eff9c4a1c60636f23d8e0c47b0376682760469621db464bc8170d58f63"));
var deleteInterview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("6097c7cf4038f4dc54829461326acd979b06f5381ff9c764f074a245815ab817"));
var loadSamplePipeline = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("f6213a6b0bd03be1ada4cb9420a43ec4653d4a097ddc9ca7bc9d436b2ca76d5d"));
var KEY = "shortlist.interviews.v1";
function readGuestInterviews() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeGuestInterviews(rows) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(KEY, JSON.stringify(rows));
	} catch {}
}
function upsertGuest(rows, incoming) {
	const map = new Map(rows.map((row) => [row.gmailThreadId, row]));
	for (const row of incoming) {
		const existing = map.get(row.gmailThreadId);
		map.set(row.gmailThreadId, existing ? {
			...existing,
			...row,
			id: existing.id
		} : row);
	}
	const next = [...map.values()];
	writeGuestInterviews(next);
	return next;
}
var QUERY_KEY = ["interviews"];
function isUnauthorized(err) {
	const message = err instanceof Error ? err.message : String(err);
	return /unauthorized/i.test(message);
}
function formatWhen(iso, withTime = true) {
	if (!iso) return "Date TBD";
	const parsed = parseISO(iso);
	const date = isValid(parsed) ? parsed : new Date(iso);
	if (!isValid(date)) return "Date TBD";
	return format(date, withTime ? "MMM d · h:mm a" : "MMM d");
}
function emptyDraft() {
	return {
		companyName: "",
		role: "",
		status: "Scheduled",
		interviewDate: null,
		interviewerNames: [],
		meetingLink: null,
		notes: null
	};
}
function DashboardInner() {
	const queryClient = useQueryClient();
	const { user, isPending: sessionPending } = useCurrentUserState();
	const [signedIn, setSignedIn] = (0, import_react.useState)(false);
	const [days, setDays] = (0, import_react.useState)(30);
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [query, setQuery] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)("date");
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [formOpen, setFormOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [scanNotice, setScanNotice] = (0, import_react.useState)(null);
	const listQuery = useQuery({
		queryKey: QUERY_KEY,
		queryFn: async () => {
			try {
				const result = await listInterviews();
				setSignedIn(true);
				return result.interviews;
			} catch (err) {
				if (isUnauthorized(err)) {
					setSignedIn(false);
					return readGuestInterviews();
				}
				throw err;
			}
		}
	});
	const interviews = listQuery.data ?? [];
	const scanMutation = useMutation({
		mutationFn: () => scanInbox({ data: { days } }),
		onSuccess: (result) => {
			setScanNotice(result);
			if (!result.ok) return;
			if (signedIn) queryClient.setQueryData(QUERY_KEY, result.interviews);
			else {
				const next = upsertGuest(interviews, result.interviews);
				queryClient.setQueryData(QUERY_KEY, next);
			}
			toast.success(result.parsed === 0 ? `Scanned ${result.scanned} threads — none looked like interviews` : `Logged ${result.parsed} interview ${result.parsed === 1 ? "thread" : "threads"}`);
		},
		onError: (err) => {
			toast.error(err instanceof Error ? err.message : "Scan failed");
		}
	});
	const waitStatus = useRefetchWhenConnectorReady(Boolean(scanNotice && !scanNotice.ok && scanNotice.pending), () => scanMutation.mutateAsync());
	const sampleMutation = useMutation({
		mutationFn: async () => {
			if (signedIn) return loadSamplePipeline();
			return upsertGuest(interviews, sampleInterviews());
		},
		onSuccess: (rows) => {
			queryClient.setQueryData(QUERY_KEY, rows);
			toast.success("Sample pipeline loaded");
		}
	});
	const saveMutation = useMutation({
		mutationFn: async (payload) => {
			if (signedIn) {
				if (payload.id) return updateInterview({ data: {
					id: payload.id,
					...payload.draft
				} });
				return createInterview({ data: payload.draft });
			}
			const now = (/* @__PURE__ */ new Date()).toISOString();
			if (payload.id) {
				const next = interviews.map((row) => row.id === payload.id ? {
					...row,
					...payload.draft,
					companyName: payload.draft.companyName || row.companyName,
					role: payload.draft.role || row.role,
					updatedAt: now
				} : row);
				writeGuestInterviews(next);
				return next.find((row) => row.id === payload.id) ?? null;
			}
			const created = {
				id: crypto.randomUUID(),
				gmailThreadId: `manual-${crypto.randomUUID()}`,
				gmailMessageId: null,
				companyName: payload.draft.companyName || "Untitled company",
				role: payload.draft.role || "Role not specified",
				status: payload.draft.status,
				interviewDate: payload.draft.interviewDate,
				interviewerNames: payload.draft.interviewerNames,
				meetingLink: payload.draft.meetingLink,
				subject: null,
				snippet: null,
				source: "manual",
				notes: payload.draft.notes,
				lastEmailAt: now,
				createdAt: now,
				updatedAt: now
			};
			writeGuestInterviews([created, ...interviews]);
			return created;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
			if (!signedIn) queryClient.setQueryData(QUERY_KEY, readGuestInterviews());
			setFormOpen(false);
			setEditing(null);
			toast.success("Saved");
		}
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			if (signedIn) {
				await deleteInterview({ data: id });
				return;
			}
			writeGuestInterviews(interviews.filter((row) => row.id !== id));
		},
		onSuccess: (_, id) => {
			queryClient.setQueryData(QUERY_KEY, (prev) => (prev ?? interviews).filter((row) => row.id !== id));
			if (selectedId === id) setSelectedId(null);
			toast.success("Removed");
		}
	});
	const metrics = (0, import_react.useMemo)(() => {
		return {
			total: interviews.length,
			upcoming: interviews.filter((row) => isUpcoming(row.interviewDate, row.status)).length,
			offers: interviews.filter((row) => row.status === "Offer").length,
			canceled: interviews.filter((row) => row.status === "Canceled").length
		};
	}, [interviews]);
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return [...interviews.filter((row) => {
			if (statusFilter !== "all" && row.status !== statusFilter) return false;
			if (!q) return true;
			return [
				row.companyName,
				row.role,
				row.subject,
				row.interviewerNames.join(" "),
				row.notes
			].filter(Boolean).join(" ").toLowerCase().includes(q);
		})].sort((a, b) => {
			if (sort === "company") return a.companyName.localeCompare(b.companyName);
			if (sort === "status") return a.status.localeCompare(b.status);
			const aMs = a.interviewDate ? Date.parse(a.interviewDate) : 0;
			return (b.interviewDate ? Date.parse(b.interviewDate) : 0) - aMs;
		});
	}, [
		interviews,
		query,
		sort,
		statusFilter
	]);
	const selected = interviews.find((row) => row.id === selectedId) ?? null;
	const connectorError = scanNotice && !scanNotice.ok ? classifyCallToolError({
		ok: false,
		data: null,
		pending: scanNotice.pending,
		loginRequired: scanNotice.loginRequired,
		loginUrl: scanNotice.loginUrl,
		errorMessage: scanNotice.errorMessage
	}) : null;
	(0, import_react.useEffect)(() => {
		if (waitStatus === "timed_out") toast.error("Still waiting on Gmail. Try scanning again in a moment.");
	}, [waitStatus]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-right",
				toastOptions: { className: "font-sans bg-surface text-fg shadow-[var(--shadow-border)]" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-widest text-fg-muted uppercase",
							children: "Inbox pipeline"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl font-medium text-fg",
							children: "Shortlist"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-3",
						children: sessionPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-8 animate-pulse rounded-full bg-surface-2" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) : null
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "stagger-in grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Total",
								value: metrics.total,
								hint: "tracked threads"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Upcoming",
								value: metrics.upcoming,
								hint: "still on the books"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Offers",
								value: metrics.offers,
								hint: "in hand"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Canceled",
								value: metrics.canceled,
								hint: "pulled or postponed"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3 sm:flex-row sm:items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm text-fg-muted",
										children: ["Lookback", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
											value: String(days),
											onChange: (e) => setDays(Number(e.target.value)),
											className: "h-11 w-32",
											"aria-label": "Lookback window in days",
											children: LOOKBACK_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: option,
												children: [option, " days"]
											}, option))
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: () => scanMutation.mutate(),
										disabled: scanMutation.isPending,
										className: "min-w-40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", scanMutation.isPending && "animate-spin") }), scanMutation.isPending ? "Scanning…" : "Scan inbox"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "secondary",
										onClick: () => {
											setEditing(null);
											setFormOpen(true);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Add interview"]
									}), interviews.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										onClick: () => sampleMutation.mutate(),
										disabled: sampleMutation.isPending,
										children: "Load sample pipeline"
									})]
								})]
							}),
							connectorError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectorBanner, {
								kind: connectorError.kind,
								message: waitStatus === "waiting" ? "Connecting to Gmail…" : waitStatus === "not_embedded" ? "Open Shortlist from Grok to reach your inbox." : connectorError.message,
								loginUrl: scanNotice?.loginUrl,
								onLogin: () => {
									if (!scanNotice) return;
									redirectToLoginIfRequired({
										ok: false,
										data: null,
										loginRequired: true,
										loginUrl: scanNotice.loginUrl
									});
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 lg:flex-row lg:items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex min-h-11 flex-wrap gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
											active: statusFilter === "all",
											onClick: () => setStatusFilter("all"),
											children: "All"
										}), INTERVIEW_STATUSES.map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
											active: statusFilter === status,
											onClick: () => setStatusFilter(status),
											children: status
										}, status))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: query,
											onChange: (e) => setQuery(e.target.value),
											placeholder: "Filter by company, role, interviewer",
											className: "pl-10",
											"aria-label": "Search interviews"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: sort,
										onChange: (e) => setSort(e.target.value),
										className: "h-11 w-full lg:w-40",
										"aria-label": "Sort interviews",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "date",
												children: "Sort by date"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "company",
												children: "Sort by company"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "status",
												children: "Sort by status"
											})
										]
									})
								]
							})
						]
					}),
					listQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-surface px-6 py-10 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-medium",
							children: "Couldn’t load the pipeline"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-fg-muted",
							children: listQuery.error instanceof Error ? listQuery.error.message : "Try scanning again in a moment."
						})]
					}) : listQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3",
						children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-20 animate-pulse rounded-lg bg-surface" }, i))
					}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						hasAny: interviews.length > 0,
						onScan: () => scanMutation.mutate(),
						onSample: () => sampleMutation.mutate(),
						scanning: scanMutation.isPending
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "grid gap-3",
						children: visible.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelectedId(row.id),
							className: "flex w-full flex-col gap-3 rounded-lg bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-[var(--motion-quick)] hover:shadow-[var(--shadow-border-hover)] sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium text-fg",
										children: row.companyName
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: STATUS_TONE[row.status],
										children: row.status
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 truncate text-sm text-fg-muted",
									children: row.role
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-3.5" }), formatWhen(row.interviewDate)]
								}), row.interviewerNames.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5" }), row.interviewerNames.join(", ")]
								})]
							})]
						}) }, row.id))
					})
				]
			}),
			selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailSheet, {
				interview: selected,
				onClose: () => setSelectedId(null),
				onEdit: () => {
					setEditing(selected);
					setFormOpen(true);
				},
				onDelete: () => deleteMutation.mutate(selected.id),
				deleting: deleteMutation.isPending
			}),
			formOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InterviewForm, {
				initial: editing,
				saving: saveMutation.isPending,
				onClose: () => {
					setFormOpen(false);
					setEditing(null);
				},
				onSave: (draft) => saveMutation.mutate({
					id: editing?.id,
					draft
				})
			})
		]
	});
}
function Metric({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-lg bg-surface px-4 py-5 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-[0.16em] text-fg-muted uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display mt-2 text-4xl font-medium tabular-nums text-fg",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-fg-subtle",
				children: hint
			})
		]
	});
}
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-11 rounded-full px-3.5 text-sm transition-colors duration-[var(--motion-quick)]", active ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg-muted hover:text-fg"),
		children
	});
}
function ConnectorBanner({ kind, message, loginUrl, onLogin }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 rounded-md bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-fg-muted",
				children: message
			}),
			kind === "login" && loginUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				onClick: onLogin,
				children: "Continue with Grok"
			}),
			kind === "not_connected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-fg-subtle",
				children: "Connect Gmail in Grok, then scan again."
			})
		]
	});
}
function EmptyState({ hasAny, onScan, onSample, scanning }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-start gap-4 rounded-xl bg-surface px-6 py-12 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-12 place-items-center rounded-md bg-surface-2 text-accent",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-lg space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium",
					children: hasAny ? "Nothing matches that filter" : "No interviews on the board"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-fg-muted",
					children: hasAny ? "Clear search or switch status to see the rest of the pipeline." : "Scan Gmail for invites, cancellations, and offers from the last few weeks — or add a loop by hand."
				})]
			}),
			!hasAny && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: onScan,
					disabled: scanning,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-4" }), "Scan inbox"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: onSample,
					children: "Load sample pipeline"
				})]
			})
		]
	});
}
function DetailSheet({ interview, onClose, onEdit, onDelete, deleting }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex justify-end bg-bg/80",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto bg-surface p-6 shadow-[var(--shadow-border)]",
			onClick: (e) => e.stopPropagation(),
			role: "dialog",
			"aria-labelledby": "interview-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-[0.18em] text-fg-muted uppercase",
							children: interview.source === "gmail" ? "From Gmail" : interview.source
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "interview-title",
							className: "font-display mt-1 text-3xl font-medium",
							children: interview.companyName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-fg-muted",
							children: interview.role
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: onClose,
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					className: cn("w-fit", STATUS_TONE[interview.status]),
					children: interview.status
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
							icon: CalendarClock,
							label: "When",
							value: formatWhen(interview.interviewDate)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
							icon: Users,
							label: "Interviewers",
							value: interview.interviewerNames.join(", ") || "Not listed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
							icon: Video,
							label: "Meeting",
							value: interview.meetingLink ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: interview.meetingLink,
								className: "text-accent underline-offset-4 hover:underline",
								target: "_blank",
								rel: "noreferrer",
								children: "Join link"
							}) : "No link yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
							icon: Building2,
							label: "Company",
							value: interview.companyName
						}),
						interview.subject && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
							icon: Mail,
							label: "Subject",
							value: interview.subject
						}),
						interview.meetingLink && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
							icon: Link2,
							label: "URL",
							value: interview.meetingLink
						})
					]
				}),
				interview.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-surface-2 px-4 py-3 text-sm text-fg-muted",
					children: interview.notes
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-auto flex flex-wrap gap-2 pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: onEdit,
						className: "flex-1",
						children: "Edit"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "danger",
						onClick: onDelete,
						disabled: deleting,
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Remove"]
					})]
				})
			]
		})
	});
}
function DetailRow({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mt-0.5 size-4 shrink-0 text-fg-subtle" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "w-24 shrink-0 text-fg-subtle",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "min-w-0 break-words text-fg",
				children: value
			})
		]
	});
}
function InterviewForm({ initial, saving, onClose, onSave }) {
	const [draft, setDraft] = (0, import_react.useState)(() => initial ? {
		companyName: initial.companyName,
		role: initial.role,
		status: initial.status,
		interviewDate: initial.interviewDate,
		interviewerNames: initial.interviewerNames,
		meetingLink: initial.meetingLink,
		notes: initial.notes
	} : emptyDraft());
	const localDate = draft.interviewDate ? toDatetimeLocal(draft.interviewDate) : "";
	function submit(e) {
		e.preventDefault();
		onSave({
			...draft,
			interviewerNames: draft.interviewerNames.map((n) => n.trim()).filter(Boolean),
			companyName: draft.companyName.trim(),
			role: draft.role.trim(),
			meetingLink: draft.meetingLink?.trim() || null,
			notes: draft.notes?.trim() || null
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 grid place-items-end bg-bg/80 sm:place-items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			onClick: (e) => e.stopPropagation(),
			className: "flex max-h-screen w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-medium",
						children: initial ? "Edit interview" : "Add interview"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: onClose,
						"aria-label": "Close form",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg-muted",
						children: "Company"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						required: true,
						value: draft.companyName,
						onChange: (e) => setDraft((d) => ({
							...d,
							companyName: e.target.value
						}))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg-muted",
						children: "Role"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						required: true,
						value: draft.role,
						onChange: (e) => setDraft((d) => ({
							...d,
							role: e.target.value
						}))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1.5 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg-muted",
							children: "Status"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: draft.status,
							onChange: (e) => setDraft((d) => ({
								...d,
								status: e.target.value
							})),
							children: INTERVIEW_STATUSES.map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: status,
								children: status
							}, status))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1.5 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg-muted",
							children: "Interview date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "datetime-local",
							value: localDate,
							onChange: (e) => setDraft((d) => ({
								...d,
								interviewDate: e.target.value ? new Date(e.target.value).toISOString() : null
							}))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg-muted",
						children: "Interviewers (comma separated)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.interviewerNames.join(", "),
						onChange: (e) => setDraft((d) => ({
							...d,
							interviewerNames: e.target.value.split(",")
						}))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg-muted",
						children: "Meeting link"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "text",
						inputMode: "url",
						placeholder: "https://",
						value: draft.meetingLink ?? "",
						onChange: (e) => setDraft((d) => ({
							...d,
							meetingLink: e.target.value
						}))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "grid gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg-muted",
						children: "Notes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						rows: 3,
						value: draft.notes ?? "",
						onChange: (e) => setDraft((d) => ({
							...d,
							notes: e.target.value
						}))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: saving,
						className: "flex-1",
						children: saving ? "Saving…" : "Save"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onClose,
						className: "flex-1",
						children: "Cancel"
					})]
				})
			]
		})
	});
}
function toDatetimeLocal(iso) {
	const date = new Date(iso);
	if (!isValid(date)) return "";
	const pad = (n) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function Dashboard() {
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		retry: 1,
		refetchOnWindowFocus: false
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardInner, {})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {});
}
//#endregion
export { Home as component };
