import type { APIRoute } from "astro";
import { z, ZodError } from "zod";

const passwordSchema = z.object({
  password: z.string().min(1, { message: "Hasło nie może być puste." }),
  // Możesz tu dodać bardziej złożone reguły, np. minimalna długość:
  // password: z.string().min(8, { message: 'Hasło musi mieć co najmniej 8 znaków.' }),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Nieprawidłowy Content-Type. Oczekiwano application/json." }), {
      status: 415,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "Użytkownik niezalogowany." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten().fieldErrors;
      return new Response(JSON.stringify({ error: "Błąd walidacji.", details: formattedErrors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { password: newPassword } = parsed.data;

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Supabase updateUser error:", updateError);
      // Można dodać bardziej szczegółowe mapowanie błędów Supabase na komunikaty dla użytkownika
      return new Response(JSON.stringify({ error: updateError.message || "Nie udało się zaktualizować hasła." }), {
        status: 500, // Lub bardziej odpowiedni kod błędu Supabase
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Hasło zostało pomyślnie zmienione." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // Should be caught by safeParse, but as a fallback
      return new Response(
        JSON.stringify({ error: "Błąd walidacji danych wejściowych.", details: error.flatten().fieldErrors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (error instanceof SyntaxError) {
      // JSON parsing error
      return new Response(JSON.stringify({ error: "Nieprawidłowy format JSON w ciele żądania." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Change password API error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd serwera." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
