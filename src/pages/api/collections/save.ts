import type { APIRoute } from "astro";
import {
  type SaveFlashcardCollectionCommand,
  saveFlashcardCollectionSchema,
  type SaveFlashcardCollectionResponseDTO,
} from "@/types";
import { saveFlashcardCollection } from "@/lib/services/collection.service"; // Corrected import path
// import { supabase } from "@/lib/supabase/server"; // This line can be removed if using locals.supabase

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  console.log("[API /api/collections/save] Received POST request at", new Date().toISOString());

  // User authentication
  if (!locals.supabase) {
    console.error("[API /api/collections/save] Supabase client not available on locals.");
    return new Response(
      JSON.stringify({ error: { code: "SERVER_ERROR", message: "Supabase client not configured." } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();
  if (authError || !user) {
    console.warn("[API /api/collections/save] Unauthorized attempt to save collection. Auth error:", authError);
    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = user.id;
  // const mockUserId = "mock-user-id-123"; // Removed mock user ID

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
    console.log("[API /api/collections/save] Request body validated successfully for user:", userId);
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

  // --- Real Database Interaction using CollectionService ---
  console.log(
    `[API /api/collections/save] Attempting to save collection via service for user: ${userId}, collection: "${command.collectionName}"`
  );

  try {
    const result = await saveFlashcardCollection(
      locals.supabase, // Use the Supabase client from locals
      userId,
      command.collectionName,
      command.flashcards
    );

    if (result.error) {
      console.error("[API /api/collections/save] Error from collection service:", result.error);
      // Determine status code based on error type if possible, otherwise default to 500
      // For PostgrestError, we might be able to map to more specific HTTP errors
      // For now, a generic 500 or a more specific one if the error message indicates something like a duplicate.
      // If the error message indicates partial success (collection created, flashcards failed),
      // we might want a different response, but the service currently returns a string error in that case.
      return new Response(
        JSON.stringify({
          error: {
            code: "SERVICE_ERROR",
            message: "Failed to save collection.",
            details: typeof result.error === "string" ? result.error : result.error.message,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!result.collectionId) {
      // This case should ideally be covered by result.error, but as a safeguard
      console.error("[API /api/collections/save] Collection service returned no error but no collection ID.");
      return new Response(
        JSON.stringify({ error: { code: "SERVICE_ERROR", message: "Failed to create collection ID." } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseDTO: SaveFlashcardCollectionResponseDTO = {
      collectionId: result.collectionId,
      message: `Kolekcja "${command.collectionName}" została zapisana pomyślnie. ID: ${result.collectionId}`,
      flashcardsSavedCount: result.flashcardsSavedCount,
    };

    console.log("[API /api/collections/save] Sending 201 Created response.");
    return new Response(JSON.stringify(responseDTO), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (serviceError) {
    const err = serviceError as Error;
    console.error("[API /api/collections/save] Unexpected error calling collection service:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  // --- End Real Database Interaction ---

  // const mockCollectionId = `coll_${Date.now()}`; // Mock code removed
  // // --- End Mock Database Interaction ---

  // const responseDTO: SaveFlashcardCollectionResponseDTO = { // Mock code removed
  //   collectionId: mockCollectionId,
  //   message: `Kolekcja "${command.collectionName}" została (mock) zapisana pomyślnie. ID: ${mockCollectionId}`,
  //   flashcardsSavedCount: command.flashcards.length,
  // };

  // console.log("[API /api/collections/save] Sending 201 Created response."); // Mock code removed
  // return new Response(JSON.stringify(responseDTO), { // Mock code removed
  //   status: 201, // 201 Created is appropriate for successful resource creation
  //   headers: { "Content-Type": "application/json" },
  // });
};
