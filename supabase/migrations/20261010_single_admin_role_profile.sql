-- IILM × BNV Innovation Lab: migrate to one authorized role (admin)
-- Safe incremental migration for projects that already applied the Super Admin/audit migration.
-- Does not delete users, profiles, content, or audit history.
-- Run this file only in Supabase SQL Editor after taking a database backup.

begin;

-- 1. Convert previously authorized role variants to the single role `admin`.
-- A NULL role means the Auth user exists but has not been explicitly authorized.
alter table public.profiles alter column role drop not null;
alter table public.profiles alter column role drop default;
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;
update public.profiles
set role = 'admin', updated_at = now()
where role in ('super_admin', 'admin', 'team_member');
alter table public.profiles
  add constraint profiles_single_admin_role_check check (role is null or role = 'admin');

-- 2. The Auth trigger creates an unapproved profile by default.
-- Only an explicit admin authorization (Supabase Table Editor or approved onboarding API)
-- sets role = 'admin'. Public sign-ups must never automatically become administrators.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    null
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- 3. Single-role authorization helpers. Keep the old helper name as a compatibility alias
-- for existing policies, but it grants access only to profile.role = 'admin'.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_admin_or_team_member()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.is_admin(); $$;

-- 4. Profile rows are readable only by their owner through the browser.
-- Name changes go through /api/admin/profile; role changes are never self-service.
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "super admins manage profiles" on public.profiles;
drop policy if exists "team read own profile" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- 5. All authorized admins may manage team roster entries. Public published-team reads
-- remain in place; these policies do not remove public-site access to published profiles.
drop policy if exists "admins create team members" on public.team_members;
drop policy if exists "admins update team members" on public.team_members;
drop policy if exists "admins delete team members" on public.team_members;
drop policy if exists "super admins create team members" on public.team_members;
drop policy if exists "super admins update team members" on public.team_members;
drop policy if exists "super admins delete team members" on public.team_members;
create policy "admins create team members" on public.team_members
  for insert to authenticated with check (public.is_admin());
create policy "admins update team members" on public.team_members
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete team members" on public.team_members
  for delete to authenticated using (public.is_admin());

-- 6. Remove the obsolete helper only after its policies have been removed.
drop function if exists public.is_super_admin();

-- 7. Keep profile role changes in audit history, using the single role terminology.
create or replace function public.audit_profile_role_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare actor_name text;
begin
  if auth.uid() is null then return new; end if;
  if old.role is distinct from new.role then
    select coalesce(full_name, email, 'Admin') into actor_name
      from public.profiles where id = auth.uid();
    insert into public.audit_logs(
      table_name, record_id, action, changed_by, changed_by_name, old_data, new_data
    ) values (
      'profiles', new.id::text, 'ROLE_CHANGE', auth.uid(), coalesce(actor_name, 'Admin'),
      jsonb_build_object('role', old.role, 'email', old.email),
      jsonb_build_object('role', new.role, 'email', new.email)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists history_profile_role_change on public.profiles;
create trigger history_profile_role_change after update of role on public.profiles
  for each row execute function public.audit_profile_role_change();

commit;

-- After running:
-- A) Existing accounts that had super_admin/admin/team_member are now role=admin.
-- B) New Auth users have role NULL until explicitly authorized.
-- C) To authorize a newly created Auth user, copy its exact Auth UUID, then in Table Editor
--    update only that matching public.profiles row: role='admin', full_name='<person name>'.
-- D) Never set a role from the browser. Audit history already present is preserved.
