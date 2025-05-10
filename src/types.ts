import type { Tables } from "./db/database.types";
import { z } from "zod";

// --- Enums ---
export type FlashcardSource = "ai" | "manual";
export type ApprovalStatus = "approved" | "rejected" | "pending";
export type ReviewStatus = "correct" | "incorrect";

// --- User / Auth DTOs ---
// Komenda rejestracji użytkownika
export interface RegisterUserCommand {
  email: string;
  password: string;
}

// Podstawowy DTO użytkownika (pochodzi z auth.users)
export interface UserDTO {
  id: string;
  email: string;
}

// Typ wiersza profilu z bazy danych (public.profiles)
export type ProfileRow = Tables<"profiles">;

// DTO profilu użytkownika, mapuje snake_case na camelCase
export interface ProfileDTO {
  id: ProfileRow["id"];
  fullName: ProfileRow["full_name"];
  avatarUrl: ProfileRow["avatar_url"];
  createdAt: ProfileRow["created_at"];
  updatedAt: ProfileRow["updated_at"];
}

// Odpowiedź na rejestrację/logowanie
export interface RegisterUserResponseDTO {
  user: UserDTO;
  profile: Omit<ProfileDTO, "createdAt" | "updatedAt">;
  token: string;
}
export type LoginUserCommand = RegisterUserCommand;
export type LoginUserResponseDTO = RegisterUserResponseDTO;

// Reset hasła – żądanie i odpowiedź
export interface PasswordResetRequestDTO {
  email: string;
}
export interface PasswordResetResponseDTO {
  message: string;
}

// Potwierdzenie resetu hasła
export interface ConfirmResetPasswordCommand {
  token: string;
  newPassword: string;
}
export interface ConfirmResetPasswordResponseDTO {
  message: string;
}

// Pobranie danych zalogowanego użytkownika
export type GetCurrentUserResponseDTO = ProfileDTO;

// Aktualizacja profilu
export interface UpdateUserProfileCommand {
  fullName?: string;
  avatarUrl?: string;
}
export type UpdateUserProfileResponseDTO = ProfileDTO;

// --- Flashcards DTOs ---
// Komenda tworzenia nowej fiszki (manual)
export interface CreateFlashcardCommand {
  front: string;
  back: string;
  source: "manual";
}

// Wiersz fiszki z bazy danych (public.flashcards)
export type FlashcardRow = Tables<"flashcards">;

// DTO fiszki mapujące pola z bazy danych plus status akceptacji
export interface FlashcardDTO {
  id: FlashcardRow["id"];
  front: FlashcardRow["front"];
  back: FlashcardRow["back"];
  source: FlashcardSource;
  /** computed: status akceptacji fiszki (wyliczane pole; dla manual zawsze 'approved') */
  approvalStatus: ApprovalStatus;
  createdAt: FlashcardRow["created_at"];
  updatedAt: FlashcardRow["updated_at"];
}

export type CreateFlashcardResponseDTO = FlashcardDTO;

// Generowanie fiszek przez AI
export interface GenerateFlashcardsCommand {
  text: string;
  maxCards?: number;
}
export type GeneratedFlashcardDTO = Pick<FlashcardDTO, "front" | "back">;
export type GenerateFlashcardsResponseDTO = GeneratedFlashcardDTO[];

// Zod schema for validating generate flashcards request
export const generateFlashcardsSchema = z.object({
  text: z.string().min(10).max(5000),
  maxCards: z.number().int().min(1).max(20).default(10),
});

// Pagination metadata
export interface PaginationDTO {
  page: number;
  pageSize: number;
  total: number;
}

// Lista fiszek
export interface ListFlashcardsResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// Pojedyncza fiszka
export type GetFlashcardResponseDTO = FlashcardDTO;

// Aktualizacja front/back fiszki
export type UpdateFlashcardCommand = Partial<Pick<FlashcardDTO, "front" | "back">>;
export type UpdateFlashcardResponseDTO = FlashcardDTO;

// Akceptacja / odrzucenie wygenerowanej fiszki
export type ApproveFlashcardResponseDTO = FlashcardDTO;
export type RejectFlashcardResponseDTO = FlashcardDTO;

// --- Sessions DTOs ---
// Komenda rozpoczęcia sesji
export interface StartSessionCommand {
  cardCount?: number;
}

// Wiersz sesji z bazy danych (public.sessions)
export type SessionRow = Tables<"sessions">;

// Odpowiedź na rozpoczęcie sesji
export interface StartSessionResponseDTO {
  id: SessionRow["id"];
  startedAt: SessionRow["started_at"];
}

// DTO sesji z liczbą kart
export interface SessionDTO {
  id: SessionRow["id"];
  startedAt: SessionRow["started_at"];
  endedAt: SessionRow["ended_at"];
  /** computed: liczba kart w sesji (wyliczane pole) */
  cardCount: number;
}

export interface ListSessionsResponseDTO {
  data: SessionDTO[];
  pagination: PaginationDTO;
}
export type GetSessionResponseDTO = SessionDTO;

// Wiersz relacji sesja–fiszka (public.session_flashcards)
export type SessionFlashcardRow = Tables<"session_flashcards">;

// DTO rekordu przeglądu pojedynczej fiszki
export interface SessionFlashcardDTO {
  sessionId: SessionFlashcardRow["session_id"];
  flashcardId: SessionFlashcardRow["flashcard_id"];
  status: ReviewStatus | null;
  reviewedAt: SessionFlashcardRow["reviewed_at"];
}

// DTO zwracany w GET /sessions/{id}/flashcards
export type SessionFlashcardReviewDTO = FlashcardDTO & {
  reviewedAt: SessionFlashcardDTO["reviewedAt"];
  status: SessionFlashcardDTO["status"];
};
export type GetSessionFlashcardsResponseDTO = SessionFlashcardReviewDTO[];

// Komenda zapisania wyniku przeglądu
export interface RecordSessionFlashcardCommand {
  status: ReviewStatus;
}
export type RecordSessionFlashcardResponseDTO = SessionFlashcardDTO;

// Zakończenie sesji – zwraca pełny obiekt sesji
export type CompleteSessionResponseDTO = SessionDTO;

// --- Admin Metrics DTO ---
export interface AdminMetricsDTO {
  totalFlashcards: number;
  aiFlashcards: number;
  manualFlashcards: number;
  acceptanceRateAi: number;
  weeklyRetention: number;
  averageSessionsPerUser: number;
}

// --- Flashcard Collection DTOs ---

/**
 * Represents a flashcard when being saved as part of a collection.
 * Includes AI-specific review details.
 */
export interface FlashcardInCollectionDTO {
  front: string;
  back: string;
  source: "ai"; // For now, collections are from AI-generated cards
  aiGeneratedDetails: {
    modified: boolean;
    approvalStatus: "pending" | "accepted" | "rejected";
  };
}

/**
 * Command to save a new collection of flashcards.
 */
export interface SaveFlashcardCollectionCommand {
  collectionName: string;
  flashcards: FlashcardInCollectionDTO[];
}

/**
 * Zod schema for validating the SaveFlashcardCollectionCommand.
 */
export const saveFlashcardCollectionSchema = z.object({
  collectionName: z
    .string()
    .min(3, "Nazwa kolekcji musi mieć co najmniej 3 znaki.")
    .max(100, "Nazwa kolekcji nie może przekraczać 100 znaków."),
  flashcards: z
    .array(
      z.object({
        front: z.string().min(1, "Przód fiszki nie może być pusty."),
        back: z.string().min(1, "Tył fiszki nie może być pusty."),
        source: z.literal("ai"),
        aiGeneratedDetails: z.object({
          modified: z.boolean(),
          approvalStatus: z.enum(["pending", "accepted", "rejected"]),
        }),
      })
    )
    .min(1, "Kolekcja musi zawierać co najmniej jedną fiszkę."),
});

/**
 * Response DTO after successfully saving a flashcard collection.
 */
export interface SaveFlashcardCollectionResponseDTO {
  collectionId: string; // UUID of the newly created collection
  message: string;
  flashcardsSavedCount: number;
}

// Unified API error response format
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// --- OpenRouter Service Types ---
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface JSONSchema {
  title?: string;
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[];
}

export interface MessageContent {
  type: "text" | "image_url" | "code";
  text?: string;
  image_url?: string;
  language?: string;
}

export interface LLMResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  object: string;
}

export interface LLMResponseChunk {
  id: string;
  content: string;
  model: string;
}

export interface RequestPayload {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: number;
    completion: number;
  };
  context_length?: number;
  capabilities?: string[];
}

export interface ModelDetails extends Model {
  provider: string;
  parameters: {
    available: string[];
    default: Record<string, unknown>;
  };
}
