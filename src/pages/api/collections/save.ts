import type { APIRoute } from "astro";
import {
  type SaveFlashcardCollectionCommand,
  saveFlashcardCollectionSchema,
  type SaveFlashcardCollectionResponseDTO,
} from "@/types"; // Assuming @ is aliased to src/
// import { supabase } from "@/lib/supabase/server"; // Placeholder for actual Supabase client

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  console.log("[API /api/collections/save] Received POST request at", new Date().toISOString());

  // TODO: Implement actual user authentication
  // const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
  // if (authError || !user) {
  //   console.warn("[API /api/collections/save] Unauthorized attempt to save collection.");
  //   return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }), {
  //     status: 401,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }
  // const userId = user.id;
  const mockUserId = "mock-user-id-123"; // Using a mock user ID for now

  let command: SaveFlashcardCollectionCommand;
  try {
    const requestBody = await request.json();
    console.log("[API /api/collections/save] Attempting to parse and validate request body...");
    const parseResult = saveFlashcardCollectionSchema.safeParse(requestBody);
    if (!parseResult.success) {
      console.warn("[API /api/collections/save] Request body validation failed:", parseResult.error.flatten());
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters.",
            details: parseResult.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    command = parseResult.data;
    console.log("[API /api/collections/save] Request body validated successfully for user:", mockUserId);
  } catch (e) {
    const err = e as Error;
    console.error("[API /api/collections/save] Error parsing JSON payload:", err.message);
    return new Response(
      JSON.stringify({ error: { code: "INVALID_JSON", message: "Invalid JSON payload: " + err.message } }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // --- Mock Database Interaction ---
  console.log(`[API /api/collections/save] Mocking database save for collection: "${command.collectionName}"`);
  console.log(`[API /api/collections/save] User ID: ${mockUserId}`);
  console.log(`[API /api/collections/save] Flashcards to save (${command.flashcards.length}):`);
  command.flashcards.forEach((fc, idx) => {
    console.log(
      `  Flashcard ${idx + 1}: Front - "${fc.front.substring(0, 20)}...", Modified - ${fc.aiGeneratedDetails.modified}, Status - ${fc.aiGeneratedDetails.approvalStatus}`
    );
  });
  // In a real scenario:
  // 1. Start a transaction.
  // 2. Insert into 'collections' table (name, user_id) -> get collection_id.
  // 3. Loop through command.flashcards:
  //    Insert into 'flashcards' table (collection_id, user_id, front, back, source, modified_by_user, approval_status_ai).
  // 4. Commit transaction or rollback on error.

  const mockCollectionId = `coll_${Date.now()}`;
  // --- End Mock Database Interaction ---

  const responseDTO: SaveFlashcardCollectionResponseDTO = {
    collectionId: mockCollectionId,
    message: `Kolekcja "${command.collectionName}" została (mock) zapisana pomyślnie. ID: ${mockCollectionId}`,
    flashcardsSavedCount: command.flashcards.length,
  };

  console.log("[API /api/collections/save] Sending 201 Created response.");
  return new Response(JSON.stringify(responseDTO), {
    status: 201, // 201 Created is appropriate for successful resource creation
    headers: { "Content-Type": "application/json" },
  });
};
