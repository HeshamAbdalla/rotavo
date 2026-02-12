# Rotavo Product MVP

## Product goal

A lightweight scheduling assistant that helps independent hospitality teams reduce no-shows and coordinate shifts quickly.

## Primary users

- **Staff members** who need to quickly read shifts, confirm attendance, and swap/pick up shifts.
- **Managers** who need fast schedule publishing and clear approval queues.

## Staff mobile scope

### Core flows

1. **Week schedule view**
   - Sectioned by day with compact shift cards.
   - Shift state badges: `Needs confirm`, `Confirmed`, `Swap pending`, `Open`.
2. **One-tap confirm**
   - Confirm assigned shift from card action.
3. **One-tap request swap**
   - Create open swap request from assigned shift.
4. **Open shifts banner**
   - Displays available count and deep-links into marketplace.
5. **Swaps marketplace**
   - List open swaps with role/day filters.
6. **Swap details + pickup**
   - View details and pick up shift (manager notified or auto-approved).

### Reliability requirements

- Schedule remains visible offline.
- Confirm/pickup actions queue while offline and sync when back online.
- Push notification first, SMS fallback when push fails or is unavailable.

## Manager scope

1. **Week grid schedule builder** with role rows and day columns.
2. **Add shift** fields:
   - role
   - time window
   - location
   - notes
3. **Publish schedule**
   - marks shifts as published
   - notifies assigned staff
4. **Approvals queue**
   - pending swap requests
   - unconfirmed shifts
5. **Auto-approval rules**
   - same role + no conflict → auto-approve

## Differentiators

1. Offline-first schedule + queued actions.
2. Fast and stable mobile UX with aggressive caching.
3. Swap experience designed for rapid pickup + manager visibility.
4. Accessibility by default (large type, dark mode, screen reader support).
5. Transparent pricing model (phase 2).

## Notification and reminder defaults

- Reminder at **24h** before shift.
- Reminder at **2h** before shift.
- Reminder at **30m** before shift if not confirmed.
- SMS fallback if push delivery fails/disabled.
