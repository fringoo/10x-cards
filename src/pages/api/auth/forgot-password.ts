import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, site }) => {
  console.log("[API /api/auth/forgot-password] Otrzymano żądanie POST");
  let email;
  try {
    const formData = await request.formData();
    email = formData.get("email") as string;
    console.log(`[API /api/auth/forgot-password] Próba wysłania linku resetującego dla email: ${email}`);

    if (!email || typeof email !== "string") {
      console.error("[API /api/auth/forgot-password] Błąd: Email nie został podany lub ma nieprawidłowy typ.");
      return new Response(JSON.stringify({ error: "Email jest wymagany." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("[API /api/auth/forgot-password] Błąd podczas parsowania formData:", error.message);
    return new Response(JSON.stringify({ error: "Nieprawidłowy format danych żądania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const redirectTo = site ? `${site.origin}/auth/reset-password` : "/auth/reset-password";
  console.log(`[API /api/auth/forgot-password] Używany redirectTo dla resetu hasła: ${redirectTo}`);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo,
  });

  if (error) {
    // Zgodnie z auth-spec.md, nie ujawniamy, czy użytkownik istnieje, więc nawet przy błędzie Supabase (np. User not found),
    // często zwraca się generyczny komunikat sukcesu, chyba że jest to błąd serwera.
    // Jednakże Supabase może zwrócić błąd np. przy przekroczeniu limitu wysyłek.
    // Dla celów diagnostycznych logujemy błąd.
    console.error(
      `[API /api/auth/forgot-password] Błąd Supabase podczas resetPasswordForEmail dla ${email}:`,
      error.message,
      `(Status: ${error.status})`
    );
    // Jeśli chcemy być bardziej precyzyjni dla klienta, można analizować `error.status` lub `error.message`
    // Na razie, zgodnie z zasadą nieujawniania, zwrócimy ogólny komunikat.
    // Ale jeśli jest to np. błąd serwera (status 5xx), to warto go zwrócić.
    if (error.status && error.status >= 500) {
      return new Response(JSON.stringify({ error: "Wystąpił wewnętrzny błąd serwera." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    // W innych przypadkach (np. użytkownik nie istnieje, co Supabase może zwrócić jako błąd 400 lub 404)
    // udajemy sukces, aby nie ujawniać informacji.
  }

  console.log(`[API /api/auth/forgot-password] Instrukcja resetowania hasła (potencjalnie) wysłana na adres: ${email}`);
  return new Response(
    JSON.stringify({
      message: "Jeśli konto o podanym adresie email istnieje, link do resetowania hasła został wysłany.",
    }),
    {
      status: 200, // Zawsze zwracamy 200 OK, aby nie ujawniać istnienia konta
      headers: { "Content-Type": "application/json" },
    }
  );
};
