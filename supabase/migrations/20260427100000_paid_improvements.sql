create table if not exists public.paid_entitlements (
  user_id uuid primary key,
  email text,
  status text not null default 'active',
  source text not null default 'dodo',
  dodo_payment_id text,
  dodo_customer_id text,
  dodo_checkout_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paid_entitlements_email_idx on public.paid_entitlements (email);
create index if not exists paid_entitlements_status_idx on public.paid_entitlements (status);

create table if not exists public.resume_improvements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  roast_snapshot jsonb not null default '{}'::jsonb,
  current_resume text,
  peer_comparison text,
  line_edits jsonb not null default '[]'::jsonb,
  rewritten_bullets jsonb not null default '[]'::jsonb,
  strategy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_improvements_user_id_idx on public.resume_improvements (user_id);
create index if not exists resume_improvements_created_at_idx on public.resume_improvements (created_at desc);
