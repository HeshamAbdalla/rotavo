# Rotavo

Rotavo is an offline-first scheduling assistant for independent restaurants, cafes, and food trucks.

## MVP focus

- Staff mobile workflows: schedule view, confirmations, swap requests, open shift pickup.
- Manager workflows: schedule builder, publish, approvals queue, auto-approval rules.
- Reliability: queued offline actions, realtime updates, push notifications with SMS fallback.

## Repository layout

- `docs/product-mvp.md`: product scope, UX flows, and reminder logic.
- `docs/technical-architecture.md`: app architecture and event-driven behaviors.
- `supabase/migrations/`: SQL migrations for the MVP schema and workflow helpers.
- `supabase/functions/`: edge functions for publish/confirm/swap/pickup flows.

## Backend workflows implemented

- `publish-schedule`: marks shifts published and enqueues push notifications for assigned staff.
- `confirm-shift`: upserts shift confirmations.
- `request-swap`: opens a swap request for the assigned user.
- `pick-up-shift`: creates pickup intent and auto-approves when role-qualified and conflict-free.

## Local development

1. Install Supabase CLI.
2. Start local stack:

   ```bash
   supabase start
   ```

3. Apply migrations:

   ```bash
   supabase db reset
   ```

4. Serve edge functions:

   ```bash
   supabase functions serve --env-file .env.local
   ```

## Next implementation milestones

1. Bootstrap Expo app (Expo Router + TanStack Query + Zustand).
2. Add Supabase client/auth wiring in mobile app.
3. Implement local SQLite cache and sync queue processing.
4. Build schedule and swaps screens from the wireframe.
5. Add manager mode schedule builder and approvals queue UI.
