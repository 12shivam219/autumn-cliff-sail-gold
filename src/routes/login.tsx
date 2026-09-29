import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md space-y-5 rounded-xl bg-surface p-8 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium tracking-widest text-fg-muted uppercase">Shortlist</p>
        <h1 className="font-display text-3xl font-medium text-fg">Open this from Grok</h1>
        <p className="text-fg-muted text-pretty">
          Shortlist reads interview mail through your Grok Gmail connection. Open it from
          Grok so your inbox and identity are already available — there is nothing to
          sign into here.
        </p>
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          Back to pipeline
        </Link>
      </div>
    </main>
  );
}
