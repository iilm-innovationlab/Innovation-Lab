-- IILM × BNV Innovation Lab: safe team onboarding and optional application photos.
-- Adds metadata columns only; existing applications, team profiles, users and audit rows remain in place.
begin;

alter table public.applications add column if not exists profile_picture_url text;
alter table public.applications add column if not exists archived_at timestamptz;
alter table public.applications add column if not exists archived_by uuid references auth.users(id);
alter table public.applications add column if not exists archived_by_name text;
alter table public.applications add column if not exists review_notes text;

alter table public.team_members add column if not exists contact_email text;
alter table public.team_members add column if not exists login_id text;

-- Previous onboarding generated Team IDs and also promoted those Auth users to admin.
-- Revoke that unintended authorization for accounts explicitly tied to generated team IDs.
-- Do not delete Auth users or team/application/audit records; only remove admin access and obsolete IDs.
update public.profiles p
set role = null
from public.team_members tm
where tm.auth_user_id = p.id
  and tm.login_id is not null
  and p.role = 'admin';

update public.team_members set login_id = null where login_id is not null;
drop index if exists public.idx_team_members_login_id;

create index if not exists idx_applications_active_queue
  on public.applications (created_at desc)
  where archived_at is null;

comment on column public.applications.profile_picture_url is 'Optional Cloudinary URL submitted with Campus Innovation Fellow or Social Media applications.';
comment on column public.team_members.photo_url is 'Optional Cloudinary HTTPS URL; image binaries are not stored in Supabase.';
comment on column public.applications.archived_at is 'Set when an applicant is onboarded into the team roster; the application row is retained.';
comment on column public.team_members.auth_user_id is 'Optional manually managed Auth link; roster onboarding never creates an Auth user.';

commit;
