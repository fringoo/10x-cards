import type { APIRoute } from "astro";
import { getUserCollections } from "@/lib/services/collection.service";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, locals }) => {
  const supabase = locals.supabase as SupabaseClient;

  if (!supabase) {
    console.error("Supabase client not found in context.locals");
    return new Response("Błąd konfiguracji serwera: Klient Supabase nie jest dostępny.", { status: 500 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("Błąd podczas pobierania użytkownika (auth.getUser):");
    return new Response("Błąd autoryzacji: Nie można zweryfikować sesji użytkownika.", { status: 401 });
  }

  if (!user) {
    return new Response("Brak autoryzacji: Użytkownik nie jest zalogowany.", { status: 401 });
  }

  try {
    const { collections, error: serviceError } = await getUserCollections(supabase, user.id);

    if (serviceError) {
      console.error("Błąd podczas pobierania kolekcji z serwisu:", serviceError);
      return new Response(
        typeof serviceError === "string" ? serviceError : serviceError.message || "Nie można pobrać kolekcji.",
        { status: 500 }
      );
    }

    const responseData = collections || [];

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Nieoczekiwany błąd serwera w GET /api/collections:", e);
    return new Response("Wystąpił wewnętrzny błąd serwera.", { status: 500 });
  }
}; 