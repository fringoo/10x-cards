# Przewodnik Implementacji: Sesja Nauki z Fiszkami

## Wstęp

Niniejszy dokument opisuje plan implementacji funkcjonalności sesji nauki z fiszkami dla aplikacji 10x Cards, zgodnie z historyjkami użytkownika US-011, US-012 oraz US-013 z dokumentu wymagań produktu (`prd.md`).

Implementacja skupia się na stworzeniu interaktywnego interfejsu użytkownika, który pozwoli na przeglądanie fiszek, ocenę ich znajomości oraz podsumowanie sesji. Na tym etapie **nie implementujemy** zaawansowanego algorytmu spaced repetition (zostanie on zamockowany poprzez prosty mechanizm wyboru fiszek i nie będzie aktualizował parametrów SR w bazie danych) ani **nie integrujemy** się z usługami AI (jak OpenRouter) do generowania fiszek w trakcie sesji nauki, gdyż te funkcjonalności wykraczają poza zakres zdefiniowanych historyjek użytkownika (US-011, US-012, US-013).

Tech stack: Astro, React, TypeScript, Supabase, Tailwind CSS, Shadcn/ui.

## 1. Opis Usługi (Funkcjonalności Sesji Nauki)

Funkcjonalność sesji nauki umożliwi użytkownikom interaktywne uczenie się przy użyciu stworzonych przez siebie lub wygenerowanych przez AI fiszek. Główne cele to:

*   Umożliwienie użytkownikowi rozpoczęcia sesji nauki z wybraną liczbą fiszek.
*   Prezentacja fiszek w formacie "przód", a następnie "tył" na żądanie użytkownika.
*   Możliwość oceny przez użytkownika stopnia opanowania materiału z danej fiszki.
*   Podsumowanie sesji nauki po jej zakończeniu lub przerwaniu.

## 2. Opis Komponentów i Modułów

Główne elementy składowe tej funkcjonalności to:

### a. Strona Sesji Nauki (`learn.astro`)
*   **Cel:** Główny kontener dla interaktywnej sesji nauki.
*   **Opis:** Strona Astro (`src/pages/learn.astro`), która będzie renderować główny komponent React odpowiedzialny za logikę sesji. Może obsługiwać podstawowe routingi i ładowanie niezbędnych skryptów.
*   **Props/Konfiguracja:** Może przyjmować parametry z URL (np. ID kolekcji do nauki, choć na razie skupimy się na ogólnej puli fiszek użytkownika).

### b. Główny Komponent Sesji Nauki (`LearningSession.tsx`)
*   **Cel:** Zarządzanie całą logiką i stanem interaktywnej sesji nauki.
*   **Opis:** Komponent React (`src/components/LearningSession.tsx`) renderowany na stronie `learn.astro`. Będzie odpowiedzialny za:
    *   Konfigurację sesji (np. wybór liczby fiszek).
    *   Pobieranie fiszek z Supabase.
    *   Zarządzanie stanem bieżącej fiszki, postępem sesji, odpowiedziami użytkownika.
    *   Nawigację między fiszkami.
    *   Obsługę logiki "pokaż odpowiedź" i oceny fiszki.
    *   Wyświetlanie podsumowania sesji.
*   **Stan (State):** `flashcardsToReview: Flashcard[]`, `currentCardIndex: number`, `isAnswerShown: boolean`, `sessionStats: object`, `isLoading: boolean`, `error: string | null`, `sessionPhase: 'setup' | 'learning' | 'summary'`.
*   **Props:** Brak lub opcjonalne ID kolekcji.

### c. Komponent Widoku Fiszki (`FlashcardView.tsx`)
*   **Cel:** Wyświetlanie pojedynczej fiszki (przód i tył).
*   **Opis:** Komponent React (`src/components/FlashcardView.tsx`) odpowiedzialny za prezentację treści fiszki.
*   **Props:** `frontContent: string`, `backContent: string`, `isRevealed: boolean`. Może zawierać animację przejścia przy odkrywaniu odpowiedzi.

### d. Komponent Konfiguracji Sesji (`SessionSetup.tsx`)
*   **Cel:** Umożliwienie użytkownikowi zdefiniowania parametrów sesji.
*   **Opis:** Komponent React (`src/components/SessionSetup.tsx`) używany na początku, pozwalający użytkownikowi np. wybrać liczbę fiszek do nauki.
*   **Props:** `onSubmit: (numberOfCards: number) => void`.

### e. Komponent Podsumowania Sesji (`SessionSummary.tsx`)
*   **Cel:** Wyświetlanie wyników zakończonej sesji nauki.
*   **Opis:** Komponent React (`src/components/SessionSummary.tsx`) pokazujący statystyki (np. liczba przejrzanych fiszek, liczba "znanych").
*   **Props:** `stats: { reviewedCount: number, knownCount: number }`, `onRestart: () => void`, `onGoBack: () => void`.

### f. Serwis Fiszki (`flashcardService.ts`)
*   **Cel:** Abstrakcja zapytań do Supabase dotyczących fiszek.
*   **Opis:** Moduł TypeScript (`src/lib/services/flashcardService.ts`) zawierający funkcje do interakcji z bazą danych.
    *   `getFlashcardsForSession(userId: string, count: number, collectionId?: string): Promise<Flashcard[]>`: Pobiera fiszki dla sesji. **Mockowanie SR:** wybiera fiszki losowo lub najstarsze.
    *   `recordFlashcardReview(flashcardId: string, known: boolean): Promise<void>`: (Opcjonalne dla MVP) Zapisuje, że fiszka była przejrzana, ale bez logiki SR.

## 3. Publiczne Metody i Pola (API Komponentów i Serwisów)

### `LearningSession.tsx`
*   **Props:** (Opcjonalne) `collectionId?: string`
*   **Eksportowane funkcje (jeśli komponent jest częścią większego systemu):** Głównie jako samodzielny komponent strony.

### `FlashcardView.tsx`
*   **Props:** `frontContent: string`, `backContent: string`, `isRevealed: boolean`

### `SessionSetup.tsx`
*   **Props:** `onSubmit: (numberOfCards: number) => void`

### `SessionSummary.tsx`
*   **Props:** `stats: { reviewedCount: number, knownCount: number }`, `onRestart: () => void`, `onGoBack: () => void`

### `flashcardService.ts`
*   `async function getFlashcardsForSession(userId: string, count: number, collectionId?: string): Promise<Flashcard[]>`
*   `async function recordFlashcardReview(flashcardId: string, known: boolean): Promise<void>` (opcjonalne, uproszczone dla MVP)

## 4. Prywatne Metody i Pola (Logika Wewnętrzna)

### `LearningSession.tsx`
*   `handleStartSession(numberOfCards: number)`: Inicjalizuje sesję, pobiera fiszki.
*   `handleShowAnswer()`: Odkrywa odpowiedź na fiszce.
*   `handleRateFlashcard(isKnown: boolean)`: Rejestruje ocenę użytkownika, przechodzi do następnej fiszki lub kończy sesję.
*   `handleNextCard()`: Logika przejścia do następnej fiszki.
*   `handleEndSession()`: Kończy sesję i przechodzi do podsumowania.
*   `handleInterruptSession()`: Umożliwia przerwanie sesji.
*   Wewnętrzne stany do zarządzania UI i danymi sesji.

### `flashcardService.ts`
*   Logika zapytań SQL/Supabase client do pobierania fiszek (np. `SELECT * FROM flashcards WHERE user_id = $1 ORDER BY RANDOM() LIMIT $2`).

## 5. Obsługa Błędów

Należy zaimplementować mechanizmy obsługi błędów dla następujących scenariuszy:

1.  **Błąd połączenia z Supabase / Błąd serwera:**
    *   Wyświetlenie komunikatu o błędzie (np. "Nie udało się pobrać fiszek. Spróbuj ponownie później.").
    *   Możliwość ponowienia próby.
2.  **Brak fiszek do nauki:**
    *   Jeśli użytkownik nie ma żadnych fiszek, wyświetlenie komunikatu np. "Nie masz jeszcze żadnych fiszek. Dodaj nowe, aby rozpocząć naukę!".
    *   Przycisk/link kierujący do strony tworzenia/zarządzania fiszkami.
3.  **Niepoprawne dane wejściowe (np. w konfiguracji sesji):**
    *   Walidacja po stronie klienta (np. liczba fiszek musi być dodatnia).
4.  **Błędy renderowania komponentów React:**
    *   Użycie Error Boundaries w React do łapania błędów w komponentach i wyświetlania UI zastępczego.
5.  **Nieautoryzowany dostęp (teoretycznie obsłużone przez RLS Supabase):**
    *   Logowanie błędu po stronie serwera/klienta, wyświetlenie ogólnego komunikatu o błędzie.

Komunikaty o błędach powinny być przyjazne dla użytkownika i zgodne z językiem aplikacji (Polski).

## 6. Kwestie Bezpieczeństwa

1.  **Kontrola Dostępu do Danych (RLS):**
    *   Kluczowe jest zapewnienie, że użytkownicy mają dostęp wyłącznie do własnych fiszek. Należy skonfigurować i zweryfikować polityki Row Level Security (RLS) w Supabase na tabeli `flashcards` (np. `CREATE POLICY "User can access their own flashcards" ON flashcards FOR SELECT USING (auth.uid() = user_id);`).
2.  **Walidacja Danych Wejściowych:**
    *   Wszelkie dane wprowadzane przez użytkownika (np. liczba fiszek do sesji) powinny być walidowane po stronie klienta, aby zapobiec nieoczekiwanemu zachowaniu.
3.  **Zarządzanie Sesją Użytkownika:**
    *   Poleganie na mechanizmach autentykacji i zarządzania sesją dostarczanych przez Supabase.
4.  **CSRF/XSS:**
    *   Standardowe praktyki Astro i React pomagają w ochronie przed XSS. Należy unikać `dangerouslySetInnerHTML` bez odpowiedniej sanityzacji. Astro domyślnie nie wymaga specjalnych środków przeciw CSRF dla operacji GET, ale przy operacjach POST (których tu nie ma bezpośrednio w sesji nauki modyfikującej dane globalne) należy stosować odpowiednie tokeny, jeśli nie są obsługiwane przez framework/bibliotekę.

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Przygotowanie Bazy Danych (Supabase)

1.  **Weryfikacja tabeli `flashcards`:**
    *   Upewnij się, że tabela `flashcards` zawiera niezbędne kolumny: `id` (PK), `user_id` (FK do `auth.users`), `front_content` (text), `back_content` (text), `created_at`, `source` (`'ai' | 'manual'`).
    *   Dodaj opcjonalne, nullable kolumny dla przyszłej implementacji SR (jeśli jeszcze ich nie ma): `last_reviewed_at` (timestamp), `next_review_at` (timestamp), `ease_factor` (float), `interval` (integer).
2.  **Konfiguracja RLS:**
    *   Zdefiniuj i przetestuj polityki RLS dla tabeli `flashcards`, aby użytkownicy mogli odczytywać tylko swoje fiszki.

### Krok 2: Stworzenie Strony Astro dla Sesji Nauki

1.  Utwórz plik `src/pages/learn.astro`.
2.  Zdefiniuj podstawowy layout strony, używając `Layout.astro`.
3.  Dodaj miejsce na renderowanie głównego komponentu React (`LearningSession.tsx`) z dyrektywą `client:load` lub `client:idle`.

    ```astro
    ---
    import Layout from '@/layouts/Layout.astro';
    import LearningSession from '@/components/LearningSession.tsx'; // Upewnij się, że ścieżka jest poprawna
    ---
    <Layout title="Sesja Nauki - 10x Cards">
      <div class="container mx-auto py-8 px-4">
        <LearningSession client:load />
      </div>
    </Layout>
    ```

### Krok 3: Implementacja Serwisu `flashcardService.ts`

1.  Utwórz plik `src/lib/services/flashcardService.ts`.
2.  Zaimplementuj funkcję `getFlashcardsForSession(userId: string, count: number, collectionId?: string): Promise<Flashcard[]>`:
    *   Użyj klienta Supabase do pobrania fiszek.
    *   **Mockowanie SR:** Wybierz fiszki losowo (`ORDER BY random()`) lub najstarsze (`ORDER BY created_at ASC NULLS FIRST`) dla danego `userId`, ograniczając do `count`.
    *   Obsłuż błędy zapytań.
3.  (Opcjonalnie dla MVP) Zaimplementuj `recordFlashcardReview(flashcardId: string, known: boolean): Promise<void>`:
    *   Ta funkcja na razie może jedynie aktualizować `last_reviewed_at` na `NOW()` lub nie robić nic w bazie danych, a jedynie logować informację lokalnie na potrzeby podsumowania sesji.

### Krok 4: Implementacja Komponentu `FlashcardView.tsx`

1.  Utwórz plik `src/components/FlashcardView.tsx`.
2.  Zaimplementuj logikę wyświetlania przodu i tyłu fiszki na podstawie prop `isRevealed`.
3.  Użyj Tailwind CSS do stylizacji. Rozważ prostą animację przejścia.

### Krok 5: Implementacja Komponentu `SessionSetup.tsx`

1.  Utwórz plik `src/components/SessionSetup.tsx`.
2.  Zaimplementuj formularz (np. input liczbowy) do określenia liczby fiszek.
3.  Dodaj przycisk "Rozpocznij naukę".
4.  Po zatwierdzeniu, wywołaj `props.onSubmit` z wybraną liczbą.
5.  Użyj komponentów Shadcn/ui (np. `Input`, `Button`) i Tailwind CSS.

### Krok 6: Implementacja Komponentu `SessionSummary.tsx`

1.  Utwórz plik `src/components/SessionSummary.tsx`.
2.  Wyświetl statystyki przekazane w `props.stats`.
3.  Dodaj przyciski "Ucz się ponownie" (`props.onRestart`) i "Wróć do kolekcji" (`props.onGoBack`).
4.  Użyj komponentów Shadcn/ui i Tailwind CSS.

### Krok 7: Implementacja Głównego Komponentu `LearningSession.tsx`

1.  Utwórz plik `src/components/LearningSession.tsx`.
2.  Zarządzaj stanem sesji: `sessionPhase` ('setup', 'learning', 'summary'), `flashcardsToReview`, `currentCardIndex`, `isAnswerShown`, `sessionStats`, `isLoading`, `error`.
3.  **Faza 'setup':**
    *   Renderuj komponent `SessionSetup`.
    *   Po otrzymaniu liczby fiszek, wywołaj `flashcardService.getFlashcardsForSession`.
    *   Ustaw `isLoading` na true podczas ładowania, obsłuż błędy.
    *   Po pomyślnym załadowaniu, przejdź do fazy 'learning'.
4.  **Faza 'learning':**
    *   Wyświetlaj bieżącą fiszkę używając `FlashcardView`.
    *   Implementuj logikę przycisku "Pokaż odpowiedź" (zmienia `isAnswerShown` i aktualizuje `FlashcardView`).
    *   Implementuj przyciski oceny (np. "Umiem", "Nie umiem").
        *   Po ocenie, zaktualizuj `sessionStats`.
        *   Przejdź do następnej fiszki. Jeśli brak więcej fiszek, przejdź do fazy 'summary'.
    *   Implementuj możliwość przerwania sesji.
5.  **Faza 'summary':**
    *   Renderuj komponent `SessionSummary` z zebranymi statystykami.
    *   Obsłuż akcje restartu sesji lub powrotu.
6.  Użyj Supabase klienta (lub serwisu) do pobierania danych i React hooks do zarządzania stanem.
7.  Zastosuj odpowiednie style Tailwind CSS i komponenty Shadcn/ui.

### Krok 8: Stylowanie i UX

1.  Dopracuj wygląd wszystkich komponentów przy użyciu Tailwind CSS i Shadcn/ui, dbając o responsywność i czytelność.
2.  Zapewnij płynne przejścia i intuicyjną nawigację.

### Krok 9: Testowanie

1.  **Manualne testy:** Przejdź przez wszystkie scenariusze użytkownika (rozpoczęcie sesji, nauka, ocena, zakończenie, przerwanie, obsługa błędów, brak fiszek).
2.  Sprawdź poprawność pobierania danych i działania RLS.
3.  Testuj na różnych rozmiarach ekranu.

### Krok 10: Refaktoryzacja i Dokumentacja

1.  Przejrzyj kod pod kątem czystości, wydajności i zgodności z wytycznymi (`.ai/prd.md` - sekcja "Coding practices").
2.  Dodaj komentarze do bardziej złożonych fragmentów kodu.

Ten plan krok po kroku powinien umożliwić systematyczne wdrożenie funkcjonalności sesji nauki z fiszkami, zgodnie z przyjętymi założeniami i technologiami. 