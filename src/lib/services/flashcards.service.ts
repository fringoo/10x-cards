import type { GeneratedFlashcardDTO, JSONSchema } from "../../types";
import { OpenRouterService, OpenRouterError } from "./openrouter.service";

// Custom error to indicate external AI service failures
export class ExternalServiceError extends Error {
  code = "external_service_error";
  constructor(message: string) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class FlashcardsService {
  private openRouterService: OpenRouterService;

  constructor(apiKey: string) {
    this.openRouterService = new OpenRouterService({
      apiKey,
      defaultModel: "meta-llama/llama-4-scout",
      defaultParameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });
  }

  async generateDraft(text: string, maxCards: number): Promise<GeneratedFlashcardDTO[]> {
    try {
      // Define the schema for flashcards
      const flashcardsSchema: JSONSchema = {
        type: "array",
        title: "Flashcards",
        items: {
          type: "object",
          required: ["front", "back"],
          properties: {
            front: {
              type: "string",
              description: "The front side of the flashcard with a question or term",
            },
            back: {
              type: "string",
              description: "The back side of the flashcard with an answer or definition",
            },
          },
        },
        maxItems: maxCards,
      };

      // Create a system message that instructs the model how to create flashcards
      const systemMessage = `You are a helpful assistant that creates effective flashcards from provided text.
      Create up to ${maxCards} flashcards that capture the key concepts, facts, and relationships from the text.
      Make sure:
      - Front side contains a clear question, term, or concept
      - Back side contains a concise but complete answer or explanation
      - Cards cover the most important information in the text
      - Cards are organized in a logical sequence`;

      // Use the OpenRouter service to generate structured flashcards
      const flashcards = await this.openRouterService.getStructuredResponse<GeneratedFlashcardDTO[]>({
        message: `Please create flashcards from the following text: ${text}`,
        schema: flashcardsSchema,
        systemMessage,
        parameters: {
          temperature: 0.5, // Lower temperature for more predictable outputs
        },
      });

      return flashcards;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw new ExternalServiceError(`Failed to generate flashcards: ${error.message} (${error.code})`);
      }
      throw new ExternalServiceError("Failed to generate flashcards: Unknown error");
    }
  }
}

// Create a service instance with API key from environment
export const flashcardsService = new FlashcardsService(import.meta.env.OPENROUTER_API_KEY || "");
