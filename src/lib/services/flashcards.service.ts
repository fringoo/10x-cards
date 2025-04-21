import type { GeneratedFlashcardDTO } from "../../types";

// Custom error to indicate external AI service failures
export class ExternalServiceError extends Error {
  code = "external_service_error";
  constructor(message: string) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class FlashcardsService {
  async generateDraft(text: string, maxCards: number): Promise<GeneratedFlashcardDTO[]> {
    // Mock implementation: return dummy flashcards without calling AI
    const count = Math.max(1, Math.min(maxCards, 20));
    return Array.from({ length: count }, (_, i) => ({
      front: `Mock front ${i + 1}`,
      back: `Mock back ${i + 1}`,
    }));
  }
}

export const flashcardsService = new FlashcardsService();
