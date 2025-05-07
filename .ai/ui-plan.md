# Architektura UI dla 10x Cards

## 1. Przegląd struktury UI

Aplikacja 10x Cards zostanie zbudowana w oparciu o Astro (dla struktury i stron statycznych/SSR) z wykorzystaniem React (dla dynamicznych, interaktywnych wysp) oraz biblioteki komponentów Shadcn/ui, stylizowanej Tailwind CSS. Routing będzie oparty na plikach Astro, zgodnie ze strukturą `./src/pages`.

Główny layout aplikacji (`src/layouts/MainLayout.astro`) będzie zawierał stały element nawigacyjny ( górny pasek - NavBar), który zapewni dostęp do kluczowych sekcji aplikacji oraz informacji o zalogowanym użytkowniku i opcji wylogowania. Dostęp do poszczególnych sekcji będzie chroniony w zależności od statusu autentykacji użytkownika oraz jego roli (np. panel administratora).

Zarządzanie stanem globalnym, takim jak sesja użytkownika, będzie realizowane przy pomocy React Context (`AuthContext`). Interakcje z backendem (API) będą obsługiwane przez dedykowane serwisy w `src/lib/api` (np. `flashcardService`, `authService`), wykorzystujące `axios` z interceptorami do automatycznego dołączania tokena JWT przechowywanego w `localStorage`. Do pobierania i zarządzania danymi serwerowymi zostanie wykorzystana biblioteka React Query.

Kluczową funkcjonalnością, czyli generowaniem fiszek przez AI oraz ich przeglądem i akceptacją, będzie dedykowany pojedynczy widok (`/generate`), gdzie użytkownik wprowadza tekst, a wygenerowane fiszki pojawiają się poniżej do dalszej interakcji, zgodnie z dostarczonym zrzutem ekranu.

## 2. Lista widoków

### 2.1. Rejestracja
-   **Ścieżka widoku:** `/register`
-   **Główny cel:** US-001 - Umożliwienie nowym użytkownikom założenia konta w systemie.
-   **Kluczowe informacje do wyświetlenia:** Formularz rejestracyjny (email, hasło, powtórz hasło), linki do polityki prywatności i regulaminu, informacja o konieczności weryfikacji adresu email po rejestracji.
-   **Kluczowe komponenty widoku:** `Form` (Shadcn/ui), `Input` (Shadcn/ui), `Button` (Shadcn/ui), `Alert` (Shadcn/ui dla komunikatów o błędach i sukcesie).
-   **UX, dostępność i względy bezpieczeństwa:** Walidacja danych formularza po stronie klienta i serwera, wskazanie siły hasła, `aria-invalid` dla pól z błędami, fokus na pierwszym polu formularza, jasne komunikaty o błędach (np. zajęty email - błąd 409), informacja o wysłaniu emaila weryfikacyjnego.

### 2.2. Logowanie
-   **Ścieżka widoku:** `/login`
-   **Główny cel:** US-002 - Umożliwienie zarejestrowanym użytkownikom dostępu do ich kont.
-   **Kluczowe informacje do wyświetlenia:** Formularz logowania (email, hasło), link "Zapomniałeś hasła?".
-   **Kluczowe komponenty widoku:** `Form`, `Input` (w tym `Input.Password` z opcją pokaż/ukryj), `Button`, `Alert` (dla błędów, np. 401 Unauthorized).
-   **UX, dostępność i względy bezpieczeństwa:** Opcja "Pokaż/ukryj hasło" z `aria-label`, możliwość zapamiętania emaila (opcjonalnie), jasne komunikaty o błędach.

### 2.3. Resetowanie hasła (Żądanie)
-   **Ścieżka widoku:** `/password-reset`
-   **Główny cel:** US-003 (Część 1) - Inicjacja procesu odzyskiwania hasła.
-   **Kluczowe informacje do wyświetlenia:** Formularz z polem na adres email.
-   **Kluczowe komponenty widoku:** `Input`, `Button`, `Alert`.
-   **UX, dostępność i względy bezpieczeństwa:** Informacja o wysłaniu linku resetującego lub o braku konta dla podanego adresu email.

### 2.4. Resetowanie hasła (Potwierdzenie)
-   **Ścieżka widoku:** `/reset-password/confirm?token=[ wartość_tokena]`
-   **Główny cel:** US-003 (Część 2) - Umożliwienie ustawienia nowego hasła.
-   **Kluczowe informacje do wyświetlenia:** Formularz (nowe hasło, powtórz nowe hasło). Token pobierany z URL.
-   **Kluczowe komponenty widoku:** `Input`, `Button`, `Alert`.
-   **UX, dostępność i względy bezpieczeństwa:** Walidacja siły nowego hasła, informacja o pomyślnej zmianie, obsługa błędów (nieważny/wygasły token).

### 2.5. Dashboard / Strona główna
-   **Ścieżka widoku:** `/`
-   **Główny cel:** Widok startowy po zalogowaniu, zapewniający szybki dostęp do kluczowych funkcji aplikacji.
-   **Kluczowe informacje do wyświetlenia:** Przyciski/karty akcji: "Generuj fiszki", "Moje fiszki", "Rozpocznij naukę". Nazwa użytkownika, awatar (jeśli dostępny).
-   **Kluczowe komponenty widoku:** `Card` (Shadcn/ui), `Button` (Shadcn/ui), `Avatar` (Shadcn/ui).
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok tylko dla zalogowanych użytkowników. Intuicyjna nawigacja do głównych sekcji.

### 2.6. Generowanie fiszek AI / Przegląd wygenerowanych fiszek
-   **Ścieżka widoku:** `/generate`
-   **Główny cel:** US-004, US-005, US-006 - Umożliwienie użytkownikowi wprowadzenia tekstu, automatycznego wygenerowania fiszek przez AI, a następnie ich przeglądu, edycji (opcjonalnie przed zapisem), zatwierdzenia lub odrzucenia, wszystko w ramach jednego, zintegrowanego widoku.
-   **Kluczowe informacje do wyświetlenia:**
    *   Sekcja wprowadzania tekstu: `Textarea` dla tekstu źródłowego, licznik znaków z limitem, przycisk "Generuj Fiszki".
    *   Sekcja przeglądu (dynamicznie ładowana po generacji): Lista wygenerowanych fiszek (front, back). Dla każdej fiszki: przyciski/ikony "Zatwierdź" (✓), "Edytuj" (✎ - jeśli zaimplementowane do modyfikacji przed finalnym zapisem), "Odrzuć" (X). Przyciski akcji masowych: "Zapisz zaakceptowane", "Zapisz wszystkie". Informacja o liczbie wygenerowanych fiszek.
-   **Kluczowe komponenty widoku:** `Textarea`, `Button` (z `Spinner`), `FormMessage` (dla walidacji limitu tekstu), `Card` (dla każdej fiszki), `Input` (dla edycji inline), `ButtonGroup`, `Alert`, `Tooltip`.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Wskaźnik ładowania (`Spinner`) podczas generowania. Możliwość edycji treści fiszki przed jej ostatecznym zapisaniem. Jasne informacje zwrotne o statusie operacji (np. zapisano, błąd). Paginacja dla dużej liczby wygenerowanych fiszek. Zgodność z dostarczonym zrzutem ekranu.

### 2.7. Lista fiszek użytkownika (Moje fiszki)
-   **Ścieżka widoku:** `/flashcards` (z parametrami query: `?page=…&source=…&sortBy=…&sortOrder=…`)
-   **Główny cel:** US-008, US-010 - Przeglądanie, sortowanie, filtrowanie oraz zarządzanie (edycja, usuwanie) wszystkimi fiszkami użytkownika.
-   **Kluczowe informacje do wyświetlenia:** Tabela lub siatka fiszek (front, fragment tyłu, źródło (AI/manualna), data utworzenia/modyfikacji). Akcje: Edytuj, Usuń. Opcje sortowania (data utworzenia, modyfikacji) i filtrowania (źródło).
-   **Kluczowe komponenty widoku:** `Table` lub komponent siatki, `Button`, `Pagination` (10 na stronę), `DropdownMenu` (dla sortowania/filtrowania), `AlertDialog` (dla potwierdzenia usunięcia).
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Potwierdzenie przed usunięciem. Komunikaty o błędach. Możliwość edycji inline lub przekierowanie do dedykowanego widoku edycji.

### 2.8. Tworzenie fiszki manualnej
-   **Ścieżka widoku:** `/flashcards/new`
-   **Główny cel:** US-007 - Umożliwienie ręcznego dodawania nowych fiszek.
-   **Kluczowe informacje do wyświetlenia:** Formularz z polami na "przód" i "tył" fiszki.
-   **Kluczowe komponenty widoku:** `Form`, `Input` lub `Textarea`, `Button` ("Zapisz fiszkę") z `Spinner`, `Alert`.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Walidacja (oba pola wymagane), `aria-required`. Fokus na pierwszym polu.

### 2.9. Edycja fiszki
-   **Ścieżka widoku:** `/flashcards/[id]`
-   **Główny cel:** US-009 - Modyfikacja istniejącej fiszki (manualnej lub AI).
-   **Kluczowe informacje do wyświetlenia:** Formularz z załadowanymi danymi fiszki (przód, tył).
-   **Kluczowe komponenty widoku:** `Form`, `Input` lub `Textarea`, `Button` ("Zapisz zmiany") z `Spinner`, `Alert`.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Ładowanie danych, obsługa błędu 404 (gdy fiszka nie istnieje).

### 2.10. Sesja nauki – Przygotowanie i start
-   **Ścieżka widoku:** `/sessions/new`
-   **Główny cel:** US-011 - Konfiguracja i rozpoczęcie nowej sesji nauki.
-   **Kluczowe informacje do wyświetlenia:** Pole wyboru liczby fiszek na sesję (domyślnie 20), przycisk "Rozpocznij naukę".
-   **Kluczowe komponenty widoku:** `Input` (type number), `Button`.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Walidacja liczby fiszek.

### 2.11. Sesja nauki – Przegląd pojedynczej fiszki
-   **Ścieżka widoku:** `/sessions/[id_sesji]`
-   **Główny cel:** US-012, US-013 (część) - Prezentacja fiszek jedna po drugiej i umożliwienie użytkownikowi oceny ich znajomości.
-   **Kluczowe informacje do wyświetlenia:** Front fiszki, następnie tył fiszki (po akcji użytkownika). Przyciski oceny ("Umiem", "Nie umiem"). Pasek postępu sesji.
-   **Kluczowe komponenty widoku:** `Card` (do wyświetlania fiszki), `Button` ("Pokaż odpowiedź"), `ButtonGroup` (dla przycisków oceny), `Progress`.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Jasne wskazanie, która strona fiszki jest widoczna. Automatyczna nawigacja do następnej fiszki/podsumowania. Ochrona przed wielokrotnym kliknięciem.

### 2.12. Podsumowanie sesji nauki
-   **Ścieżka widoku:** `/sessions/[id_sesji]/summary`
-   **Główny cel:** US-013 - Prezentacja wyników zakończonej sesji nauki.
-   **Kluczowe informacje do wyświetlenia:** Liczba przerobionych fiszek, liczba poprawnych/niepoprawnych odpowiedzi, wynik procentowy. Przyciski "Rozpocznij nową sesję", "Wróć do panelu".
-   **Kluczowe komponenty widoku:** `Card` (do wyświetlenia podsumowania), `Button`, opcjonalnie `Chart`.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok. Czytelne statystyki.

### 2.13. Profil użytkownika
-   **Ścieżka widoku:** `/profile`
-   **Główny cel:** Placeholder dla przyszłych funkcji związanych z zarządzaniem kontem użytkownika. Zgodnie z notatkami, link w nawigacji będzie nieaktywny.
-   **Kluczowe informacje do wyświetlenia:** Informacja "Funkcja dostępna wkrótce".
-   **Kluczowe komponenty widoku:** `Tooltip` "Coming soon" na linku w NavBar. Strona może być pusta lub zawierać prosty komunikat.
-   **UX, dostępność i względy bezpieczeństwa:** Chroniony widok.

### 2.14. Panel administratora
-   **Ścieżka widoku:** `/admin/metrics`
-   **Główny cel:** US-014 - Umożliwienie administratorom przeglądania kluczowych metryk systemu.
-   **Kluczowe informacje do wyświetlenia:** Metryki systemowe (liczba fiszek AI/manualnych, wskaźnik akceptacji AI, retencja użytkowników, itp.).
-   **Kluczowe komponenty widoku:** `DashboardCard` lub `Card` (dla metryk), `Chart` (dla wizualizacji), `Alert`.
-   **UX, dostępność i względy bezpieczeństwa:** Widok chroniony rolą administratora (guard na poziomie routingu + weryfikacja backendowa). Czytelna prezentacja danych.

## 3. Mapa podróży użytkownika

1.  **Nowy użytkownik:**
    *   Odwiedza stronę -> `/register` (wypełnia formularz, system wysyła email weryfikacyjny).
    *   Użytkownik klika link w emailu -> (opcjonalnie) strona potwierdzenia -> `/login`.
    *   Loguje się -> `/` (Dashboard).

2.  **Generowanie fiszek AI (główny przepływ):**
    *   Zalogowany użytkownik na `/` (Dashboard) -> Klika "Generuj fiszki" -> Nawigacja do `/generate`.
    *   Na `/generate`:
        1.  Wprowadza tekst w `TextArea`.
        2.  Klika "Generuj Fiszki" (system pokazuje `Spinner`).
        3.  Poniżej `TextArea` pojawia się lista wygenerowanych fiszek.
        4.  Dla każdej fiszki użytkownik może ją przejrzeć, edytować (jeśli zaimplementowane) i oznaczyć do zapisu ("Zatwierdź") lub pominąć ("Odrzuć").
        5.  Klika "Zapisz zaakceptowane" (lub "Zapisz wszystkie").
        6.  System wysyła żądania `POST /flashcards` dla każdej zaakceptowanej fiszki.
        7.  Wyświetlany jest komunikat o sukcesie/błędzie. Użytkownik pozostaje na `/generate` z wyczyszczonymi wynikami.

3.  **Przeglądanie i zarządzanie fiszkami:**
    *   `/` -> "Moje fiszki" -> `/flashcards`.
    *   Na `/flashcards`: przegląda listę, filtruje/sortuje.
    *   Klika "Edytuj" -> `/flashcards/[id]` (modyfikuje, zapisuje) -> Powrót do `/flashcards`.
    *   Klika "Usuń" -> `AlertDialog` (potwierdza) -> Fiszka usunięta z listy.
    *   Klika "Dodaj nową fiszkę" -> `/flashcards/new` (tworzy, zapisuje) -> Powrót do `/flashcards`.

4.  **Nauka z fiszkami:**
    *   `/` -> "Rozpocznij naukę" -> `/sessions/new`.
    *   Na `/sessions/new`: konfiguruje sesję, klika "Rozpocznij" -> Nawigacja do `/sessions/[id_sesji]`.
    *   Na `/sessions/[id_sesji]`: cykl (Pokaż przód -> Pokaż tył -> Oceń) dla każdej fiszki.
    *   Po ostatniej fiszce -> Automatyczna nawigacja do `/sessions/[id_sesji]/summary`.
    *   Na `/sessions/[id_sesji]/summary`: przegląda wyniki -> Klika "Zakończ" lub "Nowa sesja".

## 4. Układ i struktura nawigacji

-   **Główny Layout:** Zastosowany dla większości stron, zawierać będzie komponent `NavBar`.
-   **NavBar (Pasek nawigacyjny):**
    *   Umieszczony na górze strony.
    *   Zawiera logo/nazwę aplikacji (link do `/`).
    *   **Dla niezalogowanych:** Linki "Zaloguj się" (`/login`) i "Zarejestruj się" (`/register`).
    *   **Dla zalogowanych:**
        *   "Strona główna" (`/`)
        *   "Generuj fiszki" (`/generate`)
        *   "Moje fiszki" (`/flashcards`)
        *   "Nauka" (`/sessions/new`)
        *   "Profil" (`/profile` - link nieaktywny z `Tooltip` "Wkrótce")
        *   "Panel admina" (`/admin/metrics` - widoczny tylko dla użytkowników z rolą administratora)
        *   Po prawej stronie: Nazwa użytkownika, `Avatar` (jeśli jest), menu rozwijane z opcją "Wyloguj się".
-   **Responsywność:** NavBar będzie posiadać wersję mobilną z menu typu "hamburger".
-   **Ochrona tras (`ProtectedRoute`):** Strony wymagające autentykacji (`/`, `/generate`, `/flashcards`, `/flashcards/*`, `/sessions/*`, `/profile`, `/admin/*`) będą chronione. Trasa `/admin/*` będzie dodatkowo wymagać roli administratora.

## 5. Kluczowe komponenty

Poniżej lista kluczowych, reużywalnych komponentów, głównie bazujących na Shadcn/ui:

-   **`NavBar` + `MobileMenu`:** Główna nawigacja aplikacji.
-   **`ProtectedRoute`:** Komponent HOC (React) lub logika w middleware/layout Astro do ochrony tras.
-   **`FlashcardItem`:** Komponent do wyświetlania pojedynczej fiszki na listach lub w generatorze.
-   **`FlashcardForm`:** Formularz do tworzenia/edycji fiszek manualnych.
-   **`AIGenerateForm`:** Sekcja na stronie `/generate` zawierająca `Textarea` i przycisk do generowania fiszek AI.
-   **`AIGenerateResults`:** Sekcja na stronie `/generate` do wyświetlania i interakcji z wygenerowanymi fiszkami.
-   **`Pagination`:** Komponent do nawigacji po stronach list.
-   **`SessionCard`:** Komponent do wyświetlania fiszki podczas sesji nauki.
-   **`DashboardCard`:** Komponent do wyświetlania pojedynczych metryk lub kart akcji na Dashboardzie i w panelu admina.
-   **Standardowe komponenty Shadcn/ui:** `Button`, `Input`, `Textarea`, `Card`, `Alert`, `Dialog`, `AlertDialog`, `Tooltip`, `Spinner`, `Progress`, `Form` (z `FormMessage`), `DropdownMenu`, `Table`, `Avatar`, `Badge`.
-   **Kontekst/Hooki:** `AuthContext` (do zarządzania stanem autentykacji), `useUser` (hook do pobierania danych zalogowanego użytkownika). 