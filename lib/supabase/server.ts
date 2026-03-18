import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}

export function validatePasscode(passcode: string): boolean {
  return passcode === process.env.CLASS_PASSCODE;
}
