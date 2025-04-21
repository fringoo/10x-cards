import type { APIRoute } from "astro";
import { generateFlashcardsSchema } from "../../../types";
import { flashcardsService, ExternalServiceError } from "../../../lib/services/flashcards.service";
import { checkRateLimit } from "../../../lib/services/rateLimiter.service";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Mocked authentication (bypass Supabase)
  // const { data, error: authError } = await locals.supabase.auth.getSession();
  // if (authError || !data.session) {
  //   return new Response(JSON.stringify({ error: { code: "unauthorized", message: "Unauthorized" } }), { status: 401 });
  // }
  const userId = "mock-user";

  // Rate limit by authenticated user
  if (!checkRateLimit(userId)) {
    return new Response(JSON.stringify({ error: { code: "rate_limit", message: "Too many requests" } }), {
      status: 429,
    });
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: { code: "validation_error", message: "Invalid JSON payload" } }), {
      status: 400,
    });
  }

  // Validate input
  const parseResult = generateFlashcardsSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: { code: "validation_error", message: "Invalid request", details: parseResult.error.flatten() },
      }),
      { status: 400 }
    );
  }
  const { text, maxCards } = parseResult.data;

  try {
    const cards = await flashcardsService.generateDraft(text, maxCards);
    return new Response(JSON.stringify(cards), { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ExternalServiceError) {
      return new Response(JSON.stringify({ error: { code: err.code, message: err.message } }), { status: 502 });
    }
    const error = err as Error;
    console.error(error);
    return new Response(JSON.stringify({ error: { code: "server_error", message: "Internal server error" } }), {
      status: 500,
    });
  }
};
