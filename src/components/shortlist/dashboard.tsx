import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import {
  Building2,
  CalendarClock,
  Inbox,
  Link2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  classifyCallToolError,
  redirectToLoginIfRequired,
  useRefetchWhenConnectorReady,
} from "@/lib/app-data";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createInterview,
  deleteInterview,
  listInterviews,
  loadSamplePipeline,
  scanInbox,
  updateInterview,
} from "@/lib/interviews/server";
import { readGuestInterviews, upsertGuest, writeGuestInterviews } from "@/lib/interviews/guest-store";
import { sampleInterviews } from "@/lib/interviews/sample";
import { isUpcoming, STATUS_TONE } from "@/lib/interviews/status";
import {
  INTERVIEW_STATUSES,
  LOOKBACK_OPTIONS,
  type Interview,
  type InterviewDraft,
  type InterviewStatus,
  type LookbackDays,
  type ScanResult,
} from "@/lib/interviews/types";
import { cn } from "@/lib/utils";

const QUERY_KEY = ["interviews"] as const;

function isUnauthorized(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /unauthorized/i.test(message);
}

function formatWhen(iso: string | null, withTime = true): string {
  if (!iso) return "Date TBD";
  const parsed = parseISO(iso);
  const date = isValid(parsed) ? parsed : new Date(iso);
  if (!isValid(date)) return "Date TBD";
  return format(date, withTime ? "MMM d · h:mm a" : "MMM d");
}

function emptyDraft(): InterviewDraft {
  return {
    companyName: "",
    role: "",
    status: "Scheduled",
    interviewDate: null,
    interviewerNames: [],
    meetingLink: null,
    notes: null,
  };
}

function DashboardInner() {
  const queryClient = useQueryClient();
  const { user, isPending: sessionPending } = useCurrentUserState();
  const [signedIn, setSignedIn] = useState(false);
  const [days, setDays] = useState<LookbackDays>(30);
  const [statusFilter, setStatusFilter] = useState<"all" | InterviewStatus>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "company" | "status">("date");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [scanNotice, setScanNotice] = useState<ScanResult | null>(null);

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
    },
  });

  const interviews = listQuery.data ?? [];

  const scanMutation = useMutation({
    mutationFn: () => scanInbox({ data: { days } }),
    onSuccess: (result) => {
      setScanNotice(result);
      if (!result.ok) return;
      if (signedIn) {
        queryClient.setQueryData(QUERY_KEY, result.interviews);
      } else {
        const next = upsertGuest(interviews, result.interviews);
        queryClient.setQueryData(QUERY_KEY, next);
      }
      toast.success(
        result.parsed === 0
          ? `Scanned ${result.scanned} threads — none looked like interviews`
          : `Logged ${result.parsed} interview ${result.parsed === 1 ? "thread" : "threads"}`,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    },
  });

  const waitStatus = useRefetchWhenConnectorReady(
    Boolean(scanNotice && !scanNotice.ok && scanNotice.pending),
    () => scanMutation.mutateAsync(),
  );

  const sampleMutation = useMutation({
    mutationFn: async () => {
      if (signedIn) return loadSamplePipeline();
      const next = upsertGuest(interviews, sampleInterviews());
      return next;
    },
    onSuccess: (rows) => {
      queryClient.setQueryData(QUERY_KEY, rows);
      toast.success("Sample pipeline loaded");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; draft: InterviewDraft }) => {
      if (signedIn) {
        if (payload.id) {
          return updateInterview({ data: { id: payload.id, ...payload.draft } });
        }
        return createInterview({ data: payload.draft });
      }
      const now = new Date().toISOString();
      if (payload.id) {
        const next = interviews.map((row) =>
          row.id === payload.id
            ? {
                ...row,
                ...payload.draft,
                companyName: payload.draft.companyName || row.companyName,
                role: payload.draft.role || row.role,
                updatedAt: now,
              }
            : row,
        );
        writeGuestInterviews(next);
        return next.find((row) => row.id === payload.id) ?? null;
      }
      const created: Interview = {
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
        updatedAt: now,
      };
      writeGuestInterviews([created, ...interviews]);
      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (!signedIn) {
        queryClient.setQueryData(QUERY_KEY, readGuestInterviews());
      }
      setFormOpen(false);
      setEditing(null);
      toast.success("Saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (signedIn) {
        await deleteInterview({ data: id });
        return;
      }
      writeGuestInterviews(interviews.filter((row) => row.id !== id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(QUERY_KEY, (prev: Interview[] | undefined) =>
        (prev ?? interviews).filter((row) => row.id !== id),
      );
      if (selectedId === id) setSelectedId(null);
      toast.success("Removed");
    },
  });

  const metrics = useMemo(() => {
    const total = interviews.length;
    const upcoming = interviews.filter((row) => isUpcoming(row.interviewDate, row.status)).length;
    const offers = interviews.filter((row) => row.status === "Offer").length;
    const canceled = interviews.filter((row) => row.status === "Canceled").length;
    return { total, upcoming, offers, canceled };
  }, [interviews]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = interviews.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        row.companyName,
        row.role,
        row.subject,
        row.interviewerNames.join(" "),
        row.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "company") return a.companyName.localeCompare(b.companyName);
      if (sort === "status") return a.status.localeCompare(b.status);
      const aMs = a.interviewDate ? Date.parse(a.interviewDate) : 0;
      const bMs = b.interviewDate ? Date.parse(b.interviewDate) : 0;
      return bMs - aMs;
    });
    return sorted;
  }, [interviews, query, sort, statusFilter]);

  const selected = interviews.find((row) => row.id === selectedId) ?? null;

  const connectorError =
    scanNotice && !scanNotice.ok
      ? classifyCallToolError({
          ok: false,
          data: null,
          pending: scanNotice.pending,
          loginRequired: scanNotice.loginRequired,
          loginUrl: scanNotice.loginUrl,
          errorMessage: scanNotice.errorMessage,
        })
      : null;

  useEffect(() => {
    if (waitStatus === "timed_out") {
      toast.error("Still waiting on Gmail. Try scanning again in a moment.");
    }
  }, [waitStatus]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: "font-sans bg-surface text-fg shadow-[var(--shadow-border)]",
        }}
      />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-widest text-fg-muted uppercase">
              Inbox pipeline
            </p>
            <h1 className="font-display text-3xl font-medium text-fg">
              Shortlist
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {sessionPending ? (
              <div className="size-8 animate-pulse rounded-full bg-surface-2" />
            ) : user ? (
              <UserButton />
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="stagger-in grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Total" value={metrics.total} hint="tracked threads" />
          <Metric label="Upcoming" value={metrics.upcoming} hint="still on the books" />
          <Metric label="Offers" value={metrics.offers} hint="in hand" />
          <Metric label="Canceled" value={metrics.canceled} hint="pulled or postponed" />
        </section>

        <section className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm text-fg-muted">
                Lookback
                <Select
                  value={String(days)}
                  onChange={(e) => setDays(Number(e.target.value) as LookbackDays)}
                  className="h-11 w-32"
                  aria-label="Lookback window in days"
                >
                  {LOOKBACK_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} days
                    </option>
                  ))}
                </Select>
              </label>
              <Button
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
                className="min-w-40"
              >
                <RefreshCw className={cn("size-4", scanMutation.isPending && "animate-spin")} />
                {scanMutation.isPending ? "Scanning…" : "Scan inbox"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="size-4" />
                Add interview
              </Button>
              {interviews.length === 0 && (
                <Button
                  variant="ghost"
                  onClick={() => sampleMutation.mutate()}
                  disabled={sampleMutation.isPending}
                >
                  Load sample pipeline
                </Button>
              )}
            </div>
          </div>

          {connectorError && (
            <ConnectorBanner
              kind={connectorError.kind}
              message={
                waitStatus === "waiting"
                  ? "Connecting to Gmail…"
                  : waitStatus === "not_embedded"
                    ? "Open Shortlist from Grok to reach your inbox."
                    : connectorError.message
              }
              loginUrl={scanNotice?.loginUrl}
              onLogin={() => {
                if (!scanNotice) return;
                redirectToLoginIfRequired({
                  ok: false,
                  data: null,
                  loginRequired: true,
                  loginUrl: scanNotice.loginUrl,
                });
              }}
            />
          )}

          <div className="flex flex-col gap-3">
            <div className="flex min-h-11 flex-wrap gap-1.5">
              <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                All
              </FilterChip>
              {INTERVIEW_STATUSES.map((status) => (
                <FilterChip
                  key={status}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by company, role, interviewer"
                  className="pl-10"
                  aria-label="Search interviews"
                />
              </div>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-11 w-full sm:w-40"
                aria-label="Sort interviews"
              >
                <option value="date">Sort by date</option>
                <option value="company">Sort by company</option>
                <option value="status">Sort by status</option>
              </Select>
            </div>
          </div>
        </section>

        {listQuery.isError ? (
          <div className="rounded-xl bg-surface px-6 py-10 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl font-medium">Couldn’t load the pipeline</h2>
            <p className="mt-2 text-fg-muted">
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : "Try scanning again in a moment."}
            </p>
          </div>
        ) : listQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            hasAny={interviews.length > 0}
            onScan={() => scanMutation.mutate()}
            onSample={() => sampleMutation.mutate()}
            scanning={scanMutation.isPending}
          />
        ) : (
          <ul className="grid gap-3">
            {visible.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className="flex w-full flex-col gap-3 rounded-lg bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-[var(--motion-quick)] hover:shadow-[var(--shadow-border-hover)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-fg">{row.companyName}</p>
                      <Badge className={STATUS_TONE[row.status]}>{row.status}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-fg-muted">{row.role}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      {formatWhen(row.interviewDate)}
                    </span>
                    {row.interviewerNames.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {row.interviewerNames.join(", ")}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {selected && (
        <DetailSheet
          interview={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setEditing(selected);
            setFormOpen(true);
          }}
          onDelete={() => deleteMutation.mutate(selected.id)}
          deleting={deleteMutation.isPending}
        />
      )}

      {formOpen && (
        <InterviewForm
          initial={editing}
          saving={saveMutation.isPending}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={(draft) => saveMutation.mutate({ id: editing?.id, draft })}
        />
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <article className="rounded-lg bg-surface px-4 py-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium tracking-[0.16em] text-fg-muted uppercase">{label}</p>
      <p className="font-display mt-2 text-4xl font-medium tabular-nums text-fg">{value}</p>
      <p className="mt-1 text-sm text-fg-subtle">{hint}</p>
    </article>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-full px-3.5 text-sm transition-colors duration-[var(--motion-quick)]",
        active ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function ConnectorBanner({
  kind,
  message,
  loginUrl,
  onLogin,
}: {
  kind: string;
  message: string;
  loginUrl?: string;
  onLogin: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-fg-muted">{message}</p>
      {kind === "login" && loginUrl && (
        <Button size="sm" onClick={onLogin}>
          Continue with Grok
        </Button>
      )}
      {kind === "not_connected" && (
        <p className="text-sm text-fg-subtle">Connect Gmail in Grok, then scan again.</p>
      )}
    </div>
  );
}

function EmptyState({
  hasAny,
  onScan,
  onSample,
  scanning,
}: {
  hasAny: boolean;
  onScan: () => void;
  onSample: () => void;
  scanning: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl bg-surface px-6 py-12 shadow-[var(--shadow-border)]">
      <span className="grid size-12 place-items-center rounded-md bg-surface-2 text-accent">
        <Inbox className="size-5" />
      </span>
      <div className="max-w-lg space-y-2">
        <h2 className="font-display text-2xl font-medium">
          {hasAny ? "Nothing matches that filter" : "No interviews on the board"}
        </h2>
        <p className="text-fg-muted">
          {hasAny
            ? "Clear search or switch status to see the rest of the pipeline."
            : "Scan Gmail for invites, cancellations, and offers from the last few weeks — or add a loop by hand."}
        </p>
      </div>
      {!hasAny && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onScan} disabled={scanning}>
            <Mail className="size-4" />
            Scan inbox
          </Button>
          <Button variant="secondary" onClick={onSample}>
            Load sample pipeline
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailSheet({
  interview,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: {
  interview: Interview;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-bg/80" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto bg-surface p-6 shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="interview-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-widest text-fg-muted uppercase">
              {interview.source === "gmail" ? "From Gmail" : interview.source}
            </p>
            <h2 id="interview-title" className="font-display mt-1 text-3xl font-medium">
              {interview.companyName}
            </h2>
            <p className="mt-1 text-fg-muted">{interview.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <Badge className={cn("w-fit", STATUS_TONE[interview.status])}>{interview.status}</Badge>
        <div className="grid gap-4 text-sm">
          <DetailRow icon={CalendarClock} label="When" value={formatWhen(interview.interviewDate)} />
          <DetailRow
            icon={Users}
            label="Interviewers"
            value={interview.interviewerNames.join(", ") || "Not listed"}
          />
          <DetailRow
            icon={Video}
            label="Meeting"
            value={
              interview.meetingLink ? (
                <a
                  href={interview.meetingLink}
                  className="text-accent underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join link
                </a>
              ) : (
                "No link yet"
              )
            }
          />
          <DetailRow icon={Building2} label="Company" value={interview.companyName} />
          {interview.subject && <DetailRow icon={Mail} label="Subject" value={interview.subject} />}
          {interview.meetingLink && (
            <DetailRow icon={Link2} label="URL" value={interview.meetingLink} />
          )}
        </div>
        {interview.notes && (
          <p className="rounded-md bg-surface-2 px-4 py-3 text-sm text-fg-muted">
            {interview.notes}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button onClick={onEdit} className="flex-1">
            Edit
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleting} className="flex-1">
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
      <dt className="w-24 shrink-0 text-fg-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-fg">{value}</dd>
    </div>
  );
}

function InterviewForm({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial: Interview | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: InterviewDraft) => void;
}) {
  const [draft, setDraft] = useState<InterviewDraft>(() =>
    initial
      ? {
          companyName: initial.companyName,
          role: initial.role,
          status: initial.status,
          interviewDate: initial.interviewDate,
          interviewerNames: initial.interviewerNames,
          meetingLink: initial.meetingLink,
          notes: initial.notes,
        }
      : emptyDraft(),
  );
  const localDate = draft.interviewDate
    ? toDatetimeLocal(draft.interviewDate)
    : "";

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      ...draft,
      interviewerNames: draft.interviewerNames.map((n) => n.trim()).filter(Boolean),
      companyName: draft.companyName.trim(),
      role: draft.role.trim(),
      meetingLink: draft.meetingLink?.trim() || null,
      notes: draft.notes?.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-bg/80 sm:place-items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-screen w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:rounded-xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-medium">
            {initial ? "Edit interview" : "Add interview"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close form">
            <X className="size-5" />
          </Button>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="text-fg-muted">Company</span>
          <Input
            required
            value={draft.companyName}
            onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-fg-muted">Role</span>
          <Input
            required
            value={draft.role}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="text-fg-muted">Status</span>
            <Select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({ ...d, status: e.target.value as InterviewStatus }))
              }
            >
              {INTERVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-fg-muted">Interview date</span>
            <Input
              type="datetime-local"
              value={localDate}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  interviewDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="text-fg-muted">Interviewers (comma separated)</span>
          <Input
            value={draft.interviewerNames.join(", ")}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                interviewerNames: e.target.value.split(","),
              }))
            }
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-fg-muted">Meeting link</span>
          <Input
            type="text"
            inputMode="url"
            placeholder="https://"
            value={draft.meetingLink ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, meetingLink: e.target.value }))}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-fg-muted">Notes</span>
          <Textarea
            rows={3}
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
        </label>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (!isValid(date)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function Dashboard() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <DashboardInner />
    </QueryClientProvider>
  );
}
