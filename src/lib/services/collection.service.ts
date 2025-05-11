import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { FlashcardInCollectionDTO } from "@/types";
import type { Database } from "@/db/database.types.ts"; // For correct table name access

// Define a more specific type for what we expect to insert into 'flashcards'
// This maps from FlashcardInCollectionDTO to the DB schema for flashcards table
type FlashcardInsertPayload = Database["public"]["Tables"]["flashcards"]["Insert"];
export type FlashcardUpdatePayload = Database["public"]["Tables"]["flashcards"]["Update"];
type CollectionBasicInfo = Pick<Database["public"]["Tables"]["collections"]["Row"], "id" | "name">;
export type FlashcardDetailsDTO = Pick<
  Database["public"]["Tables"]["flashcards"]["Row"],
  "id" | "front" | "back" | "source" | "ai_modified_by_user" | "ai_approval_status" | "collection_id" | "user_id" | "created_at" | "updated_at"
>;

/**
 * Saves a new collection of flashcards to the database.
 *
 * @param supabase The Supabase client instance.
 * @param userId The ID of the user creating the collection.
 * @param collectionName The name for the new collection.
 * @param flashcardsData An array of flashcard data to be saved with the collection.
 * @returns An object containing the new collection ID, count of saved flashcards, or an error.
 */
export async function saveFlashcardCollection(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionName: string,
  flashcardsData: FlashcardInCollectionDTO[]
): Promise<{
  collectionId: string | null;
  flashcardsSavedCount: number;
  error: PostgrestError | string | null;
}> {
  console.log(`[CollectionService] Attempting to save collection "${collectionName}" for user ${userId}`);

  // 1. Insert the new collection
  let newCollectionId: string | null = null;
  try {
    const { data: collectionEntry, error: collectionError } = await supabase
      .from("collections")
      .insert({ name: collectionName, user_id: userId })
      .select("id")
      .single();

    if (collectionError) {
      console.error("[CollectionService] Error inserting collection:", collectionError);
      return { collectionId: null, flashcardsSavedCount: 0, error: collectionError };
    }
    if (!collectionEntry) {
      console.error("[CollectionService] No data returned after inserting collection.");
      return { collectionId: null, flashcardsSavedCount: 0, error: "Failed to create collection: No ID returned." };
    }
    newCollectionId = collectionEntry.id;
    console.log(`[CollectionService] Collection created successfully with ID: ${newCollectionId}`);
  } catch (e) {
    console.error("[CollectionService] Unexpected error during collection insertion:", e);
    return { collectionId: null, flashcardsSavedCount: 0, error: "Unexpected error creating collection." };
  }

  // 2. Prepare and insert the flashcards linked to the new collection
  if (newCollectionId && flashcardsData.length > 0) {
    const flashcardsToInsert: FlashcardInsertPayload[] = flashcardsData.map((fc) => ({
      user_id: userId,
      collection_id: newCollectionId,
      front: fc.front,
      back: fc.back,
      source: fc.source, // Should be "ai" as per FlashcardInCollectionDTO
      ai_modified_by_user: fc.aiGeneratedDetails.modified,
      ai_approval_status: fc.aiGeneratedDetails.approvalStatus,
      // created_at, updated_at will be set by default by the DB
    }));

    console.log(
      `[CollectionService] Attempting to insert ${flashcardsToInsert.length} flashcards for collection ${newCollectionId}`
    );

    try {
      const { data: insertedFlashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select("id"); // Select IDs or count to confirm insertion

      if (flashcardsError) {
        console.error("[CollectionService] Error inserting flashcards:", flashcardsError);
        // CRITICAL: Collection was created, but flashcards failed.
        // This is where a transaction or cleanup logic would be vital in a production system.
        // For now, we return an error indicating partial success/failure.
        return {
          collectionId: newCollectionId, // Collection was created
          flashcardsSavedCount: 0,
          error: `Flashcards insertion failed: ${flashcardsError.message}. Collection created but empty.`,
        };
      }

      const savedCount = insertedFlashcards?.length || 0;
      console.log(`[CollectionService] Successfully inserted ${savedCount} flashcards.`);
      return {
        collectionId: newCollectionId,
        flashcardsSavedCount: savedCount,
        error: null,
      };
    } catch (e) {
      console.error("[CollectionService] Unexpected error during flashcard insertion:", e);
      return {
        collectionId: newCollectionId,
        flashcardsSavedCount: 0,
        error: "Unexpected error inserting flashcards.",
      };
    }
  } else if (newCollectionId && flashcardsData.length === 0) {
    // Collection created, but no flashcards were provided to save with it (e.g. user saved only accepted, and none were)
    console.log(
      `[CollectionService] Collection ${newCollectionId} created, but no flashcards were in the save payload.`
    );
    return { collectionId: newCollectionId, flashcardsSavedCount: 0, error: null };
  }

  // Should not be reached if collection creation failed earlier, but as a fallback:
  return { collectionId: null, flashcardsSavedCount: 0, error: "Unknown error in saveFlashcardCollection." };
}

/**
 * Retrieves all collections for a given user.
 *
 * @param supabase The Supabase client instance.
 * @param userId The ID of the user whose collections are to be fetched.
 * @returns An object containing an array of collections or an error.
 */
export async function getUserCollections(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ collections: CollectionBasicInfo[] | null; error: PostgrestError | string | null }> {
  console.log(`[CollectionService] Attempting to fetch collections for user ${userId}`);
  try {
    const { data, error } = await supabase
      .from("collections")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[CollectionService] Error fetching collections:", error);
      return { collections: null, error };
    }
    console.log(`[CollectionService] Successfully fetched ${data?.length || 0} collections for user ${userId}.`);
    return { collections: data, error: null };
  } catch (e) {
    console.error("[CollectionService] Unexpected error fetching collections:", e);
    return { collections: null, error: "Unexpected error fetching collections." };
  }
}

/**
 * Retrieves all flashcards for a given collection and user.
 *
 * @param supabase The Supabase client instance.
 * @param userId The ID of the user.
 * @param collectionId The ID of the collection.
 * @returns An object containing an array of flashcards or an error.
 */
export async function getFlashcardsByCollectionId(
  supabase: SupabaseClient<Database>,
  userId: string,
  collectionId: string
): Promise<{ flashcards: FlashcardDetailsDTO[] | null; error: PostgrestError | string | null }> {
  console.log(
    `[CollectionService] Attempting to fetch flashcards for collection ${collectionId} and user ${userId}`
  );
  try {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front, back, source, ai_modified_by_user, ai_approval_status, collection_id, user_id, created_at, updated_at")
      .eq("user_id", userId)
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`[CollectionService] Error fetching flashcards for collection ${collectionId}:`, error);
      return { flashcards: null, error };
    }
    console.log(
      `[CollectionService] Successfully fetched ${data?.length || 0} flashcards for collection ${collectionId}.`
    );
    return { flashcards: data, error: null };
  } catch (e) {
    console.error(`[CollectionService] Unexpected error fetching flashcards for collection ${collectionId}:`, e);
    return { flashcards: null, error: "Unexpected error fetching flashcards." };
  }
}

/**
 * Updates an existing flashcard.
 *
 * @param supabase The Supabase client instance.
 * @param userId The ID of the user performing the update.
 * @param flashcardId The ID of the flashcard to update.
 * @param updates The partial data to update the flashcard with.
 * @returns An object containing the updated flashcard data or an error.
 */
export async function updateFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: string,
  updates: FlashcardUpdatePayload // front, back, ai_modified_by_user, ai_approval_status
): Promise<{ updatedFlashcard: FlashcardDetailsDTO | null; error: PostgrestError | string | null }> {
  console.log(
    `[CollectionService] Attempting to update flashcard ${flashcardId} for user ${userId} with updates:`,
    updates
  );

  // Ensure ai_modified_by_user is explicitly set if front or back are changed by AI generation context
  // For general updates, this logic might need refinement based on how `source` and `ai_modified_by_user` interact.
  // If 'front' or 'back' is part of the updates, and the card was AI-generated, imply modification.
  // However, the US-006 and US-009 imply user can edit any card.
  // Let's assume if front/back is updated, and it *was* an AI card, ai_modified_by_user should be true.
  // This logic is better handled at the API/component layer based on context or passed explicitly.
  // For now, we directly pass `ai_modified_by_user` in `updates` if it needs to change.

  try {
    // First, verify the flashcard belongs to the user
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("id, user_id, source") // check source if special logic for ai_modified_by_user is needed
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingFlashcard) {
      console.error(
        `[CollectionService] Error fetching flashcard ${flashcardId} for ownership check or flashcard not found:`,
        fetchError
      );
      return {
        updatedFlashcard: null,
        error: fetchError ? fetchError.message : "Flashcard not found or user mismatch.",
      };
    }
    
    // Prepare the final update payload
    const updatePayload: FlashcardUpdatePayload = { ...updates };
    if ((updates.front || updates.back) && existingFlashcard.source === 'ai' && updates.ai_modified_by_user !== false) {
        // If front/back of an AI card is changed, and ai_modified_by_user is not explicitly set to false,
        // then it has been modified by the user.
        updatePayload.ai_modified_by_user = true;
    }


    const { data, error: updateError } = await supabase
      .from("flashcards")
      .update(updatePayload)
      .eq("id", flashcardId)
      // .eq("user_id", userId) // Redundant due to prior check, but good for safety in direct Supabase calls
      .select("id, front, back, source, ai_modified_by_user, ai_approval_status, collection_id, user_id, created_at, updated_at")
      .single();

    if (updateError) {
      console.error(`[CollectionService] Error updating flashcard ${flashcardId}:`, updateError);
      return { updatedFlashcard: null, error: updateError };
    }
    if (!data) {
      console.error(`[CollectionService] No data returned after updating flashcard ${flashcardId}.`);
      return { updatedFlashcard: null, error: "Failed to update flashcard: No data returned." };
    }

    console.log(`[CollectionService] Successfully updated flashcard ${flashcardId}.`);
    return { updatedFlashcard: data, error: null };
  } catch (e) {
    console.error(`[CollectionService] Unexpected error updating flashcard ${flashcardId}:`, e);
    return { updatedFlashcard: null, error: "Unexpected error updating flashcard." };
  }
}

/**
 * Deletes a flashcard.
 *
 * @param supabase The Supabase client instance.
 * @param userId The ID of the user performing the deletion.
 * @param flashcardId The ID of the flashcard to delete.
 * @returns An object indicating success or an error.
 */
export async function deleteFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: string
): Promise<{ success: boolean; error: PostgrestError | string | null }> {
  console.log(`[CollectionService] Attempting to delete flashcard ${flashcardId} for user ${userId}`);
  try {
    // Optional: Verify ownership before delete if RLS is not solely relied upon or for clearer error messages
    const { count, error: checkError } = await supabase
        .from("flashcards")
        .select('*', { count: 'exact', head: true })
        .eq("id", flashcardId)
        .eq("user_id", userId);

    if (checkError) {
        console.error(`[CollectionService] Error checking flashcard ${flashcardId} ownership:`, checkError);
        return { success: false, error: checkError.message };
    }
    if (count === 0) {
        console.warn(`[CollectionService] Flashcard ${flashcardId} not found or does not belong to user ${userId}.`);
        return { success: false, error: "Flashcard not found or permission denied." };
    }

    const { error: deleteError } = await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId); // Ensure user_id match

    if (deleteError) {
      console.error(`[CollectionService] Error deleting flashcard ${flashcardId}:`, deleteError);
      return { success: false, error: deleteError };
    }

    console.log(`[CollectionService] Successfully deleted flashcard ${flashcardId}.`);
    return { success: true, error: null };
  } catch (e) {
    console.error(`[CollectionService] Unexpected error deleting flashcard ${flashcardId}:`, e);
    return { success: false, error: "Unexpected error deleting flashcard." };
  }
}
