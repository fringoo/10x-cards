import type { APIRoute } from "astro";
import { generateFlashcardsSchema } from "../../../types";
import { flashcardsService, ExternalServiceError } from "../../../lib/services/flashcards.service";
// import { checkRateLimit } from "../../../lib/services/rateLimiter.service"; // Commented out for now

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  console.log("[API /api/flashcards/generate] Received POST request at", new Date().toISOString());

  // const userId = "mock-user"; // Commented out for now

  // Rate limit by authenticated user
  // if (!checkRateLimit(userId)) { // Commented out for now
  //   console.warn("[API /api/flashcards/generate] Rate limit exceeded for user:", userId);
  //   return new Response(JSON.stringify({ error: { code: "rate_limit", message: "Too many requests" } }), {
  //     status: 429,
  //   });
  // }

  let requestBody;
  try {
    console.log("[API /api/flashcards/generate] Attempting to parse JSON request body...");
    requestBody = await request.json();
    console.log("[API /api/flashcards/generate] Successfully parsed request body:", requestBody);
  } catch (e) {
    const err = e as Error;
    console.error("[API /api/flashcards/generate] Error parsing JSON payload:", err.message);
    return new Response(
      JSON.stringify({ error: { code: "validation_error", message: "Invalid JSON payload: " + err.message } }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log("[API /api/flashcards/generate] Attempting to validate request body against schema...");
  const parseResult = generateFlashcardsSchema.safeParse(requestBody);

  if (!parseResult.success) {
    console.warn("[API /api/flashcards/generate] Request body validation failed:", parseResult.error.flatten());
    return new Response(
      JSON.stringify({
        error: {
          code: "validation_error",
          message: "Invalid request parameters",
          details: parseResult.error.flatten(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  console.log("[API /api/flashcards/generate] Request body validated successfully:", parseResult.data);
  const { text, maxCards } = parseResult.data;

  try {
    console.log(
      `[API /api/flashcards/generate] Calling flashcardsService.generateDraft with text (first 50 chars): "${text.substring(0, 50)}..." and maxCards: ${maxCards}`
    );
    const cards = await flashcardsService.generateDraft(text, maxCards);
    console.log("[API /api/flashcards/generate] flashcardsService.generateDraft returned successfully:", cards);
    console.log("[API /api/flashcards/generate] Sending 200 OK response with generated cards.");
    return new Response(JSON.stringify(cards), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("[API /api/flashcards/generate] Error during flashcard generation process:", err);
    if (err instanceof ExternalServiceError) {
      console.error(
        `[API /api/flashcards/generate] ExternalServiceError: Code - ${err.code}, Message - ${err.message}`
      );
      return new Response(JSON.stringify({ error: { code: err.code, message: err.message } }), {
        status: 502, // Bad Gateway, as it's an error from an upstream service
        headers: { "Content-Type": "application/json" },
      });
    }
    // Generic server error
    const error = err as Error; // Keep this for basic error properties like message
    console.error("[API /api/flashcards/generate] Unknown error instance:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "internal_server_error",
          message: error.message || "An unexpected internal server error occurred.",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
