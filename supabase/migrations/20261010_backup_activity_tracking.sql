-- Track backup exports/imports without writing to the content audit log.
create table if not exists public.backup_activity (
  id bigint generated always as identity primary key,
  action text not null check (action in ('export','import')),
  filename text not null,
  details text,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'Admin',
  occurred_at timestamptz not null default now()
);
create index if not exists idx_backup_activity_occurred_at on public.backup_activity(occurred_at desc);
alter table public.backup_activity enable row level security;
drop policy if exists "admins read backup activity" on public.backup_activity;
create policy "admins read backup activity" on public.backup_activity for select to authenticated using (public.is_admin());
drop policy if exists "admins insert backup activity" on public.backup_activity;
create policy "admins insert backup activity" on public.backup_activity for insert to authenticated with check (public.is_admin() and (actor_id is null or actor_id = auth.uid()));
revoke all on table public.backup_activity from anon, public;
grant select, insert on table public.backup_activity to authenticated;
grant usage, select on sequence public.backup_activity_id_seq to authenticated;
