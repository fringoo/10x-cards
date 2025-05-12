import type { APIRoute } from "astro";
import { getFlashcardsByCollectionId } from "@/lib/services/collection.service";
import type { SupabaseClient } from "@supabase/supabase-js";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase as SupabaseClient;
  const collectionId = params.collectionId;

  if (!supabase) {
    console.error("Supabase client not found in context.locals for GET flashcards");
    return new Response("Błąd konfiguracji serwera.", { status: 500 });
  }

  if (!collectionId) {
    return new Response("Brak ID kolekcji.", { status: 400 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Błąd autoryzacji podczas pobierania fiszek:", userError.message);
    return new Response("Błąd autoryzacji.", { status: 401 });
  }
  if (!user) {
    return new Response("Brak autoryzacji: Użytkownik nie jest zalogowany.", { status: 401 });
  }

  try {
    const { flashcards, error: serviceError } = await getFlashcardsByCollectionId(supabase, user.id, collectionId);

    if (serviceError) {
      console.error(`Błąd podczas pobierania fiszek dla kolekcji ${collectionId}:`, serviceError);
      return new Response(
        typeof serviceError === "string" ? serviceError : serviceError.message || "Nie można pobrać fiszek.",
        { status: 500 }
      );
    }

    const responseData = flashcards || [];

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(`Nieoczekiwany błąd serwera dla GET /api/collections/${collectionId}/flashcards:`, e);
    return new Response("Wystąpił wewnętrzny błąd serwera.", { status: 500 });
  }
};
