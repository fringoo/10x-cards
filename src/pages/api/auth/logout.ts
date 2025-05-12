import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client"; // Poprawiona ścieżka do klienta Supabase

export const prerender = false; // Ważne dla endpointów API w Astro

export const POST: APIRoute = async ({ cookies, request }) => {
  console.log("[API /api/auth/logout] Otrzymano żądanie POST");
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  // Spróbujmy uzyskać ID użytkownika przed wylogowaniem, jeśli to możliwe, dla celów logowania
  let userId = "nieznany";
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (e) {
    // Błąd podczas pobierania użytkownika jest niekrytyczny dla wylogowania
    console.warn("[API /api/auth/logout] Nie udało się pobrać użytkownika przed wylogowaniem.");
  }
  console.log(`[API /api/auth/logout] Próba wylogowania użytkownika (ID, jeśli znane: ${userId})`);

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(`[API /api/auth/logout] Błąd wylogowania Supabase dla użytkownika (ID: ${userId}):`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, // Błąd serwera, jeśli wylogowanie się nie powiedzie
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[API /api/auth/logout] Pomyślnie wylogowano użytkownika (ID: ${userId})`);
  // Supabase usunie ciasteczka sesyjne.
  // Przekierowanie nie jest tutaj potrzebne, ponieważ klient (NavBar.astro) obsłuży przekierowanie.
  // Zwracamy status 200 OK, aby potwierdzić wylogowanie.
  return new Response(JSON.stringify({ message: "Wylogowano pomyślnie" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
