# Plan implementacji widoku Generowania Fiszek AI

## 1. Przegląd
Widok "Generowanie Fiszek AI" umożliwia użytkownikom wprowadzenie tekstu źródłowego, na podstawie którego sztuczna inteligencja wygeneruje propozycje fiszek. Widok ten odpowiada historyjce użytkownika US-004 i stanowi pierwszy krok w procesie tworzenia fiszek wspomaganym przez AI. Po pomyślnym wygenerowaniu, użytkownik zostanie przekierowany do widoku przeglądania i akceptacji fiszek.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/generate`. Wymaga zalogowanego użytkownika (chociaż obecna implementacja API mockuje użytkownika, routing po stronie klienta powinien zakładać wymóg autentykacji).

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie następująca:

```
src/layouts/MainLayout.astro  // Główny layout aplikacji
  └── src/pages/generate.astro (GenerateFlashcardsPage) // Strona Astro
        └── src/components/GenerateFlashcardsForm.tsx (client:load) // Formularz React
              ├── Shadcn/ui Form (opakowuje formularz, zarządzany przez react-hook-form)
              │   ├── Shadcn/ui FormItem (grupuje label, input, opis, błędy)
              │   │   ├── Shadcn/ui Label (etykieta dla pola tekstowego)
              │   │   ├── Shadcn/ui FormControl (opakowuje kontrolkę)
              │   │   │   └── Shadcn/ui Textarea (pole do wprowadzania tekstu)
              │   │   ├── Shadcn/ui FormDescription (informacja o limicie znaków / licznik)
              │   │   └── Shadcn/ui FormMessage (miejsce na błędy walidacji pola)
              │   └── Shadcn/ui Button (przycisk "Generuj fiszki", typ submit)
              │         └── Shadcn/ui Spinner (wyświetlany w przycisku podczas ładowania)
              └── Komponent Toast/Alert (np. Sonner lub Shadcn Alert, do wyświetlania błędów API)
```
Komponent `GenerateFlashcardsForm` będzie ładowany po stronie klienta (`client:load` lub `client:visible`) w pliku `generate.astro`.

## 4. Szczegóły komponentów

### `GenerateFlashcardsPage` (`src/pages/generate.astro`)
- **Opis:** Strona Astro hostująca komponent formularza React. Odpowiada za ustawienie layoutu, tytułu strony i renderowanie interaktywnego formularza. Może zawierać logikę sprawdzania autentykacji przed renderowaniem formularza (jeśli nie jest to globalnie obsługiwane przez middleware/layout).
- **Główne elementy:** Wykorzystuje `MainLayout.astro`, renderuje `<GenerateFlashcardsForm client:load />`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji, deleguje do `GenerateFlashcardsForm`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Standardowe typy Astro (`AstroProps`, etc.).
- **Propsy:** Standardowe propsy Astro.

### `GenerateFlashcardsForm` (`src/components/GenerateFlashcardsForm.tsx`)
- **Opis:** Interaktywny formularz React do wprowadzania tekstu i inicjowania generowania fiszek AI. Zarządza stanem formularza, walidacją po stronie klienta, komunikacją z API, stanem ładowania i wyświetlaniem błędów. Zalecane użycie `react-hook-form` z `zodResolver`.
- **Główne elementy:** `Form`, `FormItem`, `Label`, `FormControl`, `Textarea`, `FormDescription`, `FormMessage`, `Button`, `Spinner` (wszystkie z `shadcn/ui`). Dodatkowo, mechanizm wyświetlania powiadomień (np. `useToast` z `shadcn/ui` lub `sonner`).
- **Obsługiwane interakcje:**
    - Wprowadzanie tekstu w `Textarea`.
    - Kliknięcie przycisku "Generuj fiszki" (submit formularza).
- **Obsługiwana walidacja:**
    - Pole `text`:
        - Wymagane (nie może być puste).
        - Minimalna długość: 10 znaków.
        - Maksymalna długość: 5000 znaków.
    - Walidacja realizowana przy użyciu `zod` (schema `generateFlashcardsSchema`) i `react-hook-form`. Błędy wyświetlane przez `FormMessage`.
- **Typy:**
    - `GenerateFlashcardsCommand` (do wysłania do API)
    - `GenerateFlashcardsResponseDTO` (oczekiwany typ odpowiedzi API)
    - `ErrorResponseDTO` (typ błędu API)
    - Typy stanu wewnętrznego (zarządzane przez `react-hook-form`): stan formularza, status `isSubmitting`, błędy walidacji.
    - Typ stanu dla błędów API: `string | null`.
- **Propsy:** Brak propsów od rodzica (komponent samodzielny w kontekście strony).

## 5. Typy
W implementacji wykorzystane zostaną następujące główne typy (zdefiniowane w `src/types.ts`):

- **`GenerateFlashcardsCommand`**: Obiekt wysyłany w ciele żądania POST `/api/flashcards/generate`.
  ```typescript
  interface GenerateFlashcardsCommand {
    text: string;      // Tekst źródłowy (min 10, max 5000 znaków)
    maxCards?: number; // Opcjonalna maksymalna liczba kart (domyślnie 10 na backendzie)
  }
  ```
- **`generateFlashcardsSchema`**: Schema Zod do walidacji danych wejściowych formularza (zarówno po stronie klienta, jak i serwera).
  ```typescript
  // import { z } from "zod";
  const generateFlashcardsSchema = z.object({
    text: z.string().min(10, { message: "Tekst musi mieć co najmniej 10 znaków." })
                     .max(5000, { message: "Tekst nie może przekraczać 5000 znaków." }),
    maxCards: z.number().int().min(1).max(20).default(10), // Frontend może nie ustawiać tego pola, backend użyje default
  });
  ```
- **`GenerateFlashcardsResponseDTO`**: Typ odpowiedzi API w przypadku sukcesu (status 200). Jest to tablica obiektów fiszek.
  ```typescript
  type GeneratedFlashcardDTO = {
    front: string;
    back: string;
  };
  type GenerateFlashcardsResponseDTO = GeneratedFlashcardDTO[];
  ```
- **`ErrorResponseDTO`**: Standardowy format odpowiedzi API w przypadku błędu.
  ```typescript
  interface ErrorResponseDTO {
    error: {
      code: string;    // Kod błędu, np. "validation_error", "rate_limit", "server_error"
      message: string; // Wiadomość błędu dla użytkownika/dewelopera
      details?: Record<string, unknown>; // Szczegóły błędu (np. błędy walidacji pól)
    };
  }
  ```

## 6. Zarządzanie stanem
Stan komponentu `GenerateFlashcardsForm` będzie zarządzany głównie przy użyciu biblioteki `react-hook-form`:
- **Stan formularza:** Wartość pola `text` będzie przechowywana w stanie zarządzanym przez `react-hook-form`.
- **Stan walidacji:** Błędy walidacji wykryte przez `zodResolver` będą dostępne w stanie `react-hook-form` i używane do wyświetlania komunikatów w `FormMessage`.
- **Stan ładowania:** Stan `isSubmitting` dostarczany przez `react-hook-form` będzie używany do:
    - Wyświetlania komponentu `Spinner` wewnątrz przycisku.
    - Wyłączania (`disabled`) przycisku podczas przetwarzania żądania API.
- **Stan błędu API:** Dodatkowy stan `useState<string | null>(null)` będzie używany do przechowywania i wyświetlania komunikatów błędów zwróconych przez API (innych niż błędy walidacji pól, np. rate limit, błędy serwera).

Nie przewiduje się potrzeby tworzenia dedykowanego custom hooka dla tego widoku.

## 7. Integracja API
Komponent `GenerateFlashcardsForm` będzie komunikował się z endpointem API `POST /api/flashcards/generate`.
- **Żądanie:**
    - Metoda: `POST`
    - URL: `/api/flashcards/generate`
    - Nagłówki: `Content-Type: application/json` (oraz potencjalnie nagłówek `Authorization`, jeśli implementacja autentykacji tego wymaga i jest globalnie dodawany przez interceptor Axios/fetch wrapper).
    - Ciało (Body): Obiekt zgodny z typem `GenerateFlashcardsCommand`, np. `{ "text": "Wprowadzony tekst użytkownika", "maxCards": 10 }`. `maxCards` jest opcjonalne, backend użyje wartości domyślnej 10.
- **Odpowiedź (Sukces - 200 OK):**
    - Ciało: Tablica obiektów zgodna z typem `GenerateFlashcardsResponseDTO`, np. `[{ "front": "Pytanie 1", "back": "Odpowiedź 1" }, ...]`.
    - Akcja po stronie klienta: Przekierowanie użytkownika do strony przeglądania fiszek (`/generate/review`).
- **Odpowiedź (Błąd):**
    - Statusy: `400` (Błąd walidacji), `429` (Przekroczono limit żądań), `500` (Błąd serwera), `502` (Błąd usługi zewnętrznej).
    - Ciało: Obiekt zgodny z typem `ErrorResponseDTO`.
    - Akcja po stronie klienta: Wyświetlenie komunikatu błędu (`error.message`) użytkownikowi za pomocą komponentu `Alert` lub systemu powiadomień Toast (np. `sonner`). Stan `isSubmitting` ustawiany na `false`.

Do realizacji zapytań można użyć standardowego `fetch` API lub prekonfigurowanej instancji `axios`.

## 8. Interakcje użytkownika
- **Wprowadzanie tekstu:** Użytkownik wpisuje lub wkleja tekst w polu `Textarea`. Komponent `FormDescription` na bieżąco pokazuje liczbę wprowadzonych znaków i limit (np. "150 / 5000 znaków").
- **Wysyłanie formularza:** Użytkownik klika przycisk "Generuj fiszki".
    - Jeśli walidacja klienta nie powiedzie się: Wyświetlany jest błąd walidacji pod polem `Textarea` (przez `FormMessage`), żądanie API nie jest wysyłane.
    - Jeśli walidacja klienta powiedzie się: Przycisk staje się nieaktywny (`disabled`), wewnątrz pojawia się `Spinner`. Wysyłane jest żądanie POST do API.
- **Zakończenie przetwarzania API:**
    - Sukces: Użytkownik jest automatycznie przekierowywany na stronę `/generate/review`.
    - Błąd: Przycisk staje się ponownie aktywny, `Spinner` znika. Wyświetlany jest komunikat o błędzie API (np. w formie Toasta/Alertu).

## 9. Warunki i walidacja
- **Walidacja pola `text`:**
    - Warunek: Długość tekstu musi być >= 10 i <= 5000 znaków.
    - Mechanizm: `react-hook-form` z `zodResolver` używający `generateFlashcardsSchema`.
    - Feedback: Komunikat błędu w `FormMessage` pod polem `Textarea`. `FormDescription` pokazuje aktualną liczbę znaków / limit. Przycisk submit jest blokowany, jeśli formularz jest nieprawidłowy.
- **Stan ładowania:**
    - Warunek: Żądanie API jest w trakcie przetwarzania (`isSubmitting === true`).
    - Feedback: Przycisk "Generuj fiszki" jest wyłączony (`disabled`) i zawiera widoczny `Spinner`.
- **Błędy API:**
    - Warunek: API zwróciło status błędu (4xx, 5xx).
    - Feedback: Wyświetlenie komunikatu błędu z `ErrorResponseDTO.error.message` za pomocą Toasta lub komponentu `Alert`.

## 10. Obsługa błędów
- **Błędy walidacji klienta:** Obsługiwane przez `react-hook-form` i `zodResolver`. Komunikaty wyświetlane w `FormMessage` powiązanym z polem `text`.
- **Błędy walidacji serwera (400):** Odpowiedź API jest parsowana jako `ErrorResponseDTO`. Wiadomość `error.message` jest wyświetlana użytkownikowi (Toast/Alert). Rzadkie, jeśli walidacja klienta jest zsynchronizowana.
- **Błąd limitu żądań (429):** Odpowiedź API jest parsowana. Wyświetlana jest specyficzna wiadomość, np. "Osiągnięto limit generowania fiszek na ten moment. Spróbuj ponownie później." (Toast/Alert).
- **Błędy serwera (500, 502):** Odpowiedź API jest parsowana. Wyświetlana jest ogólna wiadomość o błędzie, np. "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za chwilę." (Toast/Alert). Szczegóły błędu powinny być logowane w konsoli deweloperskiej lub systemie monitorowania.
- **Błędy sieciowe:** Błąd rzucany przez `fetch`/`axios` (np. brak połączenia) powinien być przechwycony w bloku `catch`. Wyświetlana jest ogólna wiadomość o problemie z siecią, np. "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe." (Toast/Alert).

## 11. Kroki implementacji
1.  **Utworzenie strony Astro:** Stworzyć plik `src/pages/generate.astro`. Skonfigurować użycie głównego layoutu (`MainLayout.astro`) i podstawowe meta tagi (tytuł strony).
2.  **Utworzenie komponentu React:** Stworzyć plik `src/components/GenerateFlashcardsForm.tsx`.
3.  **Implementacja formularza:** W `GenerateFlashcardsForm.tsx`:
    - Zainstalować i skonfigurować `react-hook-form` oraz `@hookform/resolvers`.
    - Zdefiniować schemat formularza używając `generateFlashcardsSchema` z `src/types.ts` i `zodResolver`.
    - Zbudować strukturę formularza przy użyciu komponentów `Form`, `FormItem`, `Label`, `FormControl`, `Textarea`, `FormDescription`, `FormMessage` z `shadcn/ui`.
    - Powiązać pole `Textarea` ze stanem `react-hook-form`.
    - Dodać przycisk `Button` typu `submit`.
4.  **Implementacja stanu ładowania:**
    - Użyć stanu `isSubmitting` z `react-hook-form` do warunkowego renderowania `Spinner` wewnątrz przycisku `Button`.
    - Bindować atrybut `disabled` przycisku do stanu `isSubmitting`.
5.  **Implementacja logiki `onSubmit`:**
    - Zdefiniować asynchroniczną funkcję obsługi `onSubmit` przekazywaną do `react-hook-form`.
    - Wewnątrz funkcji:
        - Wywołać API `POST /api/flashcards/generate` używając `fetch` lub `axios`, przesyłając dane formularza (`{ text: data.text, maxCards: 10 }`).
        - Obsłużyć odpowiedź sukcesu: przekierować na `/generate/review` (`window.location.href = '/generate/review'`).
        - Obsłużyć odpowiedzi błędów: sparsować `ErrorResponseDTO`, ustawić stan `apiError`, wyświetlić błąd (np. używając `toast()` z `sonner` lub `useToast()` z `shadcn/ui`).
        - Obsłużyć błędy sieciowe (blok `catch`).
6.  **Wyświetlanie błędów API:**
    - Dodać stan `apiError` (`useState<string | null>`).
    - Skonfigurować system powiadomień Toast (np. `Sonner`) lub użyć komponentu `Alert` do wyświetlania `apiError`, gdy nie jest `null`. Resetować `apiError` przed nowym żądaniem API.
7.  **Integracja z Astro:** W `src/pages/generate.astro`, zaimportować `GenerateFlashcardsForm` i wyrenderować go z odpowiednią dyrektywą klienta, np. `<GenerateFlashcardsForm client:load />`.
8.  **Styling i finalizacja:** Dopracować wygląd przy użyciu Tailwind/Shadcn, upewnić się, że licznik znaków działa poprawnie, a komunikaty błędów są czytelne.
9.  **Testowanie:** Przetestować różne scenariusze: poprawna generacja, błędy walidacji (krótki/długi tekst), błędy API (symulacja 429, 500), brak połączenia sieciowego. 