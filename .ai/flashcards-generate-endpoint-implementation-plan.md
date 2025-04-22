# API Endpoint Implementation Plan: POST /flashcards/generate

## 1. Przegląd punktu końcowego
Celem jest generowanie szkicowych fiszek na podstawie dowolnego tekstu źródłowego, z użyciem zewnętrznego API AI, i zwrócenie listy obiektów `{ front, back }` bez zapisywania ich w bazie danych.

## 2. Szczegóły żądania
- Metoda HTTP: **POST**
- URL: `/api/flashcards/generate`
- Nagłówki:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "text": "string",         // wymagane, niepusty, min 10, max 5000 znaków
    "maxCards": number        // opcjonalne, liczba fiszek (1–20, domyślnie 10)
  }
  ```
- Parametry:
  - **Wymagane:**
    - `text`: string
  - **Opcjonalne:**
    - `maxCards`: number (domyślnie 10, zakres 1–20)

## 3. Wykorzystywane typy
- **DTOs:**
  ```ts
  interface GenerateFlashcardsRequestDTO {
    text: string;
    maxCards?: number;
  }
  
  interface DraftFlashcardDTO {
    front: string;
    back: string;
  }
  ```
- **Zod schema:**
  ```ts
  import { z } from "zod";
  
  export const generateFlashcardsSchema = z.object({
    text: z.string().min(10).max(5000),
    maxCards: z.number().int().min(1).max(20).default(10),
  });
  ```

## 4. Szczegóły odpowiedzi
- **200 OK**
- Body:
  ```json
  [
    { "front": "string", "back": "string" },
    ...
  ]
  ```
- **Kody błędów:**
  - `400 Bad Request` – walidacja inputu
  - `401 Unauthorized` – brak/nieprawidłowy token
  - `429 Too Many Requests` – przekroczony limit generacji AI
  - `502 Bad Gateway` – błąd komunikacji z serwisem AI
  - `500 Internal Server Error` – nieoczekiwany błąd serwera

## 5. Przepływ danych
1. Klient → Astro Server Endpoint `/src/pages/api/flashcards/generate.ts`
2. Endpoint:
   - Pobiera sesję i weryfikuje token (`context.locals.supabase.auth.getSession()`).
   - Parsuje i waliduje body za pomocą `generateFlashcardsSchema`.
   - Przy błędach walidacji zwraca `400 Bad Request`.
3. Na pomyślnej walidacji wywołuje serwis:
   - `flashcardsService.generateDraft(text, maxCards)` w `src/lib/services/flashcards.service.ts`.
   - Serwis buduje zapytanie do OpenRouter/OpenAI (korzystając z `import.meta.env.AI_API_KEY`).
   - Odbiera odpowiedź i mapuje na tablicę `DraftFlashcardDTO[]`.
4. Endpoint zwraca wynik z kodem **200 OK**.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:**
  - Bearer token z Supabase (sprawdzenie `getSession()`).
- **Autoryzacja:**
  - Tylko role `authenticated` mogą wywołać endpoint.
- **Walidacja:**
  - Ograniczenia długości `text` (10–5000 znaków).
  - Zakres `maxCards` (1–20).
- **Ochrona przed atakami:**
  - Limit wielkości payloadu (config Astro).
  - Middleware do rate limiting (np. 5 req/min użytkownik).
- **Klucz AI:**
  - Bezpieczne przechowywanie w `import.meta.env.AI_API_KEY`.

## 7. Obsługa błędów
| Scenariusz                        | Kod | error.code                | Opis                                       |
|-----------------------------------|-----|---------------------------|--------------------------------------------|
| Walidacja Zod                     | 400 | `validation_error`        | Nieprawidłowy lub brakujący `text`/`maxCards` |
| Brak/nieprawidłowy token          | 401 | `unauthorized`            | Użytkownik nie jest zalogowany             |
| Limit generacji AI                | 429 | `rate_limit`              | Przekroczony limit żądań do serwisu AI     |
| Błąd sieciowy/API zewnętrznego    | 502 | `external_service_error`  | Timeout lub błąd serwisu AI                |
| Niespodziewany błąd serwera       | 500 | `server_error`            | Inny błąd wewnętrzny                       |

Dodatkowo:
- Logować komunikaty `console.error`.
- Opcjonalnie zapisać rekord do tabeli `api_error_logs`.

## 8. Wydajność
- Zapytania do AI są najcięższe – stosować timeout (60s).
- Endpoint bezstanowy → łatwe skalowanie Horyzontalne.
- Używać `async/await` i brak blokowania event loop.

## 9. Kroki implementacji
1. Utworzyć lub rozszerzyć serwis AI w `src/lib/services/flashcards.service.ts`:
   - Metoda `generateDraft(text: string, maxCards: number): Promise<DraftFlashcardDTO[]>`.
2. Dodać Zod schema `generateFlashcardsSchema` (np. w `src/types.ts`).
3. Skonfigurować zmienne środowiskowe (`AI_API_KEY`) w `.env`.
4. Stworzyć Astro Server Endpoint `src/pages/api/flashcards/generate.ts`:
   - Import schema, supabase z `context.locals`, serwis.
   - Auth check, walidacja, wywołanie serwisu, mapowanie i zwrócenie JSON.
5. Obsłużyć błędy zgodnie z tabelą statusów.
6. Dodać testy:
   - Jednostkowe dla walidacji i serwisu (mock AI).
   - Integracyjne dla endpointa (Supertest lub Playwright API).  
7. Zaktualizować dokumentację w `api-plan.md` i README.
8. Wdrożenie i monitorowanie:
   - Metryki czasów odpowiedzi i błędy.
   - Alerty dla 5xx i 502. 