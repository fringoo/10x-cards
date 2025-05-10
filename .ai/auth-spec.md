# Specyfikacja Techniczna Modułu Autentykacji dla 10x Cards

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu rejestracji, logowania i odzyskiwania hasła dla aplikacji 10x Cards. Specyfikacja bazuje na wymaganiach użytkownika zdefiniowanych w pliku `prd.md` (US-001, US-002, US-003) oraz na stosie technologicznym opisanym w `tech-stack.md`.

## 2. Stos Technologiczny

- Frontend: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- Backend: Supabase (Auth, Baza Danych PostgreSQL)
- Środowisko: Astro SSR (`output: "server"`)

## 3. Architektura Interfejsu Użytkownika (Frontend)

### 3.1. Strony Astro (`./src/pages`)

- **`/login`**:
    - Dostęp: Niezalogowani użytkownicy.
    - Cel: Umożliwia użytkownikom zalogowanie się do aplikacji.
    - Layout: `AuthLayout.astro`
    - Komponent React: `LoginForm.tsx`
- **`/register`**:
    - Dostęp: Niezalogowani użytkownicy.
    - Cel: Umożliwia nowym użytkownikom rejestrację w systemie.
    - Layout: `AuthLayout.astro`
    - Komponent React: `RegisterForm.tsx`
- **`/forgot-password`**:
    - Dostęp: Niezalogowani użytkownicy.
    - Cel: Pozwala użytkownikom zainicjować proces resetowania zapomnianego hasła.
    - Layout: `AuthLayout.astro`
    - Komponent React: `ForgotPasswordForm.tsx`
- **`/reset-password`**:
    - Dostęp: Niezalogowani użytkownicy (wymaga ważnego tokenu z emaila).
    - Cel: Umożliwia użytkownikom ustawienie nowego hasła po kliknięciu linku resetującego.
    - Layout: `AuthLayout.astro`
    - Komponent React: `ResetPasswordForm.tsx`
- **`/verify-email`**:
    - Dostęp: Wszyscy użytkownicy.
    - Cel: Informuje użytkownika o konieczności weryfikacji adresu email po rejestracji. Obsługuje również link weryfikacyjny, aktywując konto.
    - Layout: `AuthLayout.astro` (lub `BaseLayout.astro` dla prostoty)
    - Logika: Może zawierać komponent React do obsługi tokenu z URL i komunikacji z Supabase, lub logika może być częściowo w Astro (`Astro.url`).
- **Strony chronione (np. `/dashboard`, `/account`, `/cards`)**:
    - Dostęp: Tylko zalogowani i zweryfikowani użytkownicy.
    - Layout: `AppLayout.astro`
    - Ochrona: Realizowana przez middleware Astro.

### 3.2. Layouty Astro (`./src/layouts`)

- **`AuthLayout.astro`**:
    - Cel: Podstawowy layout dla stron związanych z procesem autentykacji (logowanie, rejestracja, reset hasła).
    - Cechy: Minimalistyczny, bez elementów nawigacyjnych typowych dla zalogowanego użytkownika (np. menu użytkownika, nawigacja główna aplikacji). Może zawierać logo aplikacji i stopkę.
- **`AppLayout.astro`**:
    - Cel: Główny layout aplikacji dla zalogowanych użytkowników.
    - Cechy: Zawiera pełną nawigację aplikacji, menu użytkownika (z opcją wylogowania), oraz inne elementy interfejsu dostępne po zalogowaniu.
- **`BaseLayout.astro`**:
    - Cel: Podstawowy, współdzielony layout, z którego mogą dziedziczyć `AuthLayout` i `AppLayout`.
    - Cechy: Definiuje globalne style, metadane, sekcję `<head>`, importuje czcionki, itp.

### 3.3. Komponenty React (`./src/components`)

Wszystkie formularze będą korzystać z komponentów UI z biblioteki `Shadcn/ui` (np. `Input`, `Button`, `Label`, `Card`, `Form` z `react-hook-form`).

- **`LoginForm.tsx` (`./src/components/auth/LoginForm.tsx`)**:
    - Pola: Email, Hasło.
    - Przyciski: "Zaloguj się", Link do "/forgot-password".
    - Walidacja (kliencka, np. z Zod/React Hook Form):
        - Email: wymagany, poprawny format.
        - Hasło: wymagane.
    - Komunikaty:
        - Błędy walidacji przy polach.
        - Ogólny błąd logowania (np. "Nieprawidłowy email lub hasło.", "Wystąpił błąd serwera.").
        - Sukces: Przekierowanie (obsługiwane przez logikę strony Astro lub hook w komponencie).
    - Akcja: Wywołanie endpointu `/api/auth/login` lub bezpośrednio `supabase.auth.signInWithPassword()`.
- **`RegisterForm.tsx` (`./src/components/auth/RegisterForm.tsx`)**:
    - Pola: Email, Hasło, Powtórz Hasło.
    - Przyciski: "Zarejestruj się".
    - Walidacja (kliencka):
        - Email: wymagany, poprawny format.
        - Hasło: wymagane, minimalna siła (np. 8 znaków, mała/wielka litera, cyfra, znak specjalny - do zdefiniowania).
        - Powtórz Hasło: wymagane, zgodne z Hasłem.
    - Komunikaty:
        - Błędy walidacji przy polach.
        - Ogólny błąd rejestracji (np. "Użytkownik o tym adresie email już istnieje.", "Wystąpił błąd serwera.").
        - Sukces: Informacja o konieczności weryfikacji emaila (np. "Link weryfikacyjny został wysłany na Twój adres email.").
    - Akcja: Wywołanie endpointu `/api/auth/register` lub bezpośrednio `supabase.auth.signUp()`.
- **`ForgotPasswordForm.tsx` (`./src/components/auth/ForgotPasswordForm.tsx`)**:
    - Pola: Email.
    - Przyciski: "Wyślij link do resetowania hasła".
    - Walidacja (kliencka):
        - Email: wymagany, poprawny format.
    - Komunikaty:
        - Błędy walidacji przy polu.
        - Ogólny błąd (np. "Nie znaleziono użytkownika o tym adresie email.", "Wystąpił błąd serwera.").
        - Sukces: Informacja o wysłaniu linku (np. "Jeśli konto istnieje, link do resetowania hasła został wysłany.").
    - Akcja: Wywołanie endpointu `/api/auth/forgot-password` lub bezpośrednio `supabase.auth.resetPasswordForEmail()`.
- **`ResetPasswordForm.tsx` (`./src/components/auth/ResetPasswordForm.tsx`)**:
    - Pola: Nowe Hasło, Powtórz Nowe Hasło.
    - Przyciski: "Ustaw nowe hasło".
    - Logika: Komponent powinien być używany na stronie, która odbiera token resetu (zazwyczaj w URL). Supabase SDK po stronie klienta (`onAuthStateChange` z eventem `PASSWORD_RECOVERY`) może obsłużyć ten stan i umożliwić formularzowi aktualizację hasła.
    - Walidacja (kliencka):
        - Nowe Hasło: wymagane, minimalna siła.
        - Powtórz Nowe Hasło: wymagane, zgodne z Nowym Hasłem.
    - Komunikaty:
        - Błędy walidacji przy polach.
        - Ogólny błąd (np. "Link do resetowania hasła jest nieprawidłowy lub wygasł.", "Wystąpił błąd serwera.").
        - Sukces: Informacja o pomyślnej zmianie hasła i przekierowanie na `/login` (np. "Hasło zostało zmienione. Możesz się teraz zalogować.").
    - Akcja: Bezpośrednio `supabase.auth.updateUser({ password: newPassword })`.
- **`UserNav.tsx` (`./src/components/layout/UserNav.tsx`)**:
    - Cel: Komponent wyświetlający menu użytkownika w `AppLayout.astro`.
    - Funkcjonalność: Wyświetla email użytkownika, link do profilu (przyszłościowo), przycisk "Wyloguj".
    - Akcja "Wyloguj": Wywołanie endpointu `/api/auth/logout` lub bezpośrednio `supabase.auth.signOut()`.

### 3.4. Integracja Astro i React

- Komponenty React będą renderowane na stronach Astro z odpowiednią dyrektywą `client:*`, np. `client:load` dla formularzy, które muszą być interaktywne od razu.
- Stan autentykacji (zalogowany/niezalogowany) będzie zarządzany globalnie, potencjalnie przez kontekst React dostarczany na najwyższym poziomie komponentów klienckich lub przez store (np. Zustand, Jotai), synchronizowany z `supabase.auth.onAuthStateChange()`.
- Strony Astro mogą przekazywać początkowe dane do komponentów React jako props, jeśli jest to konieczne (np. tokeny z URL).

### 3.5. Scenariusze Walidacji i Komunikaty Błędów

- **Walidacja po stronie klienta**: Natychmiastowy feedback dla użytkownika w formularzach React (np. przy utracie focusa z pola lub przy próbie wysłania formularza). Użycie `react-hook-form` z `Zod` do schematów walidacji.
- **Walidacja po stronie serwera**: Niezbędna jako ostateczne zabezpieczenie w endpointach API. Zwraca błędy w formacie JSON z odpowiednim kodem HTTP (400, 422).
- **Komunikaty**:
    - Jasne, zwięzłe i pomocne.
    - Rozróżnienie między błędami walidacji (np. "Hasło musi mieć co najmniej 8 znaków") a błędami systemowymi/serwera (np. "Nie udało się przetworzyć żądania. Spróbuj ponownie później.").
    - Użycie komponentów `Toast` lub `Alert` z Shadcn/ui do wyświetlania globalnych powiadomień (np. po wysłaniu emaila weryfikacyjnego, po błędzie serwera).

## 4. Logika Backendowa

### 4.1. Endpointy API Astro (`./src/pages/api/auth`)

Wszystkie endpointy będą używać serwerowego klienta Supabase (`createServerClient` z `@supabase/ssr`) do interakcji z Supabase Auth. Będą obsługiwać żądania `POST` (dla akcji) lub `GET` (np. dla callbacków).

- **`POST /api/auth/register`**:
    - Wejście: `RegisterUserDto { email, password }`.
    - Logika:
        1. Walidacja serwerowa DTO.
        2. Wywołanie `supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'YOUR_SITE_URL/verify-email' } })`.
        3. Obsługa błędów Supabase (np. `AuthApiError` dla istniejącego użytkownika).
    - Wyjście: JSON z sukcesem (status 201) lub błędem (status 400, 409, 500).
- **`POST /api/auth/login`**:
    - Wejście: `LoginUserDto { email, password }`.
    - Logika:
        1. Walidacja serwerowa DTO.
        2. Wywołanie `supabase.auth.signInWithPassword({ email, password })`.
        3. W przypadku sukcesu, Supabase automatycznie ustawi ciasteczka sesyjne.
        4. Obsługa błędów Supabase (np. nieprawidłowe dane logowania).
    - Wyjście: JSON z danymi użytkownika i sesji (status 200) lub błędem (status 400, 401, 500).
- **`POST /api/auth/logout`**:
    - Wejście: Brak (opcjonalnie token CSRF, jeśli zaimplementowany).
    - Logika:
        1. Wywołanie `supabase.auth.signOut()`.
        2. Supabase usunie ciasteczka sesyjne.
    - Wyjście: JSON z sukcesem (status 200) lub błędem (status 500).
- **`POST /api/auth/forgot-password`**:
    - Wejście: `ForgotPasswordDto { email }`.
    - Logika:
        1. Walidacja serwerowa DTO.
        2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'YOUR_SITE_URL/reset-password' })`.
    - Wyjście: JSON z sukcesem (status 200, nawet jeśli użytkownik nie istnieje, aby nie ujawniać informacji) lub błędem (status 400, 500).
- **`POST /api/auth/reset-password`**:
    - Wejście: `ResetPasswordDto { newPassword, accessToken }` (gdzie `accessToken` to token z URL, który klient musi przesłać).
    - Logika:
        1. Walidacja serwerowa DTO.
        2. Supabase SDK po stronie klienta powinien obsłużyć `PASSWORD_RECOVERY` i użyć `updateUser`. Jeśli endpoint jest używany, musi on zweryfikować `accessToken` (co może być trudne bez bezpośredniego dostępu do logiki sesji odzyskiwania Supabase). Preferowana jest obsługa po stronie klienta przez SDK Supabase po otrzymaniu tokenu z URL na stronie `/reset-password`. Jeśli jednak endpoint serwerowy jest konieczny, musi on współpracować z przepływem Supabase. Alternatywnie, Supabase SDK po stronie klienta na stronie `/reset-password` pobiera sesję odzyskiwania hasła i wysyła tylko nowe hasło do endpointu, który korzysta z `supabase.auth.updateUser({ password: newPassword })` w kontekście tej sesji.
    - Wyjście: JSON z sukcesem (status 200) lub błędem (status 400, 401, 500).
- **`GET /api/auth/callback`**:
    - Cel: Endpoint, na który Supabase może przekierować po udanej autentykacji OAuth lub weryfikacji emaila (jeśli tak skonfigurowano).
    - Logika:
        1. Odczytanie kodu autoryzacyjnego lub tokenu z parametrów URL.
        2. Wywołanie `supabase.auth.exchangeCodeForSession(authCode)` (dla przepływu PKCE) lub obsługa tokenu.
        3. Przekierowanie użytkownika do odpowiedniej strony (np. `/dashboard` lub oryginalnie żądanej).
    - Uwaga: Dla rejestracji email/hasło i weryfikacji, Supabase SDK po stronie klienta (`onAuthStateChange`) często obsługuje tokeny z URL bez potrzeby dedykowanego serwerowego endpointu callback, jeśli `emailRedirectTo` wskazuje na stronę kliencką. Jeśli jednak `emailRedirectTo` wskazuje na ten endpoint, musi on obsłużyć proces.

### 4.2. Modele Danych (DTOs) (`./src/types.ts`)

- **`RegisterUserDto`**:
    ```typescript
    interface RegisterUserDto {
      email: string;
      password: string;
    }
    ```
- **`LoginUserDto`**:
    ```typescript
    interface LoginUserDto {
      email: string;
      password: string;
    }
    ```
- **`ForgotPasswordDto`**:
    ```typescript
    interface ForgotPasswordDto {
      email: string;
    }
    ```
- **`ResetPasswordDto`**:
    ```typescript
    interface ResetPasswordDto {
      newPassword: string;
      // accessToken?: string; // Jeśli przekazywany z klienta do serwera
    }
    ```
- **`User` (częściowy, dla Astro.locals)**:
    ```typescript
    interface AuthenticatedUser {
      id: string;
      email?: string;
      // inne potrzebne pola z obiektu User Supabase
    }
    ```

### 4.3. Mechanizm Walidacji Danych Wejściowych

- Użycie biblioteki `Zod` do definiowania schematów walidacji zarówno dla DTOs w backendzie, jak i dla formularzy w frontendzie (współdzielone typy i schematy).
- Endpointy API będą walidować przychodzące dane i zwracać błędy 400/422 w przypadku niepowodzenia.

### 4.4. Obsługa Wyjątków

- Spójne formaty odpowiedzi błędów JSON z endpointów API:
    ```json
    {
      "error": {
        "message": "Komunikat błędu",
        "code": "KOD_BLEDU_APLIKACJI" // opcjonalnie
      }
    }
    ```
- Globalny handler błędów w Astro (jeśli możliwy dla API routes) lub try/catch w każdym endpoincie.
- Logowanie błędów po stronie serwera (np. do konsoli lub zewnętrznego serwisu logowania).

### 4.5. Renderowanie Stron Server-Side (`output: "server"`)

- Middleware Astro będzie kluczowe do odczytywania stanu autentykacji i podejmowania decyzji o renderowaniu lub przekierowaniu.
- Dane użytkownika (np. email) pobrane z sesji przez middleware będą dostępne w `Astro.locals.user` i mogą być używane do personalizacji stron renderowanych na serwerze.

## 5. System Autentykacji (Supabase Auth & Astro)

### 5.1. Konfiguracja Supabase

- **Klient Supabase (`./src/db/supabase.ts` lub w plikach konfiguracyjnych/middleware)**:
    - Utworzenie instancji klienta Supabase przy użyciu `createClient` (dla klienta) i `createServerClient` (dla serwera, z `@supabase/ssr`).
    - Zmienne środowiskowe dla `SUPABASE_URL` i `SUPABASE_ANON_KEY`.
- **Ustawienia w panelu Supabase**:
    - Włączenie "Email Auth Provider".
    - Włączenie "Enable email confirmations".
    - Konfiguracja szablonów email dla:
        - Potwierdzenia rejestracji (Invite user / Confirm signup).
        - Resetowania hasła (Reset password).
        - Zmiany adresu email (Change email address).
    - Ustawienie "Site URL" (główny URL aplikacji).
    - Ustawienie "Redirect URLs" (dodatkowe URL, na które Supabase może przekierowywać, np. `YOUR_SITE_URL/api/auth/callback`).
    - Opcjonalnie: konfiguracja RLS (Row Level Security) na tabelach, jeśli dane użytkownika są przechowywane w bazie Supabase i mają być dostępne tylko dla właściciela.

### 5.2. Middleware Astro (`./src/middleware/index.ts`)

```typescript
// src/middleware/index.ts
import { User } from '@supabase/supabase-js'; // Poprawiony import User
import { defineMiddleware } from 'astro:middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const protectedRoutes = ['/dashboard', '/cards', '/account']; // Przykładowe chronione ścieżki
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL!,
    import.meta.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return context.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          context.cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  context.locals.supabase = supabase;
  context.locals.user = user as User | null; // Użycie poprawionego typu User

  const currentPath = context.url.pathname;

  // Jeśli użytkownik jest niezalogowany i próbuje uzyskać dostęp do chronionej ścieżki
  if (!user && protectedRoutes.some(path => currentPath.startsWith(path))) {
    return context.redirect('/login');
  }

  // Jeśli użytkownik jest zalogowany i próbuje uzyskać dostęp do ścieżek autentykacji (np. /login, /register)
  // Zezwól na dostęp do /verify-email lub /reset-password tylko jeśli NIE ma aktywnej sesji użytkownika (user === null),
  // ponieważ te strony są przeznaczone do obsługi tokenów przez niezalogowanych użytkowników.
  // Jeśli użytkownik jest zalogowany, powinien być przekierowany.
  if (user && authRoutes.some(path => currentPath.startsWith(path))) {
    return context.redirect('/dashboard'); // Lub inna strona główna dla zalogowanych
  }
  
  // Strony /verify-email i /reset-password powinny być dostępne dla niezalogowanych użytkowników.
  // Logika przetwarzania tokenów (zazwyczaj w URL hash) odbywa się po stronie klienta
  // przy użyciu Supabase SDK (onAuthStateChange). Middleware nie musi tutaj interweniować
  // w specjalny sposób dla tokenów, poza standardową ochroną ścieżek.

  return next();
});
```
Należy zdefiniować typ `Nutzer` w `env.d.ts` lub odpowiednim pliku typów:
```typescript
// src/env.d.ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient;
    user: import('@supabase/supabase-js').User | null; // Lub bardziej szczegółowy typ, jeśli potrzeba
  }
}
```
*Uwaga: Powyższy kod middleware jest przykładem i może wymagać dostosowania.*

### 5.3. Obsługa Sesji

- Supabase Auth (`@supabase/ssr`) zarządza sesjami za pomocą ciasteczek HTTP-only, co jest bezpieczne i standardowe dla SSR.
- Ciasteczka są automatycznie odświeżane.
- **Po stronie klienta (React)**:
    - Użycie `createClient` z `@supabase/supabase-js`.
    - Subskrypcja do `supabase.auth.onAuthStateChange((event, session) => { ... })` do reagowania na zmiany stanu autentykacji (logowanie, wylogowanie, odświeżenie tokenu, odzyskiwanie hasła, weryfikacja emaila).
    - Ten listener będzie kluczowy do aktualizacji UI (np. przekierowań, zmiany menu użytkownika) oraz do obsługi specjalnych eventów jak `PASSWORD_RECOVERY` (na stronie `/reset-password` do pobrania sesji i umożliwienia `updateUser`) czy `SIGNED_IN` po weryfikacji emaila.

### 5.4. Kluczowe Wywołania Supabase Auth

- **Rejestracja**:
  `supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'YOUR_SITE_URL/verify-email' } })`
- **Logowanie**:
  `supabase.auth.signInWithPassword({ email, password })`
- **Wylogowanie**:
  `supabase.auth.signOut()`
- **Żądanie resetu hasła**:
  `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'YOUR_SITE_URL/reset-password' })`
- **Aktualizacja hasła (po otrzymaniu sesji odzyskiwania na `/reset-password`)**:
  `supabase.auth.updateUser({ password: newPassword })`
- **Pobranie sesji (serwer)**:
  `supabase.auth.getSession()` (w middleware)
- **Pobranie użytkownika (serwer)**:
  `supabase.auth.getUser()` (w middleware lub endpointach, jeśli potrzebne)

## 6. Podsumowanie i Kluczowe Wnioski

- Architektura opiera się na silnej separacji odpowiedzialności między stronami Astro (routing, SSR, middleware) a komponentami React (interfejs użytkownika formularzy, logika kliencka).
- Supabase Auth dostarcza kompletną infrastrukturę backendową dla autentykacji, minimalizując potrzebę pisania własnej logiki po stronie serwera dla podstawowych operacji.
- Middleware Astro jest centralnym punktem kontroli dostępu i zarządzania sesją po stronie serwera.
- Stosowanie `@supabase/ssr` jest kluczowe dla poprawnej integracji z Astro w trybie SSR.
- Walidacja zarówno po stronie klienta, jak i serwera jest niezbędna dla bezpieczeństwa i dobrego UX.
- Jasne komunikaty błędów i sukcesu poprawią doświadczenie użytkownika.
- Strona `/verify-email` i `/reset-password` będą wymagały logiki po stronie klienta (w React lub skrypcie Astro) do obsługi tokenów z URL i komunikacji z Supabase SDK w celu sfinalizowania odpowiednich procesów.
