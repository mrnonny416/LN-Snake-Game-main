# Database Design (MySQL)

This schema supports score submissions, multi-round game sessions, and LNBits payments tracking. It aligns with current API routes under `app/api` and the UI flow.

## Entities

- **players**: Minimal player identity (submitted name). Index on `name` for lookups.
- **scores**: Single score per submission, referenced in the leaderboard. Index on `time_ms` for top-10 reads.
- **game_sessions**: Optional entity to record a play session; useful when the UI collects multiple round times before submission.
- **session_attempts**: Per-round attempt times (`playTimes`) linked to a `game_sessions` record.
- **invoices**: LNBits invoice tracking (created via `/api/payments/invoice` and checked via `/api/payments/[paymentHash]/status`).

## Leaderboard Strategy

The `scores` table serves leaderboard queries. The view `leaderboard_top10` selects the fastest 10 by `time_ms` ascending, breaking ties by `created_at`.

## Typical Flows

- **Submit Score**
  1. Ensure player exists (`players`).
  2. Optionally create a `game_sessions` row and insert `session_attempts` for each round.
  3. Insert final chosen score into `scores` for leaderboard.

- **Payments**
  1. Create invoice in `invoices` with `payment_hash`, `bolt11`, and `amount_sats`.
  2. Update `status` to `paid` and set `paid_at` when LNBits reports `paid: true`.

## Indexes and FKs

- `scores(time_ms)` speeds up top-10 selection.
- FKs: `scores.player_id → players.id`, `game_sessions.player_id → players.id`, `session_attempts.session_id → game_sessions.id`.

## Notes

- Time is stored in milliseconds as `INT UNSIGNED` to match the UI timer.
- `players.name` is not unique to avoid conflicts; you can add uniqueness later if required.
- All tables use `utf8mb4` and InnoDB for FK integrity.

See `mysql-schema.sql` for full DDL.
