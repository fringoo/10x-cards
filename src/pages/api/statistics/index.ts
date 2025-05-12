import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getGlobalFlashcardStats,
  getGlobalEngagementStats,
  type SystemStatistics,
  type GlobalFlashcardStats,
  type GlobalEngagementStats,
} from "@/lib/services/statistics.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase as SupabaseClient;

  if (!supabase) {
    console.error("Supabase client not found in context.locals for statistics");
    return new Response("Błąd konfiguracji serwera.", { status: 500 });
  }

  // Sprawdzenie, czy użytkownik jest zalogowany (zgodnie z założeniem, że na razie wszyscy zalogowani mają dostęp)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Brak autoryzacji. Użytkownik musi być zalogowany, aby wyświetlić statystyki.", {
      status: 401,
    });
  }

  try {
    // Używamy Promise.allSettled, aby uzyskać jak najwięcej danych, nawet jeśli jedna z funkcji statystyk zawiedzie
    const results = await Promise.allSettled([getGlobalFlashcardStats(supabase), getGlobalEngagementStats(supabase)]);

    const flashcardStatsResult = results[0];
    const engagementStatsResult = results[1];

    // Przygotuj domyślne/puste wartości na wypadek błędów
    let flashcardStats: GlobalFlashcardStats | null = null;
    let flashcardError: string | null = null;
    if (flashcardStatsResult.status === "fulfilled") {
      flashcardStats = flashcardStatsResult.value.data;
      flashcardError = flashcardStatsResult.value.error as string | null;
    } else {
      flashcardError = flashcardStatsResult.reason?.message || "Błąd pobierania statystyk fiszek";
      console.error("Błąd w getGlobalFlashcardStats:", flashcardStatsResult.reason);
    }

    let engagementStats: GlobalEngagementStats | null = null;
    let engagementError: string | null = null;
    if (engagementStatsResult.status === "fulfilled") {
      engagementStats = engagementStatsResult.value.data;
      engagementError = engagementStatsResult.value.error as string | null;
    } else {
      engagementError = engagementStatsResult.reason?.message || "Błąd pobierania statystyk zaangażowania";
      console.error("Błąd w getGlobalEngagementStats:", engagementStatsResult.reason);
    }

    const systemStats: SystemStatistics = {
      // Użyj wartości null lub domyślnych, jeśli dane nie zostały pobrane
      flashcardStats: flashcardStats || {
        totalFlashcards: 0,
        aiFlashcards: 0,
        manualFlashcards: 0,
        aiFlashcardsAccepted: 0,
        aiAcceptanceRate: null,
      },
      engagementStats: engagementStats || { totalCollections: 0 },
    };

    // Zbieranie ewentualnych błędów do logowania lub przekazania dalej
    const errorsEncountered = [flashcardError, engagementError].filter(Boolean);

    if (errorsEncountered.length > 0) {
      console.warn("Wystąpiły błędy podczas pobierania niektórych statystyk:", errorsEncountered);
      // Możemy zdecydować, czy mimo błędów częściowych chcemy zwrócić 200 z tym, co mamy,
      // czy też zwrócić błąd serwera, jeśli np. statystyki fiszek są kluczowe.
      // Na potrzeby MVP, zwrócimy to co mamy, a błędy będą widoczne w logach serwera.
    }

    return new Response(JSON.stringify(systemStats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    // Ten catch jest dla nieoczekiwanych błędów w samym Promise.allSettled lub logice endpointu
    console.error("Nieoczekiwany błąd serwera w GET /api/statistics:", e);
    return new Response("Wystąpił wewnętrzny błąd serwera podczas pobierania statystyk.", { status: 500 });
  }
};
