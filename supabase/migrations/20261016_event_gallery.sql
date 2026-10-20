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
