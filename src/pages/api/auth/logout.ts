import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../db/supabase.client'; // Poprawiona ścieżka do klienta Supabase

export const prerender = false; // Ważne dla endpointów API w Astro

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, // Błąd serwera, jeśli wylogowanie się nie powiedzie
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Supabase usunie ciasteczka sesyjne.
  // Przekierowanie nie jest tutaj potrzebne, ponieważ klient (NavBar.astro) obsłuży przekierowanie.
  // Zwracamy status 200 OK, aby potwierdzić wylogowanie.
  return new Response(JSON.stringify({ message: 'Wylogowano pomyślnie' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}; 