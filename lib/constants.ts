// Placeholder user id used everywhere auth would normally scope a query.
// streak_log.user_id (and friends) are typed `uuid` — the string "demo-user"
// that was used ad hoc across routes fails with a Postgres 22P02 error
// ("invalid input syntax for type uuid"). Use this nil UUID consistently
// until real auth is wired up (see the TODO in supabase/schema.sql).
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";
