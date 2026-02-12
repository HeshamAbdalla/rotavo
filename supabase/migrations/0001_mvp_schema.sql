-- Rotavo MVP schema
-- PostgreSQL dialect compatible with Supabase

create extension if not exists "pgcrypto";

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  membership_role text not null check (membership_role in ('staff', 'manager', 'owner')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  notes text,
  published boolean not null default false,
  created_by_membership_id uuid references memberships(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null unique references shifts(id) on delete cascade,
  assigned_membership_id uuid references memberships(id) on delete set null,
  assignment_status text not null check (assignment_status in ('assigned', 'open')),
  created_at timestamptz not null default now()
);

create table if not exists shift_confirmations (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  membership_id uuid not null references memberships(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  source text not null default 'mobile' check (source in ('mobile', 'web', 'sync')),
  unique (shift_id, membership_id)
);

create table if not exists swap_requests (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  requester_membership_id uuid not null references memberships(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'pending_approval', 'approved', 'rejected', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists swap_pickups (
  id uuid primary key default gen_random_uuid(),
  swap_request_id uuid not null references swap_requests(id) on delete cascade,
  pickup_membership_id uuid not null references memberships(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  auto_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_request_id, pickup_membership_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  membership_id uuid not null references memberships(id) on delete cascade,
  channel text not null check (channel in ('push', 'sms')),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  provider text not null,
  plan_code text not null,
  status text not null check (status in ('trial', 'active', 'past_due', 'cancelled')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Useful indexes
create index if not exists idx_shifts_restaurant_starts_at on shifts(restaurant_id, starts_at);
create index if not exists idx_swap_requests_status on swap_requests(status, created_at);
create index if not exists idx_notifications_status_scheduled_for on notifications(status, scheduled_for);
