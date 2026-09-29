import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-BZn3rZsy.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md space-y-5 rounded-xl bg-surface p-8 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-widest text-fg-muted uppercase",
					children: "Shortlist"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-medium text-fg",
					children: "Open this from Grok"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-fg-muted text-pretty",
					children: "Shortlist reads interview mail through your Grok Gmail connection. Open it from Grok so your inbox and identity are already available — there is nothing to sign into here."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg",
					children: "Back to pipeline"
				})
			]
		})
	});
}
//#endregion
export { Login as component };
