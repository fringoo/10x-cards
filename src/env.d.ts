/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // Tutaj można dodać inne zmienne środowiskowe, jeśli będą potrzebne
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient;
    user: import('@supabase/supabase-js').User | null;
    // session: import('@supabase/supabase-js').Session | null; // Opcjonalnie, jeśli potrzebna cała sesja
    // Można tu dodać inne właściwości do Astro.locals
  }
}
