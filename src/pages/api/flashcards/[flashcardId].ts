import type { APIRoute } from "astro";
import { updateFlashcard, deleteFlashcard } from "@/lib/services/collection.service";
import type { FlashcardUpdatePayload } from "@/lib/services/collection.service"; // Import typu
import type { SupabaseClient } from "@supabase/supabase-js";
import { z, ZodError } from "zod";

export const prerender = false;

// Schemat Zod do walidacji danych wejściowych dla aktualizacji fiszki
const FlashcardUpdateSchema = z.object({
  front: z.string().min(1, "Pole 'front' nie może być puste.").optional(),
  back: z.string().min(1, "Pole 'back' nie może być puste.").optional(),
  ai_modified_by_user: z.boolean().optional(),
  ai_approval_status: z.enum(["approved", "rejected", "pending"]).optional(), // Dostosuj enum do swoich potrzeb
}).refine(data => Object.keys(data).length > 0, {
  message: "Przynajmniej jedno pole musi być dostarczone do aktualizacji."
});

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase as SupabaseClient;
  const flashcardId = params.flashcardId;

  if (!supabase) {
    console.error("Supabase client not found in context.locals for PUT flashcard");
    return new Response("Błąd konfiguracji serwera.", { status: 500 });
  }
  if (!flashcardId) {
    return new Response("Brak ID fiszki.", { status: 400 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response("Brak autoryzacji.", { status: 401 });
  }

  let updates: FlashcardUpdatePayload;
  try {
    const requestData = await request.json();
    updates = FlashcardUpdateSchema.parse(requestData) as FlashcardUpdatePayload;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Błąd walidacji danych wejściowych dla PUT flashcard:", error.errors);
      return new Response(JSON.stringify({ message: "Nieprawidłowe dane wejściowe.", errors: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Błąd podczas parsowania JSON dla PUT flashcard:", error);
    return new Response("Nieprawidłowy format danych JSON.", { status: 400 });
  }
  
  try {
    const { updatedFlashcard, error: serviceError } = await updateFlashcard(
      supabase,
      user.id,
      flashcardId,
      updates
    );

    if (serviceError) {
      console.error(`Błąd podczas aktualizacji fiszki ${flashcardId}:`, serviceError);
      const errorMessage = typeof serviceError === 'string' ? serviceError : (serviceError as Error).message || "Nie można zaktualizować fiszki.";
      // Sprawdzenie czy błąd to "Flashcard not found or user mismatch."
      const status = errorMessage.includes("not found or user mismatch") ? 404 : 500;
      return new Response(errorMessage, { status });
    }

    if (!updatedFlashcard) {
        // To nie powinno się zdarzyć jeśli serviceError jest null
        console.error(`Aktualizacja fiszki ${flashcardId} nie zwróciła danych mimo braku błędu.`);
        return new Response("Nie udało się zaktualizować fiszki, nie otrzymano zaktualizowanych danych.", { status: 500 });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(`Nieoczekiwany błąd serwera dla PUT /api/flashcards/${flashcardId}:`, e);
    return new Response("Wystąpił wewnętrzny błąd serwera.", { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase as SupabaseClient;
  const flashcardId = params.flashcardId;

  if (!supabase) {
    console.error("Supabase client not found in context.locals for DELETE flashcard");
    return new Response("Błąd konfiguracji serwera.", { status: 500 });
  }
  if (!flashcardId) {
    return new Response("Brak ID fiszki.", { status: 400 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response("Brak autoryzacji.", { status: 401 });
  }

  try {
    const { success, error: serviceError } = await deleteFlashcard(supabase, user.id, flashcardId);

    if (!success || serviceError) {
      console.error(`Błąd podczas usuwania fiszki ${flashcardId}:`, serviceError);
      const errorMessage = typeof serviceError === 'string' ? serviceError : (serviceError as Error).message || "Nie można usunąć fiszki.";
      const status = errorMessage.includes("not found or permission denied") ? 404 : 500;
      return new Response(errorMessage, { status });
    }

    return new Response(null, { status: 204 }); // No Content
  } catch (e: any) {
    console.error(`Nieoczekiwany błąd serwera dla DELETE /api/flashcards/${flashcardId}:`, e);
    return new Response("Wystąpił wewnętrzny błąd serwera.", { status: 500 });
  }
}; 