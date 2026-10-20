-- IILM × BNV Innovation Lab — production baseline
-- Apply this as the canonical schema in Supabase SQL Editor.
-- Free-tier strategy: keep media in Cloudinary, keep public pages cached, and avoid polling.

create extension if not exists pgcrypto;

-- Minimal database-backed abuse guard for public application and image-signature endpoints.
-- Only a keyed SHA-256 hash is stored; raw client IP addresses are not persisted.
create table if not exists public.private_request_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.private_request_rate_limits enable row level security;
revoke all on table public.private_request_rate_limits from public, anon, authenticated;
grant all on table public.private_request_rate_limits to service_role;

create or replace function public.consume_public_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare current_count integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit < 1 or p_limit > 100 or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then return false; end if;
  insert into public.private_request_rate_limits (key_hash, window_started_at, request_count, updated_at) values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update set
    request_count = case when public.private_request_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1 else public.private_request_rate_limits.request_count + 1 end,
    window_started_at = case when public.private_request_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now() else public.private_request_rate_limits.window_started_at end,
    updated_at = now()
  returning request_count into current_count;
  if random() < 0.02 then delete from public.private_request_rate_limits where updated_at < now() - interval '2 days'; end if;
  return current_count <= p_limit;
end;
$$;
revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text default null check (role is null or role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  member_count integer not null default 0 check (member_count >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  updated_by uuid references auth.users(id),
  updated_by_name text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  community text,
  location text,
  registration_url text,
  image_url text,
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  updated_by uuid references auth.users(id),
  updated_by_name text
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  campus text,
  team text,
  year_of_study text,
  degree_program text,
  photo_url text,
  bio text,
  linkedin_url text,
  display_order integer not null default 0,
  published boolean not null default false,
  auth_user_id uuid unique references auth.users(id),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  updated_by uuid references auth.users(id),
  updated_by_name text
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('explorer','ideator','campus_innovation_fellow','social_media')),
  full_name text not null,
  email text not null,
  phone text,
  campus text,
  degree text,
  year text,
  payload jsonb not null default '{}'::jsonb,
  idea text,
  problem text,
  target_users text,
  current_stage text,
  prototype_url text,
  message text,
  status text not null default 'new' check (status in ('new','review','accepted','rejected','active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  reviewed_by uuid references auth.users(id),
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_notes text,
  profile_picture_url text,
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  archived_by_name text
);

alter table public.applications add column if not exists review_notes text;
alter table public.applications add column if not exists profile_picture_url text;
alter table public.applications add column if not exists archived_at timestamptz;
alter table public.applications add column if not exists archived_by uuid references auth.users(id);
alter table public.applications add column if not exists archived_by_name text;

create table if not exists public.youtube_shorts (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  title text,
  thumbnail_url text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  updated_by uuid references auth.users(id),
  updated_by_name text
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  cta_label text,
  cta_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_by_name text,
  updated_by uuid references auth.users(id),
  updated_by_name text
);

-- Contact details are optional profile metadata; roster creation never creates an Auth account or credentials.
alter table public.team_members add column if not exists contact_email text;
alter table public.team_members add column if not exists year_of_study text;
alter table public.team_members add column if not exists degree_program text;

create index if not exists idx_events_published_starts_at on public.events(status, starts_at);
create index if not exists idx_announcements_published_created_at on public.announcements(published, created_at desc);
create index if not exists idx_team_members_published_order on public.team_members(published, display_order);
create index if not exists idx_youtube_shorts_published_order on public.youtube_shorts(published, display_order);
create index if not exists idx_applications_type_status_created_at on public.applications(type, status, created_at desc);

-- Auto-create a profile for every authenticated team account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''),'@',1)), null)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Kept as a compatibility helper for existing policies, but it recognizes only
-- the single authorized role. There is no separate team_member authorization role.
create or replace function public.is_admin_or_team_member()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.is_admin(); $$;

-- Audit fields are written by the database, not trusted from the browser.
create or replace function public.apply_audit_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor_name text;
begin
  select coalesce(full_name, email, 'Team Member') into actor_name from public.profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_by_name := actor_name;
  end if;
  new.updated_by := auth.uid();
  new.updated_by_name := actor_name;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists audit_communities on public.communities;
create trigger audit_communities before insert or update on public.communities for each row execute procedure public.apply_audit_fields();
drop trigger if exists audit_events on public.events;
create trigger audit_events before insert or update on public.events for each row execute procedure public.apply_audit_fields();
drop trigger if exists audit_team_members on public.team_members;
create trigger audit_team_members before insert or update on public.team_members for each row execute procedure public.apply_audit_fields();
drop trigger if exists audit_youtube_shorts on public.youtube_shorts;
create trigger audit_youtube_shorts before insert or update on public.youtube_shorts for each row execute procedure public.apply_audit_fields();
drop trigger if exists audit_announcements on public.announcements;
create trigger audit_announcements before insert or update on public.announcements for each row execute procedure public.apply_audit_fields();

create or replace function public.apply_application_audit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare actor_name text;
begin
  select coalesce(full_name, email, 'Team Member') into actor_name from public.profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_by_name := actor_name;
  else
    new.reviewed_by := auth.uid();
    new.reviewed_by_name := actor_name;
    new.reviewed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists audit_applications on public.applications;
create trigger audit_applications before insert or update on public.applications for each row execute procedure public.apply_application_audit();

-- RLS: default deny, then explicitly allow only what is needed.
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.events enable row level security;
alter table public.team_members enable row level security;
alter table public.applications enable row level security;
alter table public.youtube_shorts enable row level security;
alter table public.announcements enable row level security;

do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname='public' and tablename in ('profiles','communities','events','team_members','applications','youtube_shorts','announcements') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "public read published communities" on public.communities for select to anon, authenticated using (published = true);
create policy "public read published events" on public.events for select to anon, authenticated using (status = 'published');
create policy "public read published team" on public.team_members for select to anon, authenticated using (published = true);
create policy "public read published shorts" on public.youtube_shorts for select to anon, authenticated using (published = true);
create policy "public read published announcements" on public.announcements for select to anon, authenticated using (published = true);

create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());

create policy "team read communities" on public.communities for select to authenticated using (public.is_admin_or_team_member());
create policy "admins manage communities" on public.communities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "team read all events" on public.events for select to authenticated using (public.is_admin_or_team_member());
create policy "team create events" on public.events for insert to authenticated with check (public.is_admin_or_team_member());
create policy "team update events" on public.events for update to authenticated using (public.is_admin_or_team_member()) with check (public.is_admin_or_team_member());
create policy "admins delete events" on public.events for delete to authenticated using (public.is_admin());

create policy "team read all team members" on public.team_members for select to authenticated using (public.is_admin_or_team_member());
create policy "admins create team members" on public.team_members for insert to authenticated with check (public.is_admin());
create policy "admins update team members" on public.team_members for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete team members" on public.team_members for delete to authenticated using (public.is_admin());

create policy "team read applications" on public.applications for select to authenticated using (public.is_admin_or_team_member());
create policy "team review applications" on public.applications for update to authenticated using (public.is_admin_or_team_member()) with check (public.is_admin_or_team_member());
create policy "admins restore applications" on public.applications for insert to authenticated with check (public.is_admin());

create policy "team read all shorts" on public.youtube_shorts for select to authenticated using (public.is_admin_or_team_member());
create policy "team create shorts" on public.youtube_shorts for insert to authenticated with check (public.is_admin_or_team_member());
create policy "team update shorts" on public.youtube_shorts for update to authenticated using (public.is_admin_or_team_member()) with check (public.is_admin_or_team_member());
create policy "admins delete shorts" on public.youtube_shorts for delete to authenticated using (public.is_admin());

create policy "team read all announcements" on public.announcements for select to authenticated using (public.is_admin_or_team_member());
create policy "team create announcements" on public.announcements for insert to authenticated with check (public.is_admin_or_team_member());
create policy "team update announcements" on public.announcements for update to authenticated using (public.is_admin_or_team_member()) with check (public.is_admin_or_team_member());
create policy "admins delete announcements" on public.announcements for delete to authenticated using (public.is_admin());

-- Applications are intentionally NOT insertable from the browser through this table.
-- Public forms should submit through a server-side validated endpoint using SUPABASE_SERVICE_ROLE_KEY.

-- Lightweight opt-in web-push subscriptions. No passwords or auth tokens are stored here.
create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notification_subscriptions_updated_at on public.notification_subscriptions(updated_at desc);
alter table public.notification_subscriptions enable row level security;
drop policy if exists "public can register push subscription" on public.notification_subscriptions;
drop policy if exists "admins manage push subscriptions" on public.notification_subscriptions;
create policy "public can register push subscription" on public.notification_subscriptions for insert to anon, authenticated with check (length(endpoint) between 20 and 2000 and length(p256dh) between 20 and 500 and length(auth) between 10 and 500);
create policy "admins manage push subscriptions" on public.notification_subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.communities (slug, name, description, published, member_count)
values
  ('explorer', 'Explorer', 'Curiosity → exploration', true, 0),
  ('ideator', 'Ideator', 'Idea → validation', true, 0),
  ('founders-club', 'Founder’s Club', 'Execution → venture building', true, 0)
on conflict (slug) do nothing;


-- All authorized staff use the single role 'admin'. New Auth users remain unauthorized until explicitly approved.

-- Append-only audit trail. Entries are generated by database triggers, not by the browser.
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT','UPDATE','DELETE','ROLE_CHANGE','ADMIN_INVITED')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_name text not null default 'System',
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);
create index if not exists idx_audit_logs_changed_at on public.audit_logs(changed_at desc);
create index if not exists idx_audit_logs_table_record on public.audit_logs(table_name, record_id, changed_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());
-- Intentionally no client insert/update/delete policies for audit_logs.

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_old jsonb;
  row_new jsonb;
  row_id text;
  actor_name text;
begin
  -- Team onboarding uses the server service key; that API writes an explicit actor-attributed entry.
  if tg_table_name = 'team_members' and auth.uid() is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if tg_op = 'DELETE' then row_old := to_jsonb(old); row_new := null; row_id := coalesce(row_old->>'id','');
  elsif tg_op = 'UPDATE' then row_old := to_jsonb(old); row_new := to_jsonb(new); row_id := coalesce(row_new->>'id','');
  else row_old := null; row_new := to_jsonb(new); row_id := coalesce(row_new->>'id','');
  end if;
  select coalesce(full_name, email, 'Admin') into actor_name from public.profiles where id = auth.uid();
  insert into public.audit_logs(table_name, record_id, action, changed_by, changed_by_name, old_data, new_data)
  values (tg_table_name, row_id, tg_op, auth.uid(), coalesce(actor_name, current_setting('request.jwt.claim.email', true), 'System'), row_old, row_new);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists history_events on public.events;
create trigger history_events after insert or update or delete on public.events for each row execute function public.write_audit_log();
drop trigger if exists history_communities on public.communities;
create trigger history_communities after insert or update or delete on public.communities for each row execute function public.write_audit_log();
drop trigger if exists history_youtube_shorts on public.youtube_shorts;
create trigger history_youtube_shorts after insert or update or delete on public.youtube_shorts for each row execute function public.write_audit_log();
drop trigger if exists history_announcements on public.announcements;
create trigger history_announcements after insert or update or delete on public.announcements for each row execute function public.write_audit_log();
drop trigger if exists history_applications on public.applications;
create trigger history_applications after insert or update or delete on public.applications for each row execute function public.write_audit_log();
drop trigger if exists history_team_members on public.team_members;
create trigger history_team_members after insert or update or delete on public.team_members for each row execute function public.write_audit_log();

-- All authorized admins can manage shared content. Profile role authorization is
-- not writable from the browser; use the documented Supabase owner authorization step.
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "super admins manage profiles" on public.profiles;
drop policy if exists "team read own profile" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop function if exists public.is_super_admin();

drop policy if exists "admins manage communities" on public.communities;
create policy "admins manage communities" on public.communities for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "team create events" on public.events;
drop policy if exists "team update events" on public.events;
create policy "admins create events" on public.events for insert to authenticated with check (public.is_admin());
create policy "admins update events" on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "team review applications" on public.applications;
create policy "admins review applications" on public.applications for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "team create shorts" on public.youtube_shorts;
drop policy if exists "team update shorts" on public.youtube_shorts;
create policy "admins create shorts" on public.youtube_shorts for insert to authenticated with check (public.is_admin());
create policy "admins update shorts" on public.youtube_shorts for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "team create announcements" on public.announcements;
drop policy if exists "team update announcements" on public.announcements;
create policy "admins create announcements" on public.announcements for insert to authenticated with check (public.is_admin());
create policy "admins update announcements" on public.announcements for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- All authorized admins can manage team roster entries.
drop policy if exists "admins create team members" on public.team_members;
drop policy if exists "admins update team members" on public.team_members;
drop policy if exists "admins delete team members" on public.team_members;
drop policy if exists "super admins create team members" on public.team_members;
drop policy if exists "super admins update team members" on public.team_members;
drop policy if exists "super admins delete team members" on public.team_members;
create policy "admins create team members" on public.team_members for insert to authenticated with check (public.is_admin());
create policy "admins update team members" on public.team_members for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete team members" on public.team_members for delete to authenticated using (public.is_admin());


create or replace function public.audit_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if auth.uid() is null then return new; end if;
  if old.role is distinct from new.role then
    select coalesce(full_name, email, 'Admin') into actor_name from public.profiles where id = auth.uid();
    insert into public.audit_logs(table_name, record_id, action, changed_by, changed_by_name, old_data, new_data)
    values ('profiles', new.id::text, 'ROLE_CHANGE', auth.uid(), coalesce(actor_name, 'Admin'), jsonb_build_object('role', old.role, 'email', old.email), jsonb_build_object('role', new.role, 'email', new.email));
  end if;
  return new;
end;
$$;
drop trigger if exists history_profile_role_change on public.profiles;
create trigger history_profile_role_change after update of role on public.profiles for each row execute function public.audit_profile_role_change();


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


-- Event Gallery incremental schema; existing installs should use supabase/migrations/20261016_event_gallery.sql.
-- Event Gallery: metadata for images uploaded directly to the configured Cloudinary folder.
create table if not exists public.event_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  image_url text not null check (image_url ~ '^https://res\.cloudinary\.com/'),
  alt_text text,
  event_date date,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_by_name text
);
alter table public.event_gallery enable row level security;
drop policy if exists "public read published event gallery" on public.event_gallery;
drop policy if exists "admins read all event gallery" on public.event_gallery;
drop policy if exists "admins create event gallery" on public.event_gallery;
drop policy if exists "admins update event gallery" on public.event_gallery;
drop policy if exists "admins delete event gallery" on public.event_gallery;
create policy "public read published event gallery" on public.event_gallery for select to anon, authenticated using (published = true);
create policy "admins read all event gallery" on public.event_gallery for select to authenticated using (public.is_admin());
create policy "admins create event gallery" on public.event_gallery for insert to authenticated with check (public.is_admin());
create policy "admins update event gallery" on public.event_gallery for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete event gallery" on public.event_gallery for delete to authenticated using (public.is_admin());
create index if not exists event_gallery_public_order_idx on public.event_gallery (published, event_date desc, display_order);
drop trigger if exists event_gallery_audit_fields on public.event_gallery;
create trigger event_gallery_audit_fields before insert or update on public.event_gallery for each row execute procedure public.apply_audit_fields();
