// lib/supabase/server.ts
//
// WHY no singleton here:
//   The original `let adminClient = null` singleton pattern causes TypeScript
//   to lock the return type at module-load time. During Next.js builds this can
//   cause the Database generic to resolve as `never` depending on module order.
//   Fresh client per call costs nothing at server-action scale and fixes it.
//
import { createClient } from "@supabase/supabase-js";

// WHY no <Database> generic here:
// Newer versions of @supabase/supabase-js (2.44+) changed how they resolve
// the Database generic at build time. When the generic is present, TypeScript
// sometimes infers table types as `never` depending on module load order.
// Removing the generic makes the client untyped but the runtime behavior is
// identical — all CRUD operations work exactly the same. We enforce types
// manually in the action files instead.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}

export function validatePasscode(passcode: string): boolean {
  return passcode === process.env.CLASS_PASSCODE;
}
