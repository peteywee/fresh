# Schedule Status & Confirmation Workflow

This document describes the data model, API endpoints, and lifecycle for schedule (calendar event) confirmation and decline handling.

## Data Model

Schedule documents now include lightweight status flags in addition to timing and descriptive fields:

```
confirmed: boolean            # True once a user confirms attendance
confirmedAt?: number          # Epoch ms timestamp of confirmation
confirmedBy?: string          # User ID (sub) who confirmed

declined: boolean             # True once a user explicitly declines
declinedAt?: number           # Epoch ms timestamp of decline
declinedBy?: string           # User ID who declined
declineReason?: string        # Optional free-text reason
```

Only one of `confirmed` or `declined` should be true at any time. A confirm action clears any prior declined state; a decline clears any prior confirmed state.

## Utilities (Shared Types Package)

Two helper utilities were added to `packages/types`:

- `filterCalendarVisible(schedules)` → returns only schedules that are `confirmed && !declined` (used by the calendar month grid).
- `splitByStatus(schedules)` → partitions into `{ confirmed, pending, declined }` arrays to drive dashboard panels and future analytics.

## API Endpoints

Base collection lives at: `orgs/{orgId}/schedules/{scheduleId}` in Firestore.

### List / Create

`GET /api/schedules`  
Query parameters:

- (default) returns confirmed & visible schedules only
- `?pending=1` returns only pending (neither confirmed nor declined)
- `?all=1` returns all schedules without filtering

`POST /api/schedules` initializes a schedule with:

```
confirmed: false
declined: false
```

### Confirm

`PATCH /api/schedules/{id}/confirm`

```
{
  // optional: future extension (no body required now)
}
```

Effect:

```
confirmed = true
confirmedAt = now
confirmedBy = currentUserId
// reset decline related fields
declined = false
declinedAt = undefined
declinedBy = undefined
declineReason = undefined
```

### Decline

`PATCH /api/schedules/{id}/decline`

```
{
  "reason": "(optional note)"
}
```

Effect:

```
declined = true
declinedAt = now
declinedBy = currentUserId
// reset confirmation fields
confirmed = false
confirmedAt = undefined
confirmedBy = undefined
```

### Existing CRUD

The original `[id]/route.ts` (GET/PUT/DELETE) remains for full updates and deletions. Status flags can be modified there as well, but the specialized confirm/decline endpoints provide a safer semantic path.

## UI Integrations

1. **Dashboard Pending Panel** – Shows schedules from `GET /api/schedules?pending=1` with inline Confirm / Decline forms posting to dedicated endpoints.
2. **Calendar Month View** – Uses `filterCalendarVisible` so only confirmed (non-declined) appear in the grid; pending and declined are excluded.
3. **Status Badges** – Calendar legacy list view and dashboard include visual badges (Pending, Confirmed, Declined).

## Lifecycle Summary

```
Create -> Pending
Pending --(confirm)--> Confirmed
Pending --(decline)--> Declined
Declined --(confirm)--> Confirmed (clears decline)
Confirmed --(decline)--> Declined (clears confirm)
```

## Edge Cases & Notes

- Double-submit: Idempotent because re-confirm sets the same flags; timestamps simply update.
- Race conditions: Last write wins; could add Firestore transactions if needed later.
- Filtering assumption: Calendar hides both pending and declined; adjust by replacing `filterCalendarVisible` with custom predicate if business rules change.
- Analytics: `confirmedAt` and `declinedAt` timestamps support response-time metrics later.

## Testing

Basic unit tests in `tests/schedules-status.test.ts` cover:

- Visibility filter correctness
- Status partition logic
- Pending classification

Add integration tests later for API round-trips once Firestore test harness is introduced.

## Future Enhancements

- Add reason capture UI for decline (currently `reason` field supported in API but not surfaced on form).
- Implement notification dispatch to administrators on decline.
- Add optimistic UI state for confirm/decline interactions.
- Enforce mutually exclusive flags via Firestore security rules or a server-side transaction.
