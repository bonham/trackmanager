// Internal structural constants — not user-configurable via env.
// Changing AUTH_SCHEMA requires a DB migration and regenerating types/db.d.ts.
export const AUTH_SCHEMA = 'auth' as const;
