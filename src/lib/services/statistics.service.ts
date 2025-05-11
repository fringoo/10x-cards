import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types.ts";

export interface GlobalFlashcardStats {
  totalFlashcards: number;
  aiFlashcards: number;
  manualFlashcards: number;
  aiFlashcardsAccepted: number;
  aiAcceptanceRate: number | null; // Null if no AI flashcards to calculate rate from
}

export interface GlobalEngagementStats {
  totalCollections: number;
  // Placeholder for future stats like total study sessions
}

export interface SystemStatistics {
  flashcardStats: GlobalFlashcardStats;
  engagementStats: GlobalEngagementStats;
}

/**
 * Retrieves global statistics about flashcards in the system.
 */
export async function getGlobalFlashcardStats(
  supabase: SupabaseClient<Database>
): Promise<{ data: GlobalFlashcardStats | null; error: PostgrestError | string | null }> {
  console.log("[StatisticsService] Attempting to fetch global flashcard stats.");
  try {
    // 1. Total flashcards
    const { count: totalFlashcards, error: totalError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true });
    if (totalError) throw totalError;

    // 2. AI flashcards
    const { count: aiFlashcards, error: aiError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("source", "ai");
    if (aiError) throw aiError;

    // 3. Manual flashcards (assuming anything not 'ai' is 'manual' or another distinct category)
    // For simplicity, we can derive this or query explicitly if more sources exist.
    // Let's query for 'manual' explicitly for clarity, or adjust if 'source' can be other things.
    const { count: manualFlashcards, error: manualError } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("source", "manual"); // Assuming 'manual' is the other main type
    if (manualError) throw manualError;
    // Note: totalFlashcards might not be aiFlashcards + manualFlashcards if other sources exist or source is null.
    // For this MVP, we will assume these are the two primary distinct sources.

    // 4. AI flashcards accepted
    const { count: aiFlashcardsAccepted, error: acceptedError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("source", "ai")
      .eq("ai_approval_status", "approved");
    if (acceptedError) throw acceptedError;

    const stats: GlobalFlashcardStats = {
      totalFlashcards: totalFlashcards ?? 0,
      aiFlashcards: aiFlashcards ?? 0,
      manualFlashcards: manualFlashcards ?? 0, // Use explicitly queried manual count
      aiFlashcardsAccepted: aiFlashcardsAccepted ?? 0,
      aiAcceptanceRate: (aiFlashcards ?? 0) > 0 ? ((aiFlashcardsAccepted ?? 0) / (aiFlashcards ?? 0)) * 100 : null,
    };
    console.log("[StatisticsService] Successfully fetched flashcard stats:", stats);
    return { data: stats, error: null };

  } catch (e: any) {
    console.error("[StatisticsService] Error fetching global flashcard stats:", e);
    return { data: null, error: e.message || "An unexpected error occurred." };
  }
}

/**
 * Retrieves global statistics about engagement (e.g., collections).
 */
export async function getGlobalEngagementStats(
  supabase: SupabaseClient<Database>
): Promise<{ data: GlobalEngagementStats | null; error: PostgrestError | string | null }> {
  console.log("[StatisticsService] Attempting to fetch global engagement stats.");
  try {
    const { count: totalCollections, error: collectionsError } = await supabase
      .from("collections")
      .select("*", { count: "exact", head: true });
    if (collectionsError) throw collectionsError;

    const stats: GlobalEngagementStats = {
      totalCollections: totalCollections ?? 0,
    };
    console.log("[StatisticsService] Successfully fetched engagement stats:", stats);
    return { data: stats, error: null };

  } catch (e: any) {
    console.error("[StatisticsService] Error fetching global engagement stats:", e);
    return { data: null, error: e.message || "An unexpected error occurred." };
  }
} 