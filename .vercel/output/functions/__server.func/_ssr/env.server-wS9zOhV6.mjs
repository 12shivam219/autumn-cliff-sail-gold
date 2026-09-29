//#region node_modules/.nitro/vite/services/ssr/assets/env.server-wS9zOhV6.js
function env(key) {
	return process.env[key]?.trim() || void 0;
}
/**
* Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
* every publish; the sandbox preview never has it. Single source of truth for
* the split — gate audience, gate endpoints and connector-token semantics all
* key off this predicate.
*/
function isWorkspacePreview() {
	return !env("GROK_PROJECT_ID");
}
//#endregion
export { isWorkspacePreview as n, env as t };
