-- Workflow helper functions/triggers for Rotavo MVP

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_swap_requests_updated_at on swap_requests;
create trigger trg_swap_requests_updated_at
before update on swap_requests
for each row
execute function set_updated_at();

drop trigger if exists trg_swap_pickups_updated_at on swap_pickups;
create trigger trg_swap_pickups_updated_at
before update on swap_pickups
for each row
execute function set_updated_at();

create or replace function enqueue_notification(
  p_restaurant_id uuid,
  p_membership_id uuid,
  p_channel text,
  p_event_type text,
  p_payload jsonb,
  p_scheduled_for timestamptz default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into notifications (
    restaurant_id,
    membership_id,
    channel,
    event_type,
    payload,
    scheduled_for
  ) values (
    p_restaurant_id,
    p_membership_id,
    p_channel,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb),
    p_scheduled_for
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function has_shift_conflict(
  p_membership_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_shift_id uuid default null
)
returns boolean
language sql
as $$
  select exists (
    select 1
    from shift_assignments sa
    join shifts s on s.id = sa.shift_id
    where sa.assigned_membership_id = p_membership_id
      and sa.assignment_status = 'assigned'
      and (p_exclude_shift_id is null or s.id <> p_exclude_shift_id)
      and tstzrange(s.starts_at, s.ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')
  );
$$;
