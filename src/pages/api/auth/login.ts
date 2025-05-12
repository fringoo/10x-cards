import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client"; // Poprawiona ścieżka do klienta Supabase

export const prerender = false; // Ważne dla endpointów API w Astro, które mają być dynamiczne

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("[API /api/auth/login] Otrzymano żądanie POST");
  let email, password;
  try {
    const formData = await request.formData();
    email = formData.get("email") as string;
    password = formData.get("password") as string;
    console.log(`[API /api/auth/login] Próba logowania dla email: ${email}`);

    if (!email || !password) {
      console.error("[API /api/auth/login] Błąd: Email lub hasło nie zostało podane.");
      return new Response(JSON.stringify({ error: "Email i hasło są wymagane." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("[API /api/auth/login] Błąd podczas parsowania formData:", error.message);
    return new Response(JSON.stringify({ error: "Nieprawidłowy format danych żądania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`[API /api/auth/login] Błąd logowania Supabase dla email: ${email}:`, error.message);
    let errorMessage = "Nieprawidłowy email lub hasło.";
    if (error.message === "Email not confirmed") {
      errorMessage = "Adres email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.";
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: error.status || 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[API /api/auth/login] Pomyślne logowanie dla użytkownika: ${data.user?.email} (ID: ${data.user?.id})`);
  return new Response(JSON.stringify({ user: data.user, session: data.session }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  // Przekierowanie po stronie serwera nie jest tutaj konieczne,
  // ponieważ formularz po stronie klienta obsłuży przekierowanie po otrzymaniu odpowiedzi 200.
};
