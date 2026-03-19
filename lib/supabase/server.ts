// lib/supabase/server.ts
//
// WHY no singleton here:
//   The original `let adminClient = null` singleton pattern causes TypeScript
//   to lock the return type at module-load time. During Next.js builds this can
//   cause the Database generic to resolve as `never` depending on module order.
//   Fresh client per call costs nothing at server-action scale and fixes it.
//
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createAdminClient() {
  return createClient<Database>(
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
