# Rotavo Technical Architecture (MVP)

## Mobile client

- **Framework**: React Native with Expo.
- **Routing/UI composition**: Expo Router.
- **Server state**: TanStack Query.
- **Local app state**: Zustand.
- **Offline store**: `expo-sqlite` for cached schedules and action queue.
- **Notifications**: Expo Notifications.
- **Observability**: Sentry (errors and crash reporting).

## Backend platform

- **Core backend**: Supabase.
- **Authentication**: magic link with optional SMS-based access path.
- **Database**: Postgres.
- **Realtime**: subscriptions for schedule and swap changes.
- **Edge Functions**:
  - publish schedule
  - send reminders
  - run swap approval workflow
  - trigger SMS fallback via Twilio

## Event-driven workflows

### Publish schedule

1. Manager publishes a week.
2. Backend marks relevant shifts as published.
3. Notification records are queued.
4. Push delivery attempted first.
5. SMS fallback triggered per delivery rules.

### Confirm shift

1. Staff taps confirm.
2. Shift confirmation record is upserted.
3. Queue and manager surfaces update through realtime channels.

### Request swap

1. Staff taps request swap on an assigned shift.
2. Swap request record is created with `status = open`.
3. Marketplace updates immediately via realtime.

### Pick up shift

1. Staff selects an open request and taps pickup.
2. Pickup record is created with `status = pending`.
3. Auto-approval policy check runs:
   - if same role and no conflict: assignment transfer and status update.
   - else: manager approval task created.

## Offline sync model

1. User action writes to local queue table (`queued_actions`).
2. UI applies optimistic local state update.
3. Background sync worker retries queued actions when online.
4. Server acks mark queue rows complete.
5. Conflict policy:
   - if action invalidates due to changed assignment, client marks row failed and surfaces resolution message.

## Accessibility baseline

- Large text support and dynamic type aware layouts.
- Dark mode theme parity.
- Screen reader labels for all primary actions (confirm, swap, pickup, publish, approve).
