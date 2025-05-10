import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { FlashcardInCollectionDTO } from "@/types";
import type { Database } from "@/db/database.types.ts"; // For correct table name access

// Define a more specific type for what we expect to insert into 'flashcards'
// This maps from FlashcardInCollectionDTO to the DB schema for flashcards table
type FlashcardInsertPayload = Database["public"]["Tables"]["flashcards"]["Insert"];

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
