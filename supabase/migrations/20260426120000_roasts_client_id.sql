-- Stable browser id for leaderboard + dedupe (sent from app as FormData clientId)
alter table public.roasts add column if not exists client_id text;

create index if not exists roasts_client_id_idx on public.roasts (client_id);
