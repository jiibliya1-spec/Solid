// Supabase client for Solid's account sign-in and cloud data sync.
//
// This environment can't install new npm packages (the package registry is
// blocked here), so instead of a normal `npm install @supabase/supabase-js`
// plus a bare import, the client library is loaded straight from a CDN as
// an ES module. Vite/Rollup treat an absolute http(s) import specifier as
// external and leave it untouched in the build output, so the browser
// fetches it directly at runtime -- this works in both dev and the
// production build without any local package or type declarations.
// @ts-ignore -- no local type declarations exist for a CDN-only import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Dedicated Supabase project for Solid (separate from any other app's
// project on this account). The anon key is safe to ship in client code --
// it only grants what the table's Row Level Security policies allow, and
// every row in `app_state` is locked to `auth.uid() = user_id`.
const SUPABASE_URL = 'https://egkptlovgryvbfieakoq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVna3B0bG92Z3J5dmJmaWVha29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMTIzOTAsImV4cCI6MjEwNTY4ODM5MH0.wOZvQ74fV8wxHA9VFR8pcJAt3i_gRQvlj-SKuAoe6oI';

// The CDN import has no local type declarations, so the client is typed as
// `any` here -- everywhere it's used treats its return values loosely
// (see SupabaseSession/SupabaseUser below for the minimal shapes we rely on).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface SupabaseUser {
  id: string;
  email?: string | null;
}

export interface SupabaseSessionShape {
  user: SupabaseUser;
  access_token: string;
}

export type SupabaseSession = SupabaseSessionShape | null;
