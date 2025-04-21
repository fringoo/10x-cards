# Architektura UI dla 10x Cards

## 1. Przegląd struktury UI

Aplikacja oparta na Astro z React i Shadcn/ui. Routing plikowy Astro odpowiada ścieżkom logowania, rejestracji, zarządzania fiszkami, sesji nauki i panelu administratora. Wspólny layout (`src/layouts/MainLayout.astro`) zawiera topbar z NavBar, responsywną nawigację i ostrzeżenia dla niezaimplementowanych funkcji.

Autoryzacja oparta na JWT w localStorage, zarządzanie stanem sesji globalnie przez `AuthContext`. Axios z interceptorami dołącza token do nagłówków. Wszelkie strony chronione są przez guardy w `ProtectedRoute`.

## 2. Lista widoków

### 2.1. Rejestracja
- Ścieżka: `/register`
- Cel: US-001
- Kluczowe informacje: formularz email, hasło, walidacja, komunikat o weryfikacji email
- Komponenty: `Form` (Shadcn/ui), `Input`, `Button`, `Alert`
- UX / dostępność / bezpieczeństwo: aria-invalid, focus na pierwszym polu, walidacja po blur, obsługa błędów 409

### 2.2. Logowanie
- Ścieżka: `/login`
- Cel: US-002
- Kluczowe informacje: formularz email, hasło, komunikat o błędzie 401
- Komponenty: `Form`, `Input.Password`, `Button`, `Alert`
- UX: opcja "Pokaż/ukryj hasło" z aria-label, zapamiętywanie pola email

### 2.3. Resetowanie hasła
- Ścieżka: `/password-reset` i `/reset-password/confirm?token=…`
- Cel: US-003
- Komponenty: `Input`, `Button`, `Alert`
- Uwagi: link e-mail, ochrona tokenem, walidacja siły nowego hasła

### 2.4. Dashboard / Strona główna
- Ścieżka: `/`
- Cel: widok startowy, szybki dostęp do generowania, listy fiszek, sesji i profilu
- Kluczowe informacje: przyciski "Generuj fiszki", "Moje fiszki", "Rozpocznij naukę"
- Komponenty: `Card`, `Button`, `Tooltip`, `Avatar`
- UX: wyświetlanie nazwy użytkownika, link "Wyloguj się"

### 2.5. Generowanie fiszek AI
- Ścieżka: `/generate`
- Cel: US-004
- Kluczowe informacje: `TextArea` do wprowadzenia tekstu, `Button` Generuj, limit znaków, spinner podczas przetwarzania
- Komponenty: `Textarea`, `Button` z `Spinner`, `FormMessage` dla błędów limitu

### 2.6. Przegląd wygenerowanych fiszek
- Ścieżka: `/generate/review`
- Cel: US-005, US-006
- Kluczowe informacje: lista fiszek AI z przyciskami "Zatwierdź"/""Odrzuć", opcja "Zatwierdź wszystkie"
- Komponenty: `FlashcardItem`, `ButtonGroup`, `Alert`, `Spinner` na przyciskach
- UX: szybkie zatwierdzanie, inline feedback, paginacja jeżeli >10

### 2.7. Lista fiszek użytkownika
- Ścieżka: `/flashcards?page=…&source=…`
- Cel: US-008
- Kluczowe informacje: tabela lub grid fiszek, kolumny front/back, źródło, data, akcje (edytuj, usuń)
- Komponenty: `Table` lub `Grid`, `InlineEdit`, `Button`, `Pagination`
- UX: sortowanie, filtrowanie, potwierdzenie usunięcia (Modal), komunikaty przy błędach

### 2.8. Tworzenie i edycja fiszki manualnej
- Ścieżka: `/flashcards/new` oraz `/flashcards/[id]`
- Cel: US-007, US-009
- Kluczowe informacje: formularz front/back, walidacja, przycisk Zapisz, spinner na zapisie
- Komponenty: `Form`, `Input`, `Button`, `Alert`, `Spinner`
- Dostępność: focus management, aria-required

### 2.9. Sesja nauki – przygotowanie i start
- Ścieżka: `/sessions/new`
- Cel: US-011
- Kluczowe informacje: wybór liczby fiszek, przycisk "Rozpocznij", domyślna wartość 20
- Komponenty: `Input.Number`, `Button`

### 2.10. Sesja nauki – przegląd pojedynczej fiszki
- Ścieżka: `/sessions/[id]`
- Cel: US-012, US-013
- Kluczowe informacje: front fiszki, przycisk "Pokaż odpowiedź", następnie "Umiem"/"Nie umiem"
- Komponenty: `Card`, `ButtonGroup`, `Progress`, `Spinner` na przyciskach
- UX: ochrona przed wielokrotnym kliknięciem, automatyczna nawigacja do następnej

### 2.11. Podsumowanie sesji
- Ścieżka: `/sessions/[id]/summary`
- Cel: US-013
- Kluczowe informacje: suma poprawnych/niepoprawnych, procent, przycisk "Zakończ" i powrót
- Komponenty: `Card`, `Chart` (opcjonalnie), `Button`

### 2.12. Profil użytkownika (coming soon)
- Ścieżka: `/profile` (link w NavBar nieaktywny)
- Cel: miejsce na rozszerzenie (US-? placeholder)
- Komponenty: `Tooltip` "Coming soon"

### 2.13. Panel administratora
- Ścieżka: `/admin/metrics`
- Cel: US-014
- Kluczowe informacje: metryki globalne (ilość fiszek AI/manual, wskaźnik akceptacji, retencja), wykresy
- Komponenty: `DashboardCard`, `Chart`, `Alert`
- Bezpieczeństwo: widok chroniony rolą admin, guard w `ProtectedRoute` i RLS na backendzie

## 3. Mapa podróży użytkownika

1. Nowy użytkownik: `/register` → weryfikacja email → `/login` → `/`
2. Generowanie fiszek: `/generate` → przetwarzanie → `/generate/review` → zatwierdź/odrzuć → zapis do bazy
3. Przegląd i edycja: `/flashcards` → inline edit lub `/flashcards/new` → zapis
4. Rozpoczęcie nauki: `/sessions/new` → `/sessions/[id]` (cykl front → reveal → ocena) → `/sessions/[id]/summary` → powrót do `/`
5. Administrator: `/login` (rola admin) → `/admin/metrics`

## 4. Układ i struktura nawigacji

- **NavBar** w głównym layoucie z linkami: Home, Generuj fiszki, Moje fiszki, Nauka, Profil (disabled), Panel admin (conditional), Wyloguj.
- **Responsywność**: mobile hamburger menu z rolkami.
- **Interactive states**: disabled links z `Tooltip`, spinner w menu przy ładowaniu.
- **Authentication guard**: komponent `ProtectedRoute` owija wszystkie strony wymagające auth.

## 5. Kluczowe komponenty

- `NavBar` + `MobileMenu` + `Tooltip`
- `ProtectedRoute` (React Router guard)
- `FlashcardList`, `FlashcardItem`, `InlineEdit`
- `FlashcardForm` (manual/new/edit)
- `AITextArea` + `Button` + `Spinner` (generate)
- `Pagination` (Shadcn/ui)
- `SessionCard` + `ButtonGroup` + `Progress`
- `DashboardCard` + `Chart`
- `Alert`, `FormMessage`, `Spinner`
- `AuthContext`, `useUser`, `axios` interceptors dla JWT
- `ProtectedRoute` 