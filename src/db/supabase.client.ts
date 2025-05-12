import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type alias for our Supabase client instance
export type SupabaseClientInstance = typeof supabaseClient;

export const cookieOptions: CookieOptionsWithName = {
  name: "sb-token", // Default name, can be customized
  path: "/",
  secure: true, // Should be true in production
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

function parseCookieHeader(cookieHeader: string | null | undefined): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL!, import.meta.env.SUPABASE_KEY!, {
    cookieOptions,
    cookies: {
      getAll() {
        // AstroCookies.getAll() returns an array of objects with name and value
        // but createServerClient expects a string like the Cookie header.
        // We will use context.headers.get('Cookie') as per the mdc,
        // ensuring parseCookieHeader can handle null/undefined.
        return parseCookieHeader(context.headers.get("Cookie"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
