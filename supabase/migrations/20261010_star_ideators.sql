
-- Star Ideators: additive content module for public profiles managed by admins.
create table if not exists public.star_ideators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  bio text,
  photo_url text,
  linkedin_url text,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  updated_by uuid references auth.users(id),
  updated_by_name text
);
create index if not exists idx_star_ideators_published_order on public.star_ideators(published, display_order, created_at desc);
alter table public.star_ideators enable row level security;
drop policy if exists "public read published star ideators" on public.star_ideators;
create policy "public read published star ideators" on public.star_ideators for select to anon, authenticated using (published = true);
drop policy if exists "team read all star ideators" on public.star_ideators;
create policy "team read all star ideators" on public.star_ideators for select to authenticated using (public.is_admin_or_team_member());
drop policy if exists "admins create star ideators" on public.star_ideators;
create policy "admins create star ideators" on public.star_ideators for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update star ideators" on public.star_ideators;
create policy "admins update star ideators" on public.star_ideators for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete star ideators" on public.star_ideators;
create policy "admins delete star ideators" on public.star_ideators for delete to authenticated using (public.is_admin());
drop trigger if exists audit_star_ideators on public.star_ideators;
create trigger audit_star_ideators before insert or update on public.star_ideators for each row execute procedure public.apply_audit_fields();
drop trigger if exists history_star_ideators on public.star_ideators;
create trigger history_star_ideators after insert or update or delete on public.star_ideators for each row execute function public.write_audit_log();
