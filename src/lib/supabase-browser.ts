import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — safe to import in Client Components ("use client").
 * Does NOT import next/headers, so it will never break the client bundle.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
