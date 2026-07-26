import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | undefined;

// Client for use in the browser (components), scoped to the anon key.
// Lazy on purpose: creating this eagerly at module load throws if the env
// vars aren't set yet, which breaks `npm run build` before you've even
// wired up Supabase. Call supabaseBrowser() where you need it instead.
export function supabaseBrowser() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}

// Client for use in API routes only — service role key bypasses row-level
// security, so never import this into a client component.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
