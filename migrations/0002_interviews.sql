-- Interview pipeline rows, scoped per signed-in user.
-- Unique on (user_id, gmail_thread_id) so later emails upsert status
-- instead of creating duplicates.

create table if not exists interviews (
  id                 text primary key,
  user_id            text not null,
  gmail_thread_id    text not null,
  gmail_message_id   text,
  company_name       text not null,
  role               text not null,
  status             text not null,
  interview_date     timestamptz,
  interviewer_names  jsonb not null default '[]'::jsonb,
  meeting_link       text,
  subject            text,
  snippet            text,
  source             text not null default 'gmail',
  notes              text,
  last_email_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index if not exists interviews_user_thread_uidx
  on interviews (user_id, gmail_thread_id);

create index if not exists interviews_user_id_idx
  on interviews (user_id);

create index if not exists interviews_user_status_idx
  on interviews (user_id, status);

create index if not exists interviews_user_date_idx
  on interviews (user_id, interview_date);
