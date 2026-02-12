-- Optional role qualification matrix per membership.
-- Enables auto-approval checks like "same role + no conflict".

create table if not exists membership_roles (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references memberships(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (membership_id, role_id)
);

create index if not exists idx_membership_roles_membership_id on membership_roles(membership_id);
create index if not exists idx_membership_roles_role_id on membership_roles(role_id);
