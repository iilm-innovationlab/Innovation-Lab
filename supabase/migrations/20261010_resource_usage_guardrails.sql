-- IILM × BNV Innovation Lab: lightweight database-backed request guardrails.
-- Safe to apply more than once. Stores only a keyed hash of a client address, never the IP itself.

create table if not exists public.private_request_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.private_request_rate_limits enable row level security;
revoke all on table public.private_request_rate_limits from public, anon, authenticated;
grant all on table public.private_request_rate_limits to service_role;

create or replace function public.consume_public_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_count integer;
begin
  if p_key_hash is null
     or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit is null or p_limit < 1 or p_limit > 100
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.private_request_rate_limits (key_hash, window_started_at, request_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
    set request_count = case
          when public.private_request_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
          else public.private_request_rate_limits.request_count + 1
        end,
        window_started_at = case
          when public.private_request_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
          else public.private_request_rate_limits.window_started_at
        end,
        updated_at = now()
  returning request_count into current_count;

  -- Opportunistic cleanup prevents stale IP hashes from accumulating indefinitely.
  if random() < 0.02 then
    delete from public.private_request_rate_limits where updated_at < now() - interval '2 days';
  end if;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;
