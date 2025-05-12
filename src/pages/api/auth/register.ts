import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, site }) => {
  console.log("[API /api/auth/register] Otrzymano żądanie POST");
  let email, password;
  try {
    const formData = await request.formData();
    email = formData.get("email") as string;
    password = formData.get("password") as string;
    console.log(`[API /api/auth/register] Próba rejestracji dla email: ${email}`);

    if (!email || !password) {
      console.error("[API /api/auth/register] Błąd: Email lub hasło nie zostało podane.");
      return new Response(JSON.stringify({ error: "Email i hasło są wymagane." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // TODO: Dodać walidację serwerową dla siły hasła, jeśli wymagane (auth-spec.md 3.3 RegisterForm)
  } catch (error: any) {
    console.error("[API /api/auth/register] Błąd podczas parsowania formData:", error.message);
    return new Response(JSON.stringify({ error: "Nieprawidłowy format danych żądania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  const emailRedirectTo = site ? `${site.origin}/auth/verify-email` : "/auth/verify-email";
  console.log(`[API /api/auth/register] Używany emailRedirectTo: ${emailRedirectTo}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: emailRedirectTo,
    },
  });

  if (error) {
    console.error(
      `[API /api/auth/register] Błąd rejestracji Supabase dla email: ${email}:`,
      error.message,
      `(Status: ${error.status})`
    );
    // Użytkownik już istnieje (kod 422 lub 409 w zależności od konfiguracji Supabase)
    // Lub inny błąd Supabase
    // Supabase zwraca kod 400 dla 'User already registered' lub 'Password should be at least 6 characters'
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status || 400, // Użyj statusu błędu z Supabase, domyślnie 400
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(
    `[API /api/auth/register] Pomyślna próba rejestracji dla użytkownika: ${data.user?.email} (ID: ${data.user?.id}). Oczekiwanie na weryfikację email.`
  );
  // Sukces - użytkownik został utworzony, ale wymaga weryfikacji emaila.
  // Supabase automatycznie wyśle email weryfikacyjny.
  // Zwracamy dane użytkownika (mogą być częściowe do czasu weryfikacji).
  return new Response(
    JSON.stringify({
      message: "Rejestracja pomyślna. Sprawdź email, aby zweryfikować konto.",
      user: data.user,
    }),
    {
      status: 201, // Created
      headers: { "Content-Type": "application/json" },
    }
  );
};
