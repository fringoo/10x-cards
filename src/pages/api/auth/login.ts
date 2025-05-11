import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../db/supabase.client'; // Poprawiona ścieżka do klienta Supabase

export const prerender = false; // Ważne dla endpointów API w Astro, które mają być dynamiczne

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  let email, password;
  try {
    const formData = await request.formData();
    email = formData.get('email') as string;
    password = formData.get('password') as string;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email i hasło są wymagane.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Nieprawidłowy format danych żądania.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Mapowanie błędów Supabase na bardziej przyjazne komunikaty, jeśli potrzeba
    let errorMessage = 'Nieprawidłowy email lub hasło.';
    if (error.message === 'Email not confirmed') {
      errorMessage = 'Adres email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.';
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 401, // Unauthorized lub 400 Bad Request, w zależności od preferencji
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sukces - Supabase automatycznie ustawi ciasteczka sesyjne poprzez createSupabaseServerClient
  // Zgodnie z auth-spec.md (sekcja 4.1, login), zwracamy dane użytkownika i sesji.
  // W przypadku signInWithPassword, `data.session` i `data.user` są dostępne.
  return new Response(JSON.stringify({ user: data.user, session: data.session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  // Przekierowanie po stronie serwera nie jest tutaj konieczne, 
  // ponieważ formularz po stronie klienta obsłuży przekierowanie po otrzymaniu odpowiedzi 200.
}; 